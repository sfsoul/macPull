/**
 * Created by v_cywchen on 16-8-12.
 * 封装阅读动漫请求，主要支持合并请求（支持单个请求）
 * 提供2个方法：sendRequest/sendMergeRequest
 */
(function(exports, $){
	
	var _private = {};

	_private.config = {
		// 合并请求默认属性
		options: {
			dataType: 'json',
			cache: false,
			timeout: 0,
			xhrFields: {
				withCredentials: true
			},
			type: 'POST'
		},
		// 合并请求公共参数
		params: {
			plat: (window.mqq && mqq.iOS) ? 2 : 1
		}
	};
	
	_private.mapping = {};
	

	/**
	 * 异步请求
	 * @param options
	 */
	exports.sendRequest = function(options){
		if(options && options.url){//普通请求，直接透传参数发起cgi请求
			_private.ajax(options);
			return;
		}else{
			options.callback && options.callback({result : -1});  //参数缺失
			return;
		}
	};
	
	/**
     * 合并请求
     *
	 * @method ajax
	 * @param {Object} options 参数信息，参考$.ajax，success与error统一为callback
	 * 
	 * @return {xhr} AJAX请求对象
	 */
	exports.sendMergeRequest = function(options) {
		
		var groupName = String(options.url).split('?')[0];
		if (!_private.mapping[groupName] || !_private.mapping[groupName].proxyXhr || !_private.mapping[groupName].optionList) {
			_private.mapping[groupName] = {
				proxyXhr: $.ajaxSettings.xhr(),
				optionList: [],
				headers: {},
				interval: 0,
				instance: null
			};
		}
		// 重建xhr - Begin
		var pluginXhr;
		var methodList = ['abort', 'getAllResponseHeaders', 'getResponseHeader', 'open', 'overrideMimeType', 'send', 'setRequestHeader', 'init', 'openRequest', 'sendAsBinary'];
		var requestList = ['withCredentials'];
		var responseList = ['readyState', 'response', 'responseText', 'responseType', 'responseXML', 'status', 'statusText'];
		var eventList = ['abort', 'error', 'load', 'loadend', 'loadstart', 'progress', 'progress', 'timeout', 'readystatechange'];
		options.xhr = (function(xhr, groupData) {
			var proxyXhr = function () {};
			for (var i = 0, iMax = methodList.length; i < iMax; i++) {
				if (typeof(xhr[methodList[i]]) !== 'undefined') {
					proxyXhr.prototype[methodList[i]] = (function(method) {
						return function() {
							if (method && method.apply) {
								return method.apply(xhr, Array.prototype.slice.call(arguments, 0));
							}
						};
					})(xhr[methodList[i]]);
				}
			}
			proxyXhr.prototype.open = function() {};
			proxyXhr.prototype.send = function() {
				if (groupData.optionList.push(options) === 1) {
					// 队列中的第一个请求才会执行setTimeout
					setTimeout(function() {
						// 重写send
						groupData.proxyXhr.send = (function(send) {
							return function() {
								var responseList = ['readyState', 'response', 'responseText', 'responseType', 'responseXML', 'status', 'statusText'];
								var eventList = ['abort', 'error', 'load', 'loadend', 'loadstart', 'progress', 'timeout', 'readystatechange'];
								for (var i = 0, iMax = eventList.length; i < iMax; i ++) {
									(function(event, callback) {
										// 监听合并请求的各事件，用于将事件通知到各请求，本段代码需要在send时设置，避免被其他调用覆盖
										groupData.proxyXhr[event] = function() {
											var json, result;
											// 回调合并请求自身的事件
											if (callback) {
												result = callback.apply(groupData.proxyXhr, Array.prototype.slice.call(arguments, 0));
											}
											if (event === 'onreadystatechange') {
												// 当为onreadystatechange事件并且获取到responseText时进行解包
												if (groupData.proxyXhr.readyState == 4 && !/^\s*$/.test(groupData.proxyXhr.responseText)) {
													try {
														json = $.parseJSON(groupData.proxyXhr.responseText);
													} catch (e) {
														json = JSON.stringify({result:e.number || -1, message: e.message || e.name || 'parseError'});
													}
												}
											}
											for (var j = 0, jMax = groupData.optionList.length; j < jMax; j ++) {
												var itemXhr = groupData.optionList[j].xhr();
												if (typeof(itemXhr[event]) === 'function') {
													// 遍历合并请求的各属性copy到各请求的xhr上
													for (var k = 0, kMax = responseList.length; k < kMax; k++) {
														if (json && responseList[k] === 'responseText') {
															// 对responseText进行解包
															if (typeof(json) === 'string') {
																itemXhr[responseList[k]] = json;
															} else if (!json.data || !json.data[j]) {
																itemXhr[responseList[k]] = JSON.stringify({result: json.ecode || -1, message: 'key nofound'});
															} else if (!json.data[j].retBody) {
																itemXhr[responseList[k]] = JSON.stringify({result: json.data[j].retCode || -1, message: json.data[j].retMsg || 'retBody nofound'});
															} else {
																itemXhr[responseList[k]] = JSON.stringify(json.data[j].retBody);
															}
														} else {
															try{
																//此处需要屏蔽异常，responseState不等于4的情况下，获取responseText会报错
																itemXhr[responseList[k]] = groupData.proxyXhr[responseList[k]];
															}catch(e){

															}
														}
													}
													// 调用各请求的事件
													if (itemXhr[event]) {
														itemXhr[event].apply(itemXhr, Array.prototype.slice.call(arguments, 0));
													}
												}
											}
											if (callback) {
												return result;
											}
										};
									})('on' + eventList[i], groupData.proxyXhr['on' + eventList[i]]);
								}
								return send.apply(groupData.proxyXhr, Array.prototype.slice.call(arguments, 0));
							};
						})(groupData.proxyXhr.send);
						// 遍历各请求参数 - Begin
						var data = {}, params = $.extend(true, {merge: groupData.optionList.length}, _private.config && _private.config.params), timeout = 10000;
						for (var i = 0, iMax = groupData.optionList.length; i < iMax; i ++) {
							// 组建请求包，至少需呀一个参数
							data[i] = groupData.optionList[i] && groupData.optionList[i].data && $.extend(true,{param:{tt:0}},groupData.optionList[i].data);
							// 合并各请求的querystring，各请求的querystring有覆盖的可能，不建议把数据放在querystring
							params = $.extend(true, params, uri.parseQueryString(uri.parseUrl(groupData.optionList[i].url).search));
							// 以最大超时为合并请求的超时
							timeout = Math.max(timeout, groupData.optionList[i].timeout);
						}
						// 遍历各请求参数 - End
						
						groupData.instance = _private.ajax($.extend(true, {}, _private.config && _private.config.options, {
							url: groupName + '?' + $.param(params),
							data: {
								param: JSON.stringify(data)
							},
							headers: groupData.headers,
							timeout: timeout || 20000,
							xhr: function() {
								return groupData.proxyXhr;
							}
						}));
						// 释放对groupData的引用
						_private.mapping[groupName] = null;
					}, 0);
				}
			};
			proxyXhr.prototype.getDuration = function() {
				return groupData.instance && typeof(groupData.instance.getDuration) === 'function' ? groupData.instance.getDuration.apply(this, Array.prototype.slice.call(arguments, 0)) : 0;
			};
			proxyXhr.prototype.getAllResponseHeaders = function() {
				// 各请求从合并请求获取Header信息
				return groupData.proxyXhr.getAllResponseHeaders.apply(groupData.proxyXhr, Array.prototype.slice.call(arguments, 0));
			};
			proxyXhr.prototype.getResponseHeader = function() {
				// 各请求从合并请求获取Header信息
				return groupData.proxyXhr.getResponseHeader.apply(groupData.proxyXhr, Array.prototype.slice.call(arguments, 0));
			};
			proxyXhr.prototype.setRequestHeader = function(name, value) {
				// 缓存各请求的Header设置
				groupData.headers[name] = value;
			};
			pluginXhr = new proxyXhr();
			return function() {
				return pluginXhr;
			};
		})((options.xhr || $.ajaxSettings.xhr)(), _private.mapping[groupName]);
		// 重建xhr - End
		
		_private.ajax(options);
	};
	
	/**
	 * 发送网络请求
	 * @param params 参数信息，参考$.ajax，success与error统一为callback
	 */
	_private.ajax = function(params){
		var self = this,
			callback = params.callback || function(){},
			url = params.url,
			urlparams = {
				clientVer: (window.mqq && mqq.QQVersion) || '5.8.1',
				g_tk: security.getCSRFToken()
			};
		url += (url.indexOf('?') >= 0 ? '?' : '&') + $.param(urlparams);

		return $.ajax({
			url: url,
			data: params.data,
			type: params.type || 'GET',
			timeout: params.timeout || 20000,
			xhrFields: {
				withCredentials: true
			},
			dataType: 'json',
			xhr: params.xhr || $.ajaxSettings.xhr,
			cache: false,
			success: function(json){
				if (typeof json.ecode != 'undefined') {
					json.result = json.ecode;
					delete json.ecode;
				}
				if(json && (json.result == -20004 || json.result == -120000 || json.result == 120002)){
					//如果当前页面没有登录态
					qv.zero.Login.show();
					return;
				} else {
					callback(json);
				}
				//错误码上报
				/*
				if(json.result !=0 ){
					_private.sendError({url : url , result : json.result});
				}
				*/
			},
			error: function(xhr, statusText, errorText){
				var result = 600003;
				if (statusText == 'timeout') {
					result = 600000;
					callback({result: result, message: '很抱歉，访问后台服务器超时了，请稍后重试哟：）'});
				} else if (statusText == 'abort') {
					result = 600001;
					callback({result: result, message: '很抱歉，后台服务器出错了，请稍后重试哟：）'});
				} else if (statusText == "parsererror") {
					result = 600002;
					callback({result: result, message: '很抱歉，后台数据格式有问题，程序员哥哥正在修复中，请稍后重试哟：）'});
				} else {
					result = 600003;
					callback({result: result, message: '很抱歉，后台服务器出了点问题，请稍后重试哟：）'});
				}
			//	errorHandle.handle(xhr, statusText, errorText, callback);
			//	_private.sendError({url : url , result : result});
			}
		});
	};
	
	/**
     * 获取唯一标识，防止跨站请求伪造<br/>
     *
     * @method getCSRFToken
     * @param {Object} [params={}] 定制参数
     * @param {String} [params.skey=''] 用户SKey，不提供会自动到cookie中取
     * @return {String} 唯一Token值
     */
	var security = {
		getCSRFToken: function(params) {
			var self = this;
			var hash = 5381;
			var skey = self.getCookie('skey');
			skey = skey || (params && params.skey) || '';
			if (skey) {
				for(var i = 0, len = skey.length; i < len; i++){
					hash += (hash << 5) + skey.charCodeAt(i);
				}
				return hash & 0x7fffffff;
			} else {
				return false;
			}

		},
	
		/**
		 * 获取cookie
		 * @param {string} name 名称
		 * @return {?string} 值
		 * @example qv.cookie.get('qv_cookieName');
		 */
		getCookie: function(name) {
			if (document.cookie && document.cookie != '') {
				var cookieArr = document.cookie.split('; ');
				for (var i = 0, cl = cookieArr.length, name = encodeURIComponent(name), tmpArr; i < cl; i++) {
					tmpArr = cookieArr[i].split('=');
					if(name == tmpArr[0]) {
						return decodeURIComponent(tmpArr[1] || '');
					}
				}
			}
			return null;
		}
	};
	
	var uri = {
		/**
		 * 获取绝对路径
		 *
		 * @method getRealPath
		 * @param {String} path 相对路径
		 * @param {String} [target=location.href] 参考路径
		 * @return {String} 绝对路径
		 * @example
		 * getRealPath('./../file.txt', 'http://vip.qq.com/a/b/c?name=value')
		 * http://vip.qq.com/a/b/file.txt
		 */
		getRealPath : function(path, target) {
			var p = 0,
				arr = []; /* Save the root, if not given */
			var r = target || window.location.href; /* Avoid input failures */
			path = (path + '').replace('\\', '/'); /* Check if there's a port in path (like 'http://') */
			if (path.indexOf('://') !== -1) {
				p = 1;
			} /* Ok, there's not a port in path, so let's take the root */
			if (!p) {
				path = r.substring(0, r.lastIndexOf('/') + 1) + path;
			} /* Explode the given path into it's parts */
			arr = path.split('/'); /* The path is an array now */
			path = []; /* Foreach part make a check */
			for (var k in arr) { /* This is'nt really interesting */
				if (arr[k] == '.') {
					continue;
				} /* This reduces the realpath */
				if (arr[k] == '..') {
					/* But only if there more than 3 parts in the path-array.
					 * The first three parts are for the uri */
					if (path.length > 3) {
						path.pop();
					}
				} /* This adds parts to the realpath */
				else {
					/* But only if the part is not empty or the uri
					 * (the first three parts ar needed) was not
					 * saved */
					if ((path.length < 2) || (arr[k] !== '')) {
						path.push(arr[k]);
					}
				}
			} /* Returns the absloute path as a string */
			return path.join('/');
		},

		/**
		 * 解析url，返回组成部分
		 *
		 * @method parseUrl
		 * @param {String} url 待解析的url
		 * @return {Object|null} 解析成功返回URL组成部分，参考window.location。解析失败返回null
		 * @example
		 * parseUrl('http://www.qq.com:80/?name=value#hash')
		 * 返回
		 * {
		 *     hash: "#hash",
		 *     host: "www.qq.com",
		 *     hostname: "www.qq.com",
		 *     href: "http://www.qq.com/?name=value#hash",
		 *     pathname: "/",
		 *     port: "80",
		 *     protocol: "http:",
		 *     search: "?name=value"
		 * };
		 */
		parseUrl : function(url) {
			if (/^(([^:\/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/.test(url)) {
				var host = RegExp.$4.split(':');
				return {
					protocol: RegExp.$1,
					host: RegExp.$4,
					hostname: host[0],
					port: host[1] || '',
					pathname: RegExp.$5,
					search: RegExp.$6,
					hash: RegExp.$8,
					href: url
				};
			} else {
				return null;
			}
		},

		/**
		 * 根据组成信息生成URL，是uri.parseUrl的反向操作
		 *
		 * @method getUri
		 * @param {Object} component
		 * @param {String} [component.hash] HASH值
		 * @param {String} [component.search] SEARCH值
		 * @param {String} [component.pathname] PATHNAME值
		 * @param {String} [component.host] HOST值
		 * @param {String} [component.protocol] PROTOCOL值
		 * @return {String} 结果URL
		 */
		getUri : function(location) {
			var uri = '';
			if (location.hash) {
				uri = location.hash.indexOf('#') == 0 ? location.hash : '#' + location.hash;
			}
			if (location.search) {
				uri = (location.search.indexOf('?') == 0 ? location.search : '?' + location.search) + uri;
			}
			if (location.pathname) {
				uri = location.pathname + uri;
			} else {
				return uri;
			}
			if (location.host && uri.indexOf('/') == 0) {
				uri = location.host + uri;
			} else {
				return uri;
			}
			if (location.protocol) {
				uri = location.protocol + '//' + uri;
			}
			return uri;
		},

		/**
		 * 将query string解析为object
		 *
		 * @method parseQueryString
		 * @param {String} queryString 待解析的查询字符串
		 * @return {Object} 解析结果
		 * @example
		 * parseQueryString('name=value&hash[a]=A&hash[b]=B') : {
		 *     "name": "value",
		 *     "hash": {
		 *         "a": "A",
		 *         "b": "B"
		 *     }
		 * };
		 */
		parseQueryString : function(queryString) {
			var strArr = String(queryString).replace(/^[\?&#]/, '').replace(/&$/, '').split('&'),
				sal = strArr.length,
				i, j, ct, p, lastObj, obj, lastIter, undef, chr, tmp, key, value,
				postLeftBracketPos, keys, keysLen,
				fixStr = function (str) {
					return decodeURIComponent(str.replace(/\+/g, '%20'));
				},
				array = {};

			for (i = 0; i < sal; i++) {
				tmp = strArr[i].split('=');
				key = fixStr(tmp[0]);
				value = (tmp.length < 2) ? '' : fixStr(tmp[1]);

				while (key.charAt(0) === ' ') {
					key = key.slice(1);
				}
				if (key.indexOf('\x00') > -1) {
					key = key.slice(0, key.indexOf('\x00'));
				}
				if (key && key.charAt(0) !== '[') {
					keys = [];
					postLeftBracketPos = 0;
					for (j = 0; j < key.length; j++) {
						if (key.charAt(j) === '[' && !postLeftBracketPos) {
							postLeftBracketPos = j + 1;
						}
						else if (key.charAt(j) === ']') {
							if (postLeftBracketPos) {
								if (!keys.length) {
									keys.push(key.slice(0, postLeftBracketPos - 1));
								}
								keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
								postLeftBracketPos = 0;
								if (key.charAt(j + 1) !== '[') {
									break;
								}
							}
						}
					}
					if (!keys.length) {
						keys = [key];
					}
					for (j = 0; j < keys[0].length; j++) {
						chr = keys[0].charAt(j);
						if (chr === ' ' || chr === '.' || chr === '[') {
							keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
						}
						if (chr === '[') {
							break;
						}
					}

					obj = array;
					for (j = 0, keysLen = keys.length; j < keysLen; j++) {
						key = keys[j].replace(/^['"]/, '').replace(/['"]$/, '');
						lastIter = j !== keys.length - 1;
						lastObj = obj;
						if ((key !== '' && key !== ' ') || j === 0) {
							if (obj[key] === undef) {
								obj[key] = {};
							}
							obj = obj[key];
						}
						else { // To insert new dimension
							ct = -1;
							for (p in obj) {
								if (obj.hasOwnProperty(p)) {
									if (+p > ct && p.match(/^\d+$/g)) {
										ct = +p;
									}
								}
							}
							key = ct + 1;
						}
					}
					lastObj[key] = value;
				}
			}
			return array;
		}
	}
	
	if (!window.zReadcomic) {
		window.zReadcomic = exports;
	}

})((qv.zero.readcomic = {}), Zepto);