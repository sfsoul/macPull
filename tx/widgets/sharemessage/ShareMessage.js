/**
* 手Q分享组件
* payneliu
* 2016-04-20
*
* 特点：
*  1. 自动带ADTAG，本人的uin
*  2. 上报配置
*  3. 分享成功的回调
* 
* 使用方法：
*  var sm = new qv.zero.ShareMessage({
*  	  title : '逼死强迫症的游戏',
*     desc : '我帮你掷骰子赢了大奖，赶紧去领取', 
*     image_url : 'http://imgcache.gtimg.cn/vipstyle/game/act/20160408_ztz/img/102.jpg', 
*     type : 0, //0：QQ好友；1：QQ空间；2：微信好友；3：微信朋友圈。默认为 0
*     invite_uin ： 123456789, //分享时的主人uin
*     actid :　97458, //会在分享的时候上报
*     callback : function(){} //分享结束时触发，优先于actid，actid与callback都配置将只执行callback
*  });
*
* //设置分享按钮的点击事件
* sm.setOnShareHandler();
* //发起分享
* sm.shareMessage();
* //打开分享面板
* sm.showShareMenu();
*
* //如果页面有几个分享文案的时候，可以使用这个处理
* qv.zero.ShareMessage.shareCore({
* 	title : '逼死强迫症的游戏',
*   desc : '我帮你掷骰子赢了大奖，赶紧去领取', 
*   image_url : 'http://imgcache.gtimg.cn/vipstyle/game/act/20160408_ztz/img/102.jpg', 
*   type : 0, //0：QQ好友；1：QQ空间；2：微信好友；3：微信朋友圈。默认为 0
*   invite_uin ： 123456789, //分享时的主人uin
*   invite_key : 'invite_uin', //分享时带主人态的key
*   url : '', //分享的url
*   actid :　97458, //会在分享的时候上报
*   callback : function(){} //分享结束时触发，优先于actid，actid与callback都配置将只执行callback
* });
*/
;(function(exports, global) {
	
	var util = {
		shareCore : function(data){
			data.type = data.type || 0;
	    	var adtag = {0: 'fenhy', 1 : 'fenkj', 2: 'fenwx', 3: 'fenwxpyq'}, url, mqq = global.mqq;
	            if(data.url){
	            	url = data.url;
	            } else {
	            	url = location.href;
	            	url = url.split('?')[0] + '?_wv=1';
	            }
	            url += (url.indexOf('?') > -1 ? '&' : '?') + 'pvsrc=309&adtag=' + adtag[data.type] + '_' + (data.adtag||'');

	            data.invite_uin = data.invite_uin || zUtil.getUin();
	            data.invite_key = data.invite_key || 'invite_uin';
	            url += '&'+ data.invite_key +'=' + data.invite_uin;

	        if(zUtil.isQGame && zUtil.isQGame()) { //企鹅电竞内调用
	        	zUtil.require('egameExtend', function(){
	        		if (qv.zero.pgg) {
	        			qv.zero.pgg.shareMessage(data);
	        		}
	        	});
	        } else if(mqq && mqq.ui && mqq.ui.shareMessage){
	        	mqq.ui.shareMessage({
		            title: data.title,
		            desc: data.desc,
		            share_type: data.type,
		            share_url: url,
		            image_url: data.image_url,
		            back: true,
		            shareElement: data.shareElement || 'news',
	                flash_url: data.flashUrl || '',
	                puin: data.puin || 2747277822, //公众号puin, 默认QQ手游的公众号puin
	                sourceName: data.sourceName || 'QQ手游',
	                appid: data.appid,
	                toUin: data.toUin || '',
	                uinType: data.uinType || 0
		        }, function(ret) {
		        	if(typeof data.callback === 'function'){
	            		data.callback(util.extend({shareType : data.type}, ret));
	            	} else if(ret.retCode == 0){ //成功了上报
		            	if(data.actid){
		            		zHttp.send({actid : data.actid}, function(){ });
		            	}
		            }
		        });
	        } else {
	        	if(typeof data.callback === 'function'){
            		data.callback({retCode : -3, shareType : data.type}); //不支持
            	}
	        }
	    },
	    setOnShareHandler : function(getCfg){
	    	var mqq = global.mqq;
	        if(mqq && mqq.ui && mqq.ui.setOnShareHandler){
	        	mqq.ui.setOnShareHandler(function(type){
	        		var data = util.extend({}, getCfg());
	        		data.type = type;
		            util.shareCore(data);

		            if(type > 1 && mqq.compare('5.4') < 0 || zURL.get('adtag').indexOf('fenkj') > -1 && type == 1){
		                if(typeof data.callback === 'function'){
		            		data.callback({retCode : 0, shareType : type});
		            	} else if(data.actid){
		            		zHttp.send({actid : data.actid}, function(){ });
		            	}
		            }
		        });
	        }
	    },
	    extend : function(ndata, data){
	    	if(data) for(var i in data){
	    		if(data.hasOwnProperty(i)){
	    			ndata[i] = data[i];
	    		}
	    	}
	    	return ndata;
	    },
	    setShareInfo : function(data){
	    	var mqq = global.mqq;
	    	if (mqq.support && mqq.support('mqq.data.setShareInfo')) {
	            mqq.data.setShareInfo({
					share_url : data.url,
					title 	  : data.title,
					desc      : data.desc,
					image_url : data.image_url,
	            });
	        }
	    }
	};

	function ShareMessage(data){
		this.data = data;
	}
	/**
	 * 设置右上角分享按钮的点击事件
	 */
	ShareMessage.prototype.setOnShareHandler = function() {
		var me = this;
		util.setOnShareHandler(function(){ return me.data; });
	};
	/**
	 * 拉起手Q分享界面
	 */
	ShareMessage.prototype.shareMessage = function() {
		util.shareCore(util.extend({}, this.data));//复制一份数据
	};
	/**
	 * 设置分享的文案
	 */
	ShareMessage.prototype.setShareInfo = function() {
		util.setShareInfo(util.extend({}, this.data));//复制一份数据
	};
	ShareMessage.prototype.showShareMenu = function() {
		var mqq = global.mqq;
		if (mqq.support && mqq.support('mqq.ui.showShareMenu')) {
            mqq.ui.showShareMenu();
        } else {
            zMsg.show('手机QQ版本太低，请升级手机QQ版本~');
        }
	};

	/**
	 * 提供静态的方法用于分享的数据
	 */
	ShareMessage.shareCore = util.shareCore;

	exports.ShareMessage = ShareMessage;

})(qv.zero, window);