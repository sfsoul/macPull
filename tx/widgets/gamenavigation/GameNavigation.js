/*
@name : mobile game navigation header
@auth : jijixu
@create : 2017-04-10
@dependence : stanceof Page & CallBack & cache & AmsEz
@exampale :

 //Render dom and data
    var gameNav = new qv.zero.GameNavigation({
        game : "sgame",         //gameName or appid
        renderWrapper : ".act-top>.act-content", //outer wrapper
        appendStyle : true
    });


 //Only render data
    var gameNav = new qv.zero.GameNavigation({
		appid : "12345676879", //gameName or appid
		afterInit : function(){
		var $focusHeader = $('#focusHeader');
		$('.fn-menu-nav-ul', $focusHeader).html( gameNav.menuCfg.html );
		var navCfg = gameNav.navCfg;
		var $navBtn = $('a.fn-focus-btn',$focusHeader).text( navCfg.btnText );
		if( ["gamePublicAccount","gcIndex"].indexOf( navCfg.name ) === -1 ){
			$('img.fh-icon',$focusHeader).attr('src', navCfg.icon );
			$('p.fh-main-title',$focusHeader).text( navCfg.mainTitle );
			$('p.fh-sub-title',$focusHeader).text( navCfg.subTitle );
		}
		gameNav.bindClick({ $focusHeader : $focusHeader, $navBtn : $navBtn });
		}
     });
	@modify by xx 2017-09-25
	@更新游戏号链接为企鹅电竞游戏直播
*/

;(function(exports, $){

	function GameNavigation(config){
		var _this = this;
		$.extend(this, config);
		this.appid = config.appid || getAppid(config.game);
		this.init().add(function(){
			_this.appendStyle && appendNavStyle();
			_this.renderWrapper && _this.bindClick({ $wrapper :  _this.renderHtml(_this.renderWrapper) });
			( typeof config.afterInit === "function") && config.afterInit(_this);
		});
		return this;
	};
	function getAppid(gameName){
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
	function getDependentData(){
		var cb = new exports.CallBack();
		var load = {
			"AMD_145427" : "//imgcache.gtimg.cn/ACT/vip_act/act_data/145427.json.js",
			"qv.zero.cache" : "cache",
			"qv.zero.EZ" : "AmsEz"
		};
		var dependence = [];
		page.addReadyFire(function(){
			$.each( load, function(path, url){
				// 判断全局对象下属性是否存在
				if( !zUtil.getValueFromObj(window, path) ){
					dependence.push(url);
				}
			});
			if(dependence.length){
				page.require(dependence, function(){
	   				cb.execute(window.AMD_145427);
	   			});
			}else{
				cb.execute(window.AMD_145427);
			}
		});
		return cb;
	};
	function getGameCfg( appid ){
		var cb = new exports.CallBack();
		appid = appid || getAppid();
		getDependentData().add(function(formData){
			var gameCfgObj = {};
			var allCfgArr = zUtil.getValueFromObj(formData,'form.2') || [];
			$.each(allCfgArr, function(index,cfg){  //获取当前菜单配置
				(appid == cfg['appid']) && (gameCfgObj = cfg)
			});
			cb.execute(gameCfgObj);
		});
		return cb;
	};
	function getMenuCfg( gameCfgObj ){
		var linkName, linkUrl, menuCfg=[], linkHTML="";
		for(var i=1; i<=10;i++){
		    if( (linkName = gameCfgObj['nav'+i]) && (linkUrl = gameCfgObj['nav'+i+'_link']) ){
		        zURL.appendParams({"ADTAG":"adtag.huodong.dh"},linkUrl);//添加统一的ADTAG
		        linkHTML+='<li><a data-url="'+linkUrl+'" href="javascript:void(0);">'+linkName+'</a></li>';
		        menuCfg.push({
		        	name : linkName,
		        	url : linkUrl
		        });
		    }
		};
		return {
			cfg : menuCfg,
			html : linkHTML
		};
	};
	function getNavCfg( gameCfgObj ){
		var appid = gameCfgObj.appid;
		var gamePublicId = gameCfgObj.puin;
		var gameIcon = gameCfgObj.cus_i || "//download.wegame.qq.com/gc/formal/common/"+appid+"/thumImg.png";
		var publicCfg = {
			mainTitle : gameCfgObj['gameName'],
			subTitle : gameCfgObj['sub_title'],
		};
		var navCfg = [
			{	//游戏中心动态插件
				"name" : "gcPlugin",
				"type" : "plugin",
				"id" : mqq.android ? "489" : "490",
				"icon" : "//imgcache.gtimg.cn/vipstyle/game/act/pagemaker_shine/145427/1481629523642/icon_top.png",
				"mainTitle" : "游戏中心",
				"subTitle" : "专业权威游戏资讯",
				"btnText" : "立即关注"
			},
			{	//公众号 QQ手游
			 	"name" : "mainPublicAccount",
				"type" : "publicAccount",
				"id" : "2747277822",
				"icon" : "//imgcache.gtimg.cn/vipstyle/game/act/pagemaker_shine/145427/1481629588260/syicon.png",
				"mainTitle" : "QQ手游",
				"subTitle" : "更多资讯,尽在QQ手游",
				"btnText" : "立即关注"
			},
			{	// 企鹅电竞直播页
				"name" : "gcIndex",		// 兼容旧活动主标题消失 bug
				"type" : "url",
				"id" : window.location.protocol + '//egame.qq.com/livelist?layoutid=' + appid + '&_wv=1',
				"icon" : gameIcon,
				"mainTitle" : gameCfgObj['gameName'],
				"subTitle" : gameCfgObj['sub_title'],
				"btnText" : gameCfgObj['btn_join'] 		//精彩资讯
			}
		];

		var customCfg = [{
			"hideMenu" : true,
			"name" : "customBtn",
			"type" : "url",
			"id" : gameCfgObj['cus_bu'],
			"icon" : gameIcon,
			"mainTitle" : gameCfgObj['gameName'],
			"subTitle" : gameCfgObj['sub_title'],
			"btnText" : gameCfgObj['cus_bt']
		}];
		// 当填写了自定义文案和 url 才会使用自定义配置
		return (gameCfgObj['cus_bt'] && gameCfgObj['cus_bu']) ? customCfg : navCfg;
	};
	function getStatus( cfg ){
		var cb = new exports.CallBack();
		switch(cfg.type){
			case "plugin" :
				GameNavigation.isOpenedPlugin(cfg, function(json){
					cb.execute(json);
				});
				break;
			case "publicAccount" :
				GameNavigation.isFocusedPublicAccount(cfg, function(json){
					cb.execute(json);
				});
				break;
			default :
				setTimeout(function(){
					cb.execute({ret:false});
				},0);
		}
		return cb;
	};
	function getCurrentStatus( navCfg ){
		var cb = new exports.CallBack();
		var orderCfg = navCfg.concat();
		var defaultCfg = orderCfg[orderCfg.length-1];
		var recursiveCall = function(){
			var cfg = orderCfg.shift();
			if( cfg ){
				getStatus( cfg ).add(function(json){
					if(json.ret){ //已经关注过则判断下一次序
						recursiveCall();
					}else{
						cb.execute(cfg); //当前所在的类型
					}
				});
			}else{
				cb.execute(defaultCfg); //默认类型
			}
		}
		recursiveCall();
		return cb;
	};
	function appendNavStyle(){
		var style = '#focusHeader{height:50px;background-color:rgba(0,0,0,0.8)}#focusHeader .fh-icon{position:absolute;left:10px;top:10px;width:30px;height:30px}#focusHeader .fh-main-title{position:absolute;left:50px;top:10px;width:130px;height:17px;line-height:17px;text-indent:1px;color:#FFF;font-weight:bold;font-size:14px}#focusHeader .fh-sub-title{position:absolute;left:50px;top:25px;width:150px;height:17px;line-height:17px;text-indent:1px;color:#FFF;font-size:11px}#focusHeader .fn-focus-btn{position:absolute;right:40px;top:13px;width:auto;height:14px;line-height:16px;padding:5px;text-indent:1px;color:rgb(0, 0, 0);border-radius:4px;cursor:pointer;background:rgb(227, 210, 166)}#focusHeader .fn-menu-btn{position:absolute;right:10px;top:16px;width:20px;height:20px}#focusHeader .fn-menu-btn>div{position:absolute;width:45%;height:40%;background:#D8D8D8;border-radius:20%}#focusHeader .fn-menu-btn-in-1{top:0;left:0;margin:0 5% 5% 0}#focusHeader .fn-menu-btn-in-2{top:0;right:0;margin:0 0 5% 5%;background:transparent !important}#focusHeader .fn-menu-btn-in-3{bottom:0;right:0;margin:5% 0 0 5%}#focusHeader .fn-menu-btn-in-4{bottom:0;left:0;margin:5% 5% 0 0}#focusHeader .fn-menu-btn-in-2>div{border-radius:20%;width:80%;height:80%;border:1px solid #D8D8D8}#focusHeader .fn-menu-nav{display:none;position:absolute;left:228px;top:32px;width:82px;overflow:hidden}#focusHeader .fn-menu-nav-arrow{position:relative;top:1px;left:65px;width:0;height:0;border:7px solid transparent;border-bottom:8px solid #3d4250}#focusHeader .fn-menu-nav-arrow nav ul{list-style-type:none;text-align:center;font-size:12px;background:rgba(61, 64, 79, .9);border-radius:4px}#focusHeader .fn-menu-nav-ul{border-radius:3%;overflow:hidden}#focusHeader .fn-menu-nav-ul a{color:#FFF;display:block;width:100%;height:35.5px;text-align:center;line-height:35px;font-size:12px;color:#fefefe;background:rgba(61, 64, 79, .9);position:relative}#focusHeader .fn-menu-nav-ul a:hover{color:rgb(227, 210, 166);transform:scale(1.2)}#focusHeader .fn-menu-nav-ul a:after{content:"";position:absolute;width:100%;height:1px;left:0;bottom:0;background:-webkit-linear-gradient(left, transparent 0,#898CA9 50%,transparent 100%);background:linear-gradient(to right,transparent 0,#898CA9 50%,transparent 100%)}';
		zUtil.appendStyle(style);
	};

	GameNavigation.prototype.init = function(){
		var cb = new exports.CallBack();
		var _this = this;
		// 获取游戏配置 -> 获取当前状态 -> 获取菜单配置
		getGameCfg( this.appid ).add(function(gameCfg){
			// 获取静态数据配置
			var navCfg = getNavCfg( gameCfg );		// 获取导航配置
			getCurrentStatus(navCfg).add(function( currentCfg ){
				_this.menuCfg =  $.extend(getMenuCfg(gameCfg),{"hideMenu":currentCfg.hideMenu});
				_this.report( ["nav",currentCfg.name].join("."), "exposure");
				_this.navCfg = currentCfg;
				cb.execute(true);
			});
		});
		return cb;
	};
	GameNavigation.prototype.renderHtml = function(el){
		var _this = this;
		var $el = $(el);
		var cfg = $.extend({}, this.navCfg, this.menuCfg );
		cfg.display = this.menuCfg.hideMenu ? "none" : "block";
		var html = '\
            <div data-isstatic="1" id="focusHeader">\
                <!--ICON图片-->\
                <img class="fh-icon readOnly" src="{icon}">\
                <!--主标题-->\
                <p class="fh-main-title readOnly">{mainTitle}</p>\
                <!--副标题-->\
                <p class="fh-sub-title readOnly">{subTitle}</p>\
                <!--关注按钮--> \
                <a class="fn-focus-btn readOnly" href="javascript:void(0)" data-puin="{puin}">{btnText}</a>\
                <!--导航按钮-->\
                <a class="fn-menu-btn readOnly" href="javascript:void(0)">\
                    <div class="fn-menu-btn-in-1"></div><div class="fn-menu-btn-in-2"><div></div></div><div class="fn-menu-btn-in-3"></div><div class="fn-menu-btn-in-4" ></div>\
                </a>\
                <!--导航菜单-->\
                <div class="fn-menu-nav" style="display:{display}">\
                    <div class="fn-menu-nav-arrow"></div>\
                    <nav>\
                        <ul class="fn-menu-nav-ul">\
                            <!--<li><a href="javascript:void(0);">示例</a></li>-->\
                            {html}\
                        </ul>\
                    </nav>\
                </div>\
            </div>';
        $el.html( zUtil.sprintf(html,cfg) );
        return $el;
	};
	GameNavigation.prototype.bindClick = function(args){
		var _this = this;
		var $wrapper = args.$wrapper || $('body');
		var $navBtn = args.$navBtn || $('a.fn-focus-btn',$wrapper);
		var $menuBtn = args.$menuBtn || $('.fn-menu-btn',$wrapper);
		var $menuList = args.$menuList || $('.fn-menu-nav', $wrapper);
		var $listBtn = args.$listBtn || $('.fn-menu-nav-ul', $menuList);

		$navBtn.click(function(){
            _this.navBtnClick();
        });

		/*if(this.menuCfg.hideMenu){
			return;
		}*/

		$menuBtn.click(function(){
            _this.report(["menu","btn"].join("."), "click");
            $menuList.toggle();
        });

		$listBtn.on('click','a',function(){
		    var url = $(this).data('url');
		    url && zUtil.loadUrl(url,0,1);
		    var index = Number($(this).parent().index());
		    _this.report(["menu","link",index].join("."), "click");
		});
	};
	GameNavigation.prototype.report = function( path, operType){
		operType = typeof operType === "number" ? operType : ({ "exposure":8, "click":12 }[operType] || 12);
		var ee = arguments.callee;
		var reportData  = ee.reportData;
		if(!reportData){
			reportData  = {
				"nav" : {
					"gcPlugin" : {oper_module : 511, oper_id : 202240, module_type : 51101},
					"mainPublicAccount" : {oper_module : 511, oper_id : 202241, module_type : 51102},
					"gamePublicAccount" : {oper_module : 511, oper_id : 202242, module_type : 51103},
					"gcIndex" : {oper_module : 511, oper_id : 202243, module_type : 51104},
					"customBtn" : {oper_module : 511, oper_id : 202244, module_type : 51105}
				},
				"menu" : {
					"btn" : {oper_module : 511, oper_id : 202245, module_type : 51106},
					"link" : [  ],
					"links" : {
						"base" : {oper_module : 511, module_type : 51106},
						"oper_id" : [202246, 202247, 202248, 202249, 202250, 202251, 202252, 202253, 202254, 202255]
					}
				}
			}
			//format link data
			var links = reportData.menu.links, arr=[];
			$.each( links.oper_id ,function(index,item){
				arr.push( $.extend({"oper_id":item}, links.base) );
			});
			reportData.menu.link = arr;
			ee.reportData = reportData;
		}
		var currentRdata = zUtil.getValueFromObj(reportData, path);
		currentRdata && exports.EZ && exports.EZ.report($.extend({oper_type:operType},currentRdata));
	};
	GameNavigation.prototype.navBtnClick = function( cfg, isReport ){
		cfg = cfg || this.navCfg;
		typeof isReport === "undefined" && (isReport = true);
		var cb = new exports.CallBack();
		switch(cfg.type){
			case "plugin" :
				GameNavigation.openPlugin(cfg.id, "开启游戏动态，获取更多礼包讯息", function(json){
					json && GameNavigation.operCache("write", cfg);
					cb.execute(json);
				});
				break;
			case "url" :
				zUtil.loadUrl(cfg.id, 0, 1);
				break;
			case "publicAccount" :
				GameNavigation.openPublicAccount(cfg.id);
				break;
			default :
				setTimeout(function(){
					cb.execute({ret:true});
				},0);
		}
		isReport && this.report( ["nav",cfg.name].join("."), "click");
		return cb;
	};
	GameNavigation.openPublicAccount = function (uin){
		var isQQ = mqq && mqq.device && mqq.device.isMobileQQ(); isQQ ? mqq.ui.showOfficalAccountDetail({uin:String(uin),showAIO:true}) : (window.location.href = window.location.protocol + '//share.mp.qq.com/cgi/share.php?uin='+uin+'&jumptype=1&card_type=public_account')
	};
	GameNavigation.openPlugin = function (id,msg,cb){
		mqq.invoke("lebaPlugin","showOpenDialog",{id:id,msg:msg,callback:mqq.callback(function(a){cb&&cb({ret:a.userOption==1})})});
	};
	GameNavigation.isOpenedPlugin = function (cfg, cb){
		cb = cb || function(){};
		var _this = this;
		var cache = this.operCache("read", cfg);
		if(cache || mqq.compare("5.7")<0){
			cb({ret: true});
		}else{
			mqq.invoke('lebaPlugin', 'getPluginStatus', {
				id: cfg.id,
				callback: mqq.callback(function (json) {
					var result = json.isOpen;
					result && _this.operCache("write", cfg);
					cb({ret: result});
				})
			});
		}
	};
	GameNavigation.isFocusedPublicAccount = function (cfg, cb){
		cb = cb || function(){};
		var _this = this;
		var cache = this.operCache("read", cfg);
		if(cache || mqq.compare("4.7")<0){
			cb({ret: true});
		}else{
			mqq.data.isFollowUin({uin:String(cfg.id)},function(json){
				var result = json.ret==0 && json.response && json.response.follow;
				result && _this.operCache("write", cfg);
				cb({ret: result});
			})
		}
	};
	GameNavigation.operCache = function( operType, cfg ){
		var key = "vipact_follow_" + cfg.type + "_" +cfg.id + "_" + (zUtil.getUin()||0);
		var operate = {
			write : function(key){
		        var day = 7;
		        var data = 1;
		        exports.cache.add(key, data, 1000 * 3600 * 24 * day);
		        return false;
		    },
		    read : function(key){
		        return exports.cache.get(key);
		    }
		};
		return operate[operType](key);
	};
	exports.Util.loadUrl = function(url, actid, newTab){
		exports.LoadingMark.show();
		setTimeout(function(){
		  exports.LoadingMark.hide();
		},500);
		setTimeout(function(){
        	url && zUtil.openUrl( url, actid || 0, newTab);
        },200);
	};
	exports.GameNavigation = GameNavigation;

})(qv.zero, Zepto);
