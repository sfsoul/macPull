/**
* @description 调用手Q小钱包，支付成功后赠送，与AMS后台配置使用
* @author  shinelgz@163.com
* @required  Zero
* @platform  mobile
* @class qv.zero.TenpayRequest
* @support qq_4.2
* @date 2014年6月5日17:49:51
**/
;(function(exports){
	
	var sid = zURL.get('sid');
	var args;
	var STATE_ININT 	= 'init',
		STATE_LOADING 	= 'loading',
		STATE_FINISH 	= 'finish',
		STATE_RELOADING	= 'reloading'; 
	var state = STATE_ININT;
	function doActionOnCheck ( actionActid, appInfo, isStartGame, extParams) {
		zHttp.syrequest($.extend({ actid : actionActid},extParams), function (json, code, fn ,showBtn) {
            if (json.ret == 0) {
                zHttp.showResponse.apply(zHttp, arguments);
            }
            state = STATE_FINISH;
        }, isStartGame);
	}
	
	function send( actionActid, appInfo, isStartGame, extParams){
		zHttp.syrequest($.extend({ actid : actionActid}, extParams), function (json, code, fn ,showBtn) {
			if(json.ret === 20422){//启用支付
				var ruleInfo = json.data.rule.data;
				var tokenRet = ruleInfo.ret;
				var token = ruleInfo.token;
				if(tokenRet !== 0){
					zMsg.show('网络异常，请重新再试~');
					return ;
				}
				state = STATE_RELOADING;
				mqq.tenpay.pay({tokenId: token, appInfo: appInfo}, function(result){
                    if (result.resultCode && result.resultCode == 0 || result && result == '0'){
                        send.apply(window, args);
                    } else {
                        doActionOnCheck.apply(window, args);;
                    }
                });
			}else{
				zHttp.showResponse.apply(zHttp, arguments);
				state = STATE_FINISH;
			}
		},isStartGame);
	}
	function isOkQQVersion(){
		if(mqq.iOS && mqq.compare('4.6.2') >= 0 || mqq.android && mqq.compare('4.6.1') >=0){
			return true;	
		}else if(!mqq.iOS && !mqq.android){
			zMsg.show('只有IOS或Android平台的手Q才支持支付哦' );
		}else{
			zMsg.show('哎哟，你的手Q版本有点旧哦！更新后再来参加吧~' );
		}
		return false
	}
	/**
	* @for qv.zero.TenpayRequest
	* @method TenpayRequest
	* @param {Number} actionActid AMS活动号，其中该活动的条件需要配置【是否钱包支持过】条件
	* @param {String} appInfo 支持信息，默认为 appid#10000006|bargainor_id#1201423701|channel#huodong
	* @param {Boolean} isStartGame 支持成功后，是否在提示框上显示【开始游戏】按钮
	* @param {Object} extParams 其他参数，这些参数会一并传到AMS后台
	* @example :
	* ```this.require('TenpayRequest', function(){
	* 	qv.zero.TenpayRequest(25924, 25891, 25931, 'appid#10000006|bargainor_id#1201423701|channel#huodong', function(json,actid,fn,startBtn){
	*	   if (json.ret == 0) {
	*	        //其他逻辑
	*	    } 
	*	    zHttp.showResponse(json, actid, fn, startBtn);
	*	});
	* })```
	* @return {void}
	**/
	exports.TenpayRequest = function ( actionActid, appInfo, isStartGame, extParams) {
		if(state === STATE_LOADING || state === STATE_RELOADING){
			zMsg.show('正在支付中...，请稍等一下~');
			return ;
		}
		state = STATE_LOADING;
		args = arguments;
		if(window.mqq){
			if(isOkQQVersion()){
				send.apply(null, args);
			}
		}else{
			zUtil.require('http://pub.idqqimg.com/qqmobile/qqapi.js', function(){
				if(isOkQQVersion()){
					send.apply(null, args);
				}
			});
		}
	};
})(qv.zero);