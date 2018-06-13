/**
 * 打开动态中的游戏入口
 * 当天如果开启过则不再开启
 * 总次数达到3次则不再开启
 */
;(function(exports, $) {
    var Tools = {
        getUserId : function(){
            var uin = zUtil.getcookie('uin') || zURL.get('uin') || 0;
            if(uin){
                return uin;
            } else {
                var str = zURL.get('sid') || '';
                var hash = 5381;
                for(var i = 0, len = str.length; i < len; ++i){
                    hash += (hash << 5) + str.charAt(i).charCodeAt();
                }
                return hash & 0x7fffffff;
            }
        },
        getPath : function(){
            return mqq.android ? '489' : '490';
        }
    };
    var cacheDynamic = {
        shareHost : "qq.com",
        h5Path : "frd",
        callid : 0,
        getData : function(key,callback){
            var that = this;
            that.callid ++;
            key =  [Tools.getUserId(),"check_tab_open"].join('_');
            mqq.data.readH5Data({
                "callid": that.callid,
                "host" : that.shareHost,
                "path"  : that.h5Path,
                "key"   : key
            }, function(json) {
                if (json && typeof( json.ret ) != 'undefined') {
                    json.result = json.ret;
                    delete json.ret;
                }                
                if (json && typeof(json.response) != 'undefined') {
                    try{
                        json.response = json.response || {};
                        json.data     = JSON.parse( json.response.data || "{}" ) ||{};
                        delete json.response;
                    }catch(e){
                        json.data     = {}; 
                    }
                }
                callback && callback(json);
                
            });
        },
        /**
         * 
         * @param key {String}  查询各类次数的值为"check_tab_open"
         * @param value
         *  {
         * "day_show":0,    //存储单个用户每天触发的通用界面次数
         * "life_open":0,   //存储单个用户生命周期内（未清空缓存之前）总共成功打开的次数
         * "life_show":0,   //存储单个用户生命周期内连续触发的界面次数（连续的概念是指每次弹出界面用户都没有开启的操作）
         * "day_time" : 100868686 //存储最近一次更新数据的时间，new Date().getTime()
         * }
         * @param callback
         */
        setData : function(key,value,callback){
            var that = this;
            key =  [Tools.getUserId(),"check_tab_open"].join('_');
            that.callid ++;
            
            callback = callback || function(){};
            
            mqq.data.writeH5Data({
                "callid": that.callid,
                "host" : that.shareHost,
                "path"  : that.h5Path,
                "key"   : key,
                "data"  : JSON.stringify(value)
            }, function(json) {
                if (json && typeof(json.ret) != 'undefined') {
                    json.result = json.ret;
                    delete json.ret;
                }
                if (json && typeof(json.response) != 'undefined') {
                    json.data = json.response;
                    delete json.response;
                }
                callback && callback(json);
            });        
        }
    };
    var clientDynamic = {
        /**
         * 0表示刷新页面方式打开(默认),即是监听着当前webview左上角按钮情况
         * 1表示新起一个webview打开
         */
        openWay : 0,
        init : function(){
            var that = this;
            if(mqq && mqq.invoke){
                //引入客户端接口
                mqq.invoke('redpoint', 'getDynamicState', {'path' : Tools.getPath(), 'callback' : mqq.callback(that.getStateCallback)});
            }
        },
        /**
         * 读取到客户端动态开关的状态之后的回调
         * @param result {Object}
         *  字段名 字段含义    字段类型
            ret 返回码，0为查询成功，非0为查询失败  Number
            type    当前业务的开关状态，1表示为打开状态，0或者其他值表示为关闭状态    Number
            errorMessage    如果失败可以查询到失败的信息  String
         */
        getStateCallback : function(result){
            if(result.ret == 0){
                if(result.type == 0){
                    //当前是关闭的状态，符合弹出页面的条件
                    
                    //"_wv" : 5123需要隐藏webview右上角功能
                    var url;
                    if(zURL.get('debug') === '1'){
                        url = 'http://gamecentertest.cs0309.3g.qq.com/front/src/index/switch.html?_wv=5123&tabJump=1&sid='
                    } else {
                        url = 'http://gamecenter.qq.com/gamecenter/index/switch.html?_wv=5123&tabJump=1&sid='
                    }
                    url += zURL.get('sid');
                    if(clientDynamic.openWay == 0){
                        //默认情况下
                        //采用当前页刷新
                        //首先要做的就是隐藏右上角的分享按钮
                        if(window.mqq && mqq.ui && mqq.ui.setTitleButtons){
                            mqq.ui.setTitleButtons({
                                right:{
                                    hidden : true
                                }
                            });
                        }
                        window.location.replace(url);
                    }else{
                        //另起一个webview打开,适合左上角被许多场景监听的情况下
                         window.mqq && mqq.ui && mqq.ui.openUrl({
                             url: url,
                             target: 1,
                             style: 1
                         });
                    }                
                }else{
                    //走默认的关闭webview逻辑
                    if(clientDynamic.openWay == 0){
                        mqq.ui.popBack();
                    }
                    
                }
            }
        }
    };
    var dynamicSwitch = {
        /**
         * @param data
         * 
         * {
         * "day_show":0,    //存储单个用户每天触发的通用界面次数
         * "life_open":0,   //存储单个用户生命周期内（未清空缓存之前）总共成功打开的次数
         * "life_show":0,   //存储单个用户生命周期内连续触发的界面次数（连续的概念是指每次弹出界面用户都没有开启的操作）
         * "day_time" : 100868686 //存储最近一次更新数据的时间，new Date().getTime()
         * }
         * 
         */
        checkFilter : function(data){
            //测试入口
            var that = this;
            if(typeof data == "undefined" || data === null || typeof data.day_time == "undefined"){
                //第一次读取H5数据，还未写过，则满足触发校验的条件
                return true;
            }
            var basicTime = 24 * 3600;
            var deltaTime = (new Date().getTime() - data.day_time) / 1000;
            
            if(deltaTime > basicTime){
                //离最近一次弹出页面时间超过24小时，满足条件1
                //校验是否满足其他条件
                if(data.life_show < 3 && data.life_open < 3){
                    return true;
                }
            }            
            //其他条件不满足弹出页面的条件，不作处理
            return false;
        },
        /**
         * 展示设置界面
         */
        showPage : function(){
            var that = this;
            cacheDynamic.getData("check_tab_open", function(json){
                //一旦返回码不为0或者IOS -13直接校验为跳过该逻辑
                if(!(json.result == 0)){
                    var data = null;
                }else{
                    var data = json.data;
                }
                //有缓存数据，需要更新数据
                //没有缓存数据,一定会去拉一次CGI请求
                if(that.checkFilter(data)){
                    clientDynamic.init();
                }else{
                    //不要忘了关闭webview
                    mqq.ui.popBack();
                }          
            });
        }
    };
    /**
     * 何时开始初始化操作交由业务方调用
     * @param params {Object} 可选的参数,如果不传，组件默认会监听着webview左上角，一旦有点击的操作就会触发动态开关判断逻辑()
     * 对于特殊的已经监听了setOnClose的页面，则需要传递以下参数。
     * params.hasListenWebview {boolean} 告知该组件当前webview左上角是否已经被某些业务逻辑监听着（通常这部分逻辑都不是要关闭webview的操作），对于这些逻辑需要由业务方决定点击左上角时候是否接下来弹出通用界面
     * 
     */
    function _init(params){
        /*cacheDynamic.setData("check_tab_open",  {
            "day_show":1,  //存储单个用户每天触发的通用界面次数
            "life_open":1, //存储单个用户生命周期内（未清空缓存之前）总共成功打开的次数
            "life_show":1, //存储单个用户生命周期内连续触发的界面次数（连续的概念是指每次弹出界面用户都没有开启的操作）
            "day_time" : +new Date(2014,1,1) //存储最近一次更新数据的时间，new Date().getTime()
    }, function(){});*/
        //对于5.5及以上的版本才会有独立的动态设置页面
        if(mqq.compare("5.5") < 0) return;

        //先check是否还需要调用客户端接口，因为超过限额的用户不再需要弹出通用界面。
        if(typeof params == "undefined" || params.hasListenWebview === false){
            //执行默认的绑定操作
            //监听setOnclose事件
            mqq.ui.setOnCloseHandler(function(){
                dynamicSwitch.showPage();
                mqq.ui.setOnCloseHandler("");
            });
            
        }else if(params.hasListenWebview === true){
            if(typeof params.openWay != "undefined" && params.openWay == 2){
                //先清理掉其他场景已经监听的webview左上角监听
                mqq.ui.setOnCloseHandler("");
                mqq.ui.setOnCloseHandler(function(){
                    dynamicSwitch.showPage();
                    mqq.ui.setOnCloseHandler("");
                });
            }else{
                clientDynamic.openWay = 1;
                dynamicSwitch.showPage();
            }
        }else{
            throw new Error("You params is illegal in checkDynamic.js");
        }
    };

    function OpenGameEntrance(params){
        if(window.mqq){
            _init(params);
        } else {
            setTimeout(function(){
                OpenGameEntrance(params);
            }, 100);
        }
    };

    exports.OpenGameEntrance = OpenGameEntrance;
    OpenGameEntrance();

    qv.zero.Page.instance.addReadyFire(function(){
        zUtil.require('aop', function(){ //开启游戏中心
            //拦截 send方法
            if(window.mqq && mqq.compare("5.7") >= 0  && mqq.support('mqq.lebaPlugin.getPluginStatus')/*支持getPluginStatus才执行,ipad不支持*/){ //只有版本大于
                zAOP.intercept_s_a('send', { before : function(param){
                    var args = param.args, cb = param.callback;
                    var url = args[0], fn = args[1], needdo = false;
                    if(typeof url === 'object'){
                        needdo = !!url.opengamecenter;
                    } else if(typeof url === 'string'){
                        needdo = url.indexOf('opengamecenter') > -1;
                    }
                    if(needdo){
                        var id = mqq.android ? '489' : '490';
                        mqq.invoke('lebaPlugin', 'getPluginStatus', {id: id, callback: mqq.callback(function(json){ //获取是否开启了游戏中心
                            if(json.isOpen == 1){ //开启
                                cb();
                            } else {
                                mqq.invoke('lebaPlugin', 'showOpenDialog', {id: id, msg: "开启游戏动态，获取更多礼包讯息", callback: mqq.callback(function(ret){ //弹出提示语
                                    if(ret.userOption == 1){ //点击开启
                                        OZ.report({operType: '点击' , operDesc: '开启游戏动态'}); //上报
                                        cb();
                                    } else {
                                        OZ.report({operType: '点击' , operDesc: '放弃开启游戏动态'}); //上报
                                        qv.zero.LoadingMark.hide();
                                    }
                                })});
                            }
                        })});
                    } else {
                        cb();
                    }
                }} ,zHttp);
            }
        });
    });
})(qv.zero, Zepto);
