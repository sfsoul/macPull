/*
@name : EgamePendant.js
@auth : jijixu
@create : 2017-06-11
@dependence : stanceof Page & CallBack & videoPlayer & AmsEz
@exampale : Referenced the components 'pendant', manage at 67527-project
*/
;(function(exports, $) {
    exports.Page.instance.addReadyFire(function(page){
        if(page.hasEgamePendant === false || $('#egamePendant').length ){
            return;
        }
        initPendant(page);
    });
    function getAppidByGame(gameName){
        gameName = (gameName || page.game).toLocaleLowerCase();
        var appid = 0;
        try{
            gameName = gameName.substring(0,1).toUpperCase() + gameName.substring(1).toLowerCase();
            appid = window.AMD_game[gameName].a
        }catch(e){}
        return appid;
    };
    /*
    获取指定APPID正在直播的主播信息
    @appid
    @return Array-Object
        mainKey : video_cover_url | anchor_face_url | anchor_id | anchor_name | fans_count | online | title  
    */
    function getEgameLiveList(appid){
        var cb = new exports.CallBack();
        var pageSize = 5;
        var url = '//share.egame.qq.com/cgi-bin/pgg_pc_live_async_fcgi?param={"key0":{"method":"get_live_list","module":"pgg_live_read_svr","param":{"layout_id":"'+appid+'","page_size":'+pageSize+',"page_num":1}}}&g_tk='+zUtil.getToken();
        zHttp.ajax({
            url : url,
            callback : function(json){
                var liveListArr = zUtil.getValueFromObj(json,'data.key0.retBody.data.live_data.live_list');
                var resultArr = [];
                if(liveListArr instanceof Array && liveListArr.length){
                    liveListArr.forEach(function(obj,index){
                        typeof obj === "object" && 
                        resultArr.push({
                            video_cover_url : obj.video_info && obj.video_info.url,
                            anchor_face_url : obj.anchor_face_url || '//imgcache.gtimg.cn/vipstyle/game/act/rjpeng/201704/20170426_sgame_luhan/dist/img/qq.jpg',
                            anchor_id : obj.anchor_id || 0,
                            anchor_name : obj.anchor_name || "",
                            fans_count : obj.fans_count || 0,
                            online : obj.online || 0,
                            title : obj.title || ""
                        });
                    });
                }
                cb.execute(resultArr);
            }
        });
        return cb;
    };
    function getPendantHtml(game){
        var cb = new exports.CallBack();
        var appid = getAppidByGame(game);
        var templateAnchorHtml = '\
            <div class="swiper-slide">\
                <!-- 封面图 -->\
                <a href="javascript:void(0);" class="ep-btn-playvideo" data-aid="{anchor_id}">\
                    <div class="ep-video-containor" data-aid="{anchor_id}"></div>\
                    <div class="ep-video-img">\
                        <img src="{video_cover_url}" width="100%">\
                        <div></div>\
                    </div>\
                </a>\
                <!-- 主播信息：头像 粉丝数 -->\
                <div class="ep-a-info">\
                    <img src="{anchor_face_url}" height="100%" alt="" class="ep-a-i-icon">\
                    <span class="ep-a-i-name">{anchor_name}</span> <span class="ep-a-i-fans">{fans_count}粉丝</span>\
                </div>\
                <!-- 顶部：观看人数 -->\
                <div class="ep-a-title">\
                    <span class="ep-a-t-icon"></span>\
                    <div class="ep-a-t-text"><p>&nbsp;: &nbsp;{online} 人正在观看 {anchor_name} 的直播</p></div>\
                </div>\
                <!-- 底部：主播介绍 -->\
                <div class="ep-a-b-desc">\
                    <span class="ep-a-b-icon"></span>\
                    <div class="ep-a-b-txt"><p>{title}</p></div>\
                </div>\
            </div>';
        var temlatePendantHtml = '\
            <div id="egamePendant">\
                <!-- Floating -->\
                <div class="ep-left ep-icon-move">\
                    <div class="ep-l-logo"></div>\
                    <div class="ep-l-notice">\
                        <div class="ep-l-n-txt">{anchor_length}个主播正在直播 </div>\
                    </div>\
                </div>\
                <!-- Pannel -->\
                <div class="ep-right">\
                    <div id="ep-box" class="ep-box">\
                        <!-- 按钮：返回 -->\
                        <a class="ep-btn-back"></a>\
                        <!-- 按钮：进入企鹅电竞 -->\
                        <a href="javascript:void(0);" class="ep-btn-lapp"></a>\
                        <!-- 轮播图：Swpier容器 -->\
                        <div class="ep-swiper">\
                            <div class="swiper-wrapper">\
                                {anchor_html}\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>';

        getEgameLiveList(appid).add(function(liveListArr){
            var anchorLength = liveListArr.length;
            if(anchorLength==0){//No anchor living
                return;
            }
            var anchorHtml = "";
            liveListArr.forEach(function(obj,index){
                anchorHtml += zUtil.sprintf(templateAnchorHtml,obj);
            });
            var pendantHtml = zUtil.sprintf(temlatePendantHtml, {
                anchor_html : anchorHtml,
                anchor_length : anchorLength
            });
            cb.execute(pendantHtml);
        });
        return cb;
    };
    function loadStyleAndScript(){
        var path = {
            /*"images" : [],*/
            "css" : [],
            "js" : ['videoPlayer','AmsEz'],
        };
        var getPath = function(){
            var base = location.protocol + '//imgcache.gtimg.cn/club/common/lib/zero/widgets/egamependant/';
            var url = {
                /*"images" : ['/spr.png'],*/
                "css" : ['/main.css','/swiper.min.css'],
                "js" : ['/oridomi.js','/swiper.min.js'],
            }
            for(var dir in url){
                for(var index in url[dir]){
                    path[dir].push(base+dir+url[dir][index]);
                }
            }
        }
        getPath();
        var require = {
            "css" : (function(){
                var loadCss = function(url) {
                    url = ZProtoAdapter.url(url);
                    var cb = new exports.CallBack();
                    var node = document.createElement('link');
                    node.rel = 'stylesheet';
                    node.type = 'text/css';
                    node.href = url;
                    node.onload = function(){
                        cb.execute();
                    };
                    (document.head || document.getElementsByTagName("head")[0]).appendChild(node);
                    return cb;
                };
                var requireCss = function (arr){
                    var cssReg = /^https?:\/\/imgcache.gtimg.cn(\/.+\.css)(\?|$)/;
                    var urlArr = [], comboPath = [], comboUrl;
                    arr.forEach(function(url){
                        if(comboUrl = url.match(cssReg)){
                            comboPath.push(comboUrl[1]);
                        }else{
                            urlArr.push(url);
                        }
                    });

                    var comboNum = comboPath.length;
                    var domain = location.protocol + '//imgcache.gtimg.cn';
                    var comboIf = '/c/=';
                    var maxAge = '?max_age=86400000';
                    if(comboNum>0){
                        comboIf = comboNum > 1 ? comboIf : '';
                        maxAge = comboNum > 1 ? maxAge : '';
                        urlArr.push(domain + comboIf + comboPath.join(',')  + maxAge);
                    }
                    var cbs = [];
                    urlArr.forEach(function(url){
                        cbs.push( loadCss(url) );
                    });

                    return exports.CallBack.all(cbs);
                };
                return function(arr){
                    var cb = new exports.CallBack();
                    requireCss(arr).add(function(){
                        cb.execute();
                    });
                    return cb;
                }
            })(),
            "js" : function(arr){
                var cb = new exports.CallBack();
                zUtil.require(arr,function(){
                    cb.execute();
                });
                return cb;
            },
            "images" : (function(arr){
                var loadImg = function(url){
                    var cb = new exports.CallBack();
                    var img = new Image();
                    img.src = url;
                    if (img.complete) {
                        cb.execute();
                        return url;
                    }
                    img.onload = function () {
                        cb.execute();
                    };
                    return cb;
                };
                var requireImage = function(arr){
                    var cbs = [];
                    arr.forEach(function(url){
                        cbs.push( loadImg(url) );
                    });
                    return exports.CallBack.all(cbs);
                };
                return function(arr){
                    var cb = new exports.CallBack();
                    requireImage(arr).add(function(){
                        cb.execute();
                    });
                    return cb;
                }
            })()
        }
        var cb = exports.CallBack.all([ require.css(path.css), require.js(path.js) ]); //require.images(path.images) ,
        return cb;
    };
    function requireCss(arr){
        var cssReg = /^https?:\/\/imgcache.gtimg.cn(\/.+\.css)(\?|$)/;
        var urlArr = [], comboPath = [], comboUrl;
        arr.forEach(function(url){
            if(comboUrl = url.match(cssReg)){
                comboPath.push(comboUrl[1]);
            }else{
                urlArr.push(url);
            }
        });

        var comboNum = comboPath.length;
        var domain = location.protocol + '//imgcache.gtimg.cn';
        var comboIf = '/c/=';
        var maxAge = '?max_age=86400000';
        if(comboNum>0){
            comboIf = comboNum > 1 ? comboIf : '';
            maxAge = comboNum > 1 ? maxAge : '';
            urlArr.push(domain + comboIf + comboPath.join(',')  + maxAge);
        }

        var loadCss = function(url) {
            url = ZProtoAdapter.url(url);
            var cb = new exports.CallBack();
            var node = document.createElement('link');
            node.rel = 'stylesheet';
            node.type = 'text/css';
            node.href = url;
            node.onload = function(){
                cb.execute();
            };
            (document.head || document.getElementsByTagName("head")[0]).appendChild(node);
            return cb;
        };

        var cbs = [];
        urlArr.forEach(function(url){
            cbs.push( loadCss(url) );
        });

        return exports.CallBack.all(cbs);
    };
    function initPendant(page){
        if(page.__hasInitEgamePendant__){
            return;
        }
        page.__hasInitEgamePendant__ = true;
        page.game && getPendantHtml(page.game).add(function(html){
            loadStyleAndScript().add(function(){
                var $egamePendant = $(html).appendTo('body');
                var $leftIcon = $('.ep-left',$egamePendant);
                var $rightPanel = $('.ep-right',$egamePendant);
                var $panelBox = $('#ep-box',$egamePendant);
                var swiperObj;
                var foldObj;
                var playContainer = {
                    clear : function(){
                        var _this = this;
                        $.each(_this, function(index, container){
                            if(+index>=0 && container.playing){
                                container.$div.html('');//Empty the $div because the EgameVideo out of control;
                                container.playing = 0;
                                _this.toggleImg(container); //Show the $img
                            }
                        });
                    },
                    toggleImg : function(container){
                        //$img cover on the top is to be able to receive the Swiper's sliding event
                        switch(container.playing){
                            case 1 : //video playing then hide the $img
                                //When the page is not running in the QQ , user need to click second time to play video , so the top mask($img cover) must be hide
                                isMQQ() ? container.$img.show().css('opacity',0) : container.$img.hide().css('opacity',1);
                                container.$info.hide();
                                break;
                            case 0 : //video no playing then show the $img
                                isMQQ() ? container.$img.show().css('opacity',1) : container.$img.show().css('opacity',1);
                                container.$info.show();
                                break;
                        }
                    }
                };

                //Check Egame
                var isEgameInstalled = false;
                exports.SQGameManager.isInstalled({game:'egame'}, function(ret){
                    isEgameInstalled = ret;
                });

                initPanel();

                //Expand the rightPanel
                $leftIcon
                .click(function(){
                    $(this).addClass('ep-icon-move');
                    _report('clickLeftIcon');
                })
                .on('webkitTransitionEnd', function(arguments) {
                    if(!$(this).hasClass('ep-icon-move')){
                        //When rightPanel foldup and reset leftIcon 
                        return;
                    }
                    $rightPanel.show();
                    foldObj.folded.unfold(function(){
                        //console.log('展开');
                        foldObj.$epBox.show();
                        foldObj.$epBoxClone.hide();
                    });
                });
                
                //Foldup the rightPanel
                $('.ep-btn-back',$egamePendant)
                .click(function(){
                    swiperObj.slideTo(1);//Reset the slide position
                    playContainer.clear();//Stop play all video
                    var fold = foldObj;
                    fold.$epBoxClone.show();
                    fold.$epBox.hide();
                    fold.folded.foldUp(function(){
                        //console.log('回收');
                        $rightPanel.hide();
                        $leftIcon.removeClass('ep-icon-move');
                        _report('clickBack');
                    });
                });

                //Click start play video
                $egamePendant.on('click','div.swiper-slide-active .ep-btn-playvideo',function(){
                    var $this = $(this), index = +$this.data('index');
                    if(!playContainer[index]){
                        //Caculate rightPanel playContainer
                        var $img = $('div.ep-video-img',$this);
                        var $div = $('div.ep-video-containor',$this);
                        var anchorId = $this.data('aid');
                        //$div.width($img.width()).height($img.height());
                        playContainer[index] = {
                            domId : 'egamePendant_'+index+"_"+anchorId,
                            playing : 0,
                            anchorId : anchorId,
                            $img : $img,
                            $div : $div,
                            $info : $this.siblings('div.ep-a-info')
                        };
                    } 

                    var container = playContainer[index];
                    if(container.playing){
                        return;
                    }else if(container.anchorId>0){
                        exports.LoadingMark.show();
                        playContainer.clear();
                        new exports.videoPlayer({
                            anchorId : container.anchorId,   
                            playWay : 0,
                            domId : container.domId,
                            autoPlay : true,
                            afterInit : function(obj){
                                container.playing = 1;
                                exports.LoadingMark.hide();
                                playContainer.toggleImg(container);                             
                            }
                        });
                        _report('clickPlayVideo');
                    };
                });
                
                //Lauch EgameApp
                $('.ep-btn-lapp',$egamePendant)
                .click(function(){
                    //var aid = $('.swiper-slide-active > a.ep-btn-playvideo',$egamePendant).data('aid');
                    autoMark();
                    qv.zero.SQGameManager.start({game: "egame", jsonid : page.jsonid});
                    _report( isEgameInstalled ? 'clickLauchApp' : 'clickDownApp');
                });

                function _report(eventName){
                    //oper_type : exposure-8 | click-12
                    var baseData = {oper_type:12, oper_module : 595, module_type : 59501, oper_id : 0};
                    var operIdData = {
                        'clickLeftIcon' : 202887,
                        'clickLauchApp' : 202897,
                        'clickDownApp' : 202899,
                        'clickBack' : 0,
                        'clickPlayVideo' : 0,
                        'changeSlide' : 0
                    };
                    var operId = operIdData[eventName];
                    operId && exports.EZ.report($.extend(baseData, {oper_id : operId}));
                };
                function initPanel(){
                    $egamePendant.show().css({'opacity':1});
                    //Panel Show
                    $rightPanel.show().css({'opacity':0});
                    //Caculate leftIcon Height
                    var lWidth = $leftIcon.width();
                    $leftIcon.height( lWidth*208/230 )
                    //Caculate rightPanel Height
                    var width = $rightPanel.width();
                    var height = width*407/751 +'px';
                    width = width + 'px';
                    $rightPanel.height(height);
                    $panelBox.height(height).width(width);
                    //Init Swiper & Fold
                    initSwiper().add(function(swiper){
                        swiperObj = swiper;
                        //Caculate the playContainor Height
                        var slaWidth = $('.swiper-slide-active',$panelBox).width();
                        var slaHeight = slaWidth*210/374;
                        $('.ep-btn-playvideo', $panelBox).height(slaHeight+'px');
                        //Init Fold
                        foldObj = initFold($rightPanel,function(fold){
                            $rightPanel.hide().css({'opacity':1});
                            $leftIcon.removeClass('ep-icon-move');//Show the leftIcon
                            $egamePendant.css('-webkit-transform','translateY(0)');

                        });
                    });
                };
                function initSwiper(){
                    var cb = new exports.CallBack();
                    var ee = arguments.callee;
                    if(ee.swiper){
                        setTimeout(function(){
                            cb.execute(ee.swiper);
                        },0)
                        return cb;
                    }
                    ee.swiper = new Swiper('#ep-box .ep-swiper', {
                        //effect : 'coverflow',
                        paginationClickable: true,
                        slidesPerView: 1.5,         //设置一屏可见的幻灯片slide数量
                        spaceBetween: 20,           //slide之间的距离（单位px）
                        centeredSlides: true,       //设定为true时，活动块会居中，而不是默认居左
                        loop:true,                  //是否循环，当只有一个slide时需要关闭
                        coverflow: {
                            rotate: 0,
                            stretch: 0,
                            depth: 20,
                            slideShadows : true
                        },
                        onInit : function(swiper){
                            //When Swiper init, it will copy the slide, set the real play container Id by slideIndex
                            $.each($('.ep-video-containor[data-aid]',$panelBox), function(index, dom){
                                var $dom = $(dom) , id = "egamePendant_" + index + '_' + $dom.data('aid') 
                                $dom.attr("id", id);
                                $dom.parent('a').attr('data-index',index)
                            });

                            cb.execute(swiper);
                        },
                        onSlideChangeEnd: function(swiper){
                            playContainer.clear();
                            _report('changeSlide');
                        }
                    });
                    return cb;
                }
                function initFold($parent, cb){
                    var ee = arguments.callee;
                    if(ee.fold){
                        cb && cb(ee.fold);
                        return ee.fold;
                    }

                    var $epBox = $panelBox.hide();
                    var $epBoxClone = $epBox.clone().attr('id','ep-box-clone').show().appendTo($parent);

                    var folded = new OriDomi('#ep-box-clone', {
                        vPanels:         2,
                        touchEnabled: false,
                        speed:500,
                        perspective:     500,
                        shadingIntesity: .5,
                    });

                    ee.fold = {
                        folded : folded,
                        $epBox : $epBox,
                        $epBoxClone : $epBoxClone
                    }

                    //Make sure OriDomi finish init
                    setTimeout(function(){
                        folded.foldUp(function(){
                            cb && cb(ee.fold);
                        });
                    },500);

                    return ee.fold;
                };
                function isMQQ(){
                    var ee = arguments.callee;
                    if(typeof ee.isMQQ === "undefined"){
                        ee.isMQQ = mqq && mqq.device && mqq.device.isMobileQQ();
                    }
                    return ee.isMQQ;
                };
                function autoMark(time){
                  time = time || 500;
                  exports.LoadingMark.show();
                  setTimeout(function(){
                    exports.LoadingMark.hide();
                  },time);
                };
            });
        });
    };
    
})(qv.zero, Zepto);