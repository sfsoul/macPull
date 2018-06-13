/**
 * 唤起和下载微信游戏APP
 * Zepto
 * mqq
 *
 * 属性
 * version
 *
 * 方法
 * start(config, extConfig): 启动游戏
 * isInstalled(config, callback): 判断应用是否安装
 *
 */
;(function(exports, $) {

    function isWeiXin(){
        var ua = window.navigator.userAgent.toLowerCase();
        if(ua.match(/MicroMessenger/i) == 'micromessenger'){
            return true;
        }else{
            return false;
        }
    }

    // 调用微信API：launch3rdApp（launchApplication未安装时会有两次确认）
    function launchApp() {
        WeixinJSBridge && WeixinJSBridge.invoke("launch3rdApp",{
            "appID" : GameManager.config.wxappid,
            "packageName" : GameManager.config.and_pkg
        },function(res){
            if (res.err_msg == "launch_3rdApp:fail") {
                if (zUtil.isAndroid()) {
                    if (GameManager.config.and_url) {
                        window.location.href = GameManager.config.and_url;
                        return;
                    }
                } else if (zUtil.isIOS()) {
                    if (GameManager.config.ios_url) {
                        window.location.href = GameManager.config.ios_url;
                        return;
                    }
                }
                zMsg.show("非常抱歉，暂不支持启动游戏");
            } else {
            }
        });
    }

    // 调用微信API：getInstallState
    function isInstalled(callback) {
        WeixinJSBridge && WeixinJSBridge.invoke('getInstallState', {
            'packageName': GameManager.config.and_pkg,
            'packageUrl': GameManager.config.ios_pkg + '://'
        }, function(e) {
            if (e && e.err_msg && e.err_msg.indexOf('get_install_state:yes') > -1) {
                callback && callback(true);
            } else {
                callback && callback(false);
            }
        });
    }

    var GameManager = {
        config : {},
        start : function() {
            if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
                launchApp();
            } else {
                if (document.addEventListener) {
                    document.addEventListener("WeixinJSBridgeReady", function () {
                        launchApp()
                    }, false);
                } else if (document.attachEvent) {
                    document.attachEvent("WeixinJSBridgeReady", function () {
                        launchApp()
                    });
                    document.attachEvent("onWeixinJSBridgeReady", function () {
                        launchApp()
                    });
                }
            }
        },
        isInstalled : function(callback) {
            if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
                isInstalled(callback);
            } else {
                if (document.addEventListener) {
                    document.addEventListener("WeixinJSBridgeReady", function () {
                        isInstalled(callback);
                    }, false);
                } else if (document.attachEvent) {
                    document.attachEvent("WeixinJSBridgeReady", function () {
                        isInstalled(callback);
                    });
                    document.attachEvent("onWeixinJSBridgeReady", function () {
                        isInstalled(callback);
                    });
                }
            }
        }
    };

    function route(page, callback) {
        var game = page.game.toLowerCase();
        var configParam = game.toUpperCase() + 'WXConfig';

        // 加载游戏的静态配置
        if(!window[configParam]){
            zUtil && zUtil.require(location.protocol + '//imgcache.gtimg.cn/club/common/lib/zero/idip/' + game + '.wx.js',function(){
                route(page, callback);
            },{scope : this});
            return;
        }

        GameManager.config = window[configParam];
        callback();
    }

    exports.WXGameManager = {
        // 版本
        version: '1.0.0',
        // 启动游戏
        start: function(page) {
            if (!isWeiXin()) {
                zMsg.show('该平台无法启动游戏！');
                return ;
            }
            route(page, function() {
                GameManager.start();
            });
        },
        // 判断游戏是否安装 暂不支持
        isInstalled: function(page, callback) {
            if (!isWeiXin()) {
                zMsg.show('该平台无法启动游戏！');
                return ;
            }

            callback = callback || function() {};
            route(page, function() {
                GameManager.isInstalled(function(result) {
                    callback(result);
                });
            });
        }
    };
})(qv.zero, Zepto);