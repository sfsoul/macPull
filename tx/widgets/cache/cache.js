/**
* zero的缓存组件
* @author payneliu
* @required zepto
* @date 2015-08-24 09:57:38
* 使用方法：
* qv.zero.cache.add('mycache', [1,2,3], 1000 * 3600 * 24) //添加缓存
* qv.zero.cache.get('mycache') //获取缓存
* qv.zero.cache.onchange(function(){}); //变更时触发
* qv.zero.cache.onchange('mycache', function(){}); //变更时触发
* qv.zero.cache.oncechange(function(){}); //变更时触发 只会执行一次
* qv.zero.cache.oncechange('mycache', function(){}); //变更时触发 只会执行一次
* qv.zero.cache.onexpires(function(){}); //过期时触发
**/
(function(exports){
	/**
	* 缓存管理
	* 事件：过期、变更
	*/
	function CacheManager(storage, ec){
		this.Storage = storage;
		this.EC = ec;
	};
	CacheManager.prototype.add = function(key, val, stamp, comp) {
		var value = this.Storage.getItem(key), ovalue, obj;
		var status = 0;//0:初始，1：变化，2：存在一样的
		if(value){
			obj = JSON.parse(value);
			ovalue = !obj ? null : obj.v;
			if(!comp || !comp(ovalue, val)){ //变更
				status = 1;
			} else {
				status = 2;
			}
		}
		if(status < 2){
			obj = {v: val};
			if(stamp > 0){
				obj.exp = (+new Date()) + (+stamp);
			}
			value = JSON.stringify(obj);
			this.Storage.setItem(key, value);
			var isinit = status === 0;
			this.EC.trigger(key + '_change', {oval: ovalue, nval : val, isinit : isinit});
			this.EC.trigger(       'change', {oval: ovalue, nval : val, isinit : isinit});
		}
	};
	CacheManager.prototype.get = function(key, defaultval) {
		var value = this.Storage.getItem(key), nt = +new Date;
		var obj = JSON.parse(value);
		if(!obj) return defaultval;
		if(nt > obj.exp){ //过期
			this.EC.trigger(key + '_expires', {val : obj.v});
			this.EC.trigger('expires', {val : obj.v});
			this.Storage.setItem(key, null);
			return defaultval;
		}
		return obj.v !== void 0 ? obj.v : defaultval;
	};
	CacheManager.prototype.onchange = function(key, handle){
		var params = convertKey(key, 'change', handle);
		params && this.EC.on(params.key, params.handle);
	};
	CacheManager.prototype.oncechange = function(key, handle){
		var params = convertKey(key, 'change', handle);
		params && this.EC.once(params.key, params.handle);
	};
	CacheManager.prototype.offchange = function(key, handle){
		var params = convertKey(key, 'change', handle);
		params && this.EC.off(params.key, params.handle);
	};
	CacheManager.prototype.onexpires = function(key, handle){
		var params = convertKey(key, 'expires', handle);
		params && this.EC.on(params.key, params.handle);
	};
	CacheManager.prototype.onceexpires = function(key, handle){
		var params = convertKey(key, 'expires', handle);
		params && this.EC.once(params.key, params.handle);
	};
	CacheManager.prototype.offexpires = function(key, handle){
		var params = convertKey(key, 'expires', handle);
		params && this.EC.off(params.key, params.handle);
	};
	/**
	* 转换key名称
	*/
	function convertKey(key, evname, handle){
		var type = typeof key;
		if(type === 'function'){
			return {
				key : evname,
				handle : key
			};
		} else if(type === 'string'){
			return {
				key : !!key ? (key + '_' + evname) : evname,
				handle : handle
			};
		}
		return {key : evname};
	}
	/**
	* 存储管理
	*/
	function LocalStorage(){
		return {
			getItem : function(key){
				try{
					return localStorage.getItem(key);
				} catch(e){
					return null;
				}
			},
			setItem : function(key, val){
				try{
					return localStorage.setItem(key, val);
				} catch(e){
					return null;
				}
			}
		}
	};
	/**
	* cookie
	*/
	function CookieStorage(){
		return {
			getItem : function(key){
				return localStorage.getItem(key);
			},
			setItem : function(key, val){
				return localStorage.setItem(key, val);
			}
		}
	}
	/**
	* 事件中心
	*/
	function EventCenter(){
		var Events = [];
		return {
			on : function(key, handle){
				(Events[key] || (Events[key] = [])).push(handle);
			},
			off : function(key, handle){
				if(handle){
					var handles = Events[key];
					if(handles){
						Events[key] = handles.filter(function(i, j){ return i !== handle });
					}
				} else {
					Events[key] = null;
					delete Events[key];
				}
			},
			trigger : function(key, args){
				var handles = Events[key];
				if(handles){
					var func;
					handles = [].concat(handles);
					for(var i = 0, len = handles.length; i < len; ++i){
						func = handles[i];
						if(func && false === func(args)){
							break;
						}
					}
				}
			},
			once : function(key, handle){
				var me = this;
				function temp(args){
					var ret = handle(args);
					me.off(key, temp);
					return ret;
				}
				this.on(key, temp);
			}
		}
	}

	exports.cache = new CacheManager(LocalStorage(), EventCenter());
	exports.EventCenter = EventCenter;
	window.zCache = exports.cache;

})(qv.zero);