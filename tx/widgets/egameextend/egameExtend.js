//电竞的扩展
(function(exports, $){

    var egame_appinfo = function(ua) {
        /**
         * 通过ua获取运行环境
         * 一个完整的UA示例
         * Mozilla/5.0 (Linux; Android 4.4.4; HM NOTE 1S Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/37.0.0.0 Mobile MQQBrowser/6.2 TBS/036215 Safari/537.36
         * ENV/PRE IMEI/868190025888421 com.tencent.qgame/1.0.0_102.100 NetType/WIFI WebP/0.3.0 X5Core/36215
         * by sesamewen
         * =======================================================================
         * 注意：该文件服务端和客户端均会运行，必须使用function避免服务端require缓存串台
         * =======================================================================
         */

        var isBrowser = typeof document != 'undefined' && ('function' == typeof document.createElement);
        var isNode = typeof process == 'object' && Object.prototype.toString.call(process) === '[object process]';
        var isTSW = isNode && 'object' == typeof window;

        // server UA
        var os = {
            /**
             * @deprecated 请使用 isIOS()
             */
            ios: _toNum(_platform('os ')),
            /**
             * @deprecated 请使用 isAndroid()
             */
            android: _toNum(_platform('android[/ ]')),
            /**
             * @deprecated 请使用 isPC()
             */
            pc: !_toNum(_platform('os ')) && !_toNum(_platform('android[/ ]')),
            /**
             * @deprecated 请使用 isWX()
             */
            weixin: /.*(micromessenger).*/.test(_getUA()),
            /**
             * @deprecated 请使用 isMqq()
             */
            mqq: /(ipad|iphone|ipod).*? (ipad)?qq\/([\d.]+)|\bv1_and_sqi?_([\d.]+)(.*? qq\/([\d.]+))?/.test(_getUA()),
            qzone: /.*(qzone).*/.test(_getUA()),
            /**
             * @deprecated 请使用 isQgame()
             */
            qgame: _getUA().match(/\bcom\.tencent\.qgame\/([\d\.]+)/), //适配企鹅电竞APP
            /**
             * @deprecated 请使用 isQgameKit()
             */
            qgamekit: _getUA().match(/\bcom\.tencent\.qgamekit\/([\d\.]+)/), //适配企鹅电竞SDK
            isNode: function() {
                return isNode;
            },
            //网络类型 wifi 4g 3g 2g unknown ，没有NetType返回空字符串
            getNetType: function() {
                return ((new RegExp('nettype\\/(\\w*)').exec(_getUA()) || [, ''])[1]).toLowerCase();
            },
            //获取设备类型
            getPlatform: function() {
                if (os.isAndroid()) {
                    return 'android';
                } else if (os.isIOS()) {
                    return 'iOS';
                } else {
                    return 'pc';
                }
            },
            getDeviceId: function() {
                return (/\bimei\/([\w\-]+)/i.exec(_getUA()) || [, '0'])[1]; //IMEI号
            },
            /**
             * @deprecated 使用os.appVersionCode()代替
             */
            appVersion: _platform('com.tencent.qgame/') || '0.0.0', //APP版本号
            getAppVersion: function() {
                return _platform('com.tencent.qgame/') || '0.0.0';
            },
            getMqqVersion: function() {
                return _platform('qq/') || '0.0.0';
            },
            appVersionCode: function() {
                var _versionCode;
                var _version = _platform('com.tencent.qgame/') || '0.0.0';
                _versionCode = _version.split('_').pop();
                return _versionCode;
            },
            appMode: (/env\/([^ ]+)/.exec(_getUA()) || [, 'release'])[1], //app环境DEBUG、TEST、PRE、RELEASE
            IMEI: (/\bimei\/([\w\-]+)/i.exec(_getUA()) || [, '0'])[1], //IMEI号
            isX5: function() {
                return this.isAndroid() && /\s(TBS|X5Core)\/[\w\.\-]+/i.test(_getUA());
            },
            isQgame: function() {
                return /\bcom\.tencent\.qgame\/([\d\.]+)/.test(_getUA());
            },
            /**
             * 是否PC浏览器
             * @returns {boolean}
             */
            isPC: function() {
                return !_toNum(_platform('os ')) && !_toNum(_platform('android[/ ]'));
            },
            /**
             * 是否PC浏览器（不支持H5）
             * @returns {boolean}
             */
            isPC_noH5: function() {
                return !_toNum(_platform('os ')) && !_toNum(_platform('android[/ ]')) && !_toNum(_platform('chrome/')) && !_toNum(_platform('safari/'));
            },
            // 是浏览器
            isBrowser: function() {
                return isBrowser;
            },
            isServer: function() {
                return isNode;
            },
            isIOS: function() {
                return _toNum(_platform('os '));
            },
            isAndroid: function() {
                return _toNum(_platform('android[/ ]'));
            },
            // 判断是不是真的 Safari
            isSafari: function() {
                return this.isIOS() && /^((?!chrome|android).)*safari/i.test(_getUA());
            },
            isQgameKit: function() {
                return /\bcom\.tencent\.qgamekit\/([\d\.]+)/.test(_getUA())
            },
            isQgameLiveAssistant: function() {
                return /\bcom\.tencent\.qgameliveassistant\/([\d\.]+)/.test(_getUA())
            },
            //判断腾讯新闻
            isQQNews: function() {
                return /\bqqnews\/([\d\.]+)/.test(_getUA())
            },
            /**
             * 比较版本号
             * @param a
             * @param b 不传则为当前的版本号
             * @returns {number}
             * 当a<b返回-1, 当a==b返回0, 当a>b返回1,
             * 约定当a或b非法则返回-1
             */
            compareVersion: function(a, b) {
                var i, l, r, len;
                //安卓的版本号为2.1.1.118_118
                a = String((a || '').replace('_', '.')).split('.');
                b = b || _platform('com.tencent.qgame/'); //如果b不传的话就是当前的版本号
                b = String((b || '').replace('_', '.')).split('.');

                for (i = 0, len = Math.max(a.length, b.length); i < len; i++) {
                    l = isFinite(a[i]) && Number(a[i]) || 0;
                    r = isFinite(b[i]) && Number(b[i]) || 0;
                    if (l < r) {
                        return -1;
                    } else if (l > r) {
                        return 1;
                    }
                }
                return 0;
            },
            /**
             * @deprecated 使用 util/chameleon.js
             */
            showGift: function() {
                return true;
            },
            isMqq: function() {
                return /(ipad|iphone|ipod).*? (ipad)?qq\/([\d.]+)|\bv1_and_sqi?_([\d.]+)(.*? qq\/([\d.]+))?/.test(_getUA())
            },
            isWX: function() {
                return /.*(micromessenger).*/.test(_getUA());
            },
            /**
             * @returns {boolean}
             */
            isYYB: function() {
                return /\/qqdownloader\/(\d+)(?:\/(appdetail|external|sdk))?/i.test(_getUA());
            },
            /**
             * @deprecated 未验证
             * @returns {boolean}
             */
            isMSDK: function() {
                // 这个 cookie GC_TICKET 是经过 cgi 跳转过来时才会带的，如果直接嵌页面不经过跳转，则没有这个 cookie
                return /\bmsdk\/([\w\.]+)/.test(_getUA()) || ('undefined' != typeof document && document.cookie.indexOf(' GC_TICKET=') > -1);
            },
            /**
             * @desc 判断是否标记补丁包
             * @param {number} number 标记patch版本号，默认为1
             * @return{boolean}
             */
            isPatch: function(number) {
                number = number || 1;
                var rex = new RegExp('patch\\/' + number);
                return rex.test(_getUA())
            },
            /**
             * 获取渠道包名（小写）
             * @returns {boolean}
             */
            getChannelName: function() {
                return _getChannelName();
            },
            getUrlParams: _getUrlParams,
            getUA: _getUA
        };

        //getUA
        function _getUA() {
            var userAgent = '';
            //客户端
            if (isBrowser) {
                userAgent = navigator.userAgent;
            } else if (isNode) { // 服务端
                if ('undefined' != typeof context && context.window) {
                    userAgent = context.window.request.headers["user-agent"] || '';
                } else {
                    userAgent = '';
                }
            }
            return userAgent.toLowerCase();
        }

        //获取渠道号
        function _getChannelName() {
            var m = _getUA().match(/ChannelName\/([\w\-\.]+)/i);
            return (m ? m[1] : null) || '';
        }

        //判断平台并拿取版本号
        function _platform(os) {
            var ver = ('' + (new RegExp(os + '(\\d+((\\.|_)\\d+)*)').exec(_getUA()) || [, 0])[1]);
            // undefined < 3 === false, but null < 3 === true
            return ver || undefined;
        }

        function _toNum(str) {
            return parseFloat((str || "").replace(/\_/g, '.')) || 0;
        }

        function _getUrlParams() {
            if (isBrowser) {
                return _url2Object(location.search.replace('?', ''));
            } else if (isNode) { // 服务端
                if ('undefined' != typeof context && context.window) {
                    return context.window.request.query;
                } else {
                    return {};
                }
            }
        }

        //参数转object
        function _url2Object(search) {
            var paramsList = {};
            var args = (search || '').split('&');
            (args || []).forEach(function(item) {
                if (item) {
                    var kv = item.split('=');
                    try {
                        paramsList[kv[0]] = decodeURIComponent(kv[1]);
                    } catch (e) {
                        paramsList[kv[0]] = kv[1];
                    }
                }
            });
            return paramsList;
        }

        // module.exports = os;

        // isBrowser && (window.os = os); // 谁写的 window.os = os，出来领死！

        /**
         * 对象混入
         * @param {Object} to 目标对象
         * @param {Object} from 源对象
         * @param {Boolean} deep 是否深度拷贝
         * @param {Function} filter function(key, valueInFrom){}过滤器，返回false不拷贝，true拷贝
         * @returns {*}
         */
        function mix(to, from, deep, filter) {
            var copy;
            //数据过滤器
            filter = filter || (function(key, value) {
                return true;
            });
            for (var i in from) {
                copy = from[i];
                //过滤器
                if (filter(i, from[i]) === false) {
                    continue;
                }
                if (deep && copy instanceof Array) {
                    to[i] = mix([], copy, deep);
                } else if (deep && copy instanceof Object) {
                    to[i] = mix(to[i] || {}, copy, deep);
                } else {
                    to[i] = from[i];
                }
            }
            return to;
        }

        var cookie = {
            /**
             * 设置Cookie
             * @param {String} key cookie-key
             * @param {String} value cookie-value
             * @param {Object} [options]
             * @param {String} [options.path='/']
             * @param {String} [options.domain=location.hostname]
             * @param {Number} [options.expires]
             * @param {Number} [options.expiresSeconds]
             * @param {Boolean} [options.raw=false]
             * @param {Boolean} [options.secure=false]
             * @returns {*}
             */
            set: function(key, value, options) {
                if (os.isServer()) {
                    //服务端暂不支持设置
                    return null;
                }
                var days, time, result, decode;
                if (arguments.length > 1 && String(value) !== "[object Object]") {

                    options = mix({}, options);

                    if (value === null || value === undefined) options.expires = -1;

                    if (typeof options.expires === 'number') {
                        days = (options.expires * 24 * 60 * 60 * 1000);
                        time = new Date();
                        time.setTime(time.getTime() + days)
                    } else if (typeof options.expiresSeconds === 'number') {
                        time = new Date();
                        time.setTime(time.getTime() + options.expiresSeconds * 1000);
                    }

                    value = String(value);
                    return (document.cookie = [
                        encodeURIComponent(key), '=',
                        options.raw ? value : encodeURIComponent(value),
                        time ? '; expires=' + time.toUTCString() : '',
                        options.path ? '; path=' + (options.path || '/') : '',
                        options.domain ? '; domain=' + (options.domain || location.hostname) : '',
                        options.secure ? '; secure' : ''
                    ].join(''))
                }

                // Key and possibly options given, get cookie
                options = value || {};

                decode = options.raw ? function(s) {
                    return s
                } : decodeURIComponent;

                return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null
            },
            /**
             * 获取cookie
             * @param {String} name 获取cookie key
             * @returns {*}
             */
            get: function(name) {
                var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
                var cookies;
                if (os.isServer()) {
                    cookies = window.request && window.request.cookies || {};
                    return cookies[name] || '';
                } else {
                    if (arr = document.cookie.match(reg))
                        return decodeURIComponent(arr[2]);
                    else
                        return null;
                }

            },
            remove: function(name, options) {
                if (os.isServer()) {
                    //服务端暂不支持设置
                    return null;
                }
                var me = this;
                options = mix({}, options);
                var exp = new Date();
                exp.setTime(exp.getTime() - 1);
                var cval = me.get(name);
                if (cval != null) {
                    var value = '';
                    document.cookie = [encodeURIComponent(name), '=', value,
                        ';expires=', exp.toUTCString(),
                        options.path ? ('; path=' + options.path) : ';path=/',
                        options.domain ? ('; domain=' + options.domain) : ('; domain=' + location.hostname)
                    ].join('');
                }
            }
        };

        /**
         * Created by hongweiqu on 2016/11/7.
         * 前端统计ID
         */
        // var cookie = require('./cookie');
        var config = {
            domain: '.egame.qq.com',
            pvid_key: 'pgg_pvid',
            ssid_key: 'pgg_ssid'
        };
        var pvid = {
            /**
             * 获取唯一ID
             * @returns {string}
             * @private
             */
            _getID: function() {
                return ((Math.round((Math.random() || 0.5) * 2147483647) * (+new Date())) % 10000000000) + '';
            },
            /**
             * 获取客户端PV ID
             */
            getPVID: function() {
                var me = this;
                var pvID = cookie.get(config.pvid_key);
                if (!pvID) {
                    pvID = me._getID();
                    cookie.set(config.pvid_key, pvID, {
                        domain: config.domain,
                        expires: (10 * 365) //10年有效期
                    });
                }
                return pvID;
            },
            /**
             * 获取客户端Session ID
             */
            getSSID: function() {
                var me = this;
                var ssID = cookie.get(config.ssid_key);
                if (!ssID) {
                    ssID = me._getID();
                    cookie.set(config.ssid_key, ssID, {
                        domain: config.domain
                    });
                }
                return ssID;
            }
        };

        var APPID_LIST = [{
            name: '应用宝',
            expression: /\/qqdownloader\/(\d+)(?:\/(appdetail|external|sdk))?/i,
            appid: '1101070898'
        }, { //先判断严格条件，游戏中心需要在手Q前面判断
            name: '手Q-游戏中心',
            expression: function(ua, urlParams) {
                return (/(ipad|iphone|ipod).*? (ipad)?qq\/([\d.]+)|\bv1_and_sqi?_([\d.]+)(.*? qq\/([\d.]+))?/i).test(ua) && (urlParams.gamecenter == 1);
            },
            appid: 'mqq_gamecenter'
        }, {
            name: '手Q',
            expression: /(ipad|iphone|ipod).*? (ipad)?qq\/([\d.]+)|\bv1_and_sqi?_([\d.]+)(.*? qq\/([\d.]+))?/i,
            appid: 'mqq'
        }, {

            name: '微信',
            expression: /.*(micromessenger).*/i,
            appid: 'wx'
        }, {
            name: '企鹅电竞',
            expression: /\bcom\.tencent\.qgame\/([\d\.]+)/i,
            appid: '1105198412'
        }];

        function getAppInfo(ua) {
            ua = ua || os.getUA();
            ua = ua.toLowerCase();
            var urlParams = os.getUrlParams() || {};
            var appid = urlParams['egame_id'] || ''; //默认使用URL上的egame_id
            var obj; //APPID_LIST中筛选出来的对象
            for (var i = 0; i < APPID_LIST.length; i++) {
                var item = APPID_LIST[i];
                var assert = false; //断言
                if (typeof item.expression == 'function') {
                    assert = item.expression(ua, urlParams);
                } else {
                    assert = item.expression.test(ua);
                }

                if (assert) {
                    obj = item;
                    appid = item.appid || '';
                    break;
                }
            }
            //平台
            var plat = 0;
            if (/iphone os/.test(ua)) {
                plat = 2;
            } else if (/android/.test(ua)) {
                plat = 1;
            } else if (/mac os/.test(ua)) {
                plat = 3;
            } else if (/windows/.test(ua)) {
                plat = 4;
            } else {
                plat = -1;
            }
            var appInfo = {
                platform: plat,
                terminal_type: 4, //H5统一使用4
                version_code: os.appVersionCode() || '',
                version_name: os.getAppVersion() || '',
                pvid: pvid.getPVID(),
                ssid: pvid.getSSID(),
                imei: os.getDeviceId()
            };
            if (appid) {
                appInfo.egame_id = appid;
            }
            return appInfo;
        };

        this.os = os, this.mix = mix, this.cookie = cookie, this.appInfo = getAppInfo(), this.getAppInfo = getAppInfo;
        // return {config, os, mix, cookie, pvid, 'appInfo': getAppInfo(ua), 'getAppInfo': getAppInfo};
    };

    var lib_open = '//egame.gtimg.cn/club/pgg/libs/libs_open_zero.js';
    exports.Util.require(lib_open, function(){
        iOS && !zUtil.isQGame() && window.mqq && (window.iOSQQApi = mqq);//修复ios下native和mqq冲突的情况
    });
    var iOS = exports.Util.isIOS(), android = exports.Util.isAndroid();

    //判断是否安装
    function isInstalled(cb){
        if(window.mqq && window.mqq.app && window.mqq.app.isAppInstalled){
            if(android || mqq.compare('6.5.5') >= 0){
                var pgn = iOS ? 'qggame': 'com.tencent.qgame';
                window.mqq.app.isAppInstalled(pgn, cb);
            } else {
                cb(false);
            }
        } else {
            cb(false);
        }
    }

    //安装提示语
    function installTips(showTips){
        var dlUrl = "//egame.qq.com/download/app?channel=huodongzujian";
        if (showTips) {
            zMsg.showMessageBox({
                msg: "进入企鹅电竞，观看更多精彩内容~",
                left: {
                    text: "确定", click: function () {
                        exports.Util.openUrl(dlUrl, 0, 1);
                    }
                },
                right: {text: "取消"}
            });
        } else {
            exports.Util.openUrl(dlUrl, 0, 1);
        }
    }
    /*
     * 使用 iframe 发起伪协议请求给客户端
     */
    function openSchemeURL(url) {
        var returnValue, iframe = document.createElement('iframe');
        iframe.style.cssText = 'display:none;width:0px;height:0px;';
        function failCallback() {
            /*
             正常情况下是不会回调到这里的, 只有客户端没有捕获这个 url 请求,
             浏览器才会发起 iframe 的加载, 但这个 url 实际上是不存在的,
             会触发 404 页面的 onload 事件
             */
        }

        if (iOS) {
            /*
             ios 必须先赋值, 然后 append, 否者连续的 api调用会间隔着失败
             也就是 api1(); api2(); api3(); api4(); 的连续调用,
             只有 api1 和 api3 会真正调用到客户端
             */
            iframe.onload = failCallback;
            iframe.src = url;
        }
        (document.body || document.documentElement).appendChild(iframe);
        /*
         android 这里必须先添加到页面, 然后再绑定 onload 和设置 src
         1. 先设置 src 再 append 到页面, 会导致在接口回调(callback)中嵌套调用 api会失败,
         iframe会直接当成普通url来解析
         2. 先设置onload 在 append , 会导致 iframe 先触发一次 about:blank 的 onload 事件

         */
        if (android) { // android 必须先append 然后赋值
            iframe.onload = failCallback;
            iframe.src = url;
        }

        // iOS 可以同步获取返回值, 因为 iframe 的url 被客户端捕获之后, 会挂起 js 进程
        returnValue = undefined;

        // android 捕获了iframe的url之后, 也是中断 js 进程的, 所以这里可以用个 setTimeout 0 来删除 iframe
        setTimeout(function() {
            iframe.parentNode.removeChild(iframe);
        }, 0);

        return returnValue;
    }

    //判断url是否是电竞的h5页
    function isQGameH5Url(url){
        return !!(url.indexOf('egame.qq.com')>-1);
    }

    //在电竞内打开h5，这里拼接终端需要的schema
    function getH5SchemaUrl(pggOpen, url){
        var h5SchemaUrl = pggOpen.formatSchemaUrl? pggOpen.formatSchemaUrl({
            url: 'browser',
            schema: 'qgameapi',
            params: {
                url: url
            }
        }) : null;
        return h5SchemaUrl;
    }

    //手Q内打开url
    function openInMqq(pggOpen, url, option){
        var schemaUrl = pggOpen.exchangeSchema(url); //通过h5地址获取到原生的url
        var isSchema = url.indexOf('qgameapi://') >= 0; //是否原生的地址
        var isForceEgame = option.forceEgame;
        if(exports.Util.isIOS()){ //ios
            //四种情况会调起app：1、url是原生地址；2、url是h5但有对应原生地址；3、url是电竞h5；4、option中传入forceEgame
            if(schemaUrl || isSchema || isQGameH5Url(url) || isForceEgame){
                var handler = setTimeout(function(){
                    if(isSchema || isForceEgame){
                        installTips();
                    } else {
                        exports.Util.openUrl(url, 0, 1);
                    }
                }, 500);
                document.addEventListener("qbrowserVisibilityChange", function(e){
                     e.hidden && handler ( clearTimeout(handler), handler = 0);
                 });

                var targetUrl = url;
                if (schemaUrl || isSchema) {
                    targetUrl = schemaUrl || url;
                } else if (isQGameH5Url(url) || isForceEgame) {
                    targetUrl = getH5SchemaUrl(pggOpen, url);
                }

                if (targetUrl){
                    openSchemeURL(targetUrl); //尝试启动app
                } else {
                    exports.Util.openUrl(url, 0, 1);
                }
            } else {
                exports.Util.openUrl(url, 0, 1);
            }
        } else {
            isInstalled(function(install){
                if(install){ //安装了
                    if(schemaUrl || isSchema){ //是原生的地址
                        openSchemeURL(schemaUrl || url);
                    } else if (isQGameH5Url(url) || isForceEgame){ //没有原生地址，但是电竞的h5页
                        //用电竞打开h5
                        var h5SchemaUrl = getH5SchemaUrl(pggOpen, url);
                        openSchemeURL(h5SchemaUrl);
                    } else {
                        exports.Util.openUrl(url, 0, 1);
                    }
                } else { //未安装
                    if(isSchema || isForceEgame){
                        installTips();
                    } else {
                        exports.Util.openUrl(url, 0, 1);
                    }
                }
            });
        }
    }

    function open(pggOpen, url, option){
        if(pggOpen.isQGame()){ //电竞
            var schemaUrl = pggOpen.exchangeSchema(url); //通过h5地址获取到原生的url
            var isSchema = url.indexOf('qgameapi://') >= 0; //是否原生的地址
            var targetUrl = schemaUrl? schemaUrl : isSchema? url : '';
            if (targetUrl) {//是终端协议，能直接跳终端页面
                //走openView接口
                pggOpen.openView(targetUrl);
            } else {
                pggOpen.open(url);
            }
        } else if(exports.Page.prototype.isMobileQQ) {  //手Q
            openInMqq(pggOpen, url, option);
        } else {
            //兼容http和https的情况，去掉http:变成裸协议
            url = url.replace(/^(http|https):\/\//, '//');
            location.href = url;
        }
    }

    function _getUA(){
        return navigator.userAgent.toLowerCase();
    }

    //判断平台并拿取版本号
    function _platform(os) {
        var ver = ('' + (new RegExp(os + '(\\d+((\\.|_)\\d+)*)').exec(_getUA()) || [, 0])[1]);
        // undefined < 3 === false, but null < 3 === true
        return ver || undefined;
    }

    function _toNum(str) {
        return parseFloat((str || "").replace(/\_/g, '.')) || 0;
    }

    var gameDownloadInfoCache = {};//记录多个游戏的下载信息

    exports.pgg = {
        isIOS: function () {
            return _toNum(_platform('os '));
        },
        isAndroid: function () {
            return _toNum(_platform('android[/ ]'));
        },
        isWX: function() {
            return /.*(micromessenger).*/.test(navigator.userAgent.toLowerCase());
        },
        /**
         * 异步加载电竞项目提供的工具类
         * @param  {Function} callback 回调exports对象
         */
        usePggLib: function(callback){
            if (exports.pggOpen && exports.pggNative) {
                callback && callback(exports);
                return;
            }

            exports.Util.require(lib_open, function(){
                iOS && !zUtil.isQGame() && window.mqq && (window.iOSQQApi = mqq);//修复ios下native和mqq冲突的情况
                if(exports.pggOpen && exports.pggNative){
                    callback && callback(exports);
                }
            });
        },
        //打开电竞的页面
        //1. 电竞内部，直接使用 exports.pggOpen.open 方法
        //2. 手Q内，
        //     如果是原生的，先拉起app，再跳转原生的
        //     如果是H5，则直接跳转h5
        // @param option {object|null} option.forceEgame
        openUrl: function(url, actid, option){
            option = option || {};
            this.usePggLib(function(exports){
                actid ? zHttp.send({'actid' : actid}, function(){ open(exports.pggOpen, url, option) }) : open(exports.pggOpen, url, option);
            });
        },
        /**
         * 分享
         * @param  {object} data 分享数据，参考ShareMessage组件
         */
        shareMessage: function(data, callback){
            this.usePggLib(function(exports){
                var native = exports.pggNative;
                native.share.showShareDialog({
                    title: data.title,
                    summary: data.desc,
                    targetUrl: data.share_url || data.url || window.location.href,
                    imgUrl: data.image_url
                }, function(json){
                    if (json && (json.result == 'success' || json.resultCode == 'success' || json.result == 0)) { // 分享成功
                        callback && callback(json);
                        if (window.page && window.page.emit && typeof window.page.emit === 'function') {
                            window.page.emit("system.shared", {retCode: 0});
                        }
                    }
                });
            });
        },
        /**
         * 企鹅电竞内设置右上角分享按钮和行为
         * @param  {object} data 分享数据，参考ShareMessage组件
         */
        setTitleButtons: function(data){
            var me = this;
            this.usePggLib(function(exports){
                var native = exports.pggNative;
                native && native.ui && native.ui.setTitleButtons({
                    right: {
                        iconID: 4,
                        callback: function () {
                            //调用分享
                            me.shareMessage(data);
                        }
                    }
                });
            });
        },
        /**
         * 调用schema协议打开终端界面
         * @param  {string} schemaUrl schema协议url
         */
        openView: function(schemaUrl){
            this.usePggLib(function(exports){
                if (exports.pggOpen && exports.pggOpen.openView) {
                    exports.pggOpen.openView(schemaUrl);
                }
            });
        },
        /**
         * 加群
         * @param  {object} opt {uin: xxxx}
         */
        showProfile: function(opt){
            var uin = opt && opt.uin? parseInt(opt.uin, 10) : 0;
            var openEgameInWx = opt && opt.openEgameInWx? 1 : 0;
            if (zUtil.isQGame() || openEgameInWx) {
                this.usePggLib(function(exports){
                    if (exports.pggOpen && exports.pggOpen.qqOnly && exports.pggOpen.qqOnly.lauchGroupCard) {
                        exports.pggOpen.qqOnly.lauchGroupCard(uin);
                    }
                });
            } else if (window.mqq) {
                mqq.ui.showProfile({uin:+uin, uinType:1});
            }
        },
        requestCgi: function(cgi, obj, callback){
            var mergeKey = '0';
            var params = {
                '0':{
                    'module': obj.module,
                    'method': obj.method,
                    'param': obj.param
                }
            };
             var appInfoStr = '';

            try {
                appInfoStr = JSON.stringify(new egame_appinfo().appInfo);
            } catch (e) {}

            var url = cgi + '?g_tk=' + zUtil.getToken();
            var paramsStr = JSON.stringify(params);
            var dataStr = 'param=' + encodeURIComponent(paramsStr) + '&app_info=' + encodeURIComponent(appInfoStr);

            $.ajax({
                type: 'GET',
                url: url,
                cache: false,
                data: dataStr,
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.withCredentials = true;
                },
                timeout: 3000,
                success: function (json) {
                    if (json && json.data && json.data[mergeKey] && json.data[mergeKey].retBody) {
                        json.data[mergeKey].retBody.uid = json.uid || 0;
                        (typeof callback == 'function') && callback(json.data[mergeKey].retBody);
                    } else {
                        callback({result: -1, data: null});
                    }
                },
                error: function (xhr, type) {
                    (typeof callback == 'function') && callback({result: -1, data: null});
                }
            });
        },
        _getGameInfo: function(page, callback){
            var me = this;
            var game =(page.game || page.pcfg.g).toLowerCase();

            if (gameDownloadInfoCache && gameDownloadInfoCache[game]) {
                callback && callback(gameDownloadInfoCache[game]);
                return;
            }

            function getIdip(game, callback){
                if(!exports.Idip  || !exports.Idip[game]){
                    zUtil.require('http://imgcache.gtimg.cn/club/common/lib/zero/idip/' + game + '.js',function(){
                        callback && callback(qv.zero.Idip[game]);
                    },{scope : this});
                } else {
                    callback && callback(qv.zero.Idip[game]);
                }
            }

            function getCSRFToken(){
                var hash = 5381, str = zUtil.getcookie('skey')||"";
                for (var i = 0, len = str.length; i < len; ++i) {
                    hash += (hash << 5) + str.charCodeAt(i);
                }
                return hash & 0x7fffffff;
            };

            function getGameInfo(appid, callback){
                var tt = me.isIOS() ? 2 : 1; // iOS：2 安卓：1
                $.ajax({
                    type: 'GET',
                    url: 'http://info.gamecenter.qq.com/cgi-bin/gc_gameinfo_v2_fcgi?' + $.param({
                        ADTAG : 'huodong.channelList',
                        sq_ver : 0,
                        ver : 0,
                        g_tk : getCSRFToken(),
                        uin: zUtil.getUin(),
                        sid: zURL.get('sid'),
                        appid: appid, // 游戏应用ID
                        tt : tt,
                        param : JSON.stringify({"key0":{"param":{
                            "tt": tt,
                            "appid": String(appid),
                            "referId":"banner_0"}, "module":"gc_gameinfo_v2","method":"getDetail"}})
                    }),
                    cache: false,
                    dataType: 'json',
                    beforeSend : function(xhr){
                        xhr.withCredentials = true;
                    },
                    success: function(json) {
                        var data = json && json.data && json.data.key0 && json.data.key0 && json.data.key0.retBody;
                        if(data && data.result === 0){
                            callback(data.items[0]);
                        }else if(data && data.result === -120000){
                            callback(0, data.result);
                        }else{
                            callback(0);
                        }
                    },
                    error : function(){
                        callback(0);
                    }
                });
            }

            function getAppstoreId(iosDownloadUrl){
                if (!iosDownloadUrl) {
                    return '';
                }
                var str = iosDownloadUrl.split('?')[0];
                var appstoreId = str.match(/\/id(.*)$/)[1];
                return appstoreId;
            }

            getIdip(game, function(gameConfig){
                var appid = gameConfig.appid;
                getGameInfo(appid, function(data, errCode){
                    if (data) {
                        var gameInfo = {
                            'appid': appid, //安卓用，开平那边的应用id
                            'appstoreId': getAppstoreId(data.iosDownloadUrl) || appid, //ios用 appstore用id
                            'packageName': data.pkgName,
                            'via': data.pkgName,
                            'appName': data.gameName,
                            'url': data.qqDownloadUrl,
                            'actionCode': 0 //操作类型 0 是下载，1是暂停
                        };
                        gameDownloadInfoCache[game] = gameInfo;
                        callback && callback(gameInfo);
                    } else if (!data && errCode) {
                        callback && callback(null, errCode);
                    } else {
                        callback && callback(null);
                    }
                });
            });
        },
        isInstalled: function(page, callback){
            var me = this;
            var game =(page.game || page.pcfg.g).toLowerCase();
            if (zUtil.isQGame() && game == 'egame') {
                callback && callback(true);
                return;
            }

            this._getGameInfo(page, function(gameInfo, errCode){
                if (!gameInfo) {
                    callback && callback(false);
                    return;
                }

                if (zUtil.isQGame()) {
                    if (me.isIOS()) {
                        //ios一律认为是已经下载
                        callback(true);
                    } else {
                        me.usePggLib(function(exports){
                            if (exports.pggNative) {
                                var native = exports.pggNative;
                                native.app.isAppInstalled(gameInfo.packageName, function (result) {
                                    callback && callback(result);
                                });
                            }
                        });
                    }
                } else {
                    zUtil.require('SQGameManager', function(){
                        if (qv.zero.SQGameManager) {
                            qv.zero.SQGameManager.isInstalled(page, callback);
                        }
                    });
                }
            });
        },
        start: function(page, gamedata){
            var me = this;
            var game =(page.game || page.pcfg.g).toLowerCase();
            var actid = page.jsonid || 0;
            if (zUtil.isQGame() && game == 'egame') {
                return;
            }

            var hasReportStart = {};
            var hasReportDownload = {};
            var reportStart = function(appid) {
                if(!hasReportStart[appid]) {
                    report(appid, {
                        operModule: 36,
                        moduleType: 3601,
                        operId: 200413,
                        operType: 3,
                        objId: actid
                    });
                    hasReportStart[appid] = 1;
                }
            };

            var reportDownload = function(appid, isFake) {
                var key = [appid, isFake ? 10 : 1].join('_');
                if(!hasReportDownload[key]) {
                    report(appid, {
                        operModule: 36,
                        moduleType: 3601,
                        operId: 200412,
                        operType: isFake ? 10 : 1,
                        objId: actid
                    });
                    hasReportDownload[key] = 1;
                }
            };

            var report = function(appid, params) {
                function doReport() {
                    var appInfo = new egame_appinfo().appInfo;
                    var data = $.extend({
                        sq_ver : appInfo.version_name, // 手Q版本号
                        gamecenter_ver : '', // 游戏中心页面版本
                        gamecenter_ver_type : 1, // 1在线版，2离线版
                        device_type : '', // 设备类型
                        net_type : -1, // 网络类型
                        resolution : [screen.width, screen.height].join('*'), // 分辨率
                        gamecenter_src : zURL.unserialParams(location.search.toLowerCase().substring(1))['adtag'] || 'huodong.' + actid, // 来源
                        ret_id : 1, // 返回码
                        ext11 : 8,
                        ext12 : 801
                    }, {
                        oper_module : params.operModule || '',
                        oper_id : params.operId || '',
                        module_type: params.moduleType || '',
                        oper_type: params.operType || '',
                        loc_id: params.locId || '',
                        obj_id: params.objId,
                        state_id: params.stateId || '',
                        logic_id: params.logicId || ''
                    });

                    $.ajax({
                        type: 'POST',
                        url: 'http://report.gamecenter.qq.com/cgi-bin/gc_pg_act_fcgi?' + $.param({
                            uin: zUtil.getUin(),
                            sid: zURL.get('sid'),
                            appid: appid, // 游戏应用ID
                            tt: me.isIOS() ? 2 : 1, // iOS：2 安卓：1
                            g_tk  : zUtil.getToken()
                        }),
                        beforeSend : function(xhr){ xhr.withCredentials = true; },
                        contentType: 'multipart/form-data',
                        processData: false,
                        data: JSON.stringify(data),
                        cache: false,
                        dataType: 'json',
                        success: function() {}
                    });
                }
                doReport();
            };

            if (zUtil.isQGame()) {
                this._getGameInfo(page, function(gameInfo, errCode){
                    if (!gameInfo) {
                        if (errCode === -120000) {
                            zMsg.show('请先登录');
                        }
                        return;
                    }

                    me.usePggLib(function(exports){
                        if (!exports.pggNative) {
                            return;
                        }
                        var native = exports.pggNative;

                        me.isInstalled(page, function(result){
                            if (result) {//已安装
                                if (me.isIOS()) {//ios不一定是已经安装，所以要先尝试拉起，再下载
                                    reportStart(gameInfo.appid);
                                    native.app.launchApp(gameInfo, function(json){
                                        if(json && json.result){
                                            //已经安装，拉起 donothing...
                                        }else{
                                            reportDownload(gameInfo.appid);
                                            //下载ios
                                            native.app.downloadApp({
                                                'appid': gameInfo.appstoreId,
                                                'urlStr': gameInfo.url,
                                                'packageName': gameInfo.packageName,
                                                'actionCode': gameInfo.actionCode,
                                                'via': gameInfo.via,
                                                'appName': gameInfo.appName
                                            }, function (result) {
                                            });
                                        }
                                    });
                                } else {
                                    reportStart(gameInfo.appid);
                                    native.app.launchApp(gameInfo.packageName);
                                }
                            } else {
                                reportDownload(gameInfo.appid);
                                //下载安卓
                                native.app.downloadApp({
                                    'appid': gameInfo.appid,
                                    'urlStr': gameInfo.url,
                                    'packageName': gameInfo.packageName,
                                    'actionCode': gameInfo.actionCode,
                                    'via': gameInfo.via,
                                    'appName': gameInfo.appName
                                });
                                zMsg.show('游戏正在下载中，可查看上方进度条');
                            }
                        });
                    });
                });
            } else {
                zUtil.require('SQGameManager', function(){
                    if (qv.zero.SQGameManager) {
                        qv.zero.SQGameManager.start(page, gamedata);
                    }
                });
            }
        },
        getAnchorAward: function(egameAssTaskId){
            qv.zero.LoadingMark.show();
            var cgi = 'http://share.egame.qq.com/cgi-bin/pgg_anchor_async_fcgi';
            this.requestCgi(cgi, {
                module: 'pgg_anchor_present_mt_svr',
                method: 'acquire_my_anchor_gift',
                param: {
                    task_id: +egameAssTaskId
                }
            }, function(json){
                qv.zero.LoadingMark.hide();
                if (json && json.result==0 && json.data) {
                    zMsg.show('当前奖励已发放至你的账户，请注意查收');
                } else if (json && (json.result==310020 || json.result==310002)) {
                    zMsg.show('你当前不符合领取条件');
                } else if (json && json.result==310009) {
                    zMsg.show('你已经领取过该礼包');
                } else {
                    zMsg.show('领取失败');
                }
            });
        },
        afterInit: function(){
            //遍历连接，判断如果是打开微信，并且是在微信环境
            if (this.isWX()) {
                $('[data-args]').each(function(index,item){
                    var ele = $(this),
                        args = ele.data('args') || {};
                    if (args.openEgameInWx==1) {
                        ele.attr('data-busbak', ele.attr('data-bus'));
                        ele.removeAttr('data-bus');
                        ele.on('click', function(){
                            var args = $(this).data('args') || {};
                            var url = args.link || window.location.href;
                            //跳转电竞下载页
                            window.open('http://m.egame.qq.com/download/app?channel=qqzhibo&type=act&url='+encodeURIComponent(url));
                        });
                    }
                });
            }

            //安卓预启动优化
            this.androidPagePreload();
        },
        androidPagePreload: function(){
            if (zUtil.isQGame() && this.isAndroid()) {
                // android预启动
                setTimeout(function(){
                    var ua = navigator.userAgent
                    if((/android[/ ]/i).test(ua) && !(/\bcom\.tencent\.qgame\/([\d\.]+)/).test(ua)){
                        var iframe = document.createElement('iframe');
                        iframe.src = 'qgpreloadapi://';
                        iframe.style.display= 'none';
                        document.body.append(iframe)
                    }
                },3000)
            }
        }
    };

})(qv.zero, Zepto);