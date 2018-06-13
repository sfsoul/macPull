/**
 * @version   0.0.1
 * @author    zemwu
 * @date      2013-12-03
 * @modified  2013-12-03
 * @brief     会员官网活动数据上报
 */
;(function(window){
	var OZ = (function(){
		var _reportURL = ZProtoAdapter.url(zHttp.url) + '?_c=oz&oz_v=1';
		var _imgObjs = [];
		var _config = {
			actid: '', 	 		// 活动id
			actName: '', 		// 活动名称
			domainid: 101,	// 平台：web,client,android,iphone,ipad
			adtag: '',			// url参数ADTAG，默认自动获取
			stayTime: 0,		// 页面停留时长
			vendorType: ''		// 运营商类型【开通渠道】
		};

		var stay_time = (+new Date());
		// 获取adtag
		var aPars = location.search.substr(1).toLowerCase().match(/(^|\&)adtag=([^&]*)($|&)/);
		if (aPars && aPars[2]) {
			_config.adtag = encodeURIComponent(aPars[2]);
		}
		_config.adtag = (function(pageAdtag){
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
		})(_config.adtag);
		
		var ua = navigator.userAgent.toLowerCase();
		var pub = {};
		
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
		pub.ext = {
				resolution : screen.width + 'x' + screen.height,
				device : (function () {
					var domainId = 101, os = '', os_type = 'windows', device_type = 'PC';
					if(ua.indexOf('ipad') > -1){
						os = 'i' + ua.match(/os\s[\d_]+/)[0];
						domainId = 212;
						device_type = 'ipad';
						os_type = 'ipad';
					}else if(ua.indexOf('iphone') > -1){
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
						domainId = 204;
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
					
					_config.domainid = domainId;
					return {'os': os.replace(' ', '_'), 'os_type': os_type.replace(' ', '_'), 'device_type': device_type};
				})(),
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
							br = ua.match(/version\/([\d\.]+)/);
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
						id: br.replace(' ', '-'),
						type: browser_type
					};
				})()
			};
		
		/**
		 * 初始化参数，配置关键参数actid和actName（为空时不上报）
		 * @param object mKeyOrObj
		 * @param mixed	sValue
		 */
		pub.config = function(mKeyOrObj, sValue) {
			if(typeof mKeyOrObj == 'object'){
				for(var k in _config){
					if(!!mKeyOrObj[k]){
						_config[k] = mKeyOrObj[k];
					}
				}
			} else {
				if(_config[mKeyOrObj] !== undefined) {
					_config[mKeyOrObj]= sValue;
				}
			}

			var conf = {};
			for(var k in _config){
				conf[k] = _config[k];
			}
			return conf;			
		};
		function getAppid () {
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
		}
		
		/**
		 * 上报数据到OZ.isd.com
		 * 
		 * @param object oConfig
		 * {operType: '', 		// 操作类型: 抽奖，发放，投票，赠送，查询，支付，点击，开通流水等
		 * operDesc: '', 		// 操作的具体动作说明
		 * operID: '',			// 操作id：functionid/opid
		 * operCnt: 1,			// 操作次数，默认为1
		 * retID: 0,			// 返回码
		 * aid: '',				// 开通/续费会员的aid
		 * serviceType: '', 	// 消费代码
		 * payAmt: 0,			// 支付金额，单位分
		 * payDays: 0,			// 支付的时长，单位为天数
		 * itemID: '',			// 任务id/appid/itemid：可以是任务，某个道具，某个礼包
		 * itemNum: 0,			// 操作对象的数量
		 * itemSrc: '',			// item来源
		 * aim: '',			    // aim 活动目的
		 * pageindex : 1,		// 当前的页码默认是第一页
		 * restag: '',          // 排期id，用于统计活动的渠道
		 * v2 : '',				// 扩展字段，阅读是书籍id
		 * k2 : '',             // 业务类型
		 * toUin: ''} 			// 操作的接受方QQ，例如赠送好友
		 */
		pub.report = function(oConfig) {
			if (_config.actid.length == 0 || !_config.actid || _config.actName.length == 0) {
				return false;
			}
			
			oConfig = oConfig || {};
			
			var operType = oConfig.operType || '', 		
			operDesc = oConfig.operDesc || '', 
			operID = oConfig.operID || '',
			opid = oConfig.opid || 2,
			operCnt = oConfig.operCnt || 1,
			retID = oConfig.retID || 0,
			aid = oConfig.aid || '',
			serviceType = oConfig.serviceType || '',
			payAmt = oConfig.payAmt || 0,
			payDays = oConfig.payDays || 0,
			itemID = oConfig.itemID || '',
			itemNum = oConfig.itemNum || 0,
			itemSrc = oConfig.itemSrc || '',
			AMD = window['AMD_' + _config.actid] || {cfg : {aim : '0'}},
			aim = (AMD.cfg && AMD.cfg.aim) || '0',
			pageindex = (window.page || {pageindex: 1}).pageindex || 1,
			restag = /[?|&]restag=([^&]*)/.test(location.search) ? RegExp.$1 : '', //获取restag
			v2 = oConfig.v2 || '',
			k2 = oConfig.k2 || '',
			toUin = oConfig.toUin || '';
			
			var iPvsrc = oConfig.iPvsrc ||  0;
			var iPvsrc_id = oConfig.iPvsrc_id || 0;
			var iFrom = oConfig.iFrom || 0;
			var iFromId = oConfig.iFromId ||  0;
			if(!iPvsrc){
				try{
					var aPars = location.search.substr(1).match(/(^|\&)pvsrc=(\d+?)($|&)/);
					if(aPars && aPars[2]){
						iPvsrc = aPars[2];
					}
				}catch(e){}
			}
			if(!iPvsrc_id){
				try{
					var bPars = location.search.substr(1).match(/(^|\&)qz_gdt=([^&]+?)($|&)/);
					if(bPars && bPars[2]){
							iPvsrc_id = bPars[2];
						}
				}catch(e){}
			}
			if(!iFrom){
				try{
					var aPars = location.search.substr(1).match(/(^|\&)from=(\d+?)($|&)/);
					if(aPars && aPars[2]){
						iFrom = aPars[2];
					}
				}catch(e){}
			}
			if(!iFromId){
				try{
					var aPars = location.search.substr(1).match(/(^|\&)fromid=(\d+?)($|&)/);
					if(aPars && aPars[2]){
						iFromId = aPars[2];
					}
				}catch(e){}
			}
	
			operType = encodeURIComponent(operType);
			operDesc = encodeURIComponent(operDesc);
			serviceType = encodeURIComponent(serviceType);
			itemSrc = encodeURIComponent(itemSrc);
			
			_config.stayTime = parseInt(((+new Date()) - stay_time)/1000);
			stay_time = (+new Date());
			
			if (!aid && _config.adtag.length > 0) {
				aid = _config.adtag;
			}

			var url = [_reportURL,
			           "&act_id=", _config.actid, '&act_name=', encodeURIComponent(_config.actName), "&domain_id=", _config.domainid,
			           "&adtag=", _config.adtag, "&stay_time=", _config.stayTime, "&vendor_type=", encodeURIComponent(_config.vendorType),
					   "&oper_type=", operType, "&opid=", opid, "&oper_desc=", operDesc, "&clk=", operID, "&ret_id=", retID,
					   "&aid=", aid, "&service_type=", serviceType, "&pay_amt=", payAmt, "&pay_days=", payDays,
					   "&item_id=", itemID, "&item_num=", itemNum, "&item_src=", itemSrc, "&to_uin=", toUin, 
					   "&pid=", _config.actid, "&pvsrc=", iPvsrc, "&pvsrc_id=", iPvsrc_id, "&from=", iFrom, "&fromid=", iFromId,
					   "&browser_type=", pub.ext.browser.type, "&browser_id=", pub.ext.browser.id,
					   "&sys_ver_type=", pub.ext.device.os_type, "&sys_ver_id=", pub.ext.device.os, "&sys_ver_info=",
					   "&device_type=", pub.ext.device.device_type, "&resolution=", pub.ext.resolution,
					   "&appid=", getAppid(),"&aim=", aim, "&pageindex=", pageindex, "&v2=", v2, "&k2=", k2, '&restag=', restag,
					   "&t=", (new Date()).getTime()
				].join("");
			var logImg = new Image(1,1);
			logImg.src = url;
		
			setTimeout(function() {logImg = undefined;}, 10);
		}
		
		return pub;
	})();
	
	window.OZ = OZ;
	return OZ;
})(window);