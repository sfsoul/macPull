;var MqqAdapter = function(){
     /** 系统判断 */
     var os = function() {
          var ua = navigator.userAgent,
          isWindowsPhone = /(?:Windows Phone)/.test(ua), 
          isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone,
          isAndroid = /(?:Android)/.test(ua),
          isFireFox = /(?:Firefox)/.test(ua),
          isChrome = /(?:Chrome|CriOS)/.test(ua),
          isTablet = /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua)), 
          isIPhone = /(?:iPhone)/.test(ua) && !isTablet,
          isPc = !isIPhone && !isAndroid && !isSymbian && !isTablet;
          return {
               isWindowsPhone : isWindowsPhone,
               isTablet : isTablet,
               isIPhone : isIPhone,
               isAndroid : isAndroid,
               isPc : isPc
          };
     }();

     var mqqAdapter = {
          msg : [
               '抱歉，本活动只限手机QQ用户参与',              //msg[0]
               '抱歉，本活动只限IOS/Android手机QQ用户参与',   //msg[1]
               '抱歉，本活动只限Android手机QQ用户参与',       //msg[2]
               '抱歉，本活动只限IOS手机QQ用户参与',           //msg[3]
               '你的手Q版本有点旧哦！更新后再来吧！',         //msg[4]
               '本活动只限手机QQ用户参与，下载后再来吧！',    //msg[5]
               '确认再次用手机QQ参与活动吗？'                 //msg[6]
          ],

          count : 0, 

          dialogCss : [ '<style type="text/css">',
                         'body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,textarea,p,blockquote,th,td,header,hgroup,nav,section,article,aside,footer,figure,figcaption,menu,button{margin:0;padding:0}body{font-family:"Helvetica Neue", Helvetica, STHeiTi, sans-serif;line-height:1.5;font-size:14px;color:#000;background-color:#f8f9fa;-webkit-user-select:none;-webkit-text-size-adjust:none;-webkit-tap-highlight-color:rgba(255,255,255,0);outline:0}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:normal}table{border-collapse:collapse;border-spacing:0}fieldset,img{border:0}li{list-style:none}input,textarea,select{font-family:inherit;font-size:inherit;font-weight:inherit}button,html input[type="button"],input[type="reset"],input[type="submit"]{border:none;background:none;-webkit-appearance:none;outline:none}a{-webkit-touch-callout:none;text-decoration:none;color:#00a5e0;outline:0}em,i{font-style:normal}em{color:#ff7200}::-webkit-input-placeholder{color:#999}.ui-btn-group,.ui-btn-group-tiled{display:-webkit-box;width:100%;box-sizing:border-box}.ui-btn-group button,.ui-btn-group-tiled button{display:block;-webkit-box-flex:1}.ui-btn-group-tiled .ui-btn:first-child{margin-right:15px}.ui-btn-group button{color:#00a5e0;line-height:50px;height:48px;text-align:center;font-size:16px;border-right:1px #c8c7cc solid;width:100%;border-top:1px solid #c8c7cc}.ui-btn-group button:active{background-color:rgba(0,0,0,0.1)}.ui-btn-group button:last-child{border-right:none}.ui-btn-group-bottom{position:fixed;left:0;bottom:0;z-index:10;background-color:#fff}.ui-btn-group-bottom button{color:#00a5e0;background-image:-webkit-gradient(linear, left top, left bottom, color-stop(0, #f9f9f9), to(#e0e0e0))}.ui-btn-group-bottom button:active{background-color:none;color:rgba(0,165,224,0.4)}@media screen and (-webkit-min-device-pixel-ratio: 2){.ui-btn-group button{position:relative;border:0}.ui-btn-group button:before{content:"";position:absolute;-webkit-transform-origin:right top;width:0;border-right:1px solid #c8c7cc;right:0;top:0;bottom:0;-webkit-transform:scaleX(0.5)}.ui-btn-group button:after{content:"";position:absolute;-webkit-transform-origin:right top;left:0;right:0;height:0;border-top:1px solid #c8c7cc;top:0;-webkit-transform:scaleY(0.5)}.ui-btn-group button:last-child:before{border-right:none}}.ui-dialog{position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:99999;display:-webkit-box;-webkit-box-orient:horizontal;-webkit-box-pack:center;-webkit-box-align:center;background:rgba(0,0,0,0.4);display:none;color:#000}.ui-dialog-notice{background:transparent}.ui-dialog.show{display:-webkit-box;display:box}.ui-dialog .ui-dialog-cnt{border-radius:6px;width:270px;-webkit-background-clip:padding-box;background-clip:padding-box;outline:none;pointer-events:auto;background-color:rgba(253,253,253,0.95);position:relative}.ui-dialog .ui-dialog-bd{min-height:71px;border-top-left-radius:6px;border-top-right-radius:6px;padding:18px;font-size:16px;display:-webkit-box;display:box;-webkit-box-pack:center;-webkit-box-align:center;-webkit-box-orient:vertical}.ui-dialog .ui-dialog-bd h4{margin-bottom:4px;font-size:16px;width:100%;text-align:center}.ui-dialog .ui-dialog-bd div{width:100%}.ui-dialog .ui-dialog-ft{border-bottom-left-radius:6px;border-bottom-right-radius:6px}.ui-dialog .ui-dialog-ft button{height:42px;line-height:42px;background:transparent}.ui-dialog .ui-dialog-ft button:active{background:rgba(0,0,0,0.1)}.ui-dialog .ui-dialog-ft button:first-child{border-bottom-left-radius:6px;background-image:none}.ui-dialog .ui-dialog-ft button:last-child{border-bottom-right-radius:6px}.ui-dialog-notice .ui-dialog-cnt{width:130px;height:110px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-box-pack:center;-webkit-box-align:center;text-align:center;background:rgba(0,0,0,0.65);border-radius:6px;color:#fff}',
                         '</style>'].join(""),

          dialogHtml : ['',
          '<div style="display:none;" class="ui-dialog show" id="adapterDialog">',
               '<div class="ui-dialog-cnt">',
                    '<div class="ui-dialog-bd">',
                         //'<h4>{}</h4>',
                         //'下载安装手机QQ参加活动',
                    '</div>',
                    '<div class="ui-dialog-ft ui-btn-group">',
                         '<button id="adapterCancelBtn" >取消</button>',
                         '<button id="adapterOKBtn" >确定</button>',
                    '</div>',
               '</div>',
          '</div>'].join(""),

          /** 同域判断 */
          isQQDomain : function(){
               var domain = window.location.host;
               var arr = domain.split(".").reverse();
               if(arr[0] + arr[1] == "comqq" || domain == "qq.com"){
                    return true;
               }else{
                    return false;
               }
          },

          /** 微信判断 */
          isWeiXinCallBack : function(callback){
               if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
                    callback();
               } else {
                    if (document.addEventListener) {
                       document.addEventListener("WeixinJSBridgeReady", callback, false);
                    } else if (document.attachEvent) {
                       document.attachEvent("WeixinJSBridgeReady", callback);
                       document.attachEvent("onWeixinJSBridgeReady", callback);
                    }
               }
          },

          /** 跳转手Q处理 */
          openByMqq : function(){
               var  self = this;
               //外域没有权限用微信api,直接跳转
               if(!self.isQQDomain()){
                    alertForwardMqq();
                    return;
               }
               self.isWeiXinCallBack(function(){
                    WeixinJSBridge.invoke("getInstallState",{
                         "packageUrl": "mqq://",
                         "packageName":"com.tencent.mobileqq"
                    },function(e){
                         self.isWeiXin = true;
                         var msg = e.err_msg;
                         if (msg && msg.indexOf("get_install_state:yes") > -1) { //and为：get_install_state:yes_version
                              if(self.count > 0){
                                   self.showDialog({ content : self.msg[6] }, function(){
                                        self.forwardMqq();
                                   });
                                   return;
                              }
                              self.count = self.count + 1;
                              self.forwardMqq();
                         }else{
                              self.showDialog({ content : self.msg[5] , oktext : '下载' },function(){
                                   self.downLoadMqq();
                              })
                         }
                    });
               });

               //不在微信的其他客户端
               setTimeout(function(){
                    if( !window.WeixinJSBridge && !self.isWeiXin ){
                         alertForwardMqq();
                    }
               },1000);

               function alertForwardMqq(){
                    alert(self.msg[0]);
                    self.forwardMqq();
               }
          },

          /** 获取参数 */
          queryString : function(name){
               var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
               var r = window.location.search.substr(1).match(reg);
               if (r != null) return unescape(r[2]).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&apos;').replace(/"/g,'&quot;'); 
               return null;
          },

          /** 打开手Q */
          forwardMqq : function(){
               var url = window.location.href , mqqactid;          
               if(this.isQQDomain()){
                    window.location.href = "mqqapi://forward/url?url_prefix=" + btoa(url) + "&version=1&src_type=web";                    
               }else{
                    mqqactid = this.queryString("mqqactid");
                    window.location.href = "http://imgcache.qq.com/club/platform/lib/mqqadapter/proxyforward.html?_wv=3&mqqactid=" + mqqactid; //中转页
               }
          },

          /** 下载mqq */
          downLoadMqq : function(){
               this.oz(38173);
               setTimeout(function(){
                    location.href = "http://im.qq.com/mobileqq/touch/index.html";
               },200)
          },

          /** 隐藏弹窗 */
          hideDialog : function(){
               var dialog = this.dialog || $("#adapterDialog");
               dialog.hide();
               dialog.find(".ui-dialog-bd").html('');
               this.hasShowDialog = false;
          },

          /** 显示弹窗 */
          showDialog : function(params, callback){
               var  self = this,
                    dialog = this.dialog || $("#adapterDialog");
               dialog.find(".ui-dialog-bd").html(params.content || '');
               dialog.find("#adapterOKBtn").html(params.oktext || '确定');
               $("#adapterOKBtn").off("mousedown").on("mousedown",function(){
                    self.hideDialog();
                    callback && callback();
               });
               dialog.show();
               self.hasShowDialog = true;
          },

          /** 弹窗绑定 */
          bindDialogEvent : function(){
               var self = this, dialog;
               if(self.hasBindDialog){return}
               $("head").append(self.dialogCss);
               $("body").append(self.dialogHtml);                    
               self.dialog = dialog = $("#adapterDialog");
               $("#adapterCancelBtn").on("mousedown",function(){
                    self.hideDialog();
               });
               self.hasBindDialog = true;
          },

          /** 上报 */
          oz : function( clk ){
               var  pvsrc = location.href.replace(location.search,"");
               var  url = "//iyouxi.vip.qq.com/ams.php?_c=oz&opid=2&clk=" + clk + "&actid=512052&t=" + new Date().getTime() + "&pvsrc=" + pvsrc;
               var img = new Image(1,1);
               img.src = url;
          },

          /**
           * @description 客户端匹配检查,不符合业务的做相应处理,默认支持手Q最低版本（ios:'4.6.1', and:'4.6.1')
           * @author kennysu
           * @for MqqAdapter
           * @method init
           * @param {Object}   params 参数对象         
           * @param {Bollean}  params.ios 是否支持iOS（默认支持） 非必选
           * @param {String}   params.iosVersion 指定iOS版本以上（默认4.6.1） 非必选
           * @param {Bollean}  params.and 是否支持Android（默认支持） 非必选
           * @param {String}   params.andVersion 指定Android版本以上（默认4.6.1）非必选
           * @param {Function} params.success 成功适配回调函数  必选
           * @param {Function} params.andVersion 失败适配回调函数  必选
           * @return {Object}  result 回调返回结果( result.msg - 返回信息 , result.version - 返回手Q版本 , result.callBack - 返回回调（跳转函数) 
           * @example
           * MqqAdapter.init({
           *    iosVersion : '5.1.0',
           *    andVersion : '5.4.0',
           *    success : function(result){ alert('success') },
           *    fail : function(result){ alert(result.msg) },
           * });
           **/
          init : function( params ){
               var  self = this,
                    initParams,
                    msg = self.msg,
                    updateVersion = false,
                    failCallBack = params.fail,
                    successCallBack = params.success,
                    result = { 
                         ret: 1 ,
                         ismqq : mqq.QQVersion == 0 ? false : true,
                         msg:"",
                         msgid:"",
                         callBack : function(){}
                    };
                    self.oz(38189);
               if(os.isWindowsPhone){
                    result.msg = msg[1];
                    result.msgid = 1;
                    result.callBack = function(){
                         alert(result.msg);
                    }
                    failCallBack && failCallBack(result);
                    self.oz(38079);
                    return;
               }

               //弹窗事件定义
               self.bindDialogEvent();
                    
               if(typeof(mqq) == "undefined"){
                    result.msg = 'error';
                    alert('加载异常！');
                    failCallBack && failCallBack(result);
                    return;
               }

               initParams = {
                    iOSSupport : params.ios == false ? false : true,
                    andSupport : params.and == false ? false : true,
                    iosVersion : params.iosVersion || '4.6.1',
                    andVersion : params.andVersion || '4.6.1',
               };
               if(os.isIPhone || os.isAndroid){ // ios/and
                    if(mqq.iOS && initParams.iOSSupport == false ){ //系统不匹配
                         result.msg = msg[2];
                         result.msgid = 2;
                         result.callBack = function(){
                              alert(result.msg);
                         }
                         failCallBack && failCallBack(result);
                         self.oz(38075);
                         return;
                    }
                    if(mqq.android && initParams.andSupport == false ){//系统不匹配
                         result.msg = msg[3];
                         result.msgid = 3;
                         result.callBack = function(){
                              alert(result.msg);
                         }
                         failCallBack && failCallBack(result);
                         self.oz(38076);
                         return;
                    }
                    if(mqq.iOS && mqq.compare(initParams.iosVersion) < 0){ //版本低
                         updateVersion = true;
                    }
                    if(mqq.android && mqq.compare(initParams.andVersion) < 0){//版本低
                         updateVersion = true;
                    }
                    if(updateVersion){
                         result.msg = msg[4];
                         result.msgid = 4;
                         result.callBack = function(){
                              self.showDialog({ content : result.msg , oktext : '下载' },function(){
                                   self.downLoadMqq();
                              });
                         }
                         failCallBack && failCallBack(result);
                         self.oz(38077);
                         return;
                    }

                    if( mqq.QQVersion == 0 ){ //不在手q客户端打开
                         result.msg = msg[0];
                         result.msgid = 0;
                         result.callBack = function(){
                              self.openByMqq();
                         }
                         failCallBack && failCallBack(result);
                         self.oz(38171);
                         return;
                    }
               } else { //其他系统winphone,tablet等
                    result.ismqq = false;
                    result.msg = msg[0];
                    result.msgid = 0;
                    result.callBack = function(){
                         alert(result.msg);
                    }
                    failCallBack && failCallBack(result);
                    self.oz(38172);
                    return;
               }
               result.ret = 0;
               successCallBack && successCallBack(result);
          }
     };

     return {
          init : function(params,callback){
               mqqAdapter.init(params,callback);
          },
          queryString : function(name){
               return mqqAdapter.queryString(name);
          },
          openByMqq : function(){
               mqqAdapter.openByMqq();
          }
     }
}();