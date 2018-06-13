/*
* 
* 接口说明：
* 参数说明：
* var Http = {
*     send : function(data, cb){
*         setTimeout(function(){
*             console.log(data);
*             cb && cb();
*         }, 10);
*     },
*     variable : 10
* }
* var od = ObjectDecorator.getObjectDecorator(Http); //获取装饰对象
* 
* od.interception('send', {before:function(inv,next){}, after :function(inv,next){}, except:function(inv,next){}, index:1, desc: ''});
* 其中：
*    'send' 方法名称
*    before 在拦截的函数执行之前触发
*    after  在拦截的函数执行之后触发
*    except 在拦截的函数执行发生异常时触发
*    index  拦截器的顺序
*    desc   当前拦截器的描述，方便调试
*
* 
* od.interception_args('send', 1, {before:function(inv,next){}, after :function(inv,next){}, except:function(inv,next){}, index:1, desc: ''});
* 其中：
*    'send' 方法名称
*    1      参数的顺序
*    before 在拦截的函数执行之前触发
*    after  在拦截的函数执行之后触发
*    except 在拦截的函数执行发生异常时触发
*    index  拦截器的顺序
*    desc   当前拦截器的描述，方便调试
*
* od.interception('variable', {before:function(inv,next){}, after :function(inv,next){}, except:function(inv,next){}, index:1, desc: ''});
* 其中：
*    'variable' 属性名称
*    before 在拦截的函数执行之前触发
*    after  在拦截的函数执行之后触发
*    except 在拦截的函数执行发生异常时触发
*    index  拦截器的顺序
*    desc   当前拦截器的描述，方便调试
* 
*/
(function(exports){
    /**
     * 代理
     * @param object obj     
     * @param object handler 
     * {
     *     apply : function(target, thisArg, args){},
     *     get   : function(target, property, receiver){},
     *     set   : function(target, property, value, receiver){}
     * }
     */
    function ObjectProxy(obj, handler) {
        var proxy = Object.create(obj);
        init(proxy, obj, handler);
        return proxy;
    }
    function init(newobj, oldobj, handler){
        var item, hasapply = !!handler.apply, hasget = !!handler.get, hasset = !!handler.set;
        for(var i in oldobj){
            if(oldobj.hasOwnProperty(i)){
                item = oldobj[i];
                if(isFunction(item)){
                    hasapply && (newobj[i] = (function(func, name){
                        return function(){
                            return handler.apply(func, newobj, arguments, name, oldobj);
                        }
                    })(item, i));
                } else {
                    if(hasget && hasset){
                        (function(key){
                            Object.defineProperty(newobj, key, { 
                                get : function(){ return handler.get(oldobj, key, newobj) }, 
                                set : function(nval){ handler.set(oldobj, key, nval, newobj)  } 
                            });
                        })(i);
                    } else if(hasget){
                        (function(key){
                            Object.defineProperty(newobj, key, { 
                                get : function(){ return handler.get(oldobj, key, newobj) }
                            });
                        })(i);
                    } else if(hasset){
                        (function(key){
                            Object.defineProperty(newobj, key, { 
                                set : function(nval){ handler.set(oldobj, key, nval, newobj)  } 
                            });
                        })(i);
                    }
                }
            }
        }
    }

    function isFunction(val){
        return Object.prototype.toString.call(val) === '[object Function]';
    }
    //标识
    function Identity(){
        this.pre = '__id__';
        this.id = this.pre + (+new Date) + (Identity.uid++);
    }
    Identity.prototype.getIdentity = Identity.prototype.toString = Identity.prototype.valueOf = function(){
        return this.id;
    };
    Identity.uid = 0;

    //调用描述
    function Invocation(proxy, context, handler, args, parent){
        this.proxy = proxy;
        this.context = context;
        this.handler = handler;
        this.args = Array.prototype.slice.call(args);
        this.desc = '';
        this.exception = null; //异常
        this.parent = parent;  //父描述
        
        this._state = 0;  //0: 初始化之前，1: 初始化完成，2：开始执行before，3：执行原始函数，4：开始执行after，5：开始执行except， 6：执行完成
        this._index = -1; //执行的序号
    }
    //执行原始的函数
    Invocation.prototype._procced = function() {
        this.result = this.handler.apply(this.context, this.args);
        return this.result;
    };
    //执行下一个拦截器 可重入
    Invocation.prototype._next = function(list){
        var step = 1;
        switch(this._state){
            case 0 : //初始化之前
                this.list = list;
                this._state = 1;//标识初始化完成
            case 1 : //初始化完成
                this._index = -1;
                step = 1;
                this._state = 2; //标识开始执行before
            // break;
            case 2 : //开始执行before
                if(!this._innernext(step, 'before')){
                    this._state = 3; //标识before执行结束
                } else{
                    break;        
                }            
            case 3 : //开始执行原始函数
                try{
                    this._procced();
                    this._state = 4;
                } catch(e){
                    this.exception = e;
                    this._index = this.list.length;
                    this._state = 5;
                    this._next();
                    break;
                }
            case 4 : //开始执行after
                step = -1;
                if(!this._innernext(step, 'after')){
                    this._state = 6; //标识after执行结束
                }
            break;
            case 5 : //开始执行except
                step = -1;
                if(!this._innernext(step, 'except')){
                    this._state = 6; //标识except执行结束
                }
            break;
            default:
            case 6:
            break;
        }
    }
    //执行下一个拦截器
    Invocation.prototype._innernext = function(step, method){
        this._index += step;
        var current = this.list[this._index], m, that = this;
        if(current){
            if(m = current[method]){
                this.desc = current.desc || '';
                m.call(this.context, this, function(isend){ 
                    if(isend){
                        if(step > 0){ //before阶段
                            that._state = 4;
                            that._index += step;
                        } else if(step < 0){ //after阶段
                            that._state = 6;
                        }
                    } 
                    that._next();
                }); //调用
                return true;
            } else {
                return this._innernext(step, method);
            }
        }
        return false;
    };
    //执行包含了拦截器的函数
    Invocation.prototype.run = function(list){
        this._next(list); //开始执行
        return this.result;
    }

    //函数调用代理
    function InvokeProxy(){
        this.list = [];       //拦截器
        this.isOrder = false; //是否排序
    }
    //注册拦截函数
    InvokeProxy.prototype.register = function(param){
        if(param.index !== null && isFinite(param.index)){
            param.index = parseFloat(param.index, 10);
        } else {
            param.index = 0;    
        }
        this.list.push(param);
        this.isOrder = false;
    };
    //执行
    InvokeProxy.prototype.run = function(invocation){
        if(!this.isOrder){ //防止多次排序
            this.isOrder = true;
            this.list.sort(function(a, b){ return b.index - a.index; });
        }
        /*复制一份出来，防止执行的过程中有添加拦截器*/
        return invocation.run([].concat(this.list)); //开始执行
    };

    //函数的代理
    function FunctionProxy(){
        this.invokeproxy = new InvokeProxy();
        this.cb = {};
    }
    //执行
    FunctionProxy.prototype.run = function(invocation){
        return this.invokeproxy.run(invocation);
    };
    //注册函数的拦截器
    FunctionProxy.prototype.interception = function(param){
        this.invokeproxy.register(param);
    };
    //注册回调函数的拦截器
    FunctionProxy.prototype.interception_args = function(posi/*参数所在的位置*/, param){
        var me = this, inproxy;
        if(!(inproxy = me.cb[posi])){
            inproxy = me.cb[posi] = new InvokeProxy();
            this.invokeproxy.register({before: function(invocation, next){
                    if(invocation.args[posi] && isFunction(invocation.args[posi])){
                        var old_cb = invocation.args[posi];
                        invocation.args[posi] = function(){
                            inproxy.run(new Invocation(me, me, old_cb, arguments, invocation));
                        }
                    }
                    next();
                }, 
                index: 9007199254740991, //Number.MAX_SAFE_INTEGER,
                desc : 'system callback'
            });
        }
        inproxy.register(param);
    };
    //注册返回CallBack的拦截器
    FunctionProxy.prototype.interception_cb = function(param){
        var after = param.after;
        param.after = function(invocation, next){
            var cb = new qv.zero.CallBack();
            invocation.result.add(function(ret){
                after(ret);
                cb.execute(ret);
            });
            invocation.result = cb;
            next();
        }
        this.invokeproxy.register(param);
    };
    //注册返回promise的拦截器
    FunctionProxy.prototype.interception_promise = function(param){
        throw 'not support';
        // this.invokeproxy.register(before, after, except, index);
    };

    //代理工厂
    var ProxyFactory = (function(){
        var factory = {
            //代理方法
            apply : function(getFuncProxy){
                return function(target, thisArg, args, name, receiver){
                    var proxy = getFuncProxy(name);
                    if(proxy){
                        return proxy.run(new Invocation(receiver, thisArg, target, args));
                    } else {
                        return target.apply(thisArg, args);
                    }
                }
            },
            //代理get
            get : function(getFuncProxy){
                return function(target, property, receiver){
                    var proxy = getFuncProxy(property);
                    if(proxy){
                        return proxy.run(new Invocation(receiver, target, function(){ return target[property]; }, []));
                    } else {
                        return target[property];
                    }
                }
            },
            //代理set
            set : function(getFuncProxy){
                return function(target, property, value, receiver){
                    var proxy = getFuncProxy(property);
                    if(proxy){
                        proxy.run(new Invocation(receiver, target, function(){ return target[property] = value; }, [value]));
                    } else {
                        target[property] = value;
                    }
                }
            }
        };
        return {
            get : function(types){
                var list = types.split('|'), handlers = {};
                if(list){
                    list.forEach(function(type){
                        if(factory[type]){
                            handlers[type] = factory[type];
                        }
                    });
                } else {
                    throw RangeError('type is not fount');
                }
                return handlers;
            },
            set : function(type, proxy){
                factory[type] = proxy;
            }
        };
    }());

    //对象装饰者
    function ObjectDecorator(obj, handlers){
        this.interceptorList = {};
        var list = {}, getFuncProxy;
        if(handlers){
            getFuncProxy = (function (self){
                return function(key){
                    return self.interceptorList[key];
                };
            })(this);

            for (var i in handlers) {
                list[i] = handlers[i](getFuncProxy);
            }
        }
        this.proxy = new ObjectProxy(obj, list);
    }
    //注册拦截器
    ObjectDecorator.prototype.interception = function(key, before/*, after, except, index, desc*/){
        var len = arguments.length, param;
        if(len > 2){
            param = {
                'before' : before,
                'after' : arguments[2],
                'except' : arguments[3],
                'index' : arguments[4],
                'desc' : arguments[5] || ''
            };
        } else if(len === 2 && key && !isFunction(before)){
            param = before;
            param.desc = param.desc || '';
        } else {
            throw new Error('arguments error');
        }
        var interceptor = this.interceptorList[key] || (this.interceptorList[key] = new FunctionProxy());
        interceptor.interception(param);
    };
    //注册拦截器
    ObjectDecorator.prototype.interception_args = function(key, posi/*参数所在的位置*/, before/*, after, except, index, desc*/){
        var len = arguments.length, param;
        posi = +posi;
        if(len > 3){
            param = {
                'before' : before,
                'after' : arguments[2],
                'except' : arguments[3],
                'index' : arguments[4],
                'desc' : arguments[5] || ''
            };
        } else if(len === 3 && key && isFinite(posi) && !isFunction(before)){
            param = before;
            param.desc = param.desc || '';
        } else {
            throw new Error('arguments error');
        }
        var interceptor = this.interceptorList[key] || (this.interceptorList[key] = new FunctionProxy());
        interceptor.interception_args(posi, param);
    };
    //注册拦截器
    ObjectDecorator.prototype.interception_cb = function(key, proxy/*, except, index, desc*/){
        var len = arguments.length, param;
        if(len > 2){
            param = {
                'after' : proxy,
                'except' : arguments[2],
                'index' : arguments[3],
                'desc' : arguments[4] || ''
            };
        } else if(len === 2 && key && !isFunction(proxy) && proxy.after){
            param = proxy;
            param.desc = param.desc || '';
        } else {
            throw new Error('arguments error');
        }
        var interceptor = this.interceptorList[key] || (this.interceptorList[key] = new FunctionProxy());
        interceptor.interception_cb(param);
    };
    //获取装饰对象，如果本身是的话，将会返回本身。否则将创建新的装饰者
    ObjectDecorator.getObjectDecorator = function(obj, types){
        types = types || 'apply|get|set';
        var key = '__decortor__', cache = ObjectDecorator.cache || (ObjectDecorator.cache = {});
        if(obj[key]){
            if(!cache[obj[key]]){
                cache[obj[key]] = new ObjectDecorator(obj, ProxyFactory.get(types));
            }
        } else {
            var id = new Identity();
            obj[key] = id.toString();
            cache[id] = new ObjectDecorator(obj, ProxyFactory.get(types));
        }
        return cache[obj[key]];
    }
    //获取装饰者的原始对象
    ObjectDecorator.getOriginalObject = function(obj){
        var key = '__decortor__';
        if(obj[key]){
            if(Object.getPrototypeOf){
                return Object.getPrototypeOf(obj);
            } else if(obj.__proto__){
                return obj.__proto__;
            } else {
                return obj;
            }
        }
        return obj;
    };

    if(typeof define == 'function' && (define.amd != undefined || define.cmd != undefined)) {
        define(function() {
            return {
                ProxyFactory : ProxyFactory,
                ObjectDecorator : ObjectDecorator
            };
        });
    } else {
        exports.ProxyFactory = ProxyFactory;
        exports.ObjectDecorator = ObjectDecorator;
    }

    window.zHttp = exports.Http = ObjectDecorator.getObjectDecorator(exports.Http).proxy;

    //兼容旧的aop
    function interception_cfg(interceptor) { 
        return{
            before_s : function(inv, next){
                if(interceptor.before){
                    next(false === interceptor.before.call(inv.context, {args : inv.args})); //等于false才中断请求
                } else {
                    next();
                }
            },
            before_a : function(inv, next){
                if(interceptor.before){
                    interceptor.before.call(inv.context, {args : inv.args, callback: function(){ next(); }});
                } else {
                    next();   
                }
            },
            after : function(inv, next){
                if(interceptor.after){
                    inv.result = interceptor.after.call(inv.context, {args : inv.args, result: inv.result});
                }
                next();
            },
            after_s : function(inv, next){
                interceptor.after && interceptor.after.call(inv.context, {args : inv.args, result: inv.result});
                next();
            },
            a_after : function(inv, next){
                interceptor.after && interceptor.after.call(inv.context, {args : inv.args, result: inv.result, context: inv.parent.args});
                next();
            },
            after_a : function(inv, next){
                if(interceptor.after){
                    interceptor.after.call(inv.context, {args : inv.args, result: inv.result, callback: function(){ next(); }, context: inv.parent.args});
                } else {
                    next();
                }
            }, 
            exception : function(inv, next){
                interceptor.exception && interceptor.exception.call(inv.context, {exception : inv.exception})
                next();
            }
        }
    };
    exports.zAOP = window.zAOP = {
        //源函数是同步的，拦截函数是同步的
        intercept_s_s : function(methods, interceptor, context){
            var interception = interception_cfg(interceptor);
            ObjectDecorator.getObjectDecorator(context).interception(methods, { 
                before : interception.before_s,
                after : interception.after,
                exception : interception.exception,
                desc : 'intercept_s_s' + methods 
            });
        },
        //源函数是同步的，拦截函数是异步的
        intercept_s_a : function(methods, interceptor, context){
            var interception = interception_cfg(interceptor);
            ObjectDecorator.getObjectDecorator(context).interception(methods, { 
                before : interception.before_a,
                after : interception.after_s,
                exception : interception.exception,
                desc : 'intercept_s_a' + methods 
            });
        },
        //源函数是异步的，拦截函数是同步的
        intercept_a_s : function(methods, interceptor, context, cb_index){ //
            var interception = interception_cfg(interceptor);
            ObjectDecorator.getObjectDecorator(context).interception_args(methods, cb_index, { 
                before : interception.before_s,
                after : interception.a_after,
                exception : interception.exception,
                desc : 'intercept_a_s' + methods 
            });
        },
        //源函数是异步的，拦截函数是异步的
        intercept_a_a : function(methods, interceptor, context, cb_index){ //
            var interception = interception_cfg(interceptor);
            ObjectDecorator.getObjectDecorator(context).interception_args(methods, cb_index, { 
                before : interception.before_a,
                after : interception.after_a,
                exception : interception.exception,
                desc : 'intercept_a_a' + methods 
            });
        }
    };
}(qv.zero));