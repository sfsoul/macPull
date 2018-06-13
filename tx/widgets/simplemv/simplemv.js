;(function(exports, $) {
	function ctor(){}
	function mix(target, source){//混入
		if(source){
			for(var i in source){
				if(source.hasOwnProperty && source.hasOwnProperty(i)){
					target[i] = source[i];
				}
			}
		}
	}
	var eventSpliter = /^(\S+)\s*(.*)$/;
	function bind(func, context){
		if(Function.prototype.bind){
			return func.bind(context);
		} else {
			return function(){
				func.apply(context, arguments);
			};
		}
	}
	function ViewBase(cfg){
		this.cid =  ViewBase.uiq ? ++ViewBase.uiq : (ViewBase.uiq = 1);
		this.EventNS = '.delegateEventsview' + this.cid; //事件命名空间
		this.cfg = $.extend({}, this.cfg || {}, cfg);
		this.el = this.cfg.el;
		this.setContainer(this.el, false);
		this.initialize.apply(this, arguments);
		this.bindEvent();
	}
	mix(ViewBase.prototype, {
		render : function(){return this;},
		initialize : function(){}, //初始化函数
		bindEvent : function(events){ //绑定事件
			if(!(events = (events || this.events))){
				return ;
			}
			this.unbindEvent();
			var method, match, eventName, selector;
			for(var key in events){
				method = events[key];
				if(!$.isFunction(method)){
					method = this[method];
				}
				if(!method){
					continue;
				}
				match = key.match(eventSpliter);
				if(match && match.length > 1){
					eventName = match[1];
					selector = match[2];

					method = bind(method, this);
					eventName += this.EventNS;
					if(selector){
						this.$el.delegate(selector, eventName, method);
					} else {
						this.$el.on(eventName, method);
					}
				}
			}
		},
		unbindEvent : function(){ //取消绑定事件
			this.$el.off(this.EventNS);
		},
		setContainer : function (el, bindevent) {
			if(this.$el){
				this.unbindEvent();
			}
			this.$el = (el instanceof $) ? el : $(el);
			this.el = this.$el[0];
			if(bindevent !== false){
				this.bindEvent();
			}
			return this;
		}
	});
	
	function DBBase(cfg){ //获取数据的基类
		if(arguments.length == 2){
			var pid = arguments[0], tableid = arguments[1];
			var data = (window['AMD_' + pid] || {form : []}).form[tableid];
            cfg = {'data' : data};
		}
		this.Data = cfg.data || [];
		this.initialize.apply(this, arguments);
	}
	mix(DBBase.prototype, {
		initialize : function(){ },
		getData : function(){
			return this.Data;
		},
		getLength : function(){
			return this.Data.length;
		},
		filter : function(func){
			if(!this.Data || !this.Data.filter) return [];
			return this.Data.filter(func);
		},
		filterData : function(key, val){ //过滤数据
			return this.filter(function(item){
				return item && item[key] === val;
			});
		},
		groupBy : function(iteratee){ //分组数据
			var group = {}, item, key;
			for (var i = 0, len = this.Data.length; i < len; i++) {
				item = this.Data[i];
				key = iteratee(item);
				(group[key] || (group[key] = [])).push(item);
			};
			return group;
		},
		map : function(func){
			return (this.Data && this.Data.map && this.Data.map(func)) || [];
		},
		each : function(func){
			this.Data && this.Data.forEach && this.Data.forEach(func);
		},
		top : function(num){
			return this.page(0, num);
		},
		order : function(func){
			var tempData = [].concat(this.Data);
			if(func){
				return tempData.sort(func);
			} else {
				return tempData.sort();
			}
		},
		exist : function(func){
			if(!this.Data || !this.Data.some) return false;
			return this.Data.some(func);
		},
		frist : function(func){
			return this.filter(func)[0];
		},
		page : function(offset, length){
			return this.Data.slice(offset,offset + length);
		},
		pageloop : function(offset, length){
			var end = offset + length, len = this.Data.length;
			if(end < len){
				return this.Data.slice(offset,end);
			} else {
				return [].concat(this.Data).concat(this.Data).slice(offset,end);
			}
		},
		valuesByKey : function(key){
			var ret = [];
			this.map(function(i){ ret.push(i[key]); });
			return ret;
		},
		keyvalueswap : function(data){
			var ret = {};
			for (var i = data.length - 1; i >= 0; i--) {
				ret[data[i]] = i;
			};
			return ret;
		},
		orderBy : function(getvalue, calc){
			var len = this.Data.length, tempArr = [], arr2= [];
			calc = calc || function(a){return a};
			for (var i = 0; i < len; i++) {
				tempArr[i] = {val : calc(getvalue(this.Data[i])), index : i};
			};
			tempArr.sort(function(a,b){return a.val - b.val});
			for (var i = 0; i < len; i++) {
				arr2[i] = this.Data[tempArr[i].index];
			};
			this.Data = arr2;
			// this.Data.sort(function(a,b){
			// 	return calc(getvalue(a)) - calc(getvalue(b));
			// });
		},
		/**
		* getvalue : 获取每一项要比较的值
		* list: 要参考的列表
		*/
		orderByArray : function(getvalue, list){
			var ret = {}; //keyvalueswap
			for (var i = list.length - 1; i >= 0; i--) {
				ret[list[i]] = i;
			};
			function calc(a){
				return ret[a] || -1;
			}
			this.orderBy(getvalue, calc);
		},
		sum : function(getvalue){
			return this.Data.reduce(function(i,j){return i + getvalue(j)}, 0);
		}
	});

	DBBase.extend = ViewBase.extend = function(proto){
		var parent = this, child;
		if(proto.hasOwnProperty('constructor') && typeof proto.constructor === 'function'){
			child = proto.constructor;
		} else {
			child = function (){
				parent.apply(this, arguments);
			}
		}
		ctor.prototype = parent.prototype;
		child.prototype = new ctor();
		mix(child.prototype, proto);
		child.prototype.constructor = child;
		child.extend = parent.extend;
		child.__base = parent;
		return child;
	};

	exports.ViewBase = ViewBase;
	exports.DBBase = DBBase;
}(qv.zero, Zepto));