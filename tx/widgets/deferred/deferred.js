(function(exports){
    function mix(d, s){
        for(var o in s){
            if(s.hasOwnProperty(o)){
                d[o] = s[o];
            }
        }
    }

    function Promise(){
        this._resolves = [];
        this._rejects = [];
        this._readyState = Promise.PENDING;
        this._data = null;
        this._reason = null;
    }

    mix(Promise.prototype, {
        then : function(onFulfilled, onRejected){
            var deferred = new Defer();

            function fulfill(data){
                var ret = onFulfilled ? onFulfilled(data) : data;
                if(Promise.isPromise(ret)){
                    ret.then(function(data){
                        deferred.resolve(data);
                    });
                } else {
                    deferred.resolve(ret);
                }
                return ret;
            }

            if(this._readyState === Promise.PENDING){
                this._resolves.push(fulfill);
                if(onRejected) {
                    this._rejects.push(onRejected);
                } else {
                    this._rejects.push(function(reason){
                        deferred.reject(reason);
                    });
                }
            } else if(this._readyState === Promise.FULFILLED){
                var self = this;
                setTimeout(function(){
                    fulfill(self._data);
                });
            }
            return deferred.promise;
        },
        otherwise : function(onRejected){
            return this.then((void 0), onRejected);
        }
    });

    mix(Promise, {
        PENDING : 0,
        FULFILLED : 1,
        REJECTED : 2,
        isPromise : function(obj){
            return obj != null && typeof(obj['then']) === 'function';
        }
    });

    function Defer(){
        this.promise = new Promise();
    }
    
    mix(Defer.prototype, {
        resolve : function(data){
            var promise = this.promise;
            if(promise._readyState != Promise.PENDING){
                return;
            }
            promise._readyState = Promise.FULFILLED;
            promise._data = data;
            for(var i = 0, item = null; item = promise._resolves[i]; i++){
                item(data);
            }
        }, 

        reject : function(reason){
            var promise = this.promise;
            if(promise._readyState != Promise.PENDING){
                return;
            }
            promise._readyState = Promise.REJECTED;
            promise._reason = reason;
            var handler = promise._rejects[0];
            if(handler){
                handler(reason);
            }
        }
    });

    exports.Defer = {
        defer : function(func){
            if(typeof func === 'function'){
                var defer = new Defer(); 
                func.apply(0, [defer].concat(arguments.slice(1)));
                return defer.promise;
            } else {
                return new Defer(); 
            }
        },
        all : function(promises){
            var deferred = exports.Defer.defer(),
            n = 0, result = [];
            for(var i = 0, promise = null; promise = promises[i]; i++){
                (function(j){
                    promise.then(function(ret){
                        result[j] = ret;
                        n++;
                        if(n >= promises.length){
                            deferred.resolve(result);
                        }
                    });
                })(i);
            }
            return deferred.promise;
        },
        any : function(promises){
            var deferred = exports.Defer.defer();
            for(var i = 0, promise = null; promise = promises[i]; i++){
                promise.then(function(ret){
                   deferred.resolve(ret);
                });
            }
            return deferred.promise;
        }
    };

    if(!window.zDefer){
        window.zDefer = exports.Defer;
    }

    /*
        在zHttp对象中添加了 send_with_deferred、request_with_deferred、syrequest_with_deferred 等方法
        目的是让zHttp里面的方法 支持 Deferred. 方便比较复杂的回调的情况下使用
        例子：
        zHttp.syrequest_with_deferred(42105).then(function(json){
            //....
        })
        //多个回调的串行的例子：
        zHttp.syrequest_with_deferred(42105)
        .then(function(json){ return zHttp.syrequest_with_deferred(42106); })
        .then(function(){
            //..
        })
        //多个回调的并行的例子：
        var defers = [zHttp.syrequest_with_deferred(42105), zHttp.syrequest_with_deferred(42106), zHttp.syrequest_with_deferred(42107)];
        zDefer.all(defers) //所有的
              .then(function(data){
                
              });
        or:
        zDefer.any(defers)
              .then(function(data){
                
              });
    */
    if(window.zHttp){
        zHttp.send_with_deferred = function (url) {
            var deferred = new Defer();
            zHttp.send(url, function (data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        };
        zHttp.request_with_deferred = function (args, showRightBtn) {
            var deferred = new Defer();
            zHttp.request(args, function (data) {
                deferred.resolve(data);
            }, showRightBtn);
            return deferred.promise;
        };
        zHttp.syrequest_with_deferred = function (args, showRightBtn) {
            var deferred = new Defer();
            zHttp.syrequest(args, function (data) {
                deferred.resolve(data);
            }, showRightBtn);
            return deferred.promise;
        };
    }

    if(window.zUtil){
        zUtil.require_with_deferred = function(url){
            var deferred = new Defer();
            zUtil.require(url, function (data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        };
    }
}(qv.zero));
