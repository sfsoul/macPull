/*
@name : video player with tencentVideo and egameVideo
@auth : jijixu
@create : 2017-04-21
@dependence : stanceof Page & CallBack
@exampale : 
    new qv.zero.videoPlayer({
        playWay : 0, //播放方式: (默认)0-初始化在domId内 | 1-domId做为执行按钮点击后弹窗播放 
        domId : 'liveWrapper', //外部容器ID
        autoPlay : true, //true | false | "wifi" （该属性不支持 : 1、企鹅电竞视频在非手Q的环境强制为true，实际是否自动播放由电竞组件决定； 2、弹窗播放强制为true）
        coverImg : "http://ossweb-img.qq.com/upload/adw/image/1492574254/1492574254.jpg", //首屏图片，图片上需要自带播放按钮UI
        afterInit : function(obj){}, //初始化完成后回调

        //------- 四选一决定视频类型 ---------
        //anchorId : 432863,                            // 企鹅电竞主播
        //appid : 1104466820,   //game : "sgame"       // 企鹅电竞热播
        //videoId : 'u0020m5jr73',                    // 腾讯视频点播
        //liveId : 15584253,                         // 腾讯视频直播
    });
*/
;(function(exports, $){
    function videoPlayer(params){
        params.coverImg = adjustProtocol(params.coverImg);
        this.params = params;
        this.init();
    }
    videoPlayer.prototype.init = function(){
        var params = this.params;
        var videoType;
        if( params.anchorId || params.appid || params.game ){
            videoType = "egameVideo";
        }else if( params.videoId || params.liveId ){
            videoType = "tencentVideo";
        }
        this.videoType = videoType;

        var initWay = 'init';
        if(params.playWay){
            params.autoPlay = true;
            initWay = 'initPop';
        }

        videoType && videoPlayer[initWay](this);
    };
    videoPlayer.prototype.destroy = function(){
        var _this = this;
        try{
            _this.player.destroy();
        }catch(e){
            try{
                _this.dom.$dom.html("");
            }catch(e){}
        }
    };
    videoPlayer.prototype.pause = function(){
        var _this = this;
        try{
            _this.player.pause();
        }catch(e){
            try{
                _this.dom.$dom.html("");
            }catch(e){}
        }
    };
    function adjustProtocol(url){
        if(url){
           url = location.protocol + ((/^https?:(.*)$/).test(url) ? RegExp.$1 : url);
        }
        return url;
    };
    function getWrapper(selector){
        var id;
        if( /^#(.*)/.test(selector) ){
            id = RegExp.$1;
        }else{
            id = selector;
            selector = "#" + selector;
        }
        var $wrapper = $(selector);
        $wrapper = ($wrapper&&$wrapper.length) ? $wrapper.css('overflow','hidden').html('') : $('body');
        return {
            id : id,
            $dom : $wrapper,
            height : $wrapper.css("height") || "100%",
            width : $wrapper.css("width") || "100%",
            realHeight : $wrapper.height(),
            reealWidth : $wrapper.width()
        }
    };
    function getAppidByGame(gameName){
        gameName = (gameName || page.game).toLocaleLowerCase();
        var appid = 0;
        try{
            appid = exports.Idip[gameName].appid;
        }catch(e){
            gameName = gameName.substring(0,1).toUpperCase() + gameName.substring(1);
            appid = window.AMD_game[gameName].a
        }
        return appid;
    };
    function isAutoPlay( type ){
        var cb = new exports.CallBack();
        if( type === "wifi" && isMQQ()){
            if( mqq && mqq.device && mqq.device.getNetworkType ){
                mqq.device.getNetworkType(function(result){
                     cb.execute(result==1)
                });
            }else{
                setTimeout(function(){
                    cb.execute(false);
                },0);
            }
        }else{
            setTimeout(function(){
                cb.execute( (typeof type === "string" ? (type.toLowerCase() === 'true') : !!type) );
            },0);
        }
        return cb;
    };
    function isMQQ(){
        var ee = arguments.callee;
        if(typeof ee.isMQQ === "undefined"){
            ee.isMQQ = mqq && mqq.device && mqq.device.isMobileQQ();
        }
        return ee.isMQQ;
    };
    function parseNumber(str){
        str = str + "";
        return +(str.match(/\d*\.?\d+/)[0]);
        
    };
    videoPlayer.init =function(instance, finishConsume){
        if(typeof this.consuming === "undefined"){
            this.consuming = false;
        }
        if( !(this.queue instanceof Array) ){
            this.queue = new Array();
        }
        if(finishConsume){
            this.consuming = false;
        }
        instance && this.queue.push(instance);
        if(this.consuming){
            return;
        }else if(this.queue.length){
            this.consuming = true;
            var headOfQueueInstance = this.queue.shift();
            this[headOfQueueInstance.videoType].initVideo(headOfQueueInstance);
        }
    };
    videoPlayer.initPop = function(instance){
        var ee = arguments.callee;
        if(typeof ee.initIndex === "undefined"){
            ee.initIndex = 0;
        }
        ee.initIndex++;
        var timestamp = new Date().getTime();
        var maskAreaId = 'popWrapper_' + timestamp+'_'+ee.initIndex;
        var playAreaId = maskAreaId + "_play";
        var popAndPlayBtnId = instance.params.domId;
        instance.params.domId =  playAreaId;

        var width = document.documentElement.clientWidth || document.body.clientWidth;
        var height = window.screen.height/3;
        console.log(height);
        var html = '<div id="'+maskAreaId+'" class="mod-game-dialog" style="display:none;width:100%;">\
                        <div id="'+playAreaId+'" class="player-contenter mod-game-dialog-content" \
                        style="z-index:21;width:'+width+'px;background-color:transparent;position:fixed;top:45%;height:'+height+'px;">视频加载中...</div>\
                    </div>';
        var $maskArea = $(html).appendTo("body").click(function(event){ instance.pause(); $(this).hide();  });
        var $playArea = $maskArea.find('div.player-contenter').click(function(event){ event.stopPropagation(); });
        
        var $popAndPlayBtn = getWrapper(popAndPlayBtnId);
        $popAndPlayBtn.$dom.click(function(){
            $maskArea.show();
            var ee = arguments.callee;
            if( ee.isInited && instance.videoType !== "egameVideo"){
                instance.player.play();
            }else{
                ee.isInited = true;
                videoPlayer[instance.videoType].initVideo(instance);
            }
        });
    };
    videoPlayer.egameVideo = {
        initVideo : function(instance){
            var adaptIframeHeight = function(wrapperParams){
                //Make sure the container is in proportion - Shrink down
                var wrapperHeight = +parseNumber(wrapperParams.height);
                var wrapperWidth = +parseNumber(wrapperParams.width);
                var standardHeight = 210;
                var standardWidth = 374;
                var scaleWidth = wrapperHeight*(standardWidth/standardHeight);
                var scaleHeight = wrapperWidth*(standardHeight/standardWidth);
                if(scaleWidth < wrapperWidth){
                    wrapperWidth = scaleWidth;
                }else if(scaleHeight < wrapperHeight){
                    wrapperHeight = scaleHeight;
                }
                //If wrapperHeight<195 then video will "shake" in IOS plat
                var smallScale = largerScale = 1 , transformStyle = {};
                if(zUtil.isIOS() && wrapperHeight<195){
                    smallScale = wrapperHeight/195;
                    largerScale = 195/wrapperHeight;
                    wrapperWidth = wrapperWidth*largerScale;
                    wrapperHeight = 195;
                    transformStyle = {
                        '-webkit-transform' : 'scale('+smallScale+')',
                        '-webkit-transform-origin' : '0 0',
                    };
                };
                
                wrapperParams.$dom = $('<div></div>')
                .appendTo(wrapperParams.$dom.html(''))
                .css($.extend({
                    'height' : wrapperHeight+'px',
                    'width' : wrapperWidth+'px',
                    'overflow' : 'hidden'
                },transformStyle));

                //Add installbarHeight is intended to "overflow:hidden" the bottom installbar
                var barHeight = {
                    min : {
                        h : 25,
                        tiny : 1,
                    },
                    line : 220,
                    max : {
                        h : 60,
                        tiny : 2
                    },
                }
                var installbarHeight = barHeight.min.h + barHeight.min.tiny;
                if(wrapperHeight + barHeight.min.h >= barHeight.line){
                    installbarHeight = barHeight.max.h + barHeight.max.tiny;
                }

                var iframeHeight = wrapperHeight + installbarHeight;
                wrapperParams.height = iframeHeight+'px';
                wrapperParams.width = wrapperWidth+'px';
            }
            var params = instance.params;
            var _this = this;
            var wrapperParams = getWrapper(params.domId);
            adaptIframeHeight(wrapperParams);

            var cb = function(){
                videoPlayer.init(undefined, true);
                params.afterInit && params.afterInit();
            };
            
            exports.CallBack.all([ isAutoPlay(params.autoPlay), this.getAnchordIdByAdaptation(params) ]).add(function(arr){
                var isAutoPlay = arr[0];
                wrapperParams.anchorId = arr[1];

                var exportObj = {dom : wrapperParams, player : undefined};
                $.extend(instance, exportObj);

                if(isAutoPlay || !isMQQ()){
                    //direct load
                    _this.loadScript(wrapperParams).add(function(){ 
                        cb && cb(exportObj); //[export]
                    });
                }else{
                    //set the cover image
                    var $dom = wrapperParams.$dom;
                    if(params.coverImg){
                        $dom.css({
                            "background-image":"url("+params.coverImg+")",
                            "background-size":"100% 100%"
                        })
                    }
                    //bind click to load vide script
                    $dom.click(function(){
                        qv.zero.LoadingMark.show();
                        $(this).unbind("click").css("background","transparent");
                        _this.loadScript(wrapperParams).add(function(params){ 
                            qv.zero.LoadingMark.hide();
                            /*setTimeout(function(){
                                $dom.css("background","transparent");
                            },5000);*/
                            cb && cb(exportObj); //[export]
                        });
                    });
                }
            });
        },
        loadScript : function(params) {
            /*
                通过iframe加载外置脚本进行企鹅电竞播放器初始化
                播放器内部通过终端UA的wifi判断是否自动播放
                目前测试结果：手Q内自动播放，微信和企鹅电竞内需要手动播放
            */
            var cb = new exports.CallBack();
            var getIframeParams = function(params){
                return zUtil.sprint("anchorid={anchorId}&width={width}&height={height}", params);
            }
            var dataStr = getIframeParams(params);
            var $wrapper = params.$dom;
            var s = document.createElement('script');
            s.setAttribute('name', 'pgg_other_video_script');
            s.src = '//i.gtimg.cn/club/pgg/v2.4/package/other/other_video_oscript.js';
            s.setAttribute('data', dataStr);
            s.onload = function(){
                cb.execute(params);
            }
            $wrapper.append(s);
            return cb;
        },
        getAnchordIdByAdaptation: function(params){
            var cb = new exports.CallBack();
            if(params.appid || params.game){
                //get appid
                if(params.game && typeof params.appid === "undefined"){
                    params.appid = getAppidByGame(params.game);
                }
                //get anchorId via appid and initialization
                this.getAnchordIdByAppid(params.appid, function(anchorId){
                    cb.execute(anchorId);
                });
            }
            else if(params.anchorId){
                setTimeout(function(){
                    cb.execute(params.anchorId);
                },0);
            }
            return cb;
        },
        getAnchordIdByAppid : function(appid,cb){
            var _this = this; 
            if(!appid){
                console.log('getAnchordIdByAppid() : error appid');
                return false;
            }
            zHttp.ajax({
                type: 'GET',
                url: '//share.egame.qq.com/cgi-bin/pgg_skey_async_fcgi?param={"key":{"param":{"anchor_id":0,"layout_id":"'+ appid +'","index":1},"module":"pgg_live_read_svr","method":"get_live_and_profile_info"}}',
                callback: function(result) {
                    var anchorid = 0;
                    try{
                        anchorid = result.data.key.retBody.data.video_info.anchor_id;
                    }catch(e){
                        console.log('getAnchordIdByAppid() : get id fail by appid : ' + appid);
                    }
                    cb && cb.call(_this, anchorid);
                }
            });
        }
    };
    videoPlayer.tencentVideo = {
        initVideo : function(instance){
            var params = instance.params;
            var _this = this;
            var cb = function(){
                videoPlayer.init(undefined, true);
                params.afterInit && params.afterInit();
            };
            var wrapperParams = getWrapper(params.domId);
            exports.CallBack.all([ isAutoPlay(params.autoPlay), this.loadScript("default") ]).add(function(arr){
                var isAutoPlay = arr[0];
                var nameSpace = arr[1];
                var player = new window[nameSpace]({
                  containerId: wrapperParams.id,
                  vid:  params.videoId || +params.liveId,
                  videoType : ( params.videoId ? "vod" : "live"),
                  width: /%+/.test(wrapperParams.width) ? wrapperParams.width : parseNumber(wrapperParams.width),
                  height: /%+/.test(wrapperParams.height) ? wrapperParams.height : parseNumber(wrapperParams.height),
                  autoplay : isAutoPlay,
                  //hideBtn:true
                  //posterUrl : params.coverImg,
                });
                var exportObj = {
                    player : player, 
                    dom : wrapperParams
                };
                $.extend(instance, exportObj);

                var readyFunc = function(){
                    if( !isAutoPlay  ){
                        //set cover image
                        params.coverImg && player.setPoster(params.coverImg);
                        //hide default play btn
                        var playBtn = $('#txplayer_'+player.getPlayerId()+' > txpdiv.txp_overlay_play > button.txp_btn.txp_btn_play_lg.txp_show');
                        if(playBtn.length){
                            playBtn.css('opacity',0);
                            //restore default play btn
                            wrapperParams.$dom.click(function(){
                                $(this).unbind("click");
                                player.play();
                                playBtn.css('opacity',1);
                            });
                        }
                    }
                    //[export]
                    cb && cb(exportObj);
                };

                if(player.getPoster){
                    readyFunc();
                }else{
                    //first init
                    player.on("ready",function(){
                        readyFunc();
                    })
                }
                
            });
        },
        loadScript : function( type ) {
            var cb = new exports.CallBack();
            var urls = {
                "default" : ["Txplayer", "//vm.gtimg.cn/tencentvideo/txp/js/txplayer.js"],
                "mini" : ["Txminiplayer", "//vm.gtimg.cn/tencentvideo/txmp/js/txminiplayer.js"],
                "multi" : ["Txminiplayer", "//vm.gtimg.cn/tencentvideo/txmp/js/txminiplayer_multiplay.js"]
            };
            var url = location.protocol + urls[type][1]
            var nameSpace = urls[type][0]
            if( window[nameSpace] ){
                setTimeout(function(){
                    cb.execute( nameSpace );
                },0);
            }else{
                zHttp.loadScript(  url, function(){
                    cb.execute( nameSpace );
                });
            }
            return cb;
        },
    };

    exports.videoPlayer = videoPlayer;
})(qv.zero, Zepto);