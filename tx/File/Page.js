/**qv.zero.Util缩写
 * @static*/
window.zUtil = qv.zero.Util;
/**qv.zero.Msg缩写
 * @static*/
window.zMsg = qv.zero.Msg;
/**qv.zero.URL缩写
 * @static*/
window.zURL = qv.zero.URL;
/**qv.zero.Http缩写
 * @static*/
window.zHttp = qv.zero.Http;

/**
    * 页面基类，主要实现一些常用功能，其他需要在子页面中实现
    * @author shinelgzli yandeng payneliu
    * @version 6.0.2
    * @date 2016-08-15
    * @requires Zeptor
    * @example
    * var Page = qv.zero.page({ ... });
    * @class qv.zero.Page
 */
/*global zUtil, zMsg,zURL,zHttp,window,Image,OZ,pgvMain,document,location*/
/**@exports Page as qv.zero.AbstractPage*/
qv.zero.Page = function (config) {
    /**@exports this as AbstractPage*/
    if(config.init || config.initEvent){
        throw ('it unallow override the [init] or [initEvent] function');
    }
    
    qv.zero.Page.instance = this;
    this.hb = false; //暂时默认的不开启小黄条
    $.extend(this, config);
    this._checkVersion(); //检查版本号 判断是否是提审版本
    qv.zero.Event.attach(this); //附加事件

    var me = this;
    var oldonerror = window.onerror;
    window.onerror = function(msg, url, l){ //记录页面的错误信息
        /*jshint expr:true*/
        oldonerror && oldonerror(msg, url, l);
        me.error('pageerror', {'msg' : msg, 'url': url, 'line': l});
    };
    if(this._onPc()) { //在pc打开
        return;
    }
    if(this.isOpenSQView === true) { this.openSQView(); }

	//页面在未初始化完成的状态
	this.readyState = 0;
    this.$begin = new Date() /*第一个点*/;
    this.readyconditions = [];
    this.readyFire = [];
    this.conditionCounter = 0;    
	this.beforeInit();
	zHttp.bindPage(this);
	$.each(this.readyconditions, function(index, cdt){
		cdt.call(me,me);
    });
};
/**@lends Page.prototype as qv.zero.AbstractPage.prototype*/
qv.zero.Page.prototype = {
    version : '6.0.2',
    bid : 'iyouxi',
	widgets : {
		dialog : 'Dialog',
		login : 'Login',
        aop : 'aop'
	},
    api :{
        oz: 'http://imgcache.qq.com/club/common/lib/zero/widgets/amsoz/ams_oz_v4.js?max_age=86400000&v=2',
        bulletin : 'http://i.gtimg.cn/club/portal_new/bulletin.js',
        mqqapi : 'http://open.mobile.qq.com/sdk/qqapi.js?_bid=152',
        qrcode : 'http://imgcache.qq.com/club/themes/pc/qrcode/html/index.html'
    },
     /**
     * 页面构造函数
     * @example
     * ```
     * var page = new qv.zero.Page({
     *    jsonid : 27198,
     *    onlyMobile : true,
     *    afterInit : function(){
     *     //this.bindClick('a.btn', function(e){});
     *    }
     * });
     *```
     * @note no override
     * @method init
     * @for qv.zero.Page
     */
    init : function () {
        this.pcfg = $.extend(window['AMD_' + this.jsonid].cfg,{rid :this.ozid});
        //初始化OZ的配置
        this.initOZ();
        this.loadBulletin();
        this.bindLoadingMark();
        //if(this.expiredActGuide !== false) window.expriedAct(this.jsonid);
        //弹出跳转提示语
        if(this.onlyMobile) this.redirection();
        //qq尾号灰度策略
        if(this.pcfg.ltr) this.qqredirection();
        //显示pc二维码页面
        if(this.pcQrcode) this.showPcQrcode();
        //72小时内开通的手机会员自动弹窗提示不能参与活动
        if(this.mobileClubTips) this.showmobileClubTips();
    },
    //初始化后的回调事件
    _initCallBack: function(t1, me){
        var t2 /*初始化时间*/, t3 /*初始化事件*/;
        t2 = new Date();
        me.readyState = 1;
        me.init();
        /*jshint expr:true*/
        me.dispatchElConfig();
        me.bindConfigEvent();
        me.initEvent && me.initEvent();
        me.afterInit && me.afterInit();
        me.readyState = 2;
        $.each(me.readyFire, function(index, cdt){
            cdt.call(me, me);
        });
        // t3 = new Date();
        //me.speed($.extend(me.getPerformance(),{20 : t2 - t1, 21 : t3 - t2, 22 : t3 - t1}));
    },
    //检查版本
    _checkVersion: function(){
        var location = window.location;
        if(this.mqqvc !== false && ~location.href.indexOf('://youxi.vip.qq.com/m/act') && this.isMobileQQ/*在手Q中才会这样跳转*/) {
            var mqqvcUrl = '//i.gtimg.cn/c/=/ACT/vip_act/act_data/mmqversion.json.js,/club/common/wedgets/mqqvc.js';
            var gcUrl = '//gamecenter.qq.com/gamecenter/index/index.html?ADTAG=tishen&_wv=5127&_bid=278';
            zHttp.loadScript(mqqvcUrl, function() {
                var MQQVC = window.MQQIOSVC;
                try {
                    MQQVC.check(function(ret) {
                        if(ret) {
                            // 审核中
                            location.replace(gcUrl);
                        }
                    });
                } catch(e) {
                }
            }, '', function() {
                setTimeout(function(){
                    if(!window.MQQIOSVC){
                        // 加载js失败了，当作不能显示
                        location.replace(gcUrl);
                    }
                }, 100);
            });
        }
    },
    //在pc打开时跳转
    //如果pc端打开，将会跳转新的 http://vip.qq.com/game.html?ADTAG=adtag.shoujihuodong
    //先这样，后面具体跳转到指定的游戏页面可以在处理，位置要改变
    _onPc: function(){
        var location = window.location;
        if(zUtil.isPC() && ~location.href.indexOf('://youxi.vip.qq.com/m/act')){
            if(this.redirect_pc){ //如果有的话，就执行指定的方法
                var ret = $.isFunction(this.redirect_pc) ? this.redirect_pc() : !!this.redirect_pc;
                if(ret === false) return true; //返回false直接退出
            } else{
                var currentUrl = window.location.href;
                var game = this.game || '';
                if(['readcomic', 'read', 'comic'].indexOf(this.game) !== -1) {
                  window.location.href = 'http://cdn.vip.qq.com/club/themes/pc/qrcode/html/index.html?title=手机QQ&qrcode_url=' + encodeURIComponent(window.location.href);
                }else {
                  window.location.href = 'http://youxi.vip.qq.com/act/op_pc_qrCode/index.html?cbUrl=' + encodeURIComponent(currentUrl) + '&game=' + game + '&title=' + document.title;
                }
                return true;
            }
        }
        return false;
    },
    showmobileClubTips : function () {
        zHttp.send({actid : 66924},function (json) {
            if (json.data.op == 1) {
                zMsg.show('对不起，72小时内手机会员用户不能参与此活动！');
            }
        });
    },
    showPcQrcode : function () {
        var qrcodeTitle = this.qrcodeTitle ? this.qrcodeTitle : document.title,
            qrcodeUrl = location.href;
        if (!this.isIOS && !this.isAndroid) {
            location.href= this.api.qrcode + '?title=' + qrcodeTitle + '&qrcode_url=' + qrcodeUrl;
        }
    },
    bindLoadingMark : function () {
        zHttp.bindRequestWidget({
            onReady : function(args,i){
                if(args.mode !== false){
                    qv.zero.LoadingMark.show();
                }
            },
            onComplete : function(args,i, json){
                if(args.mode !== false){
                    qv.zero.LoadingMark.hide();
                }
            }
        });
    },
    /**
     * 在页面上加上以下dom结构，则会自动检测后台是否配置了有效的小黄条后，若有则会自动显示
     * 该dom请加到要展示的结构下面。
     * ```
     * <div class="bulletin" id="container" style="display:none;"></div>
     * ```
     * @method 页面小黄条
     * @for qv.zero.Page
    **/
    /**
     * 页面跳转到pc页面展示二维码页面
     * pcQrcode 为true时，则在非手机平台打开会展示二维码页面，title为默认页面的title
     * 值：true
     * @method pcQrcode
     * @for qv.zero.Page
    **/
    /**
     * 页面跳转到pc页面展示二维码页面,设置页面的title
     * qrcodeTitle 与pcQrcode配合使用
     * @for qv.zero.Page
    **/
    /**
     * 72小时内开通的手机会员自动弹窗提示不能参与活动
     * mobileClubTips
     * @for qv.zero.Page
    **/
    /**
     * 指定页面运行的平台
     * onlyMobile 为true时，则在非手机平台打开会跳到@redirectUrl或直接跳到游戏官网,
     * 值范围： android, ios, true(全部)
     * @method onlyMobile
     * @for qv.zero.Page
    **/
    /**
     * 指定页面运行的平台,重定向URL的时候是否弹出提示语，与onlyMobile配合使用
     * 值: false 表示隐藏提示语的弹出层
     * @method hideTips
     * @for qv.zero.Page
     **/
    /**
     * 过期活动引导提示语
     * expiredActGuide 恒等于 ===false时，结束提示语为默认
     * 值范围：
     * @method expiredActGuide
     * @for qv.zero.Page
    **/
     /**
     * 重定向URL，与onlyMobile配合使用
     * @method redirectUrl
     * @for qv.zero.Page
     **/
    /**
     * aid 页面跳转的AID参数,若不配置，则读取AMS管理后台配置的AID
     *optaional
     * @method aid
     * @for qv.zero.Page
     */
     /**
     * mqqEnv， 是否需要设置手Q环境，如是，则会加载手Q的api,默认为false。
     * @method mqqEnv
     * @for qv.zero.Page
     */
     /**
     * mqqEnv， 尾号灰度
     * @method limitQQRelease
     * @for qv.zero.Page
     */
    /**
     * ozid 罗盘上报的ID,不传则用AMS项目ID为上报ID，并用新表统计，若指定，则用罗盘的老表
     * @method ozid
     * @for qv.zero.Page
     */
     /**
     * preloads 预先加载，支持zero的组件及其他外部组件
     * @method preloads
     * @for qv.zero.Page
     * @example
     * preloads : ['FlashLottery', 'http://xxx/aa.js']
     */
     /**
     * AMS项目ID，
     * @method jsonid
     * @for qv.zero.Page
     * @example
     *  jsonid : 10958,
     **/
    /**
     * 本页面开通会员的开通时间，单位月，默认：1*/
    vipmonth : 1,
    /**
     * 页面EL参数配置的名字，默认：data-params
     */
    domParamsName : 'data-params',
    /**
     * 将页面的DOM节点上的配置分发到事件本身上
     * @param {String} [context] 分配事件节点上下文，默认为body
     */
    dispatchElConfig : function (context) {
        var doc = $(context || 'body'),
        pn = this.domParamsName,
        atrpn = '[' + pn + ']';
        doc.filter(atrpn).add(doc.find(atrpn)).each(function (i,el) {
            var pnData = $(el).attr(pn),
            pnArray = pnData.split('=');
            $(el).removeAttr(pn);
            $(el).attr('data-'+ pnArray[0],pnArray[1]);
        });
    },
    /**
     * 绑定配置事件
     * @public
     * cfg:do=request,actid,callback
     * @note not override
     */
    bindConfigEvent : function (context) {
        var doc = $(context || 'body');
        (function () {
            doc.filter('[data-do]').add(doc.find('[data-do]')).on('click',this.clickHandler);
            doc.filter('[data-init]').add(doc.find('[data-init]')).each($.proxy(function (i,el) {
                this.initHandler(el);
            },this));
        }).zdelay(100,this);
    },
    /**
     * 点击事件
     * @public
     * @note not override
    */
    clickHandler : function (el) {
        var todo = $(this).attr('data-do');
        if (todo) {
            el.preventDefault();
            zHttp.page.typeFire(todo,el);
        }
    },
    /**
     * 初始化事件
     * @public
     * @note not override
    */
    initHandler : function (el) {
        var toinit = $(el).attr('data-init');
        if (toinit) {
          zHttp.page.typeFire(toinit,el);
        }
    },
    /**
     * 处理点击事件
     * @public
     * @note not override
    */
    typeFire : function (expr,tar) {
        try {
            zUtil.analyseActFn(expr)(tar, zUtil);
        } catch(e) {
            if(!( typeof e == 'string' && /zero#/.test(e) )){
                throw e;
            }
        }
    },
    /**
     * 页面在初始化之前执行
     * @public
     * @note not override
     */
    beforeInit : function () {
        var me = this;
        this.isIOS = zUtil.isIOS();
        this.isAndroid = zUtil.isAndroid();
        this.plLvl1 = [this.widgets.aop, this.widgets.login,this.widgets.dialog,'LoadingMark'];
        if(window.location.href.indexOf('://youxi.vip.qq.com/m/act') > -1){
            if(this.OpenGameEntrance !== false){ //只有在游戏页面才会出现这个组件
                this.plLvl1.push('OpenGameEntrance');
            }

            this.plLvl1.push('pendant'); //挂件

            this.plLvl1.push('yxCompontent'); //游戏运营专属组件 //将ReportGC 移入 yxCompontent
        }

        if(this.expiredActGuide !== false){
            this.plLvl1.push('ExpiredActGuide');
        }

        if(this.preloads){
            this.plLvl1 = this.plLvl1.concat(this.preloads);
        }
        /*jshint expr:true*/
        this.mqqEnv && this.setupSQEnv();
        //绑定消息数据源
        this.jsonid && this.addReadyCondition(function(){
            zMsg.bindDataSource({
                hasRetCode : this.hasRetCode,
                hasBaseCode: this.hasBaseCode,
                jsonid : this.jsonid,
                game: this.game,
                appid: this.appid
            }, $.proxy(function(){
                this.popPageStatus();
                //if(this.onlyMobile) this.redirection();
            },this));
        });
        this.addReadyCondition(function(){
            //默认使用版本号，如果配置了useVersionMap:false 将不使用版本号
            var list = this.preloadUseVersionMap === false ? this.plLvl1.map(function(m){ return m + '-0'; }) : this.plLvl1;
            this.require( list, function(){
                this.popPageStatus();
            }, {combo: true/* 合并加载 */});
        });
    },
    /**
     * 获取页面性能参数
     * @method getPerformance
     * @for qv.zero.Page
     * @return {Object}
     */
    getPerformance: function() {
        if (!window.performance) {
            return {};
        }
        var navigationTime = window.performance.timing;
        var field = ["navigationStart", "unloadEventStart", "unloadEventEnd", "redirectStart", "redirectEnd",
                     "fetchStart", "domainLookupStart", "domainLookupEnd", "connectStart", "connectEnd", "requestStart",
                     "responseStart", "responseEnd", "domLoading", "domInteractive", "domContentLoadedEventStart",
                     "domContentLoadedEventEnd", "domComplete", "loadEventStart", "loadEventEnd"];
        var startTime = navigationTime.navigationStart;
        var timeList = {},timeMs;
        for (var i = 1; i < 20; i++) {
            if (typeof navigationTime[field[i]] != 'undefined' && navigationTime[field[i]] > 0) {
                timeMs = navigationTime[field[i]] - startTime;
                if (timeMs > 0 && timeMs < 100000) {
                    timeList[i] = timeMs;
                    continue;
                }
            }
            timeList[i] = 0;
        }
        return timeList;
    },
     /**
     * 测速上报接口
     * @method speed
     * @for qv.zero.Page
     * @param {Object} timelist, 延时列表，如{1:220, 2:333}
     * @param {Object} [cfg]，默认为{flag1:169,flag2:2083,flag3:1}
     * @return {void}
     */
	speed : function (timelist,cfg) {
		// cfg = cfg || {};
		// setTimeout(function(){
		// 	var i = new Image();
		// 	i.src = ZProtoAdapter.speed + '?' + $.param($.extend(timelist, {flag1:cfg.flag1||169,flag2:cfg.flag2||2083,flag3:cfg.flag3||3}));
		// },1000);
	},
    /**
     * 上报返回码
     * 支持请求合并
     */
    reportRetCode : (function(mqq){
        var queue = [], lazyTime = 2000, timeHandler, keyList = ['cgi', 'type', 'code', 'time'];
        function doNext(data){
            queue.push(data);
            if(!timeHandler){
                timeHandler = setTimeout(function(){
                    done();
                    timeHandler = null;
                }, lazyTime);
            }
        }
        function done(){
            var list = queue.splice(0, 10), request;
            request = {key : keyList.join(',')};
            for(var i = 0, params; params = list[i]; i++){
                for(var j = 0, key; key = keyList[j]; j++){
                    request[(i + 1) + '_' + (j + 1)] = params[key];
                }
            }
            request.domain = 'iyouxi.vip.qq.com';
            request.uin = zUtil.getUin();
            var arr  = [];
            for(var o in request ){
                arr.push( o + '=' + encodeURIComponent( request[o] ) );
            }
            var info =  arr.join("&");
            if( mqq && mqq.data && mqq.data.pbReport && mqq.support && mqq.support( "mqq.data.pbReport") ){
                var ua   = window.navigator.userAgent;
                var host = window.location.host;
                var data = {"d"  :  info, "h"  : host, "ua" : ua };
                mqq.data.pbReport( '104', JSON.stringify( data ) );
            }else{
                var img = new Image();
                img.src = ZProtoAdapter.retCode + '?' + info;
            }
        }
        return function(result){
            // if(result && result.actid){
            //     doNext({
            //         domain : 'iyouxi.vip.qq.com',
            //         cgi : '/ams3.0.php?actid=' + result.actid + '&plat=' + (zUtil.isAndroid() ? 1 : 0),
            //         // type : (+result.ret === 0 ? 1 : 2),
            //         type : 1,
            //         code : result.ret,
            //         time : 0
            //     });
            // }
        };
    })(window.mqq),
    qqredirection : function () {
        var qqArr = this.pcfg.ltr,
            qqNumber = zUtil.getUin().toString(),
            qqTail = /.$/.exec(qqNumber)[0],me = this;
        if (this.pcfg.ltu.indexOf('http') >=0 && qqArr.indexOf(qqTail) < 0) {
            if (me.pcfg.ltt) {
                zMsg.show(me.pcfg.ltt + '<br/><span style="color:#999;font-size:12px;">(5秒钟后自动跳转)</span>');
                setTimeout(function () {
                    window.location.href = me.pcfg.ltu;
                },5000);
                return false;
            }
            setTimeout(function () {
                window.location.href = me.pcfg.ltu;
            },50);
        }

    },
    redirection : function(){
        var me = this, url, game,rd;
        switch(this.onlyMobile){
            case 'android' : //只支持安卓平台
            {
                if(!this.isAndroid){
                    this.notMatchTip = '本活动只支持安卓手机，谢谢关注~';
                }
            }
            break;
            case 'ios' : //只支持IOS平台
            {
                if(!this.isIOS){
                    this.notMatchTip = '本活动只支持苹果手机，谢谢关注~';
                }
            }
            break;
            case true : //只支持安卓和ios平台
            {
                if (!this.isIOS && !this.isAndroid) {
                    this.notMatchTip = '本活动不支持该系统平台，谢谢关注~';
                }
            }
            break;
            //default : //没限制
        }
        if(this.notMatchTip){
            if(this.game){
                url = this.getGameConfig(this.game).m;
            }
            if(url || this.redirectUrl){
                rd = true;
                setTimeout(function(){
                    window.location.replace(me.redirectUrl || url);
                },2000);
            }
            if (this.hideTips === false) {
                return false;
            }
            zMsg.show(this.notMatchTip + ( rd ? '<br/><span style="color:#999;font-size:12px;">(2秒钟后自动跳转)</span>' : ''));
        }
    },
    /**
     * 获取游戏配置信息，
     * @method getGameConfig
     * @for qv.zero.Page
     **/
    getGameConfig : function(game){
        var game_up = game.replace(/^\w/,function($1){ return ($1).toUpperCase();});
        return window.AMD_game[game_up] || window.AMD_game[this.game] || {};
    },
    /**
     * 检查游戏类型
     * 1：手游；2：端游；3：页游；4：H5游戏
     */
    checkGameType: function(game, flag){
        var cfg = this.getGameConfig(game), num = 1 << (cfg.c || 1);
        return (flag & num) === num;
    },
    isSYGame: function(game){ return this.checkGameType(game, 2/* 1 << 1 */); },
    isPCGame: function(game){ return this.checkGameType(game, 4/* 1 << 2 */); },
    isYYGame: function(game){ return this.checkGameType(game, 8/* 1 << 3 */); },
    isH5Game: function(game){ return this.checkGameType(game, 16/* 1 << 4 */); },
    /**
     * b4Click 调用bindClick注册事件后，在执行绑定事件前，会执行该接口，
     * 只有返回 === false，则不会执行绑定的事件
     * @method b4Click
     * @for qv.zero.Page
     * @example
     * b4Click : function(evt){
     *  if(this.id == 'abc') reutrn false;
     * }
     **/
    b4Click : function(e){
        return true;
    },
    /**
    * 绑定元素的click事件，已经阻住目标元素的默认行为，若页面与平台（onlyMobile）不适配，则会提示用户
    * @param {String|Object} target，适合css选择器或元素对象
    * @param {Function} fn，事件的执行逻辑，若b4Click返回恒等于false，则不执行该逻辑
    * @method bindClick
    * @for qv.zero.Page
    **/
    bindClick : function (target, fn) {
        var me = this;
        $(target).click(function(e){
            e.preventDefault();
            if(me.b4Click(e) === false){
                return false;
            }
            if(me.notMatchTip){
                zMsg.show(me.notMatchTip);
                return false;
            }
            fn.call(this,e);
        });
    },
    /**
    * @note no override
    **/
    setupSQEnv : function () {
        var url = this.api.mqqapi;
        this.addReadyCondition(function(page){
            this.require(url,function(){
                page.popPageStatus();
            });
        });
    },
    /**
     * 是否手Q环境
     * @return {Boolean} [description]
     */
    isMobileQQ : (function(UA){
        var REGEXP_IOS_QQ = /(iPad|iPhone|iPod).*? QQ\/([\d\.]+)/;
        var REGEXP_ANDROID_QQ = /\bV1_AND_SQI?_([\d\.]+)(.*? QQ\/([\d\.]+))?/;

        return REGEXP_ANDROID_QQ.test(UA) || REGEXP_IOS_QQ.test(UA); //因为android的多，放在前面有利于整体性能
    })(window.navigator.userAgent),
    /*打开手Q view*/
    openSQView : function(){
        if(window.__isdebug){//内网
            return true;
        }
        if(!zUtil.isDebug()){
            if(!this.isMobileQQ){
                setTimeout(function(){
                    //window.location.href = 'mqqapi://forward/url?url_prefix=' + window.btoa(window.location.href) + '&version=1&src_type=web';
                    window.location.href = window.location.protocol + "//imgcache.qq.com/club/themes/mobile/middle_page/index.html?url=" +
                                    encodeURIComponent(window.location.href);
                },30);
                return false;
            }
            return true;
        }
    },

    /**
    * 记录日志
    */
    log : function(info){
        info.id = info.id || this.bid;
        var MQQ = window.mqq;
        try{
            if(typeof info.content !== 'string'){
                info.content = JSON.stringify(info.content);
            }
            if(MQQ && MQQ.debug && MQQ.debug.detailLog){
                if(MQQ.compare('0') === 0){ //pc模拟
                    console.log(info);
                } else {
                    MQQ.debug.detailLog(info);
                }
            }
        } catch(e){}
    },
    /**
    * 打debug信息进入手Q
    */
    debug : function(bid, content){
        this.log({id : this.bid, subid : bid, 'content' : content, level : 'debug'});
    },
    /**
    * 打error信息进入手Q
    */
    error : function(bid, content){
        this.log({id : this.bid, subid : bid, 'content' : content, level : 'error'});
    },
    /**
    * 打info信息进入手Q
    */
    info : function(bid, content){
        this.log({id : this.bid, subid : bid, 'content' : content, level : 'info'});
    },
    /**
     * 注册页面初始化前提条件，若在前提条件执行完后，页面才可用
     * @note 在fn的内部逻辑实现中在执行结束后必需调用popPageStatus接口，否则页面一直处于等待状态
     * @note not override
     * @param {Function} fn 条件的执行罗盘
     * @method addReadyCondition
     * @for qv.zero.Page
     */
    addReadyCondition : function(fn){
        this.readyconditions.push(fn);
        this.conditionCounter++;
    },
    /**
     * 注册页面初始化后执行
     * @note not override
     * @param {Function} fn 条件的执行罗盘
     * @method addReadyFire
     * @for qv.zero.Page
     */
    addReadyFire : function(fn){
        if(this.readyState){
            fn.call(this, this);
        }else{
            this.readyFire.push(fn);
        }
    },
    /**
     * 在页面初始化条件执行完成后必须调用,用于上报页面初始化条件完成情况
     * @note not override
     * @method popPageStatus
     * @for qv.zero.Page
     **/
    popPageStatus : function () {
        if(--this.conditionCounter <= 0){
            this._initCallBack(this.$begin, this);
        }
    },
    /**
     * 获取URL上的sid参数
     * @method getSid
     * @for qv.zero.Page
     */
    getSid : function () {
		return zURL.get('sid');
	},
	/**
     * 加载小黄条，若页面中有 div.bulletin，则会自动 加载
     */
    loadBulletin : function () {
        if(this.hb !== false){ //默认加载小黄条
            if($('div.bulletin').length === 0){
                zUtil.appendStyle('.bulletinwrap{width:100%;position:absolute;z-index: 1001;top: 0;height:0;}.bulletin{position:static;width:100%;background-color:#ffffe3;border:1px solid #fc9;padding:5px 10px;margin:0 auto 10px;text-align:left;font-size: 0.8em;}.bulletin p{padding-right:5px;color:#595959}.bt_close_bulletin{position:absolute;top:5px;right:5px;background:0;width:20px;color:#f00;font-size:10px;cursor:pointer;border:0}');
                $('<div class="bulletinwrap"><div class="bulletin" id="container" style="display:none;"></div></div>').insertBefore($(document.body).children().eq(0));
            }
            zHttp.loadScript(this.api.bulletin,'gbk');
        }
    },
    /**
     * 初始化OZ上报
     */
    initOZ : function () {
        this.require('amsOz', function(){
             OZ.config({actid: this.pcfg.rid || this.jsonid, actName: this.pcfg.n});
             OZ.report({operID: 1, operType: '访问', operDesc: '访问页面'});
         },{scope : this});
        // 数据上报
        if(zURL.get('pcQrCode')) {
            this.require('AmsEz', function(){
                qv.zero.EZ.report({oper_type: 8, oper_module: 597, oper_id: 202898, module_type: 59701});
            });
        }
    },
    /**
     * 加载组件或其他js资源文件，详情见zUtil.require，该接口的context默认为page本身
	 * @param {String|Array} modules，模块，组件名，JS文件URL
	 * @param {Object} fncontext，回调函数
     * @param {Object} config,其他配置荐
	 * @param {String} config.charset 编码，默认为utf-8，
     * @param {Object} config.scope fncontext的上下文,默认为window
	 * @example
     * ```
	 * require('FlashLottery', function(){
	 *	new qv.zero.FlashLottery();
	 * });
	 * requrei('http://open.qq.com/api.js',function(){
	 *	//do something...
	 * });
     * ```
     */
    require : function (modules,fncontext, config) {
		zUtil.require(modules, fncontext,$.extend({scope: this,__c:this.cache}, config));
    }
};
