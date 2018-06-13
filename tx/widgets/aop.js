/*
* 
* 接口说明：
* 参数说明：
* methods ：要拦截的方法名称，类型：字符串或者数组
* interceptor ：需要织入的拦截函数，类型：{before : function(){}, after : function(){}, exception : function(){}}
* context ：要拦截的方法所处的上下文。
* cb_index ：异步时 回调函数在参数列表中的顺序，默认是最后一个。
*
* intercept_s_s：源函数是同步的，拦截函数是同步的
* 使用方法: zAOP.intercept_s_s('send', {before : function(){}, after : function(){}, exception : function(){}} ,zHttp);
* 说明： before 返回false 将不会调用源函数
* 
* intercept_s_a：源函数是同步的，拦截函数是异步的
* 使用方法: zAOP.intercept_s_a('send', {before : function(){}, after : function(){}, exception : function(){}} ,zHttp);
* 说明：before 函数的参数的callback是 源函数的调用。在befroe里面根据需要是否调用
*       after 函数不能修改源函数的返回值。可以做一些扫尾的工作
* 
* intercept_a_s：源函数是异步的，拦截函数是同步的
* 使用方法: zAOP.intercept_a_s('send', {before : function(){}, after : function(){}, exception : function(){}} ,zHttp);
* 说明：before 返回false 将不会调用源函数
*       after 函数在源函数的回调函数 之前执行。如果返回false 将不会执行回调函数。
*
* intercept_a_a：源函数是异步的，拦截函数是异步的
* 使用方法: zAOP.intercept_a_a('send', {before : function(){}, after : function(){}, exception : function(){}} ,zHttp);
* 说明：before 函数的参数的callback是 源函数的调用。在befroe里面根据需要是否调用
*       after 函数在源函数的回调函数 之前执行，after函数的的callback属性是 源函数的回调的调用，在after内根据需要是否调用。
*
*
* 其中before：是在源函数执行开始时调用
*     after： 是在源函数执行结束时调用
*     exception： 是在源函数执行报错时调用 （其他几种拦截是类似的，只是异步的时候after是在回调里面执行的。）
* 说明：如果before 函数返回false 将不会调用源函数后面的函数体
*       在源函数是同步的情况下， after 函数 可以修改原函数的返回值；异步的情况下after是可以修改回调函数的入参
*       在源函数是同步的情况下， exception 函数 可以捕获源函数体内的异常；异步的情况下exception 可以捕获源函数与回调函数的异常
*
*/
(function(exports) {

	function isFunction(func){ return typeof(func) === 'function'; }
	
	//参数对象
	function ParamObj(args, result, callback, ctxt){
		this.args = args;
		this.result = result;
		this.callback = callback;
		this.context = ctxt;
	}

	function AOP(methods, interceptor, context, intercepts, cb_index){
		if(!interceptor) return;
	    methods = [].concat(methods);
	    context = context || window;
        var method;
        for (var i = methods.length - 1; i >= 0; i--) {
            method = methods[i];
            var m = context[method], intceptr;
            if(isFunction(m)){
            	for(var o in intercepts){
            		intceptr = interceptor[o];
        			if(isFunction(intceptr) && intercepts.hasOwnProperty(o)){
        				m = intercepts[o](m, intceptr, context, cb_index);
	            	}
            	}
				context[method] = m;
            }
        };
	}

	//拦截对象
	var Intercepts = {
		//before
		before : function(me, func, context) { //源函数、拦截函数都是同步的
		    return function(){
		        var args = Array.prototype.slice.call(arguments);
		        var param = new ParamObj(args);
		        if(func.call(context, param) === false) return false;
		        return me.apply(context, args);
		    }
		},
		beforeAsync : function(me, func, context) {//源函数是同步的，拦截函数是异步的
			return function(){
				var args = Array.prototype.slice.call(arguments),
					callback = function(){ me.apply(context, args); },
					param = new ParamObj(args, void 0, callback);
				return func.call(context, param);
			}
		},
		after : function(me, func, context) { //源函数、拦截函数都是同步的 //可以修改返回值
		    return function(){
		        var args = Array.prototype.slice.call(arguments),
		        	ret = me.apply(context, args),
					param = new ParamObj(args, ret);

		        func.call(context, param);
		        return param.result;
		    }
		},
		afterAsync : function(me, func, context) { //源函数是同步的，拦截函数是异步的 //不能修改返回值
			return function(){
		        var args = Array.prototype.slice.call(arguments),
			        ret = me.apply(context, args),
					param = new ParamObj(args, ret);
		        func.call(context, param);
		        return ret;
		    };
		},
		asyncAfter : function(me, func, context, cb_index) { //源函数是异步的，拦截函数是同步的 //源的最后一个参数必须是回调函数
			return function(){
				var args = Array.prototype.slice.call(arguments);
				if(typeof(cb_index) === 'undefined'){
					cb_index = args.length - 1;
				}
				var callback = args[cb_index]; //最后一个参数是回调函数
				if(isFunction(callback)){
					args[cb_index] = function(){
						var param = Array.prototype.slice.call(arguments);
						var arg = new ParamObj(param, void 0, void 0, args);
						if(false !== func.call(context, arg)){
							callback.apply(context, param);
						}
						delete arg.context;//释放循环
					}
				}
				return me.apply(context, args);
			}
		},
		asyncAfterAsync : function(me, func, context, cb_index) { //源函数、拦截函数都是异步的 //源的最后一个参数必须是回调函数
			return function(){
				var args = Array.prototype.slice.call(arguments);
				if(typeof(cb_index) === 'undefined'){
					cb_index = args.length - 1;
				}
				var callback = args[cb_index]; //最后一个参数是回调函数
				if(isFunction(callback)){
					args[cb_index] = function(){
						var param = Array.prototype.slice.call(arguments),
							innerCallback = function(){ callback.apply(context, param); };
						var arg = new ParamObj(param, void 0, innerCallback, args);
						func.call(context, arg);
					}
				}
				return me.apply(context, args);
			}
		},

		//exception
		exception : function(me, exp,context){ //源是同步的
			return function(){
				try{
					var args = Array.prototype.slice.call(arguments);
					return me.apply(context, args);
				} catch(e){
					var param = new ParamObj(args);
					param.exception = e;
					exp.call(context, param);
				}
			}
		},
		exceptionAsync : function(me, exp,context, cb_index){ //源是异步的
			return function(){
				try{
					var args = Array.prototype.slice.call(arguments);
					if(typeof(cb_index) === 'undefined'){
						cb_index = args.length - 1;
					}
					var callback = args[cb_index]; //最后一个参数是回调函数
					if(isFunction(callback)){
						args[cb_index] = function(){
							var innerargs = Array.prototype.slice.call(arguments);
							try{
								callback.apply(context, innerargs);
							} catch (ex){
								var Param = new ParamObj(innerargs);
								Param.exception = ex;
								Param.type = 'inner';
								exp.call(context, Param);
							}
						}
					}
					return me.apply(context, args);
				} catch(e){
					var Param = new ParamObj(args);
						Param.exception = e;
						Param.type = 'outer';
					exp.call(context, Param);
				}
			}
		}
	};
	Intercepts.asyncBefore = Intercepts.before;  //源函数是异步的，拦截函数是同步的
	Intercepts.asyncBeforeAsync = Intercepts.beforeAsync; //源函数、拦截函数都是异步的

	exports.zAOP = window.zAOP = {
		//源函数是同步的，拦截函数是同步的
		intercept_s_s : function(methods, interceptor, context){
			AOP(methods, interceptor, context, {
				before : Intercepts.before,
				after : Intercepts.after,
				exception : Intercepts.exception
			});
		},
		//源函数是同步的，拦截函数是异步的
		intercept_s_a : function(methods, interceptor, context){
			AOP(methods, interceptor, context, {
				before : Intercepts.beforeAsync,
				after : Intercepts.afterAsync,
				exception : Intercepts.exception
			});
		},
		//源函数是异步的，拦截函数是同步的
		intercept_a_s : function(methods, interceptor, context, cb_index){ //
			AOP(methods, interceptor, context, {
				before : Intercepts.asyncBefore,
				after : Intercepts.asyncAfter,
				exception : Intercepts.exceptionAsync
			}, cb_index);
		},
		//源函数是异步的，拦截函数是异步的
		intercept_a_a : function(methods, interceptor, context, cb_index){ //
			AOP(methods, interceptor, context, {
				before : Intercepts.asyncBeforeAsync,
				after : Intercepts.asyncAfterAsync,
				exception : Intercepts.exceptionAsync
			}, cb_index);
		}
	};
})(qv.zero);