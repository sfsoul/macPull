/**
 * 通用的回调处理类
 * @class qv.zero.CallBack
 * @author payneliu
 * @version 6.0.2
 * @date 2017-12-04
 * @name qv.zero.CallBack
 * @namespace qv.zero
 */
(function(exports){
	//通用回调管理函数
	function CallBack(){
		if(!(this instanceof CallBack)){
			return new CallBack();
		}
	    this._cbs = [];
	    this._execute = false;
	    this._ispause = false;
	}
	CallBack.prototype.execute = function(args){
	    var func;
	    args = this._execute ? this._param : (this._param = args);
	    if(!this._ispause){ //暂停
			while(func = this._cbs.shift()){
				func(args);
			}
	    }
	    this._execute = true;
	};
	CallBack.prototype.add = function(funx){
	    if(this._execute){
	        var arg = this._param;
	        setTimeout(function(){funx(arg);}, 0);
	    } else {
	        this._cbs.push(funx);
	    }
	    return this;
	};
	/**
	* 去掉回调
	*/
	CallBack.prototype.remove = function(funx){
		var func, index = 0;
		while(func = this._cbs[index]){
			if(!funx || funx === func){
				this._cbs.splice(index, 1);
			} else {
				index++;
			}
		}
	};
	/**
	* 暂停
	*/
	CallBack.prototype.pause = function(){
		this._ispause = true;
	};
	/**
	* 继续 恢复
	*/
	CallBack.prototype.resume = function(){
		this._ispause = false;
		if(this._execute){
			this.execute();
		}
	};


	/**
	* 所有的回调都执行完成才 执行回调
	*/
	CallBack.all = function(cbs, funx){
		var len = cbs && cbs.length, list, count = 0, ret_cb = new CallBack();
		if(len){
			list = [];
			for(var i = 0, cb; cb = cbs[i]; i++){
				cb.add(dealcallback(i));
			}
		}
		function dealcallback(index){
			return function(data){
				list[index] = data;
				count++;
				if(count >= len){
					/*jshint expr:true*/
					funx && funx.apply(null, list);
					ret_cb.execute(list);
				}
			};
		}
		return ret_cb;
	};
	/**
	* 只要有一个 回调执行完成就执行 回调
	*/
	CallBack.any = function(cbs, funx){
		var len = cbs && cbs.length, isfinish = false, ret_cb = new CallBack();
		if(len){
			for(var i = 0, cb; cb = cbs[i]; i++){
				cb.add(dealcallback(i));
			}
		}

		function dealcallback(index){
			return function(data){
				if(!isfinish){
					isfinish = true;
					/*jshint expr:true*/
					funx && funx.call(null, data, index);
					ret_cb.execute({data : data, index : index});
				}
			};
		}
		return ret_cb;
	};

	exports.CallBack = CallBack; //通用回调管理函数
}(qv.zero));
