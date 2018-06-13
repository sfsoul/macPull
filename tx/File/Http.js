/**
 * 向AMS发HTTP请求的接口,及错误码的处理接口逻辑，静态类
 * @class qv.zero.Http
 * @author yandeng payneliu
 * @version 6.0.2
 * @date 2016-08-15
 * @requires Zepto
 * @name qv.zero.Http
 * @namespace
 */
/*global OZ,qv,window,zMsg,zUtil,document,zURL,mqq*/
qv.zero.Http = {
	version : '6.0.2',
    minor : 1, /*小版本号*/
    page : {},
    $event: qv.zero.Event({}), //事件对象
    widgets : [],
    /**
     * 页面与AMS通信的入口
     * @for qv.zero.Http
     * @field url
    */
    url : (function () {
        if(/\buin=[a-z]?(\d+)/.test(document.cookie)){ //有登录态
            var uin1 = RegExp.$1;
            if(/[?|&]test=(\d+)/.test(window.location.href)){ //结尾带了test
                var uin2 = RegExp.$1;
                if(+uin1 === +uin2){
                    return 'http://iyouxitest.vip.qq.com/ams3.0.php';
                }
            }
        }
        return 'http://iyouxi3.vip.qq.com/ams3.0.php';
    })(),
    //替换url
    replaceUrl: function(product, test){
        if(product && this.url.indexOf('//iyouxi3.vip.qq.com') > -1){
            this.url = product;
        } else if(test && this.url.indexOf('//iyouxitest.vip.qq.com') > -1){
            this.url = test;
        }
    },
    /**
     *页面请求计数器 
     * @private 
     */
    counter : 0,
    /**
    * 获取手Q版本
    */
    getQQVersion : function(){
        return (window.mqq && window.mqq.QQVersion) || '0';
    },
    /**
     * 纯粹的发送请求接口，若为ams的活动号，则会上报实时数据和罗盘，默认没有任何请求的结果处理
     * ，自动带上gtoken参数
     * @for qv.zero.Http
     * @method send
     * @param {String|Object} url|args， 这里配置的args参数列表都会发送到ams后台。
     * @param {Function} fn 可选
	 *  - callback的键名支持自定义，如 cb,ab,db等。默认为callback;
     *  - notOz 设置为true，不上报实时数据和罗盘;
     * @example 
     *  send({actid : 999}, function(ret){});
     *  send('http://www.qq.com', function(){});
     */
    _send : function(url, fn /*, deviceinfo*/) {
        var t1 = +new Date();
		var callback = "json" + t1 + this.counter++, 
		tk, args, me = this,notOz,
		self = arguments;

		try {
			tk = qv.zero.Util.getToken();
		} catch (e) {}

		args = { 
			g_tk : tk , 
			pvsrc : qv.zero.URL.get('pvsrc') || qv.zero.URL.get('adtag') || ''
		};
        args.s_p = (this.page.isIOS ? '0' : '1') + '|http|'; //记录平台信息
        // args.s_p = deviceinfo; //记录机型信息
        args.s_v = this.getQQVersion(); //上报平台信息

		if(!$.isEmptyObject(this.page) && !$.isEmptyObject(this.page.pcfg)){
			$.extend(args,{ozid : this.page.pcfg.rid,vipid : this.page.pcfg.oid});
		}
		if(typeof url === 'object'){
			args = $.extend(true, args, url);
			url = args.url || this.url;//((this.page.onlySid || !zUtil.getcookie('skey')) ? this.url2 : this.url );
			delete args.url;
		}

		if(args.callbackName){
			args[args.callbackName] = callback;
			delete args.callbackName;
		}else{
			args.callback = callback;
		}
        if (qv.zero.URL.get('notOz',url)) {
            args.notOz = true;
        }
        /*jshint expr:true */
        me.emit('beginSend', url, args, false); //开始请求的事件
		window[callback] = function(ret){
			/*jshint expr:true */
            fn && fn(ret);
            me.emit('endSend', url, args, ret, false); //结束请求的事件
            if (!args.notOz) {
                try {OZ && ret.actid && OZ.report({operID: ret.actid, retID: ret.ret,
                operDesc: ret.data.actname || '', itemID: ((ret.op && ret.op.diamonds) ? ret.op.diamonds : '')});}catch(e){}
                me.page && me.page.speed && me.page.speed({4:new Date() - t1});
                me.page && me.page.reportRetCode && me.page.reportRetCode(ret);
            }
            
		};
        
		url = qv.zero.URL.appendParams(args, url);

		return setTimeout(function(){
            me.loadScript(url);
		}, Math.random() * 200);
    },
    /**
    * 是否是sso请求
    */
    _isSSO : function(actid){
        var pcfg = this.page.pcfg, data;
        if(!pcfg) { return false; }
        try{
            data = pcfg.act || {};
            if (data[actid]) {
                return +data[actid].is_sso === 1;
            }
            return false;    
        } catch(e){
            return true; //默认使用sso请求
        }        
    },
    /**
     * 获取子活动号的拦截率[0,10]
     */
    _getRate : function(actid){
        var pcfg = this.page.pcfg, data;
        if(!pcfg) { return 0; }
        try{
            data = pcfg.act || {};
            if (data[actid] && data[actid].is_flow_limit) {
                return +data[actid].flow_limit_js;
            }
            return 0;
        } catch(e){
            return 0;
        }
    },
    /**
     * 主要用于各种不同目的拦截
     */
    send : function(url, fn){
      this.__send__(url, fn);
    },
    /**
     * 概率拒绝请求
     * @return {[type]} [description]
     */
    __send__Rate : function(url, fn, actid){
        if(Math.random() * 10 < this._getRate(actid)){
            fn && fn({
                'ret' : 10704,
                'msg' : '活动太火爆了，一下子没挤进去，稍后再来试下哈！',
                'data' : {}
            });
        } else if(this._isSSO(actid)) {
            this.SSOSend(url, fn);
        } else {
            this._send(url, fn);
        }
    },
    /**
     * 保留原来的函数，不能被拦截
     */
    __send__ : function(url, fn){
        var me = this;
        if (typeof(url) === 'string') {
            var actidREG = /(?:\?|&)actid=(\d+)/;
            var m = actidREG.exec(url), actid;
            if(m && (actid = m[1])){
                me.__send__Rate(url, fn, actid);
            } else {
                me._send(url, fn);
            }
        } else if (url.actid) {
            me.__send__Rate(url, fn, url.actid);
        } else {
            me._send(url, fn);
        }
    },
    getSSOSendUrl: function(url){
        var t1 = +new Date();
        var tk, args, ret, me = this,notOz,
        self = arguments;

        try {
            tk = qv.zero.Util.getToken();
        } catch (e) {}

        args = { 
            g_tk : tk , 
            pvsrc : qv.zero.URL.get('pvsrc') || qv.zero.URL.get('adtag') || ''
        };
        args.s_p = (this.page.isIOS ? '0' : '1') + '|sso|'; //记录平台信息
        // args.s_p = deviceinfo; //记录机型信息
        args.s_v = this.getQQVersion(); //上报平台信息

        if(!$.isEmptyObject(this.page) && !$.isEmptyObject(this.page.pcfg)){
            $.extend(args,{ozid : this.page.pcfg.rid,vipid : this.page.pcfg.oid});
        }
        if(typeof url === 'object'){
            args = $.extend(true, args, url);
            url = args.url || this.url;//((this.page.onlySid || !zUtil.getcookie('skey')) ? this.url2 : this.url );
            delete args.url;
        }

        if (qv.zero.URL.get('notOz',url)) {
            args.notOz = true;
        }            
       
        url = qv.zero.URL.appendParams(args, url);
        return url;
    },
    /**
     * 纯粹的发送请求接口(走SSO通道)，若为ams的活动号，则会上报实时数据和罗盘，默认没有任何请求的结果处理
     * ，自动带上gtoken参数
     * @for qv.zero.Http
     * @method SSOSend
     * @param {String|Object} url|args， 这里配置的args参数列表都会发送到ams后台。
     * @param {Function} fn 可选
     *  - callback的键名支持自定义，如 cb,ab,db等。默认为callback;
     *  - notOz 设置为true，不上报实时数据和罗盘;
     * @example 
     *  SSOsend({actid : 999}, function(ret){});
     *  SSOsend('http://www.qq.com', function(){});
     */
    SSOSend : function(url, fn /*, deviceinfo*/) {
        var t1 = +new Date();
        var tk, args, ret, me = this,notOz,
        self = arguments;

        try {
            tk = qv.zero.Util.getToken();
        } catch (e) {}

        args = { 
            g_tk : tk , 
            pvsrc : qv.zero.URL.get('pvsrc') || qv.zero.URL.get('adtag') || ''
        };
        args.s_p = (this.page.isIOS ? '0' : '1') + '|sso|'; //记录平台信息
        // args.s_p = deviceinfo; //记录机型信息
        args.s_v = this.getQQVersion(); //上报平台信息

        if(!$.isEmptyObject(this.page) && !$.isEmptyObject(this.page.pcfg)){
            $.extend(args,{ozid : this.page.pcfg.rid,vipid : this.page.pcfg.oid});
        }
        if(typeof url === 'object'){
            args = $.extend(true, args, url);
            url = args.url || this.url;//((this.page.onlySid || !zUtil.getcookie('skey')) ? this.url2 : this.url );
            delete args.url;
        }

        if (qv.zero.URL.get('notOz',url)) {
            args.notOz = true;
        }            
        me.emit('beginSend', url, args, true); //开始请求的事件
        url = qv.zero.URL.appendParams(args, url);

        var afterSuccess = function(ret){
            me.emit('endSend', url, args, ret, true); //结束请求的事件
            if (!args.notOz) {
                try {OZ && ret.actid && OZ.report({operID: ret.actid, retID: ret.ret,
                operDesc: ret.data.actname || '', itemID: ((ret.op && ret.op.diamonds) ? ret.op.diamonds : '')});}catch(e){}
            }
            me.page && me.page.speed && me.page.speed({4:new Date() - t1});
            me.page && me.page.reportRetCode && me.page.reportRetCode(ret);
        };

        if (zUtil.isQGame && zUtil.isQGame()) {
            this.SSOSendInEgame(url, fn, afterSuccess);
            return;
        }

        /*jshint expr:true */
        var mqq = window.mqq;
        // 低于5.4的手Q版本不支持SSO
        if((mqq.iOS || mqq.android) && mqq.compare('5.4') < 0) {
            ret = {
                'ret' : 11002,
                'msg' : '请升级到最新版手机QQ',
                'data' : {}
            };
            /*jshint expr:true */
            fn && fn(ret);
            return;
        }

        mqq && mqq.invoke("sso", "uniAgent", {
            "cmd" : "httpagent_yx_sz.http",
            "method" : "get",
            "url" : url,
            //"content" : "a=1&b=2",
            //"Content-Type" : "application/x-www-form-urlencoded",
            "needCookie" : 1
        }, function(data){
            if(data && data.ssoRet === 0 && data.businessRet === 0 && data.data){
                /*jshint expr:true */
                var _tmp = JSON.parse(data.data);
                ret = JSON.parse(_tmp.content);
                ret.SSOData = _tmp;
                fn && fn(ret);
                afterSuccess(ret);
            }else{
                /*jslint evil: true */
                ret = {
                    'ret' : 11001,
                    'msg' : 'SSO通道传输异常',
                    'data' : data
                };
                /*jshint expr:true */
                fn && fn(ret);
            }
        });
    },
    SSOSendInEgame: function(url, fn, afterSuccess){
        var getHttpResponeData = function(httpStr){
            var data = null, str = httpStr.split('\r\n\r\n'), dataStr = str[1] || '';
            if (dataStr) {
                try{
                    data = JSON.parse(dataStr);
                } catch(e) {}
            }
            return data;
        };

        zUtil.require('egameExtend', function(){
            qv.zero.pgg && qv.zero.pgg.usePggLib && qv.zero.pgg.usePggLib(function(){
                //判断版本 安卓2.7 IOS2.6
                var native = qv.zero.pggNative, ret;
                if (native && native.compare) {
                    if ((native.iOS && native.compare('2.6')<0) || (native.android && native.compare('2.7')<0)) {
                        ret = {
                            'ret' : 11003,
                            'msg' : '请升级到最新版企鹅电竞',
                            'data' : {}
                        };
                        fn && fn(ret);
                        return;
                    }
                }
                native && native.wns && native.wns.uniAgent({
                    cmd: 'httpagent_ams_sz',
                    method: 'get',
                    needCookie: 1,
                    url: url,
                    content: '',
                    content_type: ''
                }, function (data) {
                    if (data && data.wnsRet === 0 && data.businessRet === 0 && data.data) {
                        ret = getHttpResponeData(data.data) || {};
                        ret.SSOData = data.data;
                        fn && fn(ret);
                        afterSuccess(ret);
                    } else {
                        ret = {
                            'ret' : 11001,
                            'msg' : 'SSO通道传输异常',
                            'data' : data
                        };
                        fn && fn(ret);
                    }
                });
            });
        });
    },
    /**
     * 发出请求， 强制前端登录态，默认以活动号上报到实时数据和罗盘系统，
     * 会根据AMS管理的配置自动提示用户结果，自动带上gtoken参数
     * @for qv.zero.Http
     * @method  request
     * @param {Object} args { num : 5},这里配置的args参数列表都会发送到ams后台。
     * @param {Number} args.actid,AMS的子活动号。
      * @param {String} [args._c],AMS的控制器，默认为page，若调用查询接口，则可用view或query。
     * @param {Boolean} [args.mode],noMode为===false,则不启用loading mode层。
     * @param {Function} fn 回调,默认回调函数为zHttp.showResponse(json, actid, fn, showRightBtn, requestArgs);
     * @param {Boolean|String|Array} showRightBtn 弹出层右侧按钮
     *  -Boolean : true,显示进入游戏按钮;false,右侧不显示按钮
     *  -String : OpenMember,显示开通会员按钮, 'OpenCjVip : 显示开通超级会员,支持在AMS管理平台的提示语配置中的“按钮”配置。
     *  -Array  : ['发送微博',function () {}] ,自定义按钮
     * @return qv.zero.Http
     * @example
     * ```
     *  qv.zero.Http.reqeust({actid : 9999});
     *  qv.zero.Http.reqeust({actid : 9999}, function(json, actid, fn, showRightBtn, requestArgs){
     *   //your code
     *  });
     *  qv.zero.Http.request({actid : 9999},true);
     *  qv.zero.Http.request({actid : 9999},callback, true);
     *```
     */
    request : function(args, fn, showRightBtn) {
        var me = this;
        this.requestInner(args, fn, showRightBtn, function (url, fn){
            me.send(url, fn);
        });
        return this;
    },
    /**
     * 发出请求（SSO通道）， 强制前端登录态，默认以活动号上报到实时数据和罗盘系统，
     * 会根据AMS管理的配置自动提示用户结果，自动带上gtoken参数
     * @for qv.zero.Http
     * @method  SSORequest
     * @param {Object} args { num : 5},这里配置的args参数列表都会发送到ams后台。
     * @param {Number} args.actid,AMS的子活动号。
      * @param {String} [args._c],AMS的控制器，默认为page，若调用查询接口，则可用view或query。
     * @param {Boolean} [args.mode],noMode为===false,则不启用loading mode层。
     * @param {Function} fn 回调,默认回调函数为zHttp.showResponse(json, actid, fn, showRightBtn, requestArgs);
     * @param {Boolean|String|Array} showRightBtn 弹出层右侧按钮
     *  -Boolean : true,显示进入游戏按钮;false,右侧不显示按钮
     *  -String : OpenMember,显示开通会员按钮, 'OpenCjVip : 显示开通超级会员,支持在AMS管理平台的提示语配置中的“按钮”配置。
     *  -Array  : ['发送微博',function () {}] ,自定义按钮
     * @return qv.zero.Http
     * @example
     * ```
     *  qv.zero.Http.reqeust({actid : 9999});
     *  qv.zero.Http.reqeust({actid : 9999}, function(json, actid, fn, showRightBtn, requestArgs){
     *   //your code
     *  });
     *  qv.zero.Http.request({actid : 9999},true);
     *  qv.zero.Http.request({actid : 9999},callback, true);
     *```
     */
    SSORequest : function(args, fn, showRightBtn) {
        var me = this;
        this.requestInner(args, fn, showRightBtn, function (url, fn){
            me.SSOSend(url, fn);
        });
        return this;
    },
    /**
    *  request 内部实现
    */
    requestInner : function(args, fn, showRightBtn, send){
        this.fireRqReadyEvent(args);
        this.emit('beginRequest', args);
        var self = arguments, me = this,
        selfFn = function(exArgs){
            self.callee.call(me, $.extend(true,args,exArgs), fn, showRightBtn);
        };
        if(typeof fn === 'boolean' || typeof fn === 'string' || typeof fn === 'object'){
            showRightBtn = fn;
            fn = null;
        }

        args._c = args._c || args.ctrl || 'page';
        var postUrl = qv.zero.URL.appendParams(args, this.url);

        send(postUrl, function(ret) {
            me.emit('endRequest', args, ret);
            me.fireRqCompleteEvent(args, ret);
            if(fn) {
                fn.call(me, ret, ret.actid, selfFn, showRightBtn, args);
            } else {
                me.showResponse(ret, ret.actid, selfFn, showRightBtn, args);
            }
        });      
        return this;
    },
    /**
    * 这个接口的应用场景为后台接口需要处理与用户手游角色相关的参数，若不需要，则可以用request接口。
    * 该与手游相关后台请求接口，会自动匹配area, platid, roleid, sid参数,
    * 参数中的game优先读取接口配置的game，否则读page上的game。没有game则和request一样。
    * @for qv.zero.Http
    * @method syrequest
    **/
    SSOSyrequest : function (args, fn, showRightBtn) {
        var me = this;
        this.syrequestInner(args, fn, showRightBtn, function (args, fn, showRightBtn){
            me.SSORequest(args, fn, showRightBtn);
        });
    },

    /**
    * 这个接口的应用场景为后台接口需要处理与用户手游角色相关的参数，若不需要，则可以用request接口。
    * 该与手游相关后台请求接口，会自动匹配area, platid, roleid, sid参数,
    * 参数中的game优先读取接口配置的game，否则读page上的game。没有game则和request一样。
    * @for qv.zero.Http
    * @method syrequest
    **/
    syrequest : function (args, fn, showRightBtn) {
        var me = this;
        this.syrequestInner(args, fn, showRightBtn, function (args, fn, showRightBtn){
            me.request(args, fn, showRightBtn);
        });
    },
    /**
    * syrequest 内部实现
    * game 是appid的情况会怎么样？
    */
    syrequestInner : function(args, fn, showRightBtn, request){
        var me = this;
        if(typeof args == 'number'){
            args = { actid : args};
        }
        var game = args.game || this.page.game || this.page.pcfg.g;

        if(game && this.page.checkGameType(game, 18 /* (1<<1 | 1<<4) == 18 手游与H5游戏都要选区服*/)){
            game = game.toLowerCase();
            zUtil.require('https://i.gtimg.cn/club/common/lib/zero/'+ (isFinite(game) ? 'sdk' : 'idip') +'/' + game + '.js', function(){
                var flag = this.page.isIOS ? 0 : 1;
                var idip = qv.zero.Idip[game];
                if(!idip){
                    zMsg.show('game::' +game+ ' not exist');
                    return false;
                }
                if(idip.platid != -1){
                    args.platid = $.isArray(idip.platid) ? idip.platid[flag] : idip.platid;
                }
                if(idip.area != -1){
                    args.area = $.isArray(idip.area) ? idip.area[flag] : idip.area;
                }
                if(idip.roleid != -1){
                    args.roleid = idip.roleid;
                }
                args.plat = this.page.isIOS ? 1 : (this.page.isAndroid ? 2 : 3);
                // 兼容游戏中心的tt
                args.tt = this.page.isIOS ? 2 : (this.page.isAndroid ? 1 : 3);
                args.game = game;
                if(+idip.partition === -1 && args.autosvr){ //需要选区服
                    var assn = 'AreaSvrSelector', assnkey = 'src' + game + (args.serverList || '');
                    var page = this.page;
                    page.require( assn , function(){
                        if(!page[assnkey]){
                            page[assnkey] = new qv.zero[assn]({ name: game, serverList: args.serverList, useFilter: args.useFilter, rbtn: true, controller: args.controller });
                        }
                        delete args.serverList;
                        delete args.useFilter;
                        delete args.autosvr;
                        page[assnkey].show({send : function(area_args, cb){
                            args.roleid = area_args.roleid;
                            args.partition = area_args.partition;
                            args.opengamecenter = true;
                            request(args , fn, this.rbtn);
                        }});
                    });
                }else {
                    request(args, fn, showRightBtn);
                }
            },{scope : this});
        }else{
            if(args.autosvr){
                var assn = 'PCGameAreaSvrSelector', assnkey = 'src' + game, page = this.page;
                page.require( assn , function(){
                    if(!page[assnkey]){
                        page[assnkey] = new qv.zero[assn]({ name : game });
                    }
                    delete args.autosvr;
                    page[assnkey].show({send : function(area_args, cb){
                        $.extend(args, area_args);
                        request(args , fn, showRightBtn);
                    }});
                });
            } else {
                args.sid = this.page.getSid();
                request(args, fn, showRightBtn);
            }
        }
    },
    /**
    * ajax请求
    * 主要用于 一些非iyouxi的后台请求，使用的是短的token。跨域
    * token_diseabled 禁用自动添加token
    */
    ajax : function(data){
        var url = data.url, cache = data.cache || false, dataType = data.dataType || 'json', timeout = data.timeout || 5000, callback = data.callback;
        if(!data.token_diseabled && (url.indexOf('&g_tk=') < 0 && url.indexOf('?g_tk=') < 0)){ //指定加上
            url += (url.indexOf('?') > -1 ? '&g_tk=' : '?g_tk=') + zUtil.getToken();
        }
        Zepto.ajax({
            url : url,
            cache   : cache,
            dataType: dataType,
            timeout : timeout,
            beforeSend : function(xhr){
                xhr.withCredentials = true;
            },
            success : function(json){
                /*jshint expr:true*/
                callback && callback(json);
            },
            error : function(){
                /*jshint expr:true*/
                callback && callback({
                    result : 5,
                    ret    : 5,
                    msg    : "网络异常，请稍后再试！"
                });
            }
        });
    },
    /**
     * 异步加载js文件
     * @for qv.zero.Http
     * @method loadScript
     * @param {String} url
     * @param {Function} [callback] 回调，可不传
     * @param {String} [charset] 可选,默认为utf8
     * @param {Function} [errCallback]，错误的回调
     * @return void
     * @example
     * ```
     * loadScript('vip.qq.com/test.js');
     * loadScript('vip.qq.com/test.js','gbk');
     * loadScript('vip.qq.com/test.js',function(){}, 'gbk');
     * ```
     */
    loadScript : function(url, callback, charset, errCallback) {
        url = qv.zero.URL.appendParams({cache : (this.page && this.page.cacheid || 0)}, url);
        qv.zero.Module.loadScript(url, callback, charset, errCallback);
    },
    /**
     * 异步加载css文件
     * @for qv.zero.Http
     * @method loadCss
     * @param {String} url
     * @return void
     * @example
     * ```
     * loadCss('vip.qq.com/test.css');
     * ```
     */
    loadCss : function(url) {
        url = ZProtoAdapter.url(url); //适配url
        $('<link>').attr({
            type : 'text/css',
            rel : 'stylesheet',
            href : url
        }).appendTo('head');
    },
    /**
     * 展示AMS请求响应的结果，会自动处理登录状态，结果提示语等
     * @for qv.zero.Http
     * @method showResponse
     * @param {Object} json AMS返回的结果
     * @param {Number} actid 活动号
     * @param {Function} [fn] 请求本身。
     * @param {Boolean | String | Array} requestArgs 弹出层右侧按钮
     *  -Boolean true,显示进入游戏按钮;false,右侧不显示按钮
     *  -String 'openVip',显示开通会员按钮
     *  -Array ['发送微博',function () {}] ,自定义按钮
     * @param {Object} requestArgs 请求的参数列表
     * @return void
     */
    showResponse : function(json, actid, fn, showRightBtn, requestArgs) {
		var code = Number(json.ret),
			data = json.data, msgCfg;
		if(json.ret == 10002){ //没登录
			qv.zero.Login.show();
			return ;
		}else if(code === 0 && $.inArray(data.act.op,
                ['lottery_route_must_wx','lottery_route_must','lottery_route','choose_mp_send','lottery_rand']) != -1) {
                msgCfg = zMsg.getLotMsg(actid,data.op.diamonds);
                msgCfg.m = msgCfg.m.replace(/\{name\}/, data.op ? data.op.name:'');
        }else{
                msgCfg = zMsg.getRetMsg(actid, code);
        }
        if( typeof msgCfg === 'string'){
            msgCfg = {m : msgCfg};
        }
        msgCfg.m = msgCfg.m.replace(/\{name\}/, data.actname ? data.actname:'');
        var msgTips = msgCfg.m.replace(/<[^>]+>/g,'');
        var cdk = (data.op && data.op.cdkey) ? data.op.cdkey: ( data.join && data.join.info ? data.join.info.split("|")[1] : "");
        msgTips = msgTips.replace("{cdkey}", cdk);
        showRightBtn = msgCfg.l ? msgCfg.l : showRightBtn;

        // 如果是端游的移动端活动，则弹窗不显示启动游戏按钮
        if (typeof showRightBtn === 'boolean') {
            var gameName = this.page.game || this.page.pcfg.g;
            var gameConfig = this.page.getGameConfig(gameName.toLowerCase());
            var isPC = gameConfig.c != 1;
            if(isPC) {
                showRightBtn = false;
            }
        }
        var dialog = null;
        if (typeof showRightBtn === 'boolean' && showRightBtn) {
            dialog = zMsg.showWithGameBtn(msgTips,this.page, requestArgs);
        } else if (typeof showRightBtn === 'string' &&showRightBtn !== ''){
            var dn = this.capitalize(showRightBtn), cfg;
            var dns = showRightBtn;
            if(/^http/.test(dns)) {
                if (/\{sid\}/.test(dns)) {
                   dns = dns.replace(/\{sid\}/g,this.page.getSid()); 
                }
                dialog = qv.zero.Msg.showDialog(msgTips,[msgCfg.b,function(){
                    window.open(dns);
                }]);
            }else if(zMsg['show'+ dn]) {
                dialog = zMsg['show'+this.capitalize(showRightBtn)](msgTips,this.page, requestArgs);  
            }else if( zMsg['get' + dn + 'Config']){
                cfg = zMsg['get' + dn + 'Config'](msgTips,this.page, requestArgs);
                dialog = zMsg.showCustomDialog(msgTips,cfg, requestArgs);
            } else{
                dialog = zMsg.showDialog(msgTips,[msgCfg.b, function(){
                /*jslint evil: true */
                (new Function(msgCfg.l))();
              }]);
            }
        } else if ($.isArray(showRightBtn)) {
            dialog = zMsg.showCustomDialog(msgTips,showRightBtn, requestArgs);
        } else  {
            dialog = zMsg.show(msgTips);
        }
        if(dialog && dialog.on){
            var page = this.page;
            dialog.on('click', function(i){
                page && page.emit && page.emit('dialogClick', requestArgs, json, actid, i); //向外部抛出事件
            });
        }
        return dialog;
    },
    /*
    *把字符串的首字符变大写
    */
    capitalize : function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1) + 'Dialog';
    },
    /**
     * 绑定插件，每个插件应该具备至少[onReady,onFinish]其中之一，否则无效
     * @for qv.zero.Http
     * @method bindWidget
     * @param {Object} widgetObject 插件的配置项
     * @param {Function} widgetObject.onReady 开始send请求触发
     * @param {Function} widgetObject.onComplete 成功获取请求响应触发
    **/
	bindRequestWidget : function(widgetObject){
        this.widgets.push(widgetObject);
    },
    /**
     * 执行rq插件的ready事件
     * @param {Object} args 请求的参数
    **/
    fireRqReadyEvent : function (args) {
        $.each(this.widgets, function(i,cfg){
            /*jshint expr:true */
            cfg.onReady && cfg.onReady.call(zHttp, args, i);
        });
    },
    /**
     * 执行rq插件的complete事件
     * @param {Object} args 请求的参数
     * @param {Object} json 请求响应的结果
    **/
    fireRqCompleteEvent : function (args, json) {
        $.each(this.widgets, function(i,cfg){
            /*jshint expr:true */
            cfg.onComplete && cfg.onComplete.call(zHttp,args, i, json); 
        });  
    },
   //绑定页面对象
   bindPage : function (page) {
		this.page = page;
   },
   //事件相关
   on: function(key, handle, onPage){
       if(handle){
        this.$event.on(key, handle.bind(this));
        onPage && this.page && this.page.on && this.page.on(key, handle.bind(this.page)); //触发page上的数据
       }
   },
   off: function(key, handle, onPage){
       if(handle){
        this.$event.off(key, handle.bind(this));
        onPage && this.page && this.page.off && this.page.off(key, handle.bind(this.page)); //触发page上的数据
       }
   },
   once: function(key, handle, onPage){
      if(handle){
        this.$event.once(key, handle.bind(this));
        onPage && this.page && this.page.once && this.page.once(key, handle.bind(this.page)); //触发page上的数据
      }
    },
    emit: function(){
        var args = Array.prototype.slice.call(arguments, 0, -1), onPage = Array.prototype.slice.call(arguments, -1)[0];
        this.$event.emit.apply(this.$event, args);
        onPage && this.page && this.page.emit && this.page.emit.apply(this.page, args); //触发page上的数据
    }
};
