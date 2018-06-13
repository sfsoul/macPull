/**
* 1. 直播：http://imgcache.gtimg.cn/tencentvideo_v1/tvp/js/tvp.player_v2_live.js
* 2. 点播：http://imgcache.gtimg.cn/tencentvideo_v1/tvp/js/tvp.player_v2_zepto.js
* 
* 视频播放
* 使用方法：
*  new qv.zero.Player({id : 'AAAAAAAA', modid: '容器id', width ：100, height : 200, pic : '首屏图片', autoplay : true/false});
*/

(function (exports, $) {
    //加载js
    function loadPlayerJS(type){
        var cb = new qv.zero.CallBack();
        if(window.tvp && tvp.VideoInfo){            
            cb.execute();
        } else {
            var url = (+type === 0 ? 'http://imgcache.gtimg.cn/tencentvideo_v1/tvp/js/tvp.player_v2_zepto.js' : 
                                      'http://imgcache.gtimg.cn/tencentvideo_v1/tvp/js/tvp.player_v2_live.js');

            zUtil.require(url, function (data) {
                cb.execute();
            });
        }
        return cb;
    }
    function Player(cfg){
        this.data = $.extend(true, {}, cfg);
        this.init();
    }
    //初始化
    Player.prototype.init = function() {
        var data = this.data, me = this;
        data.type = data.type || 0;
        this._execute_state = loadPlayerJS(data.type);
        this._execute_state.add(function(){
            var video = me.VideoInfo = new tvp.VideoInfo(), 
                player = me.Player = new tvp.Player(), cid = data.modid, mod = $('#' + cid), config;
            var id = data.id, width = data.width || mod.width(), height = data.height || mod.height(), pic = data.pic || '';
            if(me.islive()){ //直播
                video.setChannelId(id);
            } else { //点播
                video.setVid(id);
            }
            config = me.config = {
                width: width,
                height: height,
                video: video,
                modId: cid, 
                isHtml5UseFakeFullScreen: false,
                vodFlashSkin: ('http://imgcache.qq.com/minivideo_v1/vd/res/skins/TencentPlayerMiniSkin.swf'.replace(/^http:/, window.location.protocol)),
                pic : pic,
                autoplay: data.autoplay || false,
                isShowDurationLimit : false
            }
            if(me.islive()){
                config.type = 1;
            }
            if(/ mi /.test(navigator.userAgent.toLowerCase())){ //小米手机特殊处理
                config.playerType = 'html5';
            }
            player.create(config);
        });
    };
    //是否直播
    Player.prototype.islive = function(){
        return ((+this.data.type) === 1);
    };
    //播放
    Player.prototype.play = function(){
        var me = this;
        this._execute_state.add(function(){            
            me.Player.play();
        });
    };
    //暂停
    Player.prototype.pause = function(){
        var me = this;
        this._execute_state.add(function(){
            me.Player.pause();
        });
    };

    exports.Player = Player;
}(qv.zero, Zepto));