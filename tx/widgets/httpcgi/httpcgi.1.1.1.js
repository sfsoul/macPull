/**
 * 前端JS调用后台CGI接口(SRF)
 * @class qv.zero.HttpCgi
 * @author kennysu
 * @description 前端JS调用后台SRF接口
 * @version 1.0
 * @requires zepto
 * @time 2015-1-21
 * @name qv.zero.HttpCgi
**/
;var HttpCgi = function(){
     var httpcgi = {

          getMenShenToken : function(){
               var  hash = 5381,
                    str = this.getCookie("skey");
               if (str != null) {
                    for(var i=0,len=str.length;i<len;++i)
                    {
                         hash+=(hash<<5)+str.charCodeAt(i);
                    }
                    return hash&0x7fffffff;
               };
               return false;
          },

          getCookie : function(name){
               var tmp, reg = new RegExp("(?:^| )" + name + "=([^;]*)(?:;|$)","gi");
               return (tmp = reg.exec(document.cookie)) ? (unescape(tmp[1])) : 1;
          },

          /**
          * @description 请求SRF接口
          * @author kennysu
          * @for qv.zero.HttpCgi
          * @method request
          * @param {Object}   params 参数对象         
          * @param {String}   params.url 接口地址（默认：http://proxy.svip.qq.com/cgi-bin/srfentryV2.fcgi） (非必填)   
          * @param {String}   params.servant 服务 (必填)   
          * @param {String}   params.method 方法 (必填)  
          * @param {Number}   params.type 类型 (非必填) 默认为2
          * @param {Object}   params.request 参数对象 (必填)
          * @return {Object}  返回报文，返回码ret说明：0 - 成功, -500000 - 未登陆, -500001 - 前台请求编码出错, -500002 - 后台响应编码出错
          *      -500003 - 未找到Server, -500004 - 后台无响应
          * @example
          *     HttpCgi({
          *          servant : "MQQ.xxxServer.xxxObj",
          *          method  : "procMap",
          *          type    : 2,
          *          params  : { request : {} }
          *     },function(result){
          *          console.log(result);
          *     })
          **/
          request : function(params, callback){
               var  requestUrl,
                    ts,
                    g_tk,
                    data,
                    requestStr,
                    self = this;
               ts = new Date().getTime();
               g_tk = this.getMenShenToken();
               requestUrl = params.url || "http://proxy.svip.qq.com/cgi-bin/srfentryV2.fcgi";
               data = { 
                    "1": {  "servant" : params.servant,  
                             "method" : params.method,
                               "type" : params.type || 2,
                             "params" : params.params
                         }
               };
               requestUrl += '?ts=' + ts + '&g_tk=' + g_tk + '&data=' + JSON.stringify(data);
               $.ajax({
                    url: requestUrl,
                    dataType: 'json',
                    beforeSend : function( xhr ){
                         xhr.withCredentials = true;
                    },
                    success : function(result){
                         callback && callback(result);
                    }
               });
          }

     };

     return {
          getMenShenToken : function(){
               return httpcgi.getMenShenToken();
          },
          request : function(params, callback){
               httpcgi.request(params, callback);
          }
     }
}();
if(window.qv && window.qv.zero){
     qv.zero.HttpCgi = HttpCgi;
}