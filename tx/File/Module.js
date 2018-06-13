/**
 * 通用的模块加载类
 * @class qv.zero.Module
 * @author payneliu
 * @version 6.0.2
 * @date 2018-01-04
 * @name qv.zero.Module
 * @namespace qv.zero
 */
(function (exports) {
    var uuid = +new Date(); //全局版本
    /**
     * 获取系统配置的版本号
     * @returns exports.CallBack
     */
    function getSystemVersionMap() {
        var url = 'https://i.gtimg.cn/ACT/vip_act/act_data/253685.json.js?t=' + uuid; //缓存
        var versionCB = new exports.CallBack();
        load([url])[0].add(function () {
            var data = window.AMD_253685.form[1], versionmap = {};
            if (data && data.length) {
                data.forEach(function (i, j) {
                    versionmap[i.package_name] = i.version;
                });
            }
            versionCB.execute($.extend(versionmap, exports.versionmap));
        });
        return versionCB;
    }

    getSystemVersionMap(); //预热 不阻塞页面展示

    /**
     * 获取组件的加载地址
     * @param {Array} modules 模块列表 格式：['a','b'] 或者 ['a-1.0.0','b-1.2.0'] 或者 'a-1.0.0' 或者 'a' 或者 'a-0'
     * 其中（为了兼容现有的使用习惯）：
     * 'a-0'     表示加载不带版本号的版本
     * 'a-1.0.0' 表示加载版本号为1.0.0的版本
     * 'a'       表示加载最新的版本
     * @param {Object} options domain:域名  path: 组件的路径, combo: 是否合并加载 默认false
     * @returns exports.CallBack
     */
    function getUrls(modules, options) {
        var nmodules = [].concat(modules), cb, verMapCB = new exports.CallBack(), cmpReg = /^\w+$/, needvm = false;
        for (var i = 0, len = nmodules.length; i < len; ++i) {
            if (typeof nmodules[i] === 'string' && cmpReg.test(nmodules[i])) {
                needvm = true;
                break;
            }
        }
        if (needvm) { //需要加载版本文件
            cb = getSystemVersionMap();
        } else {
            cb = new exports.CallBack();
            cb.execute({});
        }
        cb.add(function (versionmap) {
            var urls = [], otherUrls = [], item, domain = options.domain, path = options.path, combo = options.combo, res = [], verReg = /^(\w+)-([\d|.]+)$/;
            for (var i = 0, len = nmodules.length; i < len; ++i) {
                item = nmodules[i];
                if (typeof item === 'string') {
                    if (cmpReg.test(item)) {
                        urls.push(path + item.toLocaleLowerCase() + '/' + item + (versionmap[item] ? ('-' + versionmap[item]) : '') + '.js');
                    } else if (verReg.test(item)) {
                        var mod = RegExp.$1, version = (RegExp.$2 === '0' ? 0 : RegExp.$2);
                        urls.push(path + mod.toLocaleLowerCase() + '/' + mod + (version ? ('-' + version) : '') + '.js');
                    } else {
                        otherUrls.push(item);
                    }
                }
            }
            if (combo && urls.length > 1) {
                res.push(domain + '/c/=' + urls.join(',') + '?max_age=86400000')
            } else if (urls.length) {
                for (var i = 0; i < urls.length; i++) {
                    item = urls[i];
                    res.push(domain + item);
                }
            }
            otherUrls.length && (res = res.concat(otherUrls));
            verMapCB.execute(res); //所有url
        });
        return verMapCB;
    }
    /**
     * 加载js文件
     * @param {String} url 
     * @param {Function} callback 
     * @param {String} charset 
     * @param {Function} errCallback 
     */
    function loadScript(url, callback, charset, errCallback) {
        if(!url || !url.replace) return; //防御措施
		if( typeof callback == 'string') {
			charset = callback;
			callback = function(){};
		}
		var sc = document.createElement("script"), head = document.getElementsByTagName("head")[0];
		sc.setAttribute("charset", charset || "utf-8");
        sc.src = ZProtoAdapter.url(url); //适配url
		sc.onload = function() {
			/*jshint expr:true */
			callback && callback();
			head.removeChild(sc);
		};
        /*jshint expr:true */
        errCallback && (sc.onerror = function(){
            errCallback();
            head.removeChild(sc);
        });
		head.appendChild(sc);
    }

    /**
     * 加载文件
     * @param {Array} urls 路径
     * @param {Object} config 配置信息
     */
    function load(urls, config) {
        var cache = load.cache || (load.cache = {});
        var url, cbs = [];
        config = config || {};
        for (var i = 0, len = urls.length; i < len; ++i) {
            url = urls[i];
            if (!cache[url]) {
                cache[url] = new exports.CallBack();
                !function (cb) {
                    loadScript(url,
                        function () { cb.execute(true); }, //加载完成
                        config.charset,
                        function () { cb.execute(false); } //加载失败
                    )
                }(cache[url]);
            }
            cbs.push(cache[url]);
        }
        return cbs;
    }

    /**
     * 加载组件
     * @param {Array} modules 
     * @param {Function} fncontext 
     * @param {Object} config 
     * 默认的域名与组件路径
     * widgetDomain: 'i.gtimg.cn',
	 * widgetPath: '/club/common/lib/zero/widgets',
     */
    function require(modules, fncontext, config) {
        config = config || {};
        var cb = getUrls(modules, config);
        var ret_cb = new exports.CallBack();
        cb.add(function (urls) {
            var cbs = load(urls, config);
            if (cbs.length === 1) {
                cbs[0].add(execute);
            } else if (cbs.length > 1) {
                exports.CallBack.all(cbs, execute);
            } else {
                //没有组件
                execute(false);
            }
        });
        return ret_cb;
        //执行结果
        function execute() {
            var args = [].slice.call(arguments), success = args[0];
            for (var i = 1; i < args.length; i++) {
                success = (success && args[i]);
                if (!success) break;
            }
            if (success) {
                fncontext && fncontext(args);
            } else {
                config.onerror && config.onerror();
            }
            ret_cb.execute(success);
        }
    }
    //是否函数
    function isFunction(data) {
        return Object.prototype.toString.call(data) === '[object Function]';
    }
    //执行模块
    function execModule(modname, modules, factory, options){
        modules = [].concat(modules);
        if(modules.length){
            var modu = new Module(modname);
            modules.forEach(function (mod) { modu.addDep(mod) });
            modu.factory = factory;
            modu.exec(options);
        }
    }

    Module.NONE = 0; //0：未加载
    Module.CACHED = 1; //1：缓存数据
    Module.DEPLOADED = 2; //2：依赖加载完成
    Module.EXECUTED = 3; //3：执行完成
    //默认配置
    var defaultOptions = {
        charset: 'utf-8',
        domain: 'https://i.gtimg.cn',
        path: '/club/game/zero/widgets/',
        combo: false
    }, currentOptions = $.extend({}, defaultOptions);

    /**
     * 模块类
     * @param {string} name 模块名称
     */
    function Module(name) {
        this.name = name;
        this.factory = null;
        this.callback = null;
        this.status = Module.NONE; //0未加载；1：缓存数据；3：依赖加载完成；4：执行完成
        this._deps = [];
        this.exports = null; //模块的输出
    }

    $.extend(Module.prototype, {
        //添加依赖
        addDep: function (modname) {
            this._deps.push(modname);
        },
        require: function (options) {
            if (!this.callback) {
                var _deps = this._deps.filter(function(mod){ return !Module.has(mod); }),  //过滤没有路径的模块
                    dep = require(_deps, null, options), //加载依赖
                    cb = this.callback = new exports.CallBack(), that = this;
                dep.add(function () {
                    that.status = Module.DEPLOADED; //依赖加载完成
                    //获取依赖模块的输出
                    var args = that._deps.map(function (mod) { return Module.get(mod).exports });
                    cb.execute(args);
                });
            }
            return this.callback;
        },
        exec: function (options) {
            var that = this;
            this.require(options).add(function (args) {
                that.factory && (that.exports = that.factory.apply((options || {}).scope, args));
                that.status = Module.EXECUTED; //执行完成
            });
        }
    });
    Module.loadScript = loadScript;
    //预加载
    Module.preload = function (func) {
        var preload = currentOptions.preload || [];
        if (preload.length) {
            execModule('preloadModule', preload, func, currentOptions);
        } else {
            func && func();
        }
    };
    //配置加载器
    Module.config = function (options) {
        $.extend(currentOptions, options);
    };
    //加载
    Module.require = function (modname, funx, options) {
        modname = [].concat(modname);
        if (!isFunction(funx)) {
            options = funx;
            funx = null;
        }
        execModule('tempModule', modname, funx, $.extend({}, currentOptions, options));
    };
    //是否有模块
    Module.has = function(modname){
        var cache = Module._modCache || (Module._modCache = {});
        return !!cache[modname];
    };
    //获取模块
    Module.get = function (modname) {
        var cache = Module._modCache || (Module._modCache = {});
        if (!cache[modname]) {
            cache[modname] = new Module(modname);
        }
        return cache[modname];
    };
    //定义模块
    Module.define = function (modname, deps, factory, options) {
        if (arguments.length < 3) {
            throw 'argument is error';
        }
        var mod = Module.get(modname);
        if (mod.status < Module.CACHED) {
            //初始化数据
            [].concat(deps).forEach(function (dep) {
                mod.addDep(dep);
            });
            mod.factory = factory;
            mod.status = Module.CACHED;
            mod.exec($.extend({}, currentOptions, options));
        } else {
            throw 'module:' + modname + ' already define';
        }
    };
    //加载组件
    Module.use = function (modname, funx, options) {
        modname = [].concat(modname);
        if (!isFunction(funx)) {
            options = funx;
            funx = null;
        }
        Module.preload(function () {
            execModule('tempModule', modname, funx, $.extend({}, currentOptions, options));
        });
    }
    qv.zero.Module = Module;
}(qv.zero));
