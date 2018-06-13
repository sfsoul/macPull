(function (exports) {
    var _private = {};
    _private.sn = 'propmall_';

    _private.getName = function (name, category, type) {
        return 'propmall_&' + escape(category || 'normal') + '&' + escape(name) + (type ? '&' + escape(type) : '');
    };

    _private.getLocalStorage = function (name, category) {
        try {
            var value = window.localStorage.getItem(_private.getName(name, category));
            var info = JSON.parse(window.localStorage.getItem(_private.getName(name, category, 'info')));

            window.localStorage.setItem(_private.getName(name, category, 'info'), JSON.stringify({
                time: ( info && parseInt(info.time)) || new Date().getTime(),
                count: ((info && parseInt(info.count)) || 0) + 1
            }));
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    };

    _private.setLocalStorage = function (name, value, category) {

        //如果value为null，则删除该键值
        //Example:cache.set('dirtydata', null);
        if (value === null) {
            window.localStorage.removeItem(_private.getName(name, category));
            window.localStorage.removeItem(_private.getName(name, category, 'info'));
            return;
        }

        var json = JSON.stringify(value);

        try {
            window.localStorage.setItem(_private.getName(name, category), json);
            window.localStorage.setItem(_private.getName(name, category, 'info'), JSON.stringify({
                time: new Date().getTime(),
                count: 0
            }));
        } catch (e) {
            return false;
        }
        return true;
    };

    _private.getLocalStorageTime = function (name, category) {
        try {
            var info = JSON.parse(window.localStorage.getItem(_private.getName(name, category, 'info')));
            return (info && parseInt(info.time)) || 0;
        } catch (e) {
            return 0;
        }
    };

    _private.getLocalStorageCount = function (name, category) {
        try {
            var info = JSON.parse(window.localStorage.getItem(_private.getName(name, category, 'info')));
            return (info && parseInt(info.count)) || 0;
        } catch (e) {
            return 0;
        }
    };

    _private.memoryCache = {};

    _private.getMemory = function (name, category) {
        var data = _private.memoryCache[_private.getName(name, category)];
        var value = data && data.value;
        var time = data && data.time;
        var count = data && data.count;

        if (typeof(data) === 'undefined') {
            return null;
        } else {
            if (data !== null) {
                data.count = (parseInt(data.count) || 0) + 1;
            }
            return value;
        }
    };

    _private.setMemory = function (name, value, category) {

        _private.memoryCache[_private.getName(name, category)] = {
            value: value,
            time: new Date().getTime(),
            count: 0
        };
        return true;
    };

    _private.getMemoryTime = function (name, category) {
        var data = _private.memoryCache[_private.getName(name, category)];
        return (data && parseInt(data.time)) || 0;
    };

    _private.getMemoryCount = function (name, category) {
        var data = _private.memoryCache[_private.getName(name, category)];
        return (data && parseInt(data.count)) || 0;
    };

    exports.get = function (name) {
        var category = '';
        switch (this.getCacheMode()) {
            case 'localStorage':
                return _private.getLocalStorage.call(this, name, category);
            case 'memory':
                return _private.getMemory.call(this, name, category);
        }
    };

    exports.set = function (name, value) {
        var category = '';
        switch (this.getCacheMode()) {
            case 'localStorage':
                return _private.setLocalStorage.call(this, name, value, category);
            case 'memory':
                return _private.setMemory.call(this, name, value, category);
        }
    };

    _private.cacheMode = null;

    exports.setCacheMode = function (mode) {
        _private.cacheMode = mode;
    };

    exports.getCacheMode = function () {
        if (_private.cacheMode === null) {
            if (window.localStorage) {
                _private.cacheMode = 'localStorage';
            } else {
                _private.cacheMode = 'memory';
            }
        }
        return _private.cacheMode;
    };

    exports.isExpire = function (name, maxSecond, maxCount) {
        var time = 0;
        var count = 0;
        var category = '';
        switch (this.getCacheMode()) {
            case 'localStorage':
                time = _private.getLocalStorageTime.call(this, name, category);
                count = _private.getLocalStorageCount.call(this, name, category);
                break;
            case 'memory':
                time = _private.getLocalStorageTime.call(this, name, category);
                count = _private.getLocalStorageCount.call(this, name, category);
                break;
        }
        if (Math.abs(new Date().getTime() - time) > maxSecond * 1000) {
            return true;
        }
        if (count > maxCount) {
            return true
        }
        return false;
    };

    window.zCacheData = exports;
})(qv.zero.cacheData || (qv.zero.cacheData = {}));