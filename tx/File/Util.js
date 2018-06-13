/**
 * 工具静态类
 * @class qv.zero.Util
 * @author shinelgzli payneliu
 * @version 6.0.2
 * @date 2016-08-15
 * @requires qv
 * @name qv.zero.Util
 * @namespace
 */
/*global document,zUtil,navigator,window,location,pt_logout */
/*jslint evil: true */
window.zHttp = qv.zero.Http;
qv.zero.Util = {
	wdcache: {},
	options: {},
	widgetDomain: 'i.gtimg.cn',
	widgetPath: '/club/common/lib/zero/widgets',
	idipPath: '/club/common/lib/zero/idip',
	/**
	* 获取cookie值
	* @static
    * @method getcookie
    * @for qv.zero.Util
	* @param {String} name cookie名称
	* @return {String} 
   **/
	getcookie: function (name) {
		if (document.cookie && document.cookie !== '') {
			var cookieArr = document.cookie.split('; ');
			name = encodeURIComponent(name);
			for (var i = 0, cl = cookieArr.length, tmpArr; i < cl; i++) {
				tmpArr = cookieArr[i].split('=');
				if (name == tmpArr[0]) {
					return decodeURIComponent(tmpArr[1] || '');
				}
			}
		}
		return null;
	},
	/**
	* 判断是否为ios平台
    * @method isIOS
    * @for qv.zero.Util
	* @return {Boolean} 
   **/
	isIOS: function () {
		var ua = navigator.userAgent.toLowerCase();
		return typeof this._isIOS !== 'undefined' ? this._isIOS : (this._isIOS = (/iphone|ipad|ipod|itouch/.test(ua)));

	},
	/**
	* 判断是否为安卓平台
    * @method isAndroid
    * @for qv.zero.Util
	* @return {Boolean} 
   **/
	isAndroid: function () {
		var ua = navigator.userAgent.toLowerCase();
		return typeof this._isAndroid !== 'undefined' ? this._isAndroid : (this._isAndroid = (/android/.test(ua)));
	},
	/**
     * 判断是否是电竞app内
     * @return {Boolean} 是否
     */
	isQGame: function () {
		var ua = navigator.userAgent.toLowerCase();
		return /\bcom\.tencent\.qgame\/([\d\.]+)/.test(ua);
	},
	/**
	* 根据sid获取gtoken
    * @method getCSRFToken
    * @for qv.zero.Util
	* @return {String} 
   **/
	getCSRFToken: function () {
		return this.getToken();
	},
	/**
	* 给页面加内链样式表，会将样式插在head头部
	* @method appendStyle
    * @for qv.zero.Util
	* @param {String} css 样式表
	* @example
	* zUtil.appendStyle('a{color:red;}');
	*/
	appendStyle: function (css) {
		var style = document.createElement('style');
		style.type = 'text/css';
		try {
			style.appendChild(document.createTextNode(css));
		} catch (E) {
			style.styleSheet.cssText = css;
		}
		var head = document.getElementsByTagName('head')[0];
		head.appendChild(style);
	},
	/**
	 * 格式化字符串，对字符串中{\w\d+}的占位替换
	 * @method sprintf
     * @for qv.zero.Util
	 * @param {string} str 字符串
	 * @param {Object} param 键值对
	 * @return {string} 
	 * @example zUtil.sprintf('Hello {name}!', {name : 'world'});//output: Hello world!
	 * @example zUtil.sprintf('Hello, {0} {1}', 'word','!') //output: Hello worid !
	 */
	sprintf: function (str, param) {
		var args = arguments;
		var data = !$.isPlainObject(param) ? (function () {
			var p = Array.prototype.slice.call(args);
			return p.splice(1, p.length);
		})() : param;
		return str.replace(/\{([\d\w]+)\}/g, function (m, n) {
			return typeof (data[n]) != 'undefined' ? String(data[n]).toString() : m;
		});
	},
    /**
	 * 时间转换成时间戳
	 * @method timeStamp
	 * @for qv.zero.Util
	 * @param {Number} 时间格式
	 * @return {Number} 时间戳
    */
	timeStamp: function (date) {
		var newTime = date.replace(/:/g, '-');
		newTime = newTime.replace(/ /g, '-');
		var arr = newTime.split('-');
		var datum = new Date(Date.UTC(arr[0], arr[1] - 1, arr[2], arr[3] - 8, arr[4], arr[5]));
		return datum.getTime() / 1000;
	},
    /**
	 * 获取QQ号
	 * @method getUin
	 * @for qv.zero.Util
	 * @return {Number} QQ号
    */
	getUin: function () {
		if (/(\d+)/.test(this.getcookie('uin'))) {
			return parseInt(RegExp.$1, 10);
		} else {
			return 0;
		}
	},
	/**
	 * 发送AMS请求，cfg:do=request,actid,callback
	 * @param {Number} actid 活动号
	 * @param {Function} [callback] 请求成功后回调,默认用qv.zero.Http.showResponse处理
	 * @return void
	 * @example 
	 * page.response = function(json, actid, requestFn){}
	 * do=request,3115,page.response
	*/
	request: function (evt, params) {
		zHttp.request({
			actid: params[0]
		}, params[1] ? this.evalFn(params[1]) : zHttp.showResponse);
	},
	send: function (evt, params) {
		zHttp.send({
			actid: params[0]
		}, params[1] ? this.evalFn(params[1]) : zHttp.showResponse);
	},
    /**
     * 将配置表达式编译成一个可执行的function<br/>
     * @since 2.0.1
     * @example
     * 如"request,4444,callback" => 
	 * function(src, zHttp){
	    * zHttp[request](src, [4444,callback]);
	 * }
	 * 如"page.share,4444" => 
	 * function(src, zHttp){
	    * page.share(src, [4444]);
	 *} 
	* @param {String} request,4444
	* @return {Function}
	*/
	analyseActFn: function (pstr) {
		var me = this,
			args = pstr.split(',');
		args = [args.shift(), args];
		return function (src, host) {
			me.fireFn(args[0], [src, args[1]], host);
		};
	},
    /**
     *触发名为name的接口
    */
	fireFn: function (name, param, host) {
		return name && (host[name] ? this.evalFn(name, host) : this.evalFn(name)).apply(this, param);
	},
    /**
     * 将fnName变成一个可执行的接口
     * @param {String} fnName 接口名 
     * @param {Object} [scope] 上下文
     * @return {Function}
     * @example 
     * qv.zero.Util.evalFn('qv.zero.Msg.show');
     * qv.zero.Util.evalFn('page.share');
     * qv.zero.Util.evalFn('request',zHttp);
     */
	evalFn: function (fnName, scope) {
		if (!fnName) {
			return;
		}
		if (typeof fnName === 'function') {
			return fnName;
		}
		var ns = scope || window,
			index = fnName.lastIndexOf('.');
		if (index !== -1) {
			ns = eval(fnName.substr(0, index));
			fnName = fnName.substr(index + 1);
		}
		scope = scope || window;
		return function () {
			return ns[fnName].apply(scope, arguments);
		};
	},
	/**
	* 是否测试环境
	*/
	isDebug: function () {
		if (this._isdebug === void 0) {
			var uin0 = +this.getUin(), uin1 = +qv.zero.URL.get('test');
			this._isdebug = (uin1 === uin0 && uin0 !== 0); //防止cookie本来就没有uin
		}
		return this._isdebug;
	},
	/**
	* 是否pc端
	*/
	isPC: function () {
		var UA = navigator.userAgent;
		return UA.toLowerCase().match(/(Mobile|ipod|iphone|android|coolpad|mmp|smartphone|midp|wap|xoom|symbian|j2me|blackberry|win ce)/i) === null;
	},
	/**
     * 在手Q环境中打开手Q的路径
     * 手Q版本大于4.6
     */
	openUrl: function (url, actid, newwb) {
		var target = newwb ? 1 : 0,
			func_open = newwb ? function (newurl) {
				window.location.href = newurl;
			} : function (newurl) {
				window.location.replace(newurl);
			}, MQQ = window.mqq,
			report = actid ? function (cb) {
				zHttp.send({ 'actid': actid }, function () { cb(); });
			} : function (cb) {
				cb();
			};
		//如果没有带协议将会自动加上去
		url && (url = url.replace(/^[\s:]*\/\//, window.location.protocol + '//')) && report(function () {
			if (MQQ && (MQQ.iOS && MQQ.compare("4.5") >= 0 || MQQ.android && MQQ.compare("4.6") >= 0)) {
				MQQ.ui.openUrl({ url: url, target: target });
			} else {
				func_open(url);
			}
		});
	},
	//只执行一次
	oneExec: (function (moneyCache) {
		return function (key, executor, type, context) {
			var ls = window.localStorage;
			type = !ls ? 1 : (type || 0);
			var cache = (type !== 0 ? {
				get: function (key) { return moneyCache[key]; },
				set: function (key, value) { moneyCache[key] = true; }
			} : {
					get: ls.getItem.bind(ls),
					set: ls.setItem.bind(ls)
				});
			if (!cache.get(key)) {
				cache.set(key, true);
				executor.call(context || window);
			}
		};
	}({})),
	//获取短token
	getToken: function () {
		var hash = 5381, str = this.getcookie('skey') || "";
		for (var i = 0, len = str.length; i < len; ++i) {
			hash += (hash << 5) + str.charCodeAt(i);
		}
		return hash & 0x7fffffff;
	},
	//根据字符串获取数据
	getValueFromObj: function (context, keypath) {
		var keys = keypath.split('.'), key, cur = context, REG = /^(\w+)\[(\d+)\]$/;
		while (key = keys.shift()) {
			if (cur === void 0) {
				return cur;
			}
			if (~key.indexOf('[')) {
				if (REG.test(key)) {
					var k1 = RegExp.$1, k2 = RegExp.$2;
					cur = cur[k1];
					if (cur) {
						cur = cur[k2];
					}
				} else {
					throw 'argument: ' + key + ' error'
				}
			} else {
				cur = cur[key];
			}
		}
		return cur;
	},
    /**
     * 加载依赖文件，如果是zero的插件，则modules为类名如 FlashLottery<br/>
	 * imgcache不合并加载（因为后面cdn会取消combo的支持）
     * 支持imgcache的combo加载，多插件不同域名并行加载
     * @method require
     * @for qv.zero.Util
     * @param {String|Array} modules 模块名，如果外部接口，则直接传入URL，资源名可以列入qv.zero.APIs中查询
     * @param {Function} [fncontext] 加载后回调
     * @param {Object} [config], 其他配置
     * @param {String} config.charset 编码，默认为utf-8，
     * @param {Object} config.scope fncontext的上下文,默认为window
     * @return {void}
     */
	require: function(modules, fncontext, config){
		return qv.zero.Module.require(modules, fncontext, config);
	}
};
/**
 * @method sprint
 * @for qv.zero.Util
 * @see qv.zero.Util.sprintf
 * @deprecated 
 */
qv.zero.Util.sprint = qv.zero.Util.sprintf;

// 通过参数来控制，方便测试
if (qv.zero.Util.isDebug()) {
	//先备份
	qv.zero.Http.bak_SSOSyrequest = qv.zero.Http.SSOSyrequest;
	qv.zero.Http.bak_SSORequest = qv.zero.Http.SSORequest;
	qv.zero.Http.bak_SSOSend = qv.zero.Http.SSOSend;

	qv.zero.Http.SSOSyrequest = qv.zero.Http.syrequest;
	qv.zero.Http.SSORequest = qv.zero.Http.request;
	qv.zero.Http.SSOSend = qv.zero.Http._send;
}
