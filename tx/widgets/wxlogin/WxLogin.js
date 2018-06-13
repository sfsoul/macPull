/**
* 微信登录
* @author yandeng
* @class qv.zero.Login
* @required zepto
* @date 2016年11月03日
**/
(function(exports){
	var $ = Zepto;
	var _public = {
		isLogin : function(){
			if(zUtil.getcookie('wxvip_skey') && zUtil.getcookie('wxvip_openid')){
				return true;
			}
			return false;
		},
		login : function(backUrl){
			this.setCookie('wxvip_skey', null,  {path: '/', domain: '.vip.qq.com'}); //清除cookie
            this.setCookie('wxvip_openid', null,  {path: '/', domain: '.vip.qq.com'});
            location.reload();

            //登录地址
            //var protocol = window.location.protocol;
            //var redirect = protocol + "//m.vip.qq.com/setwxh5token/redirect?r="+location.href;//中转页面，因为会员公众号只能绑定一个域名，已经绑定到m.vip.qq.com站点，新站点域名为h5.vip.qq.com
            //var locationHref = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe12a77518747b118&redirect_uri='+encodeURIComponent(redirect)+'&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
            //location.href= locationHref;
		},
		ensureLogin : function(callback4login) {
			if(this.isLogin()){
				if (callback4login) {
					callback4login.call();
				}
			}else{
				this.login();
			}
		},
		/**
		* 强制登录
		* @method ensure
		* @for qv.zero.Login
		*/
		ensure : function(cb){
			if(this.isLogin()){
				cb && cb();
			}else{
				this.login();
			}
		},
		/**
		 * 弹出登录框
		 * @method show
		 * @for qv.zero.Login
		*/
		show : function (cb) {
			this.login();
		},
		/**
		 * cookie操作API，
		 * @method setCookie
		 * @for qv.zero.Login
		 * @param {String} name 键
		 * @param {String} value 值
		 * @param {String} options 选项
		 * @example
		 * setCookie(’the_cookie’, null); //删除一个cookie，
		 * setCookie('the_cookie'); //读取Cookie值
		 * setCookie(’the_cookie’, ‘the_value’); //设置cookie的值
		 * setCookie(’the_cookie’, ‘the_value’, {expires: 7, path: ‘/’, domain: ‘jquery.com’, secure: true});//新建一个cookie 包括有效期 路径 域名等
		 * return {void} 
		 */
		setCookie : function(name, value, options) {
			if (typeof value != 'undefined') {
				options = options || {};
				if (value === null) {
					value = '';
					options = $.extend({}, options);
					options.expires = -1;
				}
				var expires = '';
				if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
					var date;
					if (typeof options.expires == 'number') {
						date = new Date();
						date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
					} else {
						date = options.expires;
					}
					expires = '; expires=' + date.toUTCString();
				}
				var path = options.path ? '; path=' + (options.path) : '; path=/';
				var domain = options.domain ? '; domain=' + (options.domain) : '; domain=qq.com';
				var secure = options.secure ? '; secure' : '';
				document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
			} else {
				var cookieValue = null;
				if (document.cookie && document.cookie != '') {
					var cookies = document.cookie.split(';');
					for (var i = 0; i < cookies.length; i++) {
						var cookie = $.trim(cookies[i]);
						if (cookie.substring(0, name.length + 1) == (name + '=')) {
							cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
							break;
						}
					}
				}
				return cookieValue;
			}
		}
	};
	exports.Login = _public;

	//登录验证
	/*if(exports.zAOP){
		exports.zAOP.intercept_a_s('send', { after : function(param){ //拦截send方法
                var json = param.args[0], url = param.context[0];
                if(checklogin(url) && json.ret == 10002){
                    exports.Login.login();
                    return false;
                }
            }}, zHttp, 1);
	}*/

	function checklogin(url){
		var type = typeof url;
		if(type === 'string'){
			var reg = /[?|&]checklogin=([^&]*)&?/;
			var m = reg.exec(url)
			if(m){
				if(m[1] === '0' || m[1] === 'false') return false;
			}
		} else if(type === 'object') {
			return url.checklogin !== false;
		}
		return true;
	}
}(qv.zero));