/**
* 游戏内嵌H5页面的处理
* @author payneliu
* @required zepto
* @date 2015年8月10日17:18:00
**/
(function(exports){
	
	function GetRequest(){
		var url = location.search.substr(1), theRequest = {}; 
		if (url) {
			var strs = url.split("&"), item;
			for(var i = 0, len = strs.length; i < len; i ++) {
				item = strs[i].split('=');
				theRequest[item[0]] = decodeURIComponent(item[1]);
			}
		}
		return theRequest;
	}

	//分析区服信息
	function Analysis(data){
		var info = data.split('_');
		return {
			partition : info[0],
			roleid : info[1]
		};
	}

	function getAppid(){
		var appid = 100692648, games = window.AMD_game, game = qv.zero.Page.instance.game;
		if(games && game){
			game = game.toLowerCase();
			for(var i in games){
				if(games.hasOwnProperty(i) && i.toLowerCase() === game){
					appid = games[i].a;
					break;
				}
			}
		}
		return appid;
	}

	function get_appid_cache(){
		if(appid) return appid;
		appid = getAppid();
		return appid;
	}

	var Request = GetRequest();
	var openId = Request['openId'],
		openKey = Request['openKey'],
		sessionId = Request['sessionId'],
		pf = Request['pf'],
		zoneId = Request['zoneId'] || '1',
		offerId = Request['offerId'],
		sessionType = Request['sessionType'], appid,
		area_info = Analysis(zoneId);
		initparam = sessionId === 'uin' ? function(args){
			args._u = openId;
			args._s = openKey;
		} : function(args){
			args.openid  = openId;
			args.openkey  = openKey;
			args.appid = get_appid_cache();
		};

	var Midas = exports.Midas = {
		payMonth : function(args){
			var serviceCode = args.serviceCode, serviceName = args.serviceName||'黄钻',
				cb = args.callback || function(){};
			MidasJSBridge.call('payMonth',
				{'offerId': offerId,'openId':openId,'openKey':openKey,'sessionId':sessionId,'sessionType':sessionType,'pf': pf,
					'pfKey':'pfKey', 'zoneId':zoneId,'acctType':'common','serviceCode': serviceCode,'serviceName': serviceName,'resData':''},
				function(data){
				    //此处处理回调
				    cb(data);
				}, '');
		},
		payGame : function(){

		},
		payGoods : function(){

		},
		paySubscribe : function(){

		},
		getVersion : function(cb){
			MidasJSBridge.call('getVersion', {'from':'h5'},
				function(data){
					cb(data);
				}, '');
		}
	};

	//处理请求后台时的区服信息
	/*	area : this.areaValue, platid : this.platId, zoneid : this.zoneid,
		partition : this.partition , roleid : this.role_id
	*/
	zHttp.bindRequestWidget({
		onReady : function(args){
			args.partition = area_info.partition;
			args.roleid = area_info.roleid;
			initparam(args);
		}
	});

})(qv.zero);