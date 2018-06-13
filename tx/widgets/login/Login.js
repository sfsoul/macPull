/**
* 触屏登录
* @author shinelgzli
* @class qv.zero.Login
* @required zepto
* @date 2013年4月23日17:49:51
**/
(function(exports){
	if(window.mqq && !window.mqq.iOS && !window.mqq.android){ //浏览器模拟
		//console.log('使用 qv.zero.Login.logout() 登出系统');
	}
	var $ = Zepto;
	var _public = {
		inited : false,
		isLogin : function(){
			if(zUtil.getcookie('skey') || zURL.get('sid')){
				return true;
			}
			return false;
		},
		login : function(backUrl, picUrl){
			this.setCookie('uin', null); //清除cookie
			this.setCookie('skey', null);
			var loginUrl = 'https://ui.ptlogin2.qq.com/cgi-bin/login?style=9&appid=809041606&daid=18&low_login=0';
			var hln_css = picUrl || ''; //尺寸: 244 * 100
			if(hln_css){
				loginUrl += '&hln_css=' + hln_css;
			}
			var s_url = backUrl || location.href;
			location.href = loginUrl+'&s_url='+encodeURIComponent(s_url);
		},
		logout : function(){
			zUtil.require('https://ui.ptlogin2.qq.com/js/ptloginout.js', function(){
				pt_logout.logout(function(ret){
					location.replace(location.pathname);
				});
			});
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
		 * 触屏公共登录
		 * @method init
		 * @for qv.zero.Login
		 * @param {Function} callback 登录成功后的回调函数,必填,函数的user参数有uin,nick（昵称),sid,head(头像)4个字段
		 */
		init : function(callback) {			
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
		 * 通用的登录回调，在当前路径中加上sid
		 * @method commonLoginHandler
		 * @for qv.zero.Login
		 * @param {String} param  参数名称
		 * @returns {String}
		 */
		commonLoginHandler : function(data) {
		},
		/**
		 * 通用退出，删除当前路径中的sid
		 * @param param  参数名称
		 * @returns {string}
		 */
		commonLogout : function() {
			this.logout();
		},
		wdcache : {},
		
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
		},
	};
	exports.Login = _public;

	//登录验证
	if(exports.zAOP){
		exports.zAOP.intercept_a_s('send', { after : function(param){ //拦截send方法
                var json = param.args[0], url = param.context[0];
                if(checklogin(url) && json.ret == 10002){
                    exports.Login.login();
                    return false;
                }
            }}, zHttp, 1);
	}

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