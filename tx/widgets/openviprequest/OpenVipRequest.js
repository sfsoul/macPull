/**
 * 开通会员或超级会员送礼包
 * @class qv.zero.openviprequest
 * @author yandeng
 * @description 开通送礼包
 * @version 1.0
 * @time 2014-08-11
 * @name qv.zero.openviprequest
 * @requires jQuery
**/
(function(exports,$) {
	(function (){
		var arg = arguments;
		if(page.readyState){
			//会员支付
			if (zURL.get('pay') == 'done'&&zURL.get('area')) {
			    this.require('AreaSvrSelector', function(){
			        if(!svr){
			            svr = new qv.zero.AreaSvrSelector({ 
			                name : zURL.get('game'),
			                actid : zURL.get('actid'),
			                serverList : zURL.get('key')
			            });
			        }
			        svr.show();
			    });
			} else if (zURL.get('pay') == 'done') {
		    	zHttp.syrequest({actid:zURL.get('actid')},true);
			}
		}else{
			setTimeout(function(){arg.callee.call()}, 100);
		}
	})();
	OpenVipRequest = {
		/**
		 * 显示开通送
		 * @param {String} [config.mpid] 营销活动号,做营销活动时传入
		 * @param {Number} [config.n] 开通会员数量
		 * @param {Number} [config.actid] 开通会员后请求的id活动号
		 * @param {String} config.c 必选，开通类型,'ltmclub'表示会员，'cjclub'表示超级会员
		 * @param {Boolean} [config.area] 可选，开通送礼包是否选择大区,true表示选大区
		 * @param {String} [config.key] 可选，在选择config.area基础上填写该参数才有意义，自定义大区
		 * @example
		 * ```
		 * qv.zero.OpenVipRequest.show({
		 *	page : page,
		 *	mpid : 'MA20140725154457420',
		 *	n : 1,
		 *	actid : 27378,
		 *	c : 'ltmclub',
		 *	area : true,
		 *	key :''
		 * });
		 *```
		 * @note no override
		 * @method show
		 * @for qv.zero.openviprequest
		**/
		show : function (config) {
			this.mpid = config.mpid || '';
			this.n = config.n || 1;
			this.actid = config.actid || '';
			this.c = config.c || 'ltmclub';
			this.page = config.page;
			this.area = config.area || '';
			this.key = config.key || '';
			this.init(config);
			this.required = 'http://pay.qq.com/h5/index.shtml';
		},
		init : function () {
			var me = this;
			var maiHref = location.href.substring(0,location.href.indexOf('?'));
			var gameName = this.page.pcfg.g.toLowerCase();
			var returnHref;
			if (this.actid) {
				returnHref = maiHref + '?pay=done&sid=' + zURL.get('sid') + '&actid=' + me.actid + '&game=' + gameName + '&area=' + me.area + '&key=' + me.key;
			} else {
				returnHref = maiHref + '?sid=' + zURL.get('sid');
			}
			zHttp.syrequest({actid : this.actid},function (json) {
				if (json.ret == 20108 || json.ret == 30301) {
					var p = $.param({
						sid : zURL.get('sid'),
						aid : me.page.pcfg.aid,
						mpid: me.mpid,
						n : me.n,
						ru : returnHref,
						m : 'buy',
						c : me.c,
						pf : 2100
					});
					location.href = me.required + '?' + p;
				} else {
					zHttp.showResponse(json, json.actid);
				}
			});
		}
	}
	
	exports.OpenVipRequest = OpenVipRequest;
})(qv.zero,Zepto);