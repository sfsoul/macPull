/**
* 上报我参与的活动到游戏中心
* 2015-08-25 10:08:43
*/

;(function (exports) {

	if(zURL.get('debug') === '1'){
		var reportURL = 'http://gconlytest.3g.qq.com/cgi-bin/gc_user_activity_v2_async_fcgi';
	} else {
		var reportURL = '//gamecenter.qq.com/cgi-bin/gc_user_activity_v2_async_fcgi';
	}
	var tt = /iphone|ipad|itouch/ig.test(window.navigator.userAgent)? 2 : 1;
	var pid = exports.Page.instance.jsonid;
	var isreport = false;

	function getCSRFToken(){
		var hash = 5381, str = zUtil.getcookie('skey')||"";
		for (var i = 0, len = str.length; i < len; ++i) {
			hash += (hash << 5) + str.charCodeAt(i);
		}
		return hash & 0x7fffffff;
	};
	var reg1 = /\/m\/act\/\d{8,10}\//, reg2 = /\/m\/act\/\d{3}\//;
	var aid = '';
	
	zHttp.bindRequestWidget({onComplete : function(args, i, json){
		var href = window.location.href;
		if(!aid){
			try{ aid = qv.zero.Page.instance.pcfg.aid; }catch(e){ }
		}
		if(!(aid && (aid.indexOf('mvip.yx.sjyx') > -1 || aid.indexOf('mvip.youxi.sjyx') > -1))) return;
		if(reg1.test(href) || reg2.test(href)) return; //是否游戏内嵌页
		if(isreport || json.ret == 10004) return;
		isreport = true;

		var url = [reportURL,
	           '?param={"key": {"param": {"tt":', tt ,',"actId": "', pid,
	           '","source":1}, "module": "gc_user_activity_v2","method": "report_user_activity_record"}}&g_tk=', getCSRFToken()
		].join("");

		var logImg = new Image(1,1);
		logImg.src = url;
		setTimeout(function() {logImg = undefined;}, 10);
	}});

}(qv.zero));