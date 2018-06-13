//反劫持的代码
;(function(isInit){
    if(!isInit){
        !function(a){function b(a){var b=new RegExp("(^|&)"+a+"=([^&]*)(&|$)"),c=location.search.substr(1).match(b);return null!=c?decodeURIComponent(c[2]):null}function c(){var a="iframe_hijack_redirected";if(b(a))f(0);else if(self!=top){var c=location.href,d=c.split("#");d[0]+=location.search?"&"+a+"=1":"?"+a+"=1";try{top.location=d.join("#")}catch(e){}}}function d(){if(a.XMLSerializer){var b=(new XMLSerializer).serializeToString(document),c=b.match(/<!--headTrap.*?-->/),d=b.match(/<!--tailTrap.*?-->/);(c&&c[0]&&c[0].length>54||d&&d[0]&&d[0].length>54)&&f(3)}}function e(a){var b=a?a.srcElement:document.documentElement;if(b.outerHTML){for(var c=/(https?:)?\/\/[a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6}(:[0-9]{1,6})?\/?[^'")\s]*/gi,d=/^(https?:)?\/\/([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})/i,e=[],g=[b],h=b.getElementsByTagName("*"),i=0;i<h.length;i++)g.push(h[i]);for(var i=0;i<g.length;i++){var j=g[i],l=null;if("IMG"==j.nodeName.toUpperCase()&&j.src&&d.test(j.src))l=[j.src];else if("LINK"==j.nodeName.toUpperCase()){var m=j.getAttribute("href");m&&d.test(m)&&(l=[m])}else"STYLE"==j.nodeName.toUpperCase()?l=j.innerHTML.match(c):"IFRAME"==j.nodeName.toUpperCase()&&j.src&&d.test(j.src)?l=[j.src]:j.getAttribute("style")&&(l=j.getAttribute("style").match(c));if(l){for(var n=!1,o=0;o<l.length;o++){var p=d.exec(l[o]);p&&p[2]&&k.test(p[2])||(e.push(l[o]),n=!0)}n&&j.setAttribute("style","display:none;position:fixed;top:10000px;")}}e.length&&(a&&b.setAttribute("style","display:none;position:fixed;top:-10000px;"),f(a?2:1,e))}}function f(a,b){if(!l[a]){l[a]=!0;var c={project_id:j,department_id:i,hijack_type:a,page_url:location.href,blocked:1};if(b&&(c.ad_url=b.join("||")),1==a){for(var d=document.head.outerHTML,e=document.body.children,f=0;f<e.length;f++){var g=e[f];"IFRAME"==g.nodeName.toUpperCase()&&g.src&&0!=g.src.indexOf("http")||(d+=g.outerHTML)}d=d.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,""),d=d.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,""),c.html_dom=d}setTimeout(function(){h(c)},500)}}function g(){50*Math.random()<1&&h({project_id:j,department_id:i,pv:1})}function h(a){var b=[];for(var c in a)b.push(c+"="+encodeURIComponent(a[c]));var d=new XMLHttpRequest;d.open("POST","http://hijack.qq.com/cgi/r",!0),d.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),d.send(b.join("&"))}var i,j,k=/^.*\.(qq\.com|gtimg\.cn|qlogo\.cn|qpic\.cn|sogoucdn\.com|file\.myqcloud\.com)$/i,l={};a.HijackReport={init:function(a){i=a.departmentId,j=a.projectId,a.whiteReg&&(k=a.whiteReg)},watch:function(){a.addEventListener("DOMNodeInserted",e),c(),document.addEventListener("DOMContentLoaded",function(){e(),d(),g()},!1)}}}(window);

        try {
            HijackReport.init({
                departmentId: 1,
                projectId: 23
            });
            HijackReport.watch();
        } catch (e) {}
    }
})(!!window.HijackReport || (window.location.protocol === 'https:'));


//自动判断是否需要下载游戏
// 给 syrequest 增加了一个逻辑：
// 1. 在请求之前判断 参数里面是否有 checkInstall 属性，如果有则判断是否安装了游戏
//     a. 游戏的选择方式：看调用syrequest的参数里面是否有game属性有则使用，没有则使用page里面的game属性
// 2. 如果没有安装游戏，则默认是跳转下载游戏地址。如果传递处理函数将使用传递的处理函数
//     a. 获取处理函数的方式是： 判断 syrequest 的参数数量是否 > 2 且 最后一个参数是函数
;
(function (exports, $) {
    //自动判断是否需要下载游戏
    qv.zero.Page.instance.addReadyFire(function (page) {
        if (exports.zAOP) {
            exports.zAOP.intercept_s_a('syrequest', {
                before: function (param) { //拦截syrequest方法 function (args, fn, showRightBtn)
                    var args = param.args, len = args.length, data, cb = param.callback;
                    if (args && len > 0 && (data = args[0])) {
                        if (data && data.checkInstall) { //如果开启
                            delete data.checkInstall;
                            zUtil.require('SQGameManager', function () { //加载组件
                                var p = page, install_data = {game: data.game || p.game, jsonid: p.jsonid};
                                var isPCGame = (p.getGameConfig(install_data.game) || {}).c > 1;
                                var lastarg = args[len - 1], sqgm = qv.zero.SQGameManager, noinstall = function () {
                                    sqgm.start(install_data);
                                };
                                if (len > 2 && typeof lastarg === 'function') {
                                    noinstall = lastarg;
                                }
                                if (!isPCGame && (window.mqq && mqq.compare('0') > 0)) { //不是pc and  不是浏览器
                                    sqgm.isInstalled(install_data, function (ret) {
                                        if (!ret) {
                                            noinstall(); //未安装
                                        } else {
                                            cb && cb();
                                        }
                                    })
                                } else {
                                    cb && cb();
                                }
                            });
                            return false; //不执行后面的代码
                        }
                    }
                    cb && cb();
                }
            }, zHttp, 1);
        }
    });
}(qv.zero, Zepto));

//添加pay 来开添加这个通会员的业务
(function (exports, $) {
    qv.zero.Page.instance.addReadyFire(function (page) {
        var PAY = window.PAY || (window.PAY = {});
        if(!PAY.showPay){
            PAY.showPay = function (months) {
                OZ.report({operType: '点击' , operDesc: '开通会员'});
                zUtil.require('http://imgcache.gtimg.cn/club/platform/lib/pay/smartpay.simplify.js', function(){
                    qw.smartPay.openService({
                        data : null,
                        aid : page.pcfg.aid,
                        type : "svip",
                        month : months || 1,
                        onPayCallback : function(result){
                            if(result && result.ret == 0){
                                OZ.report({operType: '点击' , operDesc: '开通会员-成功'});
                            }
                        }
                    });
                });
            }
        }
    });
}(qv.zero, Zepto));

//添加一些特殊的有用的函数
(function (exports, $) {
    
    //获取段的token 后面迁移至zUtil
    if(!exports.Util.getToken){
        exports.Util.getToken = function() {
            var hash = 5381, str = this.getcookie('skey') || "";
            for (var i = 0, len = str.length; i < len; ++i) {
                hash += (hash << 5) + str.charCodeAt(i);
            }
            return hash & 0x7fffffff;
        };
    }
    /**
     * 查询子活动的参与信息
     * @param actids 只能是单个子活动或者子活动数组
     * 返回deferred
     * 兼容CallBack
     */
    exports.Http.queryJoinInfo = function(actids, callback){
        if(window.zDefer){
            var deferred = zDefer.defer();
        } else {
            var cb = new exports.CallBack();
        }
        zHttp.request({'actids' : ([]).concat(actids).join('_'), _f : 'remaindCnt', _c : 'load'}, function (data) {
            deferred && deferred.resolve(data);
            cb && cb.execute(data);
            callback && callback(data);
        });
        if(deferred){
            return deferred.promise;
        } else {
            return cb;
        }
    };

    //跳转游戏详情页
    if(!exports.Util.gotoGameDetail){
        exports.Util.gotoGameDetail = function (appid){
            var url = '//m.gamecenter.qq.com/directout/detail/{appid}?ADTAG=adtag.huodong&asyncMode=3';
            if(appid){
                this.openUrl(url.replace('{appid}', appid), 0, 1);
            }
        }
    }
    //查询当前页面的游戏的appid(一个游戏的时候使用)
    if(!exports.Page.prototype.getCurAppid){
        exports.Page.prototype.getCurAppid = function(cb){
            this.addReadyFire(function(){
                var gname = (this.game || '').toLocaleLowerCase(), data;
                if(qv.zero.Idip && (data = qv.zero.Idip[gname])){
                    cb(data.appid || '');
                } else {
                    cb('');
                }
            });
        }
    }
})(qv.zero, Zepto);

//处理游戏的日志记录
(function(exports){
    exports.Page.prototype.bid = 'youxi'; //修改游戏域的 业务id

    //写入日志
    qv.zero.Page.instance.addReadyFire(function (page) {
        if(exports.zAOP && window.AMD_65905) {
            var cfg = window.AMD_65905.form[2] || [], projectcfg; //添加一层控制
            if(cfg && cfg.length > 0 && 
                (projectcfg = cfg[0].pid || []) && 
                projectcfg.length > 0 && 
                (projectcfg.indexOf(this.jsonid) > -1 || projectcfg.indexOf(0) > -1)){
                    exports.zAOP.intercept_a_s('send', {
                        before: function(param) { //拦截send方法 function(url, fn)
                            var args = param.args,
                                url;
                            if (args && args.length > 1 && (url = args[0])) {
                                page.error('request', url);
                            }
                        },
                        after : function(param){ //拦截send方法
                            var json = param && param.args && param.args[0];
                            if(json){
                                if(json.ret === 0){
                                    page.error('request_result', 'succ'); //成功记录少一点
                                } else {
                                    page.error('request_result', json); //失败记录多一点
                                }
                            }
                        }
                    }, zHttp, 1);   
            }
        }
    });
})(qv.zero);

//支持游戏方的参数传递过来。
//参数：appid、openid、openkey、access_token、sig、timestamp、algorithm、version、encode、msdkEncodeParam
(function(exports, $){
    var keys = 'appid,openid,openkey,access_token,sig,timestamp,algorithm,version,encode,msdkEncodeParam'.split(',');
    
    /**
     * 修改请求的对象
     * @param  {[type]} obj  [description]
     * @return {[type]}      [description]
     */
    var modifyObj = (function (keys){
        var hasConvert = false;
        return function(obj){
            if(hasConvert) return;
            keys = keys || [];
            var val;
            for(var i = 0, item; item = keys[i]; ++i){
                val = zURL.get(item);
                if(val){
                    hasConvert = true;
                    obj[item] = val;
                }
            }
        };
    })(keys);
    /**
     * 修改请求的url
     * @param  {[type]} url  [description]
     * @return {[type]}      [description]
     */
    var modifyUrl = (function (keys){
        var hasConvert = false;
        return function(url){
            keys = keys || [];
            var val, obj = {}, extentParam = '';
            for(var i = 0, item; item = keys[i]; ++i){
                val = zURL.get(item);
                if(val){
                    obj[item] = val;
                }
            }
            if(!hasConvert && (extentParam = $.param(obj))){
                var flag = url.indexOf('?') > 0, s = (flag ? '&' : '?');
                if(url.indexOf(s + 'msdkEncodeParam=') < 0 && url.indexOf(s + 'openkey=') < 0 && url.indexOf(s + 'access_token=') < 0){
                    hasConvert = true;
                    return url + s + extentParam;
                }
            }
            return url;
        };
    })(keys);

    exports.zAOP && exports.zAOP.intercept_s_s('send', {
        before: function(param) { //拦截send方法 function(url, fn)
            var args = param.args, url;
            if (args && args.length > 1 && (url = args[0])) {
                if (typeof(url) === 'string') { //修改从request过来的请求
                    args[0] = modifyUrl(url);
                } else if (url.actid) { //直接使用send请求过来的
                    modifyObj(url);
                }
            }
        }
    }, zHttp, 1);

})(qv.zero, Zepto);

(function(exports, $){
    function doReport(deviceInfo, netType, params) {
        var data = $.extend({
            sq_ver : mqq.QQVersion, // 手Q版本号
            gamecenter_ver : '', // 游戏中心页面版本
            gamecenter_ver_type : 1, // 1在线版，2离线版
            device_type : deviceInfo.model || '', // 设备类型
            net_type : netType, // 网络类型
            resolution : [screen.width, screen.height].join('*'), // 分辨率
            ret_id : 1, // 返回码
            ext11 : 8,
            ext12 : 801
        }, {
            oper_module : params.operModule || '',
            oper_id : params.operId || '',
            module_type: params.moduleType || '',
            oper_type: params.operType || '',
            loc_id: params.locId || '',
            obj_id: params.actid,
            state_id: params.stateId || '',
            logic_id: params.logicId || '',
            gamecenter_src : 'huodong.' + (params.src || '')  //来源
        });

        $.ajax({
            type: 'POST',
            url: 'http://report.gamecenter.qq.com/cgi-bin/gc_pg_act_fcgi?' + $.param({
                uin: zUtil.getUin(),
                sid: '',
                appid: params.appid || '', // 游戏应用ID
                tt: mqq.iOS ? 2 : 1, // iOS：2 安卓：1
                g_tk  : zUtil.getToken()
            }),
            xhrFields: {
                withCredentials: true
            },
            beforeSend : function(xhr){ xhr.withCredentials = true; },
            contentType: 'multipart/form-data',
            processData: false,
            data: JSON.stringify(data),
            cache: false,
            dataType: 'json',
            success: function() {}
        });
    }
    //上报到游戏中心
    //data: {appid : '', operModule:'', operId :'', moduleType:'', operType :'', src:'', actid:''}
    exports.report = {};
    exports.report.ToGameCenter = function(data){
        if(data.actid && window.mqq && mqq.device.getDeviceInfo){
            mqq.device.getDeviceInfo(function(dinfo){
                mqq.device.getNetworkType(function(ntype){
                    doReport(dinfo, ntype, data);
                });
            });
        }
    };
    //上报游戏下载
    //data: {appid : '', actid:''}
    exports.report.downloadGame = function(data){
        this.ToGameCenter($.extend({
            operModule: 36,
            moduleType: 3601,
            operId: 200412,
            operType: 1,
            src : String(data.actid)
        }, data));
    };

    //上报游戏启动
    //data: {appid : '', actid:''}
    exports.report.startGame = function(data){
        this.ToGameCenter($.extend({
            operModule: 36,
            moduleType: 3601,
            operId: 200413,
            operType: 3,
            src : String(data.actid)
        }, data));
    };

    //新游预约
    //data: {appid : '', actid:''}
    exports.report.yyGame = function(data){
        this.ToGameCenter($.extend({
            operModule: 36,
            moduleType: 3601,
            operId: 200412,
            operType: 10,
            src : String(data.actid)
        }, data));
    };
    //新游抢号
    //data: {appid : '', actid:''}
    exports.report.qhGame = function(data){
        this.ToGameCenter($.extend({
            operModule: 36,
            moduleType: 3601,
            operId: 200412,
            operType: 4,
            src : String(data.actid)
        }, data));
    };
})(qv.zero, Zepto);

//进入页面上报染色
//不要去掉，涉及到游戏分成结算
(function(exports, $){
    var hasReport = {}; //只上报一次
    var page = exports.Page.instance;
    //根据page对象获取数据
    function getDataFromPage(page){
        var game =(page.game || page.pcfg.g || '').toLowerCase(), appid = page.appid || '',
        jsonid = page.jsonid || 10000; // 活动号，一定会有
        if(exports.Idip  && exports.Idip[game]){
            appid = exports.Idip[game].appid || '';
        }
        return {
            'appid' : appid,
            'actid' : jsonid
        }
    }
    //根据参数获取数据
    function getDataFromArgs(data){
        if(data.game){
            return getDataFromPage({'game' : data.game, jsonid: page.jsonid});
        } else if(typeof data === 'string'){
            var m = /[?|&]game=(\w+)&?/.exec(data);
            if(m && m[1]){
                return getDataFromPage({'game' : m[1], jsonid: page.jsonid});
            }
            return {};
        } else{
            return getDataFromPage(page);
        }
    }

    //添加禁用的接口
    page.addReadyFire(function(){
        var data = getDataFromPage(this) || {};
        var isDyeing = page && page.isDyeing;
        var _isDyeing =  typeof isDyeing === 'function' ? isDyeing(data) : (isDyeing !== false);
        //上报伪下载
        if(_isDyeing && data.appid && !hasReport[data.appid]){
            hasReport[data.appid] = true; //防止重复上报
            exports.report.yyGame(data);
        }
    });

    //应对多个游戏的情况
    if (exports.zAOP) {
        exports.zAOP.intercept_s_s('send', {
            before: function (param) { //拦截send方法 function(url, fn)
                var args = param.args, data;
                var isDyeing = page && page.isDyeing;
                if( args && args.length > 0 && (data = args[0]) ){
                    var repdata = getDataFromArgs(data) || {};
                    var _isDyeing =  typeof isDyeing === 'function' ? isDyeing(repdata) : (isDyeing !== false);
                    if(_isDyeing && repdata.appid && !hasReport[repdata.appid]){
                        hasReport[repdata.appid] = true; //防止重复上报
                        exports.report.yyGame(repdata);
                    }
                }
            }
        }, zHttp, 1);
    }
})(qv.zero, Zepto);

/*
* 实名注册模块修改 yxCompontent
*   依赖 qv.zero.SetOnCloseHandler
*   回调事件名name=popDialog | 优先级level=500
*/
(function(exports, $){

    function Shiming(){
        this.deviceInfo = null;
        this.shimInfo = new exports.CallBack();
        this._isinit = false;
    }
    $.extend(Shiming.prototype, {
        run : function(page){
            if(this.isYX(page)){
                var me = this;
                this.hasShiming().add(function(data){
                    if(data.ret === 0 && +data.flag === 0){ //未认证
                        me.render(); //呈现
                    }
                });
            }
        },
        isYX : function(page){
            var aid;
            if(location.href.indexOf('://youxi.vip.qq.com/m/act/201607/shiming.html') > -1){
                return false;
            }
            if(page.pcfg && page.isShiming !== false /*可以配置不进行实名认证*/ && (aid = page.pcfg.aid)){
                return aid.indexOf('.y.') > -1 || aid.indexOf('.yx.') > -1 || aid.indexOf('.youxi.') > -1;
            }
            return false;
        },
        hasShiming: function(){
            if(!this._isinit){
                this._isinit = true;
                var cb = this.shimInfo = new exports.CallBack();
                this.getDeviceInfo().add(function(data){
                    var str_guid = data.str_guid || '';
                    var str_mac = data.str_mac || '';
                    var str_deviceid = data.str_deviceid || '';
                    zHttp.ajax({
                        url : 'http://info.gamecenter.qq.com/cgi-bin/gc_real_name_auth_async_fcgi?param={"testkey1":{"module":"gc_real_name_auth_svr","method":"query","param":{"str_guid":"'+ str_guid +'","str_mac":"'+ str_mac +'","str_deviceid":"'+ str_deviceid +'"}}}',
                        callback : function(json){
                            var info;
                            if(json.data && json.data.testkey1 && json.data.testkey1.retBody && json.data.testkey1.retBody.data && json.data.testkey1.retBody.result == 0){
                              info = { ret : 0, flag : json.data.testkey1.retBody.data.flag};
                            } else {
                              info = { ret : -1, msg : '当前操作人数过多，请稍后再来！'};
                            }
                            // cb.execute({ret : 0, flag : 0});
                            cb.execute(info);
                        }
                    });
                });
            }
            return this.shimInfo;
        },
        getDeviceInfo : function(){
            if(!this.deviceInfo){
                var cb = this.deviceInfo = new exports.CallBack();
                if(window.mqq && mqq.device && mqq.device.getDeviceInfo && mqq.compare('4.5') >= 0){
                    mqq.device.getDeviceInfo(function(data){
                        cb.execute({
                            str_guid : data.fingerprint || '',
                            str_mac : data.macAddress || '',
                            str_deviceid : data.identifier || ''
                        });
                    });
                } else {
                    cb.execute({ str_guid : '123', str_mac : '123', str_deviceid : '123' });
                }
            }
            return this.deviceInfo;
        },
        bindEvent : function(){
           var soch = new qv.zero.SetOnCloseHandler({'name':'popDialog', 'level':500, 'handler': function(){
                $('#shim_20160718').removeClass('hide').addClass('show').show();
                var soch2 = new qv.zero.SetOnCloseHandler({'name':'popBack', 'level':1, 'handler': function(){
                    soch2.done();//注册多一次回调，再点击一次直接退出
                }});
                soch.done();
            }});
            $('#shim_20160718').click(function(){
                zUtil.openUrl('http://youxi.vip.qq.com/m/act/201607/shiming.html?_wv=1027&adtag=adtag.guajian', 0, 1);
            });
        },
        render : function(){
            var me = this;
            if(window.mqq && mqq.ui && mqq.ui.setOnCloseHandler && mqq.compare('5.5') >= 0){
                $(document.body).append('<article class="mod-game-dialog hide" style="display:none;" id="shim_20160718"> \
    <div class="mod-game-dialog-content" style="background: url( //imgcache.gtimg.cn/ACT/svip_act/act_img/payneliu/201607/m1469195564_m1468826837_shim.png) 0% 0% / 100% no-repeat;width: 100%;height: 100%;"> \
    <div class="mod-txt" style="border:none;"> </div> <div class="mod-btn"> </div> </div> </article>');
                zUtil.require('SetOnCloseHandler',function(){
                    me.bindEvent(); //绑定事件
                })
            }
        }
    });
    
    var shim = exports.Shiming = new Shiming();
    exports.Page.instance.addReadyFire(function(){
        shim.run(this);
    });

})(qv.zero, Zepto);

//企鹅电竞的登录态适配
(function(exports, $){
    //1. 先判断是否企鹅电竞
    //2. 如果是企鹅电竞，替换isLogin、login
    var login = exports.Login, ua = (window.navigator||{userAgent:''}).userAgent.toLowerCase();
    if(/.*(qgame).*/.test(ua)){
        function isLogin(){
            if(zUtil.getcookie('pgg_access_token')){
                if(zUtil.getcookie('pgg_type') == 2){
                    return 2; //微信登录
                } else {
                    return 1; //手Q登录
                }
            }
            return 0; //未登录
        }
        login.isLogin = function(){
            var isl = isLogin();
            if(isl > 0){
                if(isl === 2){
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        };
        login.login = function(backUrl, picUrl){
            var that = this;
            zMsg.showMessageBox({msg:'请使用QQ号登录！', left: {text : '取消', click : function(){
                return;
            }}, right: {text : '立即登录', click : function() {
                that.setCookie('pgg_access_token', null); //清除cookie
                that.setCookie('pgg_type', null);
                that.setCookie('pgg_openid', null);

                var loginUrl = 'https://egame.qq.com/login?adtag=huodong';
                var hln_css = picUrl || ''; //尺寸: 244 * 100
                if(hln_css){
                    loginUrl += '&hln_css=' + hln_css;
                }
                var s_url = backUrl || location.href;
                location.href = loginUrl+'&ru='+encodeURIComponent(s_url);
            }}});
        };
        login.ensureLogin = login.ensure = function(callback4login){
            var isl = isLogin();
            if(isl > 0){
                if(isl === 2){
                    this.login();
                } else {
                    callback4login && callback4login.call();
                }
            } else {
                this.login();
            }
        };

        var send = exports.Http.send;
        var callback = new exports.CallBack();
        exports.Http.send({_c:'util', _f:'getUin', appid:1105198412}, function(){ //登录
            callback.execute(1);
        });
        exports.Http.send = function(url, fn){
            callback.add(function(){
                send.call(exports.Http, url, fn);
            });
        }
    }
})(qv.zero, Zepto);

//光荣使命不兼容机型判断
(function(exports, $){
    function detect(cb){
        var r = zUtil.getValueFromObj(window,'mqq.device.getDeviceInfo');
        if(r){
            cb();
        }else{
            setTimeout(function(){
                detect(cb);
            },500);
        }
    }
    zUtil.isIOS() && detect(function(){
        try{
            var data = window.AMD_65905.form[1] , cfg = {};
            data.forEach(function(item){
              cfg[item.package_name] = item.version;
            });
            var game = page.game;          
            var white_jsonid = cfg.test_clqs_exclude_jsonid.split('_').map(function(i){ return +i});
            var _game = cfg.test_clqs_enable_game;
            var url = cfg.test_clqs_url;
            var models = cfg.test_clqs_iphone.split('_');
            var actid1 = +cfg.test_clqs_addinfoactid_down;
            var actid2 = +cfg.test_clqs_addinfoactid_up;
            var actid = actid2;
            (game == _game) && white_jsonid.indexOf(+page.jsonid)<0 && mqq.device.getDeviceInfo(function(data){
              try{
                var modelVersion = data.modelVersion;
                if( models.indexOf(modelVersion)<0 ){
                  actid = actid1;
                  setTimeout(function(){
                    url && window.location.replace(url);
                  },300);
                }
                actid && zHttp.send({actid: actid, info: modelVersion});
              }catch(e){}
            });
        }catch(e){}
    });
})(qv.zero, Zepto);