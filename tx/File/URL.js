/**
 * URL处理接口，静态类
 * @class qv.zero.URL
 * @author shinelgzli payneliu
 * @version 6.0.2
 * @date 2016-08-15
 * @requires Zepto
 * @name qv.zero.URL
 * @namespace
 */
/*global location,document*/
qv.zero.URL = {
    /**
     * 将参数串分割成json串 
     * @for qv.zero.URL
     * @param {String} [paramstr],默认为location.search的值
     * @return {Object}
     */
    unserialParams : function (paramstr) {
        paramstr = paramstr || location.search.substring(1);
        if(!paramstr) return {};
        var params = paramstr.split("&"),
            paramMap = {}, param;
        $.each(params, function(index, param){
            param = param.match(/(\w+)(?:=(.+))?/);
            if(param) {
                paramMap[param[1]] = (param[2] ||'')
					.replace(/</g,'&lt;')
					.replace(/>/g,'&gt;')
					.replace(/'/g,'&apos;')
					.replace(/"/g,'&quot;');
            }
        });
        return paramMap;
    },
    /**
     * 获取URL上name的参数值 
     * @method get
     * @for qv.zero.URL
     * @param {String} [name], 若有指定，则获取的参数名称，否获取当前URL的参数列表
     * @param {String} [url]，默认为location.href
     * @return {String|Object}
     */
    get : function(name, url) {
        if(!url && !this.paramsMap){
            this.paramsMap = this.unserialParams();
        }else if(url){
            var index = url.indexOf('?');
            return this.unserialParams( index !== -1 ? url.substr(index+1) : url )[name];
        }
        return name ? (this.paramsMap[name]||'') : this.paramsMap;
    },
    /**
     * 将参数付加到url上，并返回url
     * @method appendParams
     * @for qv.zero.URL
     * @param {Object} params， 要附加参数列表
     * @param {String} [url]，要附加参数的url，默认为当前url
     * @return {String} 返回加参数后的url
     * @example
     * zURL.appendParams({a : 1}); //output http://xxxxx ?a=1
     */
    appendParams : function (params, url) {
        if(!params){
            return url;
        }
        url = url || location.href;
        params = $.param(params);
        return this.burl(params, url);
    },
    /**
     * 将参数串付加到url上，并返回url
     * @method burl
     * @for qv.zero.URL
     * @param {String} pstr 要附加参数列表
     * @param {String} url，要附加参数的url，默认为当前url
     * @return {String} 返回加参数后的url
     */
    burl : function (pstr, url) {
        var a = document.createElement('a');
        var hash, hostPath, srh;
        a.href = url;
        hostPath = url.split(/[#\?]/)[0];
        hash = a.hash;
        srh = a.search;
        a = null;
        return hostPath + ( srh ? srh+(pstr ? '&'+pstr : '') : (pstr ? '?'+pstr : '')  ) + hash;
    }
};