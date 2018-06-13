/**
 * AmsEz.js
 * 运营活动上报模块 qv.zero.EZ
 * @version   0.0.1
 * @author    jijixu
 * @date      2016-11-11
 * @brief     会员运营活动数据上报 dc01441
 * @editor xiexun
 * @data 2017-8-16   1、修复批量上报问题；2、fix bug

	//-------- 外网曝光2个模块时 - POST --------
	qv.zero.EZ.report({
		oper_type : 8,
		page_deep : 100,
		page_height : 1000,
		request_type: 'post',		// 请求方式 post/get,默认为 get
		modules : [{
			oper_id : 0,
			oper_module : 358,
			module_cid : 179039338539,
			module_type : 0,
			loc_id : '20,34'
		},{
			oper_id : 0,
			oper_module : 359,
			module_cid : 179039338540,
			module_type : 0,
			loc_id : '40,55'
		}]
    });

	//-------- 外网点击1个模块时 - GET --------
	- 场景一：需要上报返回码的点击操作(合并在OZ上报中)
	var data = qv.zero.EZ.getClickData2Oz( $dom, {module_cid : somevalue} )
	zHttp.send( {actid: actid , ... , ezReportData : data} );
	- 场景二：独立上报
	var data = qv.zero.EZ.getClickData2Oz( $dom, {module_cid : somevalue} )
	qv.zero.EZ.report(data);
	或者
	qv.zero.EZ.report({
		oper_type : 12,
		obj_id : 12345,
		ret_id : 0,
		oper_id : 0,
		oper_module : 358,
		module_cid : 179039338539,
		module_type : 0,
		loc_id : '20,34'
    });
*/
;(function(exports){

	/*
	* 获取上报配置
	* oper_type : 1下载 3启动 12点击 8曝光 18内网创建
	* 曝光行为的数据上报方式为POST，且http/https的上报地址皆为 http.iyouxi3
	* 其他行为的数据上报方式为GET，上报地址根据协议切换
	*/
	var getReportCfg = function(data){
		var _reportURL = ZProtoAdapter.url(zHttp.url) + '?_c=ez';
		if(data.modules && data.modules instanceof Array) {
				_reportURL += '&_f=exposureReport';
		}
		return {
			url :　_reportURL
		};
	};
	var page = exports.Page.instance || window.page || {};
	var time = {
		entryTime : +new Date(),
		getStayTime : function(){
			return parseInt(((+new Date()) - this.entryTime)/1000);
		}
	};
	var urlTools = {
	    unserialParams : function (paramstr) {
	        paramstr = paramstr || location.search.substring(1).toLowerCase();
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
		get : function(name, url) {
		    if(!url && !this.paramsMap){
		        this.paramsMap = this.unserialParams();
		    }else if(url){
		        var index = url.indexOf('?');
		        return this.unserialParams( index !== -1 ? url.substr(index+1) : url )[name];
		    }
		    return encodeURIComponent( name ? (this.paramsMap[name]||'') : this.paramsMap );
		}
	};
	var debug = urlTools.get('test') == zUtil.getUin() && urlTools.get('debug');
	var adtag = (function(){
		var _adtag = urlTools.get('adtag');
		//取到adtag后再进一步过滤
		_adtag = (function(pageAdtag){
			try {
				if (pageAdtag) {
					//TODO 判断ADTAG的合法性
					if (pageAdtag.indexOf("CLIENT.QQ") == 0) {
						pageAdtag = pageAdtag.substring(pageAdtag.indexOf('_') + 1, pageAdtag.lastIndexOf("."));
						if (pageAdtag == "") {
							pageAdtag = "pcqq";
						}
					}
				} else {
					var pageReferer = document.referrer;
					var pageRefererA = document.createElement('a');
					// 有Referer取Referer，无Referer则取当前页面地址
					if (pageReferer != "") {
						pageRefererA.href = pageReferer;
					} else {
						pageRefererA.href = location.href;
					}
					// hostname和pathname作为ADTAG值
					if (navigator.appName == "Microsoft Internet Explorer") {
						pageAdtag = pageRefererA.hostname + "/" + pageRefererA.pathname;
					} else {
						pageAdtag = pageRefererA.hostname + pageRefererA.pathname;
					}
				}
			} catch (err) {}

			return pageAdtag;
		})(_adtag);
		return _adtag;
	})();
	var hardware = (function(){
		var ua = navigator.userAgent.toLowerCase();
		/*获取硬件信息
			return
			{
				resolution : 640x780,
				device : {
					domain_id:211,
					os: "ios_9_3_2",
					os_type: "iphone",
					device_type: "iphone"
				},
				browser : {
					id: "chrome-49",
					type: "chrome"
				}
			}
		*/
		return {
			//分辨率
			resolution : screen.width + 'x' + screen.height,

			//取得设备型号 ：操作系统版本 + 操作系统类型 + 设备类型
			//{'domain_id':1,os: "ios_9_3_2", os_type: "iphone", device_type: "iphone"}  | {'domain_id':3,os: "windows_7", os_type: "windows", device_type: "PC"}
			device : (function () {
				/**
					domain id:
					101 web
					102 客户端
					200 能识别是手持设备，但识别不了详细信息
					201 android phone
					202 android pad
					211 iphone其他
					212 ipad
					213 iPod touch
					214 iphone4
					215 iphone4s
					216 iphone5
					220 发展到iphone20时用
					230 Symbian
					240 WindowsPhone
					250 BlackBerry
				*/
				var domainId = 101, os = '', os_type = 'windows', device_type = 'PC';
				if(ua.indexOf('ipad') > -1){
					os = 'i' + ua.match(/os\s[\d_]+/)[0];
					domainId = 212;
					device_type = 'ipad';
					os_type = 'ipad';
				}else if(ua.indexOf('iphone') > -1){
					domainId = 211;
					os = 'i' + ua.match(/os\s[\d_]+/)[0];
					device_type = 'iphone';
					os_type = 'iphone';
				}else if(ua.indexOf('ipod') > -1){
					os = 'i' + ua.match(/os\s[\d_]+/)[0];
					domainId = 213;
					device_type = 'ipod';
					os_type = 'ipod';
				}else if(ua.indexOf("macintosh") != -1 || ua.indexOf("mac os x") != -1){
					os_type = 'mac';
					os = 'mac os';
				}else if( ua.indexOf('android')>-1){
					os = ua.match(/android\s[\d\.]+/)[0];
					domainId = 201;
					device_type = 'android';
					os_type = 'android';
				}else if( ua.indexOf('windows phone') > -1){
					os = ua.match(/windows phone \d+/)[0];
					domainId = 240;
					device_type = 'windows phone';
				}else if(ua.indexOf("nt 6.1") > -1  ){
					os = 'windows 7';
				} else if(ua.indexOf("nt 6.0") > -1 ){
					os = 'vista';
				} else if(ua.indexOf("nt 5.2") > -1){
					os = 'windows 2003';
				}else if(ua.indexOf("nt 5.1") > -1 ){
					os = 'windows xp';
				}else if(ua.indexOf("nt 5.0") > -1 ){
					os = 'windows 2000';
				}else if( ua.indexOf("windows") != -1 || ua.indexOf("win32") != -1){
					os = 'windows'
				}else if( ua.indexOf('series') > -1 ){
					os = 'Series40';
					domainId = 230;
				}else if( ua.indexOf('symbianos') > -1 ){
					os = 'Series60';
					domainId = 230;
				}else if(ua.indexOf('blackberry') > -1){
					os = ua.match(/blackberry\s[\d_]+/)[0];
					domainId = 250;;
				}else if(ua.indexOf('playbook') > -1){
					os = 'PlayBook' + ua.match(/RIM Tablet OS\s[\d_]+/)[0];
					domainId = 250;
				}else if(/bb(\d+)/.test(navigator.userAgent.toLowerCase())){
					os = ua.match(/bb\d+/)[0];
					domainId = 250;
				}else if(ua.indexOf("linux") != -1){
					os = 'linux';
					os_type = 'linux';
				}else {
					os = 'other';
				}
				return {'domain_id':domainId,'os': os.replace(' ', '_'), 'os_type': os_type.replace(' ', '_'), 'device_type': device_type};
			})(),

			//取得浏览器类型
			//{id: "chrome-49", type: "chrome"}
			browser :(function () {
				var br = '', browser_type = '';
				try{
					if(ua.indexOf('msie') > -1){
						browser_type = 'ie';
						if( ua.indexOf('qqbrowser') > -1) {
							br = ua.match(/qqbrowser[\/\s]([\d\.]+)/);
							br = 'qqbrowser_ie ' + parseInt(br[1]);
						}else if( ua.indexOf('se 2.x metasr 1.0.') > -1){
							br = 'SouGou_ie';
						}else if (ua.indexOf('maxthon') > -1){
							br = 'maxthon_ie';
						}else{
							br = ua.match(/msie\s([\d\.]+)/);
							br = 'ie ' + parseInt(br[1]);
						}
					}else if(ua.indexOf('opera') > -1){
						browser_type = 'opera';
						br = ua.match(/opera[\/\s]([\d\.]+)/);
						br = 'opera ' + parseFloat(ua.match(/opera[\/\s]([\d\.]+)/)[1]);
					}else if(ua.indexOf('firefox') > -1){
						browser_type = 'firefox';
						br = ua.match(/firefox\/([\d\.]+)/);
						br = 'firefox ' + parseInt(br[1]);
					}else if( ua.indexOf('chrome') > -1){
						browser_type = 'chrome';
						if( ua.indexOf('qqbrowser') > -1){
							br = ua.match(/qqbrowser[\/\s]([\d\.]+)/);
							br = 'qqbrowser_webkit ' + parseInt(ua.match(/qqbrowser[\/\s]([\d\.]+)/)[1]);
						}else if (ua.indexOf('se 2.x metasr 1.0.') > -1){
							br = 'SouGou_webkit';
						}else if (ua.indexOf('maxthon') > -1){
							br = 'maxthon_webkit';
						}else{
							br = ua.match(/chrome\/([\d\.]+)/);
							br = 'chrome ' + parseInt(br[1]);
						}
					}else if( ua.indexOf('safari') > -1){
						browser_type = 'safari';
						br = ua.match(/version\/([\d\.]+)/) || [0,0];
						br = 'safari ' + parseInt(br[1]);
					}else{
						browser_type = 'other';
						br = 'other';
					}
				}catch(e){
					browser_type = 'other';
					br = 'other'; 
				}

				return {
					id: (br+""||"").replace(' ', '-'),
					type: browser_type
				};
			})(),

			//Webview内核版本
			tbs_ver : (function () {
				var re = /\s+TBS\/(\d+)\s/;
				var m;
				if(m = ua.match(re)){
					if(m && m[1]){
						return m[1];
					}
				}
				return null;
			})()
		};
	})();
	var getAppid = function(){
		function innerFn() {
			if(!window.qv || !qv.zero || !qv.zero.Idip){
				return '';
			}
			var idip = qv.zero.Idip;
			if(window.page && page.pcfg && page.pcfg.g){
				return idip[(page.pcfg.g).toLowerCase()].appid;
			}else{
				for(var i in idip){
					if(idip[i].appid){
						return idip[i].appid;
					}
				}
				return '';
			}
		}
		var appid = innerFn();
		getAppid = function(){
			return appid;
		}
		return appid;
	};
	var setMqqInfo = function(data){
		var ee = arguments.callee;
		if(ee.init){
			return;
		}
		ee.init=true;
		try{
			mqq.device.isMobileQQ(function(isMqq){
				if(isMqq){
					// mqq_ver
					data.mqq_ver = mqq.QQVersion || 0;
					// net_type
					mqq.device.getNetworkType(function(result){
						var net_type = ({
							1 : 'WiFi',
							2 : '2G',
							3 : '3G',
							4 : '4G'
						})[+result] || 'unknow';
						data.net_type = net_type;
					});
					// imei | ROM
					/*mqq.device.getDeviceInfo(function(result){
						data.imei = result && result.identifier ? result.identifier : 0;
						data.rom = result && result.incremental ? result.incremental : 0;
					});*/
				}
			});
		}catch(e){}
	};
	var setPageInfo = function(data){
		var ee = arguments.callee;
		if(ee.init){
			return;
		}
		ee.init=true;
		data.pro_id = (page.pcfg && page.pcfg.rid) || page.jsonid || 0;
		data.pro_name = (page.pcfg && page.pcfg.n) || '';

		var AMD = window['AMD_' + data.pro_id] || {cfg : {aim : '0'}},
		aim = (AMD.cfg && AMD.cfg.aim) || '0';
		data.aim = aim;
	};
	//所有上报字段
	var data = {
		//-----------------公共字段-----------------
			//模版类型
			ext1 : window._templateid || '',
			//业务ID - 运营活动固定为8
			business : 8,
			//页面标识 - 运营活动固定为804
			page : 804,
			//项目ID
			pro_id : 0,//(page.pcfg && page.pcfg.rid) || page.jsonid || 0,
			//项目名
			pro_name : '',//(page.pcfg && encodeURIComponent(page.pcfg.n)) || '',
			//[URL]来源
			adtag : adtag || '',
			//[URL]来源
			pvsrc : urlTools.get('pvsrc') || '',
			//[URL]来源
			//pvsrc_id : urlTools.get('qz_gdt') || 0,
			//[URL]来源
			from : urlTools.get('from') || '',
			//[URL]来源
			//from_id : urlTools.get('fromid') || 0,
			//Webview内核版本
			tbs_ver : hardware.tbs_ver,
			//分辨率 - 640x780
			resolution : hardware.resolution || '',
			//浏览器类型 - "chrome"
			browser_type : hardware.browser.type,
			//浏览器版本 - "chrome-49"
			browser_id : hardware.browser.id,
			//操作系统类型 - "iphone"
			sys_ver_type : hardware.device.os_type,
			//操作系统版本 - "ios_9_3_2"
			sys_ver_id : hardware.device.os,
			//操作系统版本信息
			//sys_ver_info : 0,
			//设备类型 - "iphone"
			device_type : hardware.device.device_type,
			//(映射后的)设备平台ID
			domain_id : hardware.device.domain_id,
			//网络类型 - setMqqInfo(data) - wifi|4G|3G|默认unknow
			net_type : 'unknow',
			//QQ版本 - setMqqInfo(data)
			mqq_ver : 0,
			//IMEI - setMqqInfo(data)
			//imei : 0,
			//ROM - setMqqInfo(data)
			//rom : 0,
			//游戏APPID
			appid : getAppid(),
			//活动目的 setAim(data) - 依赖项目ID
			aim : 0,
			//页面停留时间 - time.getStayTime() - (上报时的时间 reportTime)减(进入页面时的时间 entryTime)
			stay_time : 0,
			//操作上报时间 - (new Date()).getTime()
			oper_timestamp : 0,

		//-----------------行为字段-----------------
			//[传参]操作类型ID(oper_type_id) - 1下载 3启动 12点击 8曝光 18内网创建 - (原取参数.operType如"访问")
			oper_type : 0,
			//[传参]操作模块功能ID(oper_module_id) - 取节点data-modid - (原opid默认2例如页面的Tab，例如：1、精品游戏，2、游戏详情，5、礼包活动)
			oper_module : 0,
			//[传参]操作ID - 取节点data-expid或clkid - (原clk字段functionid或opid)
			oper_id : 0,
			//[传参]对oper_type的具体描述 - "访问页面" - 取参数.operDesc
			//oper_desc : 0,

			//[传参]模块功能分配的固定id(取节点的data-modid) - 该模块已由oper_module代替
			//module_id : 0,
			//[传参]模块创建cid(取模块创建时间data-createtime)
			module_cid : 0,
			//[传参]模块状态 - 取节点data-modtype - (由业务设置节点状态，默认0) - 如1下载态\2启动态
			module_type : 0,

		//-----------------曝光行为字段-----------------
			//曝光模块数组集 - POST - [{module_id : 358,module_cid : 179039338539,module_type : 0,loc : '20,34'},{module_id : 359,module_cid : 179039338540,module_type : 0,loc : '40,55'}];
			modules : undefined,
			//[传参]页面浏览深度
			page_deep : 0,
			//[传参]页面高度
			page_height : 0,
			//[传参]操作模块的位置 top,left
			loc_id : "",

		//-----------------点击行为字段-----------------
			//操作对象ID
			//obj_id : 0,
			//对obj_id的描述
			//obj_type : ''
			//[传参]子活动名 - [暂无使用]
			//act_name : 0,
			//[传参]对象ID，如子活动ID
			obj_id : 0,
			//[传参]对象类型，对obj_id的补充描述
			obj_type : "",
			//[传参]返回码 - 默认0
			ret_id : 0,

		//-----------------保留字段-----------------
			//当前的页码 - 默认是第一页 - [暂无使用]
			//pageindex : (window.page || {pageindex: 1}).pageindex || 1,
			//运营商类型(开通渠道) - [暂无使用]
			//vendor_type : 0,
			//[传参]开通/续费会员的aid(若无传参则取adtag) - [暂无使用]
			//aid : "",
			//[传参]消费代码 - [暂无使用]
			//service_type : "",
			//支付金额，单位分 - [暂无使用]
			//pay_amt : "",
			//支付的时长，单位为天数 - [暂无使用]
			//pay_days : "",
			//任务id/appid/itemid：可以是任务，某个道具，某个礼包 - [暂无使用]
			//item_id : "",
			//操作对象的数量 - [暂无使用]
			//item_num : "",
			//item来源 - [暂无使用]
			//item_src : "",
			// 操作的接受方QQ，例如赠送好友 - [暂无使用]
			//to_uin : "",
	};

	var EZ = {
		init : function(config) {
			setPageInfo(data);
			setMqqInfo(data);

			var _config = {};
			for(var k in data){
				_config[k] = data[k];
			}

			if(typeof config == 'object'){
				for(var k in _config){
					if(!!config[k]){
						_config[k] = config[k];//update
					}
				}
			}
			_config.pro_name = encodeURIComponent(_config.pro_name);
			_config.obj_type = encodeURIComponent(_config.obj_type);
			_config.stay_time = time.getStayTime();
			_config.oper_timestamp = +new Date();
			return _config;
		},
		report : function(config){
			var me = this;
			try{
				var reportFunc = config.request_type ? me[config.request_type] : me['get'];
				var data = me.init(config);
				var reportCfg = getReportCfg(data);
				var url = reportCfg.url;
				var modules = data.modules;
				delete data.modules;
				for(var i in data){
					url += '&'+i+'='+data[i];
				}
				if( !(modules && modules instanceof Array) ){
					modules = [];
				}
				me.debug([reportCfg.type,url,modules]);
				reportFunc.call(me, url, modules);
			}catch(e){}
		},
		debug : function(arr){
			if(debug){
				alert(JSON.stringify(arr));
			}
		},
		mqq : function(url,data){
			var me = this;
			try{
				mqq.data.fetchJson({
				    url: url,
				    params : {'modules':data},
				    options: {
				    	method: "POST"
				    }
				}, function(responseText, context, statusCode){
				    me.debug(arguments);
				});
			}catch(e){}
		},
		post : function(url,data){
			var me = this;
			$.ajax({
				url: url,
				data: {'modules':data},
				cache: false,
				type : "POST",
				dataType: 'json',
				beforeSend : function(xhr){
						xhr.withCredentials = true;
				},
				success: function(json){
					me.debug(arguments);
				},
				error: function(jqXHR, statusText, errorText){
					me.debug(arguments);
				}
			});
		},
		get : function(url){
			var logImg = new Image(1,1);
			logImg.src = url;
			setTimeout(function() {logImg = undefined;}, 10);
		},
		/*
		* 获取点击时节点上的个性化上报数据
		*	$dom : 个性化数据所在的JQuery节点
		*	customData : 对个性化数据的修正
		*	notMapFields : 是否映射上报字段
		*/
		getClickData2Oz : function($dom, customData, notMapFields){
			var getDomData = function($dom){
				return {
					oper_module : $dom.attr('data-modid') || 0,
					module_type : $dom.attr('data-modtype') || 0,
					oper_id : $dom.attr('data-operid') || 0,
					module_cid : $dom.attr('data-createtime') || 0,
					loc_id : [ (parseInt($dom.css('top')) || 0), (parseInt($dom.css('left')) || 0) ].join(','),

					oper_type : 12,
					obj_type : 'actid'
				}
			};
			var mapClickData = function(fullData){
				/*
				* mapData 映射上报字段
				* 跟原有字段冲突需重新映射，最终合并在OZ的上报URL参数中
				*/
				var mapData = {
					//业务ID
					"business" : '_busi',
					//页面表示
					"page" : '_page',
					//操作类型 1下载 3启动 12点击 8曝光 18内网创建
					"oper_type" : '_optype',
					//操作对象描述
					"obj_type" : '_objtype',

					//Webview内核版本
					"tbs_ver" : '_tbsv',
					//QQ版本
					"mqq_ver" : '_mqqv',
					//操作模块的功能ID
					"oper_module" : '_opmod',
					//操作ID
					"oper_id" : '_opid',
					//模块状态类型ID
					"module_type" : '_modt',
					//模块创建CID
					"module_cid" : '_modcid',
					//模块位置 (top,left)
					"loc_id" : '_locid',
					//操作时间戳
					"oper_timestamp" : '_optime',
					//模版类型
					"ext1" : '_tname',
					//停留时间 (进入页面到上报所停留的时间 单位:秒)
					"stay_time" : '_stime',
				}
				var clickData = {};

				$.each( mapData, function(i,d){
					clickData[d] = fullData[i] || ''
				});

				return clickData;
			}
			customData = typeof customData === 'object' ?  customData : {};
			var config = this.init(), moduleData = {};
			if($dom){
				moduleData = getDomData($dom);
			}

			var result;
			if(notMapFields){
				result = $.extend(config,moduleData,customData);
			}else{
				result = mapClickData( $.extend(config,moduleData,customData) );
			}
			return result;
		}
	};
	exports.EZ = EZ;
})(qv.zero);
