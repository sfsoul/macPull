/*
* SetOnCloseHandler.js
* 手Q左上角返回事件管理模块 qv.zero.SetOnCloseHandler
* 依赖 qv.zero.CallBack
* name : string 自定义事件名（同名则执行最高优先级）
* level : int 优先级（数字越小优先级越高，最终只执行优先级最高的事件）
* handler ：function 回调函数（业务处理退出时必须执行实例.done(); ）
*
* 使用实例 ：
* var soch = new qv.zero.SetOnCloseHandler({ 'name':'popDialog', 'level':1000, 'handler': function(){
* 	setTimeout(function(){
* 		alert('我执行了5秒');
* 		soch.done();
* 	},5000);
* }});
*/
;(function(exports){
	var allCloseHandler = exports.allCloseHandler = exports.allCloseHandler || {};
	function SetOnCloseHandler(params){
		var me = this;
		var level = +params.level;
		var name = params.name || 'default';
		if(isNaN(level) || typeof params.handler != 'function' ){ return; }
		if( !allCloseHandler[name] || $.type(allCloseHandler[name])!='object' ){ allCloseHandler[name]={}; }
		this.cb = new qv.zero.CallBack();
		allCloseHandler[name][level] = (function(){
			params.handler();
			return me.cb;
		});
	}
	SetOnCloseHandler.prototype.done = function(){
		this.cb.execute();
	}
	SetOnCloseHandler.clicked = false;
	//bind Handler
	page.addReadyFire(function(){
		exports.mqq_ui_setOnCloseHandler = exports.mqq_ui_setOnCloseHandler || mqq.ui.setOnCloseHandler;
		mqq.ui.setOnCloseHandler = function( cb ){ console.log('请用qv.zero.SetOnCloseHandler注册事件');console.log(cb); }
		exports.mqq_ui_setOnCloseHandler(function(){
			if( exports.SetOnCloseHandler.clicked ){
				return;
			}
			exports.SetOnCloseHandler.clicked = true;
			try{
				var allFunc = [];
				$.each( allCloseHandler , function(index,item){
					allFunc.push( item[+( Object.keys(item).sort(function(a,b){return a-b}) )[0]] )
				});
				allCloseHandler = {};//reset
				qv.zero.CallBack.all( allFunc.map(function(func){ return func() }) , function(){
					//判断是否还有新注册事件，如果没有则退出
					$.isEmptyObject(allCloseHandler) &&	mqq.ui.popBack();
					exports.SetOnCloseHandler.clicked = false;
				});
			}catch(e){
				mqq.ui.popBack();
			}
		});
	});
	exports.SetOnCloseHandler = SetOnCloseHandler;
})(qv.zero);