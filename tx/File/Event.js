/**
 * 通用的事件处理类
 * @class qv.zero.Event
 * @author payneliu
 * @version 6.0.2
 * @date 2017-12-04
 * @name qv.zero.Event
 * @namespace qv.zero
 */
(function(exports){
	//通用的事件对象
	function EventObj(){
		if(!(this instanceof EventObj)){
			return new EventObj();
		}
		this.$event = {};
	}
	//绑定事件
    EventObj.prototype.on = function(key, handle){
		(this.$event[key] || (this.$event[key] = [])).push(handle);
		return this;
    };
    //注销事件
    EventObj.prototype.off = function(key, handle){
        if(key && handle){
            var handles = this.$event[key];
            if(handles){
                this.$event[key] = handles.filter(function(i, j){ return i !== handle; });
            }
        } else if(key) {
            this.$event[key] = null;
            delete this.$event[key];
        } else {
            this.$event = {};
		}
		return this;
    };
    //触发事件
    EventObj.prototype.emit = function(key){
        var handles = this.$event[key];
        if(handles){
            var func;
            handles = [].concat(handles);
            for(var i = 0, len = handles.length; i < len; ++i){
                func = handles[i];
                if(func && false === func.apply(this, [].slice.call(arguments, 1))){
                    break;
                }
            }
		}
		return this;
    };
    //仅触发一次事件
    EventObj.prototype.once = function(key, handle){
        function temp(){
            var ret = handle.apply(this, arguments);
            this.off(key, temp);
            return ret;
        }
        return this.on(key, temp);
	};
	//附加事件对象
	EventObj.attach = function(obj){
		var evobj = new EventObj();
		obj.on = function(key, handle){ evobj.on(key, handle && handle.bind && handle.bind(obj)) };
		obj.off = function(key, handle){ evobj.off(key, handle && handle.bind && handle.bind(obj)) };
		obj.once = function(key, handle){ evobj.once(key, handle && handle.bind && handle.bind(obj)) };
		obj.emit = function(){ evobj.emit.apply(evobj, arguments) };
		// ['on', 'off', 'emit', 'once'].forEach(function(k){
		// 	obj[k] = function(){
		// 		return evobj[k].apply(evobj, arguments);
		// 	};
		// });
		return evobj;
	}
	exports.Event = EventObj;
}(qv.zero));
