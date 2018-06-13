/**
 * 合并请求
 * payneliu
 * 实现原理：
 * 在使用zero请求的时候，发现可以合并的请求，则将请求hold住，等指定毫秒之后一起发出。ams则使用pages控制器；
 * 在请求返回之后，再将返回值分发给各个回调函数
 *
 * 走合并请求的条件
 * 1. 标识为可以合并请求的 字段名称为：mergeReq : true
 * 2. 只能合并page、view控制器
 *
 * 在发出请求的时候，page控制器最多使用3个子活动，view最多使用5个子活动
 *
 * eg :
 *
 * zHttp.send({actid:123456, ismerge : !0}, function(a){});                 |
 * zHttp.send({actid:123457, ismerge : !0, _c : 'view'}, function(a){});    |=>    zHttp.send({pactids:'123456_123458', vactids = '123457', _c: 'pages'}, function(a,b,c){});
 * zHttp.send({actid:123458, ismerge : !0}, function(a){});                 |
 * 
 */

;(function (exports, $) {
    var P_MAX = 3/*page控制器最大限制*/, 
        V_MAX = 5/*view控制器最大限制*/, 
        TIMEOUT = 4/*等待时间*/;

    //合并请求对象
    var MergeRequest = (function(){

        function MergeRequest(){
            this.list = [];
            this.mixiArg = {};//所有参数
            this.handle = null; //获取最后的
        }

        $.extend(MergeRequest.prototype, {
            /**
             * 添加请求
             * 添加成功返回true，否则返回false
             */
            addRequest : function(args, callback){
                if(this._checkArgument(args)){
                    var actid = args.actid;
                    //合并参数
                    $.extend(this.mixiArg, args);
                    this.list.push({ arg : args, callback : callback, issso : zHttp._isSSO(actid) });

                    this.triggerSend();
                    return true;
                } else {
                    return false;
                }
            },
            /**
             * 触发发送
             */
            triggerSend : function(){
                if(this._checkNum()){ //数量满足了发送请求
                    if(this.handle){ //发送之后将定时的清空
                        clearTimeout(this.handle);
                        this.handle = null;
                    }
                    this.sendBatch();
                } else if(!this.handle){ //开始定时
                    var me = this;
                    this.handle = setTimeout(function(){
                        me.handle = null;
                        me.sendBatch();
                    }, TIMEOUT);
                }
            },
            /**
             * 批量发送请求
             */
            sendBatch : function(){
                var rc = new RequestCell(this.mixiArg, this.list);
                this.mixiArg = {};
                this.list = [];
                rc.run();
            },
            /**
             * 检查参数
             * 检查所有参数，如果发现key相同，但是值不同的将不会返回false
             */
            _checkArgument : function(args){
                var mixiArg = this.mixiArg;
                for(var i in args){
                    if(args.hasOwnProperty(i) && mixiArg[i] && ['actid', '_c'].indexOf(i) === -1){
                        if(mixiArg[i] != args[i]){
                            return false;
                        }
                    }
                }
                return true;
            },
            /**
             * 检查数量 是否满足最大限制
             */
            _checkNum : function(){
                var item, pnum = 0, vnum = 0;
                this.list.map(function(i){
                    item = i.arg;
                    if(!item._c || item._c === 'page'){
                        pnum++;
                    } else if(item._c === 'view'){
                        vnum++;
                    }
                });
                return pnum >= P_MAX || vnum >= V_MAX;
            }
        });

        /**
         * 请求类
         */
        function RequestCell(reqargs, data){
            this.reqArgs = reqargs;
            this.data = data;
        }
        $.extend(RequestCell.prototype, {
            /**
             * 执行请求
             */
            run : function(){
                var arg = $.extend({}, this.reqArgs, this.build());
                if(this.hasSSO()){
                    zHttp.page && zHttp.page.emit('beginMergeSend', 'mergerequest', arg, true); //开始请求的事件
                    zHttp.SSOSend(arg, $.proxy(this.commonCallback, this));
                } else {
                    zHttp.page && zHttp.page.emit('beginMergeSend', 'mergerequest', arg, false); //开始请求的事件
                    zHttp._send(arg, $.proxy(this.commonCallback, this));
                }
            },
            /**
             * 通用的回调函数
             */
            commonCallback : function(json){
                var retData;
                if(json.actid){ //单个返回时
                    retData = {};
                    retData[json.actid] = json;
                } else { //多个返回时
                    retData = json.data || {};
                }
                this.data.map(function(i){
                    var actid = (i.arg || {actid : 0}).actid;
                    if(retData[actid]){
                        var ret = retData[actid];
                        i.callback && i.callback(ret); //调用回调
                        zHttp.page && zHttp.page.emit('endMergeSend', 'mergerequest', i.arg, ret, i.issso); //结束请求的事件
                        if (i.arg && !i.arg.notOz) {
                            try {OZ && ret.actid && OZ.report({operID: ret.actid, retID: ret.ret,
                            operDesc: ret.data.actname || '', itemID: ((ret.op && ret.op.diamonds) ? ret.op.diamonds : '')});}catch(e){}
                        }
                    } else if(json.ret === 11002/*前端sso控制*/ || json.ret === 10704/*前端流量控制*/) {
                        i.callback && i.callback(json); //调用回调
                    }
                });
                this.destroy();
            },
            /** 
             * 生成数据
             */
            build : function(){
                var pactids = [], vactids = [];
                this.data.map(function(i){
                    var item = i.arg;
                    if(!item._c || item._c === 'page'){
                        pactids.push(item.actid);
                    } else if(item._c === 'view'){
                        vactids.push(item.actid);
                    }
                });
                if(pactids.length === 1 && vactids.length === 0){ /*只有一个数据的时候，还是走之前的请求路径; 只有page控制器的时候，走原来的路径*/
                    return {};
                }
                var result = {_c : 'pages'};
                if(pactids.length > 0){
                    result.pactids = pactids.join('_');
                }
                if(vactids.length > 0){
                    result.vactids = vactids.join('_');
                }
                return result;
            },
            /**
             * 销毁
             */
            destroy : function(){
                this.data.map(function(i){ //手工释放
                    i.arg = null;
                    i.callback = null;
                    i.issso = null;
                });
                this.data = [];
                this.reqArgs = {};
            },
            /**
             * 是否走sso通道
             */
            hasSSO : function(){
                return this.data.some(function(i){
                    return i.issso;
                });
            }
        });

        return MergeRequest;
    })();

    var mergeReq = new MergeRequest();
    /**
     * 发送请求
     * 返回 true：表示不适合本逻辑
     * 返回 false ： 表示会hold住本请求，后面统一发送出去
     * @param  {object}   args     参数
     * @param  {Function} callback 回调函数
     * @return {boolean}           是否hold住
     */
    function sendRequest(args, callback){
        var actid = args.actid, controller = args._c || 'page', ismerge = args.ismerge;

        if([false, 0, 'false', '0'].indexOf(ismerge) > -1 || ['page', 'view'].indexOf(controller) === -1){
            return true; //继续后面的逻辑
        } else {
            //hold请求
            return !mergeReq.addRequest(args, callback);
        }
    }
    /**
     * 将对象urldecode
     * @return object
     */
    function urldecode(args){
        for(var i in args){
            if(args.hasOwnProperty(i)){
                args[i] = window.decodeURIComponent(args[i]);
            }
        }
        return args;
    }
    if (exports.zAOP) {
        var mothed = zHttp.__send__ ? '__send__' : 'send';
        exports.zAOP.intercept_s_s(mothed, {
            before: function (param) { //拦截send方法 function(url, fn)
                //搜集请求
                var args = param.args, data, callback;
                if (args && args.length > 0 && (data = args[0])) {
                    callback = args[1];
                    if(data.actid){ //原生使用send请求的方式
                        return sendRequest(data, callback);
                    } else if(typeof data === 'string'){
                        return sendRequest(urldecode(zURL.unserialParams(data.split('?')[1] || '')), callback);
                    }
                }
            }
        }, zHttp, 1);
    }
}(qv.zero, Zepto));