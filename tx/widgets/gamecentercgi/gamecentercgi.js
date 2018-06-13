//游戏中心领取礼包的接口


;(function(exports, $) {
	var platCode     = /iphone|ipad|itouch/ig.test(window.navigator.userAgent)? 2 : 1;

	zUtil.require('aop', function(){
		exports.ObjectDecorator.getObjectDecorator(zHttp).interception('request', {
			before : function(env, next){
				var arg = env.args[0], fn = env.args[1], showRightBtn = env.args[2];
				if(typeof fn === 'boolean' || typeof fn === 'string' || typeof fn === 'object'){
		            showRightBtn = fn;
		            fn = null;
		        }
		        if(arg.gcgift){
		        	getgift(arg, function(ret) {
	            		if(ret.result === -120000) ret.ret = 10002;
			            if(fn) {
			                fn.call(me, ret, arg.actid, null, showRightBtn, arg);
			            } else {
			            	var msgCfg = zMsg.getRetMsg(arg.actid, ret.ret);
			            	if(ret.ret == 20801){ //暂时只支持游戏中心的礼包
			            		zMsg.showDialog(msgCfg.m,[msgCfg.b, function(){
					                (new Function(msgCfg.l + '();'))();
					            }]);
			            	} else {
			            		zMsg.showWithGameBtn(msgCfg.m, zHttp.page, arg);
			            	}
			            }
			        });
		        } else {
		        	next();
		        }
			},
			desc : 'gamecentercgi interception'
		});
	});

	zUtil.require('aop', function(){
        zAOP.intercept_s_s('request', { before : function(param){ //拦截request方法
            var arg = param.args[0], fn = param.args[1], showRightBtn = param.args[2];
            if(typeof fn === 'boolean' || typeof fn === 'string' || typeof fn === 'object'){
	            showRightBtn = fn;
	            fn = null;
	        }
            if(arg.gcgift){
            	getgift(arg, function(ret) {
            		if(ret.result === -120000) ret.ret = 10002;
		            if(fn) {
		                fn.call(me, ret, arg.actid, null, showRightBtn, arg);
		            } else {
		            	var msgCfg = zMsg.getRetMsg(arg.actid, ret.ret);
		            	if(ret.ret == 20801){ //暂时只支持游戏中心的礼包
		            		zMsg.showDialog(msgCfg.m,[msgCfg.b, function(){
				                (new Function(msgCfg.l + '();'))();
				            }]);
		            	} else {
		            		zMsg.showWithGameBtn(msgCfg.m, zHttp.page, arg);
		            	}
		            }
		        });
            	return false;
            }
        }}, zHttp, 1);
    });
    
	//领取礼包
	function getgift(param, callback){
		var data = {module : "gc_game_gift",
					method : "exchangeGift",
					param : {
						"tt"    : platCode,
						'id'	: +param.actid,
						"giftType" : (!!param.partition ? 3 : 2)
					}
		};
		param.area && (data.param.area = +param.area);
		param.roleid && (data.param.roleId = param.roleid+'');
		param.partition && (data.param.partition = +param.partition);
		param.platid && (data.param.platId = +param.platid);

		ajax(data, function(json){
			callback && callback(json, param);
		});
	};

	function getCSRFToken(){
		var hash = 5381, str = zUtil.getcookie('skey')||"";
		for (var i = 0, len = str.length; i < len; ++i) {
			hash += (hash << 5) + str.charCodeAt(i);
		}
		return hash & 0x7fffffff;
	};

	function createUrl(route, params){
		var defaultParams = $.extend(true, {}, parseQueryString(window.location.search));
		defaultParams.sid = zURL.get('sid');
		var domain = 'gift.gamecenter.qq.com';
		if (window.location.hostname.split('.').slice(-3).join('.') == '3g.qq.com') {
			domain = window.location.host;
		} else if(window.location.search.indexOf('&debug=') > -1 ||
				  window.location.search.indexOf('?debug=') > -1 ){
			domain = 'gamecentertest.cs0309.3g.qq.com';
		}
		return 'http://' + domain + route + '?' + $.param($.extend(true, {g_tk : getCSRFToken()}, defaultParams, params));
	};

	function parseQueryString(queryString) {
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
	};

	function ajax(data, callback){
		$.ajax({
			url     : createUrl("/cgi-bin/gc_gamegift_fcgi"),
			data 	: {param : JSON.stringify({'key0' : data })},
			cache   : false,
			dataType: 'json',
			timeout : 8,
			beforeSend : function(xhr){
				xhr.withCredentials = true;
			},
			success : function(json){
				var result = json.data.key0.retBody;
				result.ret = result.result;
				callback && callback(result);
			},
			timeout : function(json){
				callback && callback({
					result : 2,
					ret    : 2,
					msg    : "timeout"
				});
			},
			error 	: function(){
				callback && callback({
					result : 5,
					ret    : 5,
					msg    : "网络异常，请稍后再试！"
				});
			}
		});
	}

})(qv.zero, Zepto);