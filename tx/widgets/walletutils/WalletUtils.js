/**
 * QQ钱包工具组件(requires:Zepto,Zero)
 * @class qv.zero.WalletUtils
 * @author kennysu
 * @description QQ钱包工具组件类
 * @version 1.0
 * @requires mqq.js,zero.js
 * @time 2014-11-1
 * @name qv.zero.WalletUtils
**/
;(function(exports){

    var WalletUtils = {

        /**
         * @description 初始化事件,默认已执行（暂用于监听是否已打开新webview防止重复打开 - zWalletUtils.openUrl)
         * @for qv.zero.WalletUtils
         * @method init
         **/
        init : function(){
            var self = this;
            self.openUrlFlag = true;
            document.addEventListener("qbrowserVisibilityChange", function(e){ //防止重复打开webview,做标志位判断
                if(e.hidden == true){
                    self.openUrlFlag = false;
                }else{
                    self.openUrlFlag = true;
                }
            });
        },

        /**
         * @description 客户端检查,不符合钱包业务的做相应处理,支持手Q最低版本（ios:'4.6.2', and:'4.6.1')
         * @author kennysu
         * @for qv.zero.WalletUtils
         * @method checkClient
         * @param {Object}   params 参数对象         
         * @param {Bollean}  params.ios 是否支持iOS（默认支持）   
         * @param {String}   params.iosVersion 指定iOS版本以上（默认4.6.2）         
         * @param {Bollean}  params.and 是否支持Android（默认支持）
         * @param {String}   params.andVersion 指定Android版本以上（默认4.6.1）
         * @param {String}   params.pcUrl PC端访问跳转页面
         * @return {Bollean|String}  成功返回 true 失败返回提示语
         * @example
         *      //代码里的提示语
         *      var msg = {
         *          'gotomqq'  : '点击确定，立即使用手机QQ参加活动',
         *          'update'   : '哎哟，你的手Q版本有点旧哦！更新后再来参加吧~',
         *          'mqqlimit' : '抱歉，本活动只限手机QQ用户参与~',
         *          'ioslimit' : '抱歉，本活动只限安卓手机QQ用户参与~',
         *          'andlimit' : '抱歉，本活动只限iOS安卓手机QQ用户参与~'
         *      };
         *      //用法如下：
         *      //默认支持ios和android(不返回提示语)
         *      zWalletUtils.checkClient();  
         *
         *      //只支持android(不返回提示语)
         *      zWalletUtils.checkClient({ ios:false });
         *
         *      //只支持android(5.2.0+)
         *      zWalletUtils.checkClient({ ios:false , andVersion : "5.2.0" });
         *
         *      //需要提示语的用法
         *      var msg = zWalletUtils.checkClient();
         *      if( msg == true){
         *          console.log('pass');
         *      }else{
         *          alert(msg);
         *      }
         **/
        checkClient : function( params ){
            var self = this,
                ua = navigator.userAgent,
                iOSClient = params.ios == false ? false : true,
                andClient = params.and == false ? false : true;

            //钱包支付的客户端版本
            var clientVersion = {
                ios : params.iosVersion || '4.6.2',
                and : params.andVersion || '4.6.1'
            };

            var device = {
                    ios: /iphone|ipad|ipod/.test(ua.toLowerCase()),
                    and: /android/.test(ua.toLowerCase())
                };

            //提示语
            var msg = {
                'gotomqq'  : '点击确定，立即使用手机QQ参加活动',
                'update'   : '哎哟，你的手Q版本有点旧哦！更新后再来参加吧~',
                'mqqlimit' : '抱歉，本活动只限手机QQ用户参与~',
                'ioslimit' : '抱歉，本活动只限安卓手机QQ用户参与~',
                'andlimit' : '抱歉，本活动只限iOS手机QQ用户参与~'
            };

            /** 检测开始 */
            if(!device.ios && !device.and){ //非 ios和and客户端
                if(params.pcUrl){
                    window.location.href = params.pcUrl;
                    return;
                }
                alert(msg['mqqlimit']);
                return msg['mqqlimit'];
            }

            if( iOSClient == false && mqq.iOS ){ //不支持ios
                alert(msg['ioslimit']);
                return msg['ioslimit'];
            }

            if( andClient == false && mqq.android ){ //不支持and
                alert(msg['andlimit']);
                return msg['andlimit'];
            }

            if( mqq.QQVersion == 0 ){ //不在手q客户端打开
                if( /iPad|iPod/i.test(ua) ){ //ipad , ipod 打开
                    alert(msg['mqqlimit']);
                    return msg['mqqlimit'];
                }else{
                    //alert(msg['gotomqq']); //微信打开或浏览器打开
                    self.openUrlByMqq();
                    return msg['mqqlimit'];
                }
                return;
            }

            if( mqq.iOS && mqq.compare(clientVersion.ios) < 0){ //ios版本低
                alert(msg['update']);
                return msg['update'];
            }

            if( mqq.android && mqq.compare(clientVersion.and) < 0){ //and 版本低
                alert(msg['update']);
                return msg['update'];
            }

            return true;

        },

        /**
         * @description 获取门神token
         * @for qv.zero.WalletUtils
         * @method getMenShenToken
         * @return {String}  门神token
         * @example
         *       var token = zWalletUtils.getMenShenToken();
         */
        getMenShenToken : function(){
            var hash = 5381;
            var str = zUtil.getcookie("skey");
            if (str != null) {
                for(var i=0,len=str.length;i<len;++i)
                {
                    hash+=(hash<<5)+str.charCodeAt(i);
                }
                return hash&0x7fffffff;
            };
            return false;
        },

        /**
        * @description 用手Q客户端打开当前页面
        * @author kennysu
        * @for qv.zero.WalletUtils
        * @method openUrlByMqq
        * @example
        *      zWalletUtils.openUrlByMqq();
        **/
        openUrlByMqq : function( url ){
            var url = url || window.location.href;
            window.location.href = "mqqapi://forward/url?url_prefix=" + btoa(url) + "&version=1&src_type=web";
        },

        /**
         * @description 获取用户QQ帐号
         * @author kennysu
         * @for qv.zero.WalletUtils
         * @method getUin
         * @param {Function} callback 回调函数
         * @example
         *      zWalletUtils.getUin(function(uin){
         *          console.log(uin); //返回QQ帐号
         *      });
         **/
        getUin: function (callback) {
            var self = this;
            if (self._uin) {
                callback && callback(self._uin);
                return ;
            };

            if( mqq.compare("4.7") < 0){
                zHttp.send({ _c:'util', _f:'getUin', sid: self.getSid() },function(json){
                    if(json && json.data){
                        self._uin = json.data;
                        callback && callback(self._uin);
                    }
                });
            } else {
                mqq.data.getUserInfo(function(result){ //该api只支持(ios/and)4.7以上
                    self._uin = result.uin;
                    callback && callback(self._uin);
                });
            }
        },

        /**
         * @description 根据Url获取用户sid
         * @author kennysu
         * @for qv.zero.WalletUtils
         * @method geSid
         * @example
         *      var sid = zWalletUtils.getSid();
         **/
        getSid : function(){
            if(!this._sid){
                this._sid = qv.zero.URL.get('sid');
            }
            return this._sid;
        },


        /**
         * @description 打开指定的URL(可防止快速连击打开重复的URL)
         * @author kennysu
         * @for qv.zero.WalletUtils
         * @method openUrl
         * @param {Object} params 对象参数 
         * @param {String} params.url 页面地址  (必填)
         * @param {Number} params.target 默认是1（在新webview打开），详细清参考：http://mqq.oa.com/api/#mqq.compare       
         * @param {Number} params.style 默认是0，详细清参考：http://mqq.oa.com/api/#mqq.compare   
         * @param {Function} params.callback 回调函数           
         * @example
         *      zWalletUtils.openUrl({
         *          url : "http://mc.vip.qq.com/",
         *          callback : function(){ console.log('success')}
         *      });
         **/
        openUrl : function( params ){
            if (!this.openUrlFlag){
                return;
            }
            params.url && mqq.ui.openUrl({
                url: params.url,
                target: params.target || 1,
                style: params.style ? params.style : 0
            });
            params.callback && params.callback();
        },

        /**
         * @description 普通提示框
         * @author kennysu
         * @for qv.zero.WalletUtils
         * @method alert
         * @param {String}   text  提示语 (必填)
         * @param {Function} callback 点击确定回调函数   
         * @example
         *      zWalletUtils.alert("恭喜你成功参与！",function(){ 
         *            console.log('success')}
         *      });
         **/
        alert : function( text , callback ){
            mqq.ui.showDialog({
                title:'',
                text: text || '',
                needCancelBtn: false,
                needOkBtn:true
            },function(result){
                callback && callback();
            });
        },

        /**
         * @description AMS子活动请求
         * @author kennysu
         * @for qv.zero.WalletUtils
         * @method requestActid
         * @param {Number}   actid  活动号 （必填）
         * @param {Function} callback 回调函数
         * @example
         *      zWalletUtils.requestActid( 12345 , function(json){
         *           console.log(json);
         *      });
         **/
        requestActid : function( actid , callback){
            var options = {
                 sid : this.getSid(),
                 actid : actid
            };
            zHttp.request( options, function(json){
                if(json && json.ret == 10002){
                   qv.zero.Login.show();
                   return;
                }
                callback && callback(json);
            });
        },


        /**
         * @description 日志上报
         * @author kennysu
         * @for qv.zero.WalletUtils
         * @method reportLog
         * @param {Number}          actid  日志记录活动号 （必填）
         * @param {Object|String}   info   日志内容（必填）
         * @example
         *      zWalletUtils.reportLog( 1234 , "return data is null" );   //字符串
         *      zWalletUtils.reportLog( 1234 , { ret:"-1" , data: "" } ); //对象
         */
        reportLog : function( actid , info ){
            try{
                if(typeof(info)=="object"){
                    info = JSON.stringify(info);
                }
            }catch(e){}
            actid && zHttp.send({ actid: actid, 'info':info });
        }

    };

    exports.WalletUtils = {
        init : function(){ WalletUtils.init() },
        openUrlByMqq : function( url ){ WalletUtils.openUrlByMqq( url ) },
        getUin : function(callback){ WalletUtils.getUin( callback ) },
        getSid : function(){ return WalletUtils.getSid() },
        getMenShenToken : function(){ return WalletUtils.getMenShenToken() },
        alert : function( text , callback ){ WalletUtils.alert( text , callback ) },
        openUrl : function( params ){ WalletUtils.openUrl( params ) },
        checkClient : function( params ){ return WalletUtils.checkClient( params ) },
        requestActid : function( actid , callback){ WalletUtils.requestActid( actid , callback) },
        reportLog : function( actid , info ){ WalletUtils.reportLog( actid , info ) }
    };

    if(!window.zWalletUtils){
        window.zWalletUtils = exports.WalletUtils;
    }

    window.zWalletUtils.init();

})(qv.zero);