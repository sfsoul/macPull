/**
 * 供运营活动上报数据的接口
 * Zepto
 * mqq
 *
 * 属性
 * version
 *
 * 方法
 * start(config, extConfig): 启动游戏
 * isInstalled(config, callback): 判断应用是否安装
 * setGameCenterApi(urlapi): 设置游戏中心详情页地址
 *
 *
 * @author tom.wang<tomszwang@tencent.com>
 */
;(function(exports, $) {
    var global = this;
    // 保存游戏配置信息
    var gameConfig = {};
    var isIPad = /iPad/.test(window.navigator.userAgent); //是否ipad
    var PATH = zUtil.isAndroid() ? '489' : '490';

    function module(factory) {
        var exports = {};
        factory.call(exports, exports);
        return exports;
    }
    function getCSRFToken(){
        var hash = 5381, str = zUtil.getcookie('skey')||"";
        for (var i = 0, len = str.length; i < len; ++i) {
            hash += (hash << 5) + str.charCodeAt(i);
        }
        return hash & 0x7fffffff;
    };

    //区分 iphone与ipad
    function getpkg(cfg){
        if(qqapi.callAPI('mqq.iOS')){
            if(!cfg.ipad_pkg){
                return cfg.ios_pkg
            }
            if(isIPad){
                return cfg.ipad_pkg;
            } else {
                return cfg.ios_pkg;
            }
        } else {
            return cfg.and_pkg;
        }
    }

    //获取完整的via信息，
    //应用宝通过via获取qqversion和uin，受于此时的条件只能这样改
    var getFullVia = (function(viaCache, uin){
        return function(via){
            via = via || 'ANDROIDQQ.GAME.DETAIL';
            if( via && via.indexOf('$')>0 ){
                return via;
            }
            if( viaCache[via] ){
                return viaCache[via];
            }
            var QQVersion = window.mqq && mqq.QQVersion || '';
            viaCache[via] = [ via, QQVersion, uin ].join('$');
            return viaCache[via];
        };
    })({}, zUtil.getUin());

    // 网络请求
    var net = module(function(exports) {
        // 获取游戏信息
        exports.getAppInfo = function(callback) {
            callback({
                'appid': gameConfig.appid,
                'pkgName': getpkg(gameConfig)
            });
        };
    });

    // qqapi
    var qqapi = module(function(exports) {
        var detailPage = location.protocol + '//m.gamecenter.qq.com/directout/detail/{appid}?_bid=278&_wv=5127&gc_version=2&autodownload=1&asyncMode=3';

        function goDetailPage(appid) {
            //pf=invite&ADTAG=huodong&autodownload=1&appid=
            var downUrl = detailPage.replace('{appid}', appid) + '&ADTAG=huodong.' + config.getConfig('actid');

            //手Q打开新web
            mqq.ui.openUrl({
                url: downUrl,
                target: 1,
                style: 0
            });
        }

        function callAPI(ns, callback, params) {
            callback = callback || function() {};

            if(ns && ns.replace && qqapi.isOver700()){ //将 q_download 替换为 wadl_download
                ns = ns.replace(/^q_download\./, 'wadl_download.');
            }

            // 检查mqq环境
            ns = ns.split('.');
            var root = global;
            for(var i = 0; i < ns.length; i++) {
                if(root.hasOwnProperty(ns[i])) {
                    if(i < ns.length - 1) {
                        root = root[ns[i]];
                    }
                } else {
                    var errMsg = '缺少手Q环境，该功能无法使用！';
                    zMsg.show(errMsg);
                    err = new Error(errMsg);
                    console.log(err);
                    callback(err);
                    return;
                }
            }

            try {
                if(!params) {
                    // 读取属性
                    return root[ns[i - 1]];
                } else {
                    // 调用方法
                    return root[ns[i - 1]].apply(root, params);
                }
            } catch(err) {
                console.log(err);
                callback(err);
            }
        }

        exports.setGameCenterDetailUrl = function(url) {
            detailPage = url;
        };
        exports.callAPI = callAPI;
        exports.isInstalled = function(callback) {
            exports.isIOS9(function(isIOS9) {
                if(isIOS9) {
                    // ios9下一律认为已经安装
                    callback(null, true);
                } else {
                    net.getAppInfo(function(appInfo) {
                        callAPI('mqq.app.isAppInstalled', callback, [appInfo.pkgName, function(result) {
                            callback(null, result);
                        }]);
                    });
                }
            });
        };
        function _getOpneId(appid, callback){
            $.ajax({
                type: 'GET',
                url: 'http://info.gamecenter.qq.com/cgi-bin/gc_get_openid_fcgi?' + $.param({
                    ADTAG : 'huodong.channelList',
                    plat : 'qq',
                    _lv : 34384,
                    path : PATH,
                    g_tk : getCSRFToken(),
                    uin: zUtil.getUin(),
                    sid: zURL.get('sid'),
                    appid: appid // 游戏应用ID
                }),
                cache: false,
                dataType: 'json',
                beforeSend : function(xhr){
                    xhr.withCredentials = true;
                },
                success: function(json) {
                    if(json.ret === 0){
                        callback(json.items[0].openid);
                    }else{
                        callback(0);
                    }
                },
                error : function(){
                    callback(0);
                }
            });
        };
        /**
         * 通用启动第三方APP
         */
        function commonLaunch(params, cb){
            var isUpVersion61 = mqq.compare("6.1.0") >= 0, isios = zUtil.isIOS();
            if(isUpVersion61 && isios){ //如果是ios6.1.0以上 结果异步返回
                params.callback = mqq.callback(function(json){
                    if(!json.result){ //失败
                        cb && cb({ ret : -1, plat : isios}); //ios执行失败
                    }
                });
            }
            var ret = callAPI('mqq.app.launchAppWithTokens', function(err) {
                // 出错了，直接跳转到游戏中心来启动
                if(err) {
                    cb && cb({ ret : -2, plat : isios }); //执行失败
                }
            }, [params]);

            if(!isUpVersion61 && !ret){
                cb && cb({ ret : -3, plat : isios }); //低版本ios执行失败
            }
        }
        var _start = function(gamedata) {
            net.getAppInfo(function(appInfo) {
                var appid = appInfo.appid;
                util.reportStart(appid);
                _getOpneId(appid, function(openid) {
                    if(openid === 0){
                        goDetailPage(appid);
                    } else {
                        var gd = '';
                        if(gamedata){
                            if($.isArray(gamedata) && gamedata.join){ //数组就这样
                                gd = 'mqq_' + gamedata.join('_');
                            } else {
                                gd = window.encodeURIComponent($.param(gamedata || {}));
                            }
                        }
                        var params = {
                            appID: appInfo.appid,
                            packageName: appInfo.pkgName,
                            flags: '536870912',
                            paramsStr: '?platform=qq_m&openid='+ openid +'&user_openid='+ openid +'&launchfrom=sq_gamecenter&gamedata='+ gd +'&platformdata='
                        };
                        commonLaunch(params, function(json){
                            if(json.ret !== 0){
                                if(!json.plat){ //andriod
                                    goDetailPage(appid);
                                } else { //ios
                                    location.href = "tencent" + appid + "://" + params.paramsStr; //先尝试拉起游戏

                                    exports.isIOS9(function(isIOS9) {
                                        if(isIOS9) {
                                            setTimeout(function(){
                                                _download(); //尝试下载
                                            }, 500);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            });
        };

        var _download = function() {
            net.getAppInfo(function(appInfo) {
                var appid = appInfo.appid;
                util.reportDownload(appid);
                util.sendDownloadPack(appid);
                downloadManager.download(appid, function(json){
                    goDetailPage(appid);
                });
            });
        };

        exports.download = exports.start = exports.auto = function(gamedata) {
            exports.isInstalled(function(err, isInstalled) {
                if(isInstalled) {
                    _start(gamedata);
                } else {
                    _download();
                }
            });
        };

        exports.Download = _download; //仅仅只是下载不进行判断是否安装。原因ios9下面，全部默认是安装的;

        exports.getQQVersion = function() {
            return String(callAPI('mqq.QQVersion')).split('.').slice(0, 3).join('.');
        };

        var cacheInfo;
        exports.getUserInfo = function(callback) {
            if(cacheInfo) {
                callback(cacheInfo);
            } else {
                callAPI('mqq.data.getUserInfo', function(err) {
                    // 出错了
                    if(err) {
                        callback({});
                    }
                }, [function(result) {
                    if(result && result.hasOwnProperty('uin') /*&& result.hasOwnProperty('sid')*//*sid下线去掉*/) {
                        cacheInfo = result;
                        callback(result);
                    } else {
                        callback({});
                    }
                }]);
            }
        };

        var cacheNetworkType;
        exports.getNetworkType = function(callback) {
            var netType = ['none', 'wifi', '2g', '3g', '4g'];
            if(cacheNetworkType) {
                callback(cacheNetworkType);
            } else {
                callAPI('mqq.device.getNetworkType', function(err) {
                    // 出错了
                    if(err) {
                        callback(netType[0]);
                    }
                }, [function(type) {
                    cacheNetworkType = netType[type || 0] || netType[0];
                    callback(cacheNetworkType);
                }]);
            }
        };

        var cacheDeviceInfo;
        exports.getDeviceInfo = function(callback) {
            if(cacheDeviceInfo) {
                callback(cacheDeviceInfo);
            } else {
                callAPI('mqq.device.getDeviceInfo', function(err) {
                    // 出错了
                    if(err) {
                        callback({});
                    }
                }, [function(info) {
                    if(info && info.model) {
                        cacheDeviceInfo = info;
                        callback(cacheDeviceInfo);
                    } else {
                        callback({});
                    }
                }]);
            }
        };

        exports.isIOS9 = function(callback) {
            exports.getDeviceInfo(function(deviceInfo) {
                if(deviceInfo.systemVersion && parseInt(deviceInfo.systemVersion, 10) >= 9) {
                    callback(true);
                    return;
                }
                callback(false);
            });
        };

        //判断手Q版本大于7.0.0
        exports.isOver700 = function isOver700(){
            // if(isOver700.res === void 0){
            //     var data = 0, isover = false, uin = zUtil.getUin();
            //     if(window.AMD_178835 && AMD_178835.form && AMD_178835.form[1] && AMD_178835.form[1][0]){
            //         data = AMD_178835.form[1][0];
            //     }
            //     if(data && uin){
            //         var u = uin % 100;
            //         if(u >= data.f_1 && u <= data.f_2 || (data.f_3 && data.f_3.length && data.f_3.indexOf(uin) >= 0)){
            //             isover = mqq.compare('7.0.0') >= 0;
            //         }
            //     }
            //     isOver700.res = isover;
            // }
            //return isOver700.res;
            return mqq.compare('7.0.0') >= 0;
        };
    });

    // 工具类
    var util = module(function(exports) {
        var hasReportStart = {};
        var hasReportDownload = {};

        exports.reportAuto = function(isFake) {
            qqapi.isInstalled(function(err, isInstalled) {
                if(!isInstalled) {
                    net.getAppInfo(function(appInfo) {
                        exports.reportDownload(appInfo.appid, isFake);
                    });
                }
            });
        };

        exports.reportStart = function(appid) {
            if(!hasReportStart[appid]) {
                util.report(appid, {
                    operModule: 36,
                    moduleType: 3601,
                    operId: 200413,
                    operType: 3,
                    objId: config.getConfig('actid')
                });
                hasReportStart[appid] = 1;
            }
        };

        exports.reportDownload = function(appid, isFake) {
            var key = [appid, isFake ? 10 : 1].join('_');
            if(!hasReportDownload[key]) {
                exports.report(appid, {
                    operModule: 36,
                    moduleType: 3601,
                    operId: 200412,
                    operType: isFake ? 10 : 1,
                    objId: config.getConfig('actid')
                });
                hasReportDownload[key] = 1;
            }
        };

        exports.report = function(appid, params) {
            qqapi.getDeviceInfo(function(deviceInfo) {
                qqapi.getNetworkType(function(netType) {
                    doReport(deviceInfo, netType);
                });
            });

            function doReport(deviceInfo, netType) {
                var data = $.extend({
                    sq_ver : qqapi.getQQVersion(), // 手Q版本号
                    gamecenter_ver : '', // 游戏中心页面版本
                    gamecenter_ver_type : 1, // 1在线版，2离线版
                    device_type : deviceInfo.model || '', // 设备类型
                    net_type : netType, // 网络类型
                    resolution : [screen.width, screen.height].join('*'), // 分辨率
                    gamecenter_src : zURL.unserialParams(location.search.toLowerCase().substring(1))['adtag'] || 'huodong.' + config.getConfig('actid'), // 来源
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

                qqapi.getUserInfo(function(userInfo) {
                    $.ajax({
                        type: 'POST',
                        url: 'http://report.gamecenter.qq.com/cgi-bin/gc_pg_act_fcgi?' + $.param({
                            uin: userInfo.uin || 0,
                            sid: userInfo.sid || '',
                            appid: appid, // 游戏应用ID
                            tt: qqapi.callAPI('mqq.iOS') ? 2 : 1, // iOS：2 安卓：1
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
                });
            }
        };

      /*
       * 发送下载礼包 17-08-07
       */
       exports.sendDownloadPack = function(appid) {
           var url = location.protocol +　'//info.gamecenter.qq.com/cgi-bin/gc_play_info_fcgi?param=';
           var param = {
               0: {
                 module: 'gc_play_info',
                 method: 'checkGameDownload',
                 param: {
                   appId: appid + ''
                 }　
               }
           };
           // report
           $.ajax({
             type: 'GET',
             url: url + JSON.stringify(param) + "&g_tk=" + getCSRFToken(),
             beforeSend: function(xhr){ xhr.withCredentials = true; },
             contentType: 'multipart/form-data',
             success: function() {}
           })
       }

    });

    var downloadManager = module(function(exports){
        /**
         *  天坑：三星S6无法拉起应用宝
         *  三星S6的机器系列是G9200-G9250之间
         */
        function isSamsungS6(callback){
            qqapi.getDeviceInfo(function(deviceInfo) {
                var dm;
                if((dm = deviceInfo.model)){
                    callback && callback(/^SM-G92\d{2}$/.test(dm));
                } else {
                    callback && callback(false);
                }
            });
        }
        function iconUrl( appId ){
            if( '' + appId === '10001' ){
                return '//imgcache.qq.com/vipstyle/icon/pcGame/Cf.png';
            }
            else {
                return 'http://download.wegame.qq.com/gc/formal/common/' + appId + '/thumImg.png';
            }
        }
        function getClient(){
            if(getClient.ret){
                return getClient.ret;
            }
            var ret;
            if(qqapi.callAPI('mqq.iOS')){
                ret = 'iphoneqq';
            } else if(qqapi.callAPI('mqq.android')){
                ret = 'androidqq'
            } else {
                ret = '';
            }
            getClient.ret = ret;
            return ret;
        }
        function getWebView() {
            if (/[?&]_webview=(gameCenter|default)/.test(window.location.href)) {
                return RegExp.$1;
            } else if (typeof(GCApi) !== 'undefined' && GCApi.getClass) {
                // androidQQ4.5以前如果有GCApi则代表在游戏中心
                return 'gameCenter';
            } else if (getClient() == 'iphoneqq') {
                // iphoneQQ的webview能力一致
                return 'gameCenter';
            } else if (/\bV1_AND_SQ_.+gamecenter/.test(window.navigator.userAgent)) {
                // androidQQ4.6+新增userAgent标识
                return 'gameCenter';
            } else {
                return 'default';
            }
        };
        function iosDownloadErrCallback(json){ //ios下载失败时的回调函数
            if ( !json || json.result != 0 ) {
                location.href = params.url;   //最初的方式
            }
        }
        function getDownloaderVersion(callback) {
            var cache = arguments.callee;
            if (cache.json) {
                callback(cache.json);
            } else {
                qqapi.callAPI('q_download.getDownloadVersion', function() {
                    callback({result: 0, data: 0});
                }, [function(version) {
                    cache = {result: 0, data: version};
                    callback(cache);
                }]);
            }
        };
        function getGameInfo(appid, callback){
            var tt = qqapi.callAPI('mqq.iOS') ? 2 : 1; // iOS：2 安卓：1
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
                    }else{
                        callback(0);
                    }
                },
                error : function(){
                    callback(0);
                }
            });
        }
        var gameinfoCache = {};
        function getGameInfoCache(appid, callback){
            if(gameinfoCache[appid]){
                callback(gameinfoCache[appid]);
            } else {
                getGameInfo(appid, function(json){
                    gameinfoCache[appid] = json;
                    callback(gameinfoCache[appid]);
                });
            }
        }
        function gotoDownload(){//跳转下载管理页面
            setTimeout(function(){
                var url = window.location.protocol + '//imgcache.qq.com/gc/gamecenterV2/dist/index/download/download.html?ver=0&number=0&gamecenter=1&_wv=2147484679&gc_version=2&notShowPub=1&' + $.param({
                    st : +new Date(),
                    uin : zUtil.getUin(),
                    path : 489,
                    plat : 'qq',
                    ADTAG: 'huodong.' + config.getConfig('actid')
                });
                zUtil.openUrl(url, 0, 1);
            }, 50);
        }
        function _startDownload(params, callback) {
            switch (getClient()) {
                case 'iphoneqq':
                    params.url = params.iosDownloadUrl;
                    if( !params.url){return;}   //如果没有url，直接就不操作了

                    if( -1 != params.url.indexOf("itunes.apple.com") ){  //只有是appstore的连接，才使用这个
                        var res     = /.*id(\d+)[$|?]?/.exec( params.url )
                        var appleId = res?res[1]:0;
                        var uin     = zUtil.getUin();
                    }

                    if( appleId ){      //下载需要有苹果id
                        var param   = {
                            appid : appleId,
                            url   : params.url
                        };
                        if(mqq.compare("5.9.5") >= 0){
                            //6.0之后的版本，支持手Q内部直接调起appstore页下载
                            var nparams = param;
                            var callbackName = mqq.callback(iosDownloadErrCallback);
                            if (callbackName) {
                                nparams.callback = callbackName;
                            }
                            mqq.invoke('app', 'downloadApp', nparams);
                            // qqapi.callAPI('mqq.app.downloadApp', iosDownloadErrCallback, [param, iosDownloadErrCallback]);
                        } else {
                            location.href = params.url;   //最初的方式
                        }
                    }else{
                        location.href = params.url;   //最初的方式
                    }

                    break;
                case 'androidqq':
                    if(!params.qqDownloadUrl || !/\.apk$|\.apk\?/.test(params.qqDownloadUrl)){
                        mqq.ui.showTips({ text: "下载链接有误，请稍后重试", iconMode: 2 });
                        return;
                    }
                    getDownloaderVersion(function(json) {
                        var isOver658 = mqq.compare('6.5.8')>=0;  //坑爹的客户端版本判断
                        var data;
                        isSamsungS6(function(flag){
                            params.url = params.qqDownloadUrl;
                            if (json && json.data && (params.downloadChannel != 1) && !flag) {
                                // 新版下载器
                                data = {
                                    appid: params.appId + '',
                                    iconUrl: iconUrl(params.appId),
                                    url: params.url,
                                    packageName: params.pkgName,
                                    actionCode: 2,  // 2:下载; 3:暂停 5:安装 9:卸载 10:取消下载
                                    via: getFullVia('ANDROIDQQ.GAME.DETAIL'),  //默认来源，重要字段，记录下载分成，KPI
                                    // appName: params.gameName || params.appName,
                                    appName: _getName(params.gameName) || _getName(params.appName),
                                    myAppConfig: 2, //应用宝配置 0不使用，1使用并走安装逻辑， 2使用不走
                                    notifyKey: 'N_' + params.appId,
                                    updateData: '', //通过更新SDK查询的更新结果，可不填？
                                    updateType: '0',    //是否使用增量更新功能，0不使用、1使用  例子代码没有
                                    //以下为跳转应用宝相关参数
                                    wording : params.wording || "",
                                    myAppId: params.yybAppId || '', //应用宝Id
                                    apkId: params.yybApkId || '',   //应用宝下载包apkid;
                                    versionCode: params.yybVersionCode || '',   //应用宝versionCode;
                                    isAutoDownload: 1,
                                    showNotification: 1,    //展示下载通知栏
                                    toPageType: params.target || 1, //游戏中心列表也下载时，跳往应用宝详情页；游戏中心详情页下载时跳往应用宝下载管理器
                                    sourceType: 2,
                                    wadl_updateflag: 0, //2：继续下载、1：更新、0：下载
                                    delayDownload: params.delayDownload ? 1 : 0,  //是否需要延迟下载,当网络环境切换到wifi时自动下载(如果为1且当前为移动网络则不会立即下载,而是会在有wifi网络的时候才自动下载)
                                    wadlSource: location.href.split('?')[0],    //当前页面地址上报，见『点击下载透传下载URL地址』
                                    wadlDownloadType: 2                         //当前下载类型上报，见『点击下载透传下载URL地址』
                                };
                                //手Q6.5.8以下版本的自动下载参数为isAutoInstall
                                if(isOver658){
                                    data.isAutoInstallBySdk = 1
                                }else{
                                    data.isAutoInstall = 1
                                }
                                // 完整下载
                                qqapi.callAPI('q_download.doDownloadAction', function(json) {
                                    if (json && json.result !== 0) {
                                        callback(json, params);
                                    }
                                }, [JSON.stringify(data)]);
                                if(qqapi.isOver700()){ //如果是高版本直接跳转下载中心
                                    gotoDownload();
                                } else {
                                    //判断是否安装了应用宝
                                    qqapi.callAPI('mqq.app.isAppInstalled', gotoDownload, ['com.tencent.android.qqdownloader', function(result) {
                                        if(!result){
                                            gotoDownload();
                                        }
                                    }]);
                                }
                            } else {
                                // 旧版下载器
                                data={
                                    appid: params.appId + '',
                                    iconUrl: iconUrl(params.appId),
                                    url: params.url,
                                    packageName: params.pkgName,
                                    actionCode: 2,  // 2:下载; 3:暂停 5:安装
                                    via: getFullVia('ANDROIDQQ.GAME.DETAIL'),  //默认来源，重要字段，记录下载分成，KPI
                                    // appName: params.appName || params.gameName,
                                    appName: _getName(params.gameName) || _getName(params.appName),
                                    myAppConfig: '0',   //应用宝配置 0不使用，1使用并走安装逻辑， 2使用不走
                                    notifyKey: params.appId,
                                    versionCode: params.yybVersionCode || '',   //应用宝versionCode;
                                    dType: 0,
                                    actionType: 900,
                                    gf: 'gf',
                                    from: 'gamecenter'
                                };
                                //手Q6.5.8以下版本的自动下载参数为isAutoInstall
                                if(isOver658){
                                    data.isAutoInstallBySdk = 1
                                }else{
                                    data.isAutoInstall = 1
                                }
                                qqapi.callAPI('q_download.doGCDownloadAction', function(json) {
                                    if (json && json.result !== 0) {
                                        location.href = params.url;
                                    }
                                }, [JSON.stringify(data)]);
                                gotoDownload();
                            }
                        });
                    });
                    break;
                default:
                    callback({result: 4, message: 'no support'});
            }
        }

        //获取游戏中文名
        function _getName(appName){
            // var appName = params.appName || params.gameName;
            var isUpVersion665 = mqq.compare("6.6.5") >= 0;
            if(isUpVersion665) return appName;
            //兼容6.6.5版本以下的应用宝下载sdk bug(只要名字有“耀”字就会把这个字不编码直接放在请求header里带到cdn服务器去)
            if(appName && appName.indexOf("王者荣耀")>=0){
                appName="王者"
            }
            return appName;
        }

        var isinit = false;
        function initAPI(){
            if(!isinit){
                isinit = true;
                //初始化对象
                if (getClient() === 'androidqq') {
                    if (getWebView() == 'gameCenter') {
                        //JsBridge.restoreApis({'GCApi': ['setClientWebviewPull', 'showWarningToast', 'getReportPublicHighData', 'getReportPublicData', 'getSid', 'getUin', 'getOpenidBatch', 'getVersionName', 'startToAuthorized']}, '4.6');
                        JsBridge.restoreApis({'q_download': ['doGCDownloadAction', 'doDownloadAction', 'getDownloadVersion']}, '4.6');
                        qqapi.isOver700() && JsBridge.restoreApis({'wadl_download': ['doGCDownloadAction', 'doDownloadAction', 'getDownloadVersion']}, '4.6');
                    }else{
                        //外面的webview也要q_download, 但是回调机制不一样
                        // JsBridge.restoreApis({'q_download': ['registerDownloadCallBackListener', 'getQueryDownloadAction', 'doGCDownloadAction', 'doDownloadAction', 'getDownloadVersion', 'checkUpdate']}, '4.7');
                        JsBridge.restoreApis({'q_download': ['doGCDownloadAction', 'doDownloadAction', 'getDownloadVersion']}, '4.7');
                        qqapi.isOver700() && JsBridge.restoreApis({'wadl_download': ['doGCDownloadAction', 'doDownloadAction', 'getDownloadVersion']}, '4.6');
                    }
                }
            }
        }

        /**
         * 下载app
         */
        exports.download = function(appid, callback){
            getGameInfoCache(appid, function(json){
                if(json){
                    initAPI();
                    _startDownload(json, callback);
                }
            });
        };
    });

    var config = module(function(exports) {
        var config = {
            //actid
        };

        exports.setConfig = function(cfg) {
            config = cfg;
        };

        exports.getConfig = function(key) {
            return config[key];
        };
    });

    function route(page, callback) {
        var game =(page.game || page.pcfg.g).toLowerCase();
        // 取APPID
        if(!exports.Idip  || !exports.Idip[game]){
            zUtil.require('http://imgcache.gtimg.cn/club/common/lib/zero/idip/' + game + '.js',function(){
                route(page, callback);
            },{scope : this});
            return;
        }
        var jsonid = page.jsonid; // 活动号，一定会有
        config.setConfig({
            actid: jsonid
        });
        gameConfig = qv.zero.Idip[game];
        //zUtil.require('http://imgcache.gtimg.cn/ACT/vip_act/act_data/178835.json.js?t=' + (+new Date()), function(){
            callback();
        //});
    }

    exports.SQGameManager = {
        // 版本
        version: '2.4.3',
        // 启动游戏
        start: function(page, gamedata) {
            if (zUtil.isQGame()) {
                zUtil.require('egameExtend', function(){
                    if (qv.zero.pgg && qv.zero.pgg.start) {
                        qv.zero.pgg.start(page, gamedata);
                    }
                });
                return;
            }
            if(qqapi.getQQVersion() == 0){
                zMsg.show('该平台无法启动游戏！');
                return ;
            }
            route(page, function() {
                qqapi.start(gamedata);
            });
        },
        // 判断游戏是否安装
        isInstalled: function(page, callback) {
            callback = callback || function() {};
            if (zUtil.isQGame()) {
                zUtil.require('egameExtend', function(){
                    if (qv.zero.pgg && qv.zero.pgg.isInstalled) {
                        qv.zero.pgg.isInstalled(page, callback);
                    }
                });
                return;
            }
            route(page, function() {
                qqapi.isInstalled(function(err, result) {
                    callback(result);
                });
            });
        },
        setGameCenterApi : function(url){
            qqapi.setGameCenterDetailUrl(url);
        },
        report: util.report,
        reportStart: util.reportStart,
        reportDownload: util.reportDownload,
        reportAuto: function(isFake){
            route(window.page || exports.Page.instance, function() {
                util.reportAuto(isFake);
            });
        },
        isIOS9: qqapi.isIOS9
    };
})(qv.zero, Zepto);
