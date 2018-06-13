/**
 * 在页面显示惊喜连接的组件
 * @author payneliu
 * @version 1.0
 * @date 2014-11-20
 * @requires Zepto
 * @name qv.zero.Surprise
 * @namespace
 */
 ;(function(exports, $) {
 	function getPath(url){
 		var index = url.indexOf('?');
 		if(index > -1){
 			return url.substring(0, index);
 		} else {
 			return url;
 		}
 	}
 	function getFileName(purl){
 		var path = getPath(purl);
 		return path.substring(path.lastIndexOf('/') + 1);
 	}
 	function equalUrl(url1, url2){ //url相等
 		return getPath(url1) === getPath(url2);
 	}
 	function inbwlist(bwlist, url){
 		if(bwlist.length === 0) return true;
 		var path = getPath(url);
 		return bwlist.filter(function(i){ return path.indexOf(i) > -1 }).length > 0;
 	}
 	function showGJ(data){
 		var url = data.url, jumpUrl = data.jumpUrl, imgUrl = data.imgUrl, style = data.style, conn = data.conn, bwlist = data.bwlist;
 		conn = Array.isArray(conn) ? conn : [];
 		bwlist = Array.isArray(bwlist) ? bwlist : [];
 		if(conn.indexOf(getFileName(url)) === -1 && url.indexOf('http://youxi.vip.qq.com/m/act') > -1 && inbwlist(bwlist, url) &&
 		   jumpUrl && imgUrl && !equalUrl(url, jumpUrl)){
 			var $body = $(document.body), html;
			style = style || 'right:15px;top:250px;height:78px;z-index:20;width:64.5px;background-size:64.5px auto;';
			html = "<div id='my_surprise' style='position:fixed;background-repeat:no-repeat;background-image:url({imgUrl});{style}'></div>";
			html = html.replace('{style}', style);
			html = html.replace('{imgUrl}', imgUrl);
 			$body.append(html);
 			jumpUrl += jumpUrl.indexOf('?') > -1 ? '&sid=' : '?sid=';
 			$("#my_surprise").click(function(){
	 			try{
	 				window.location = jumpUrl + page.getSid();
	 			} catch(e){}
	 		});
 		}
 	}

 	$(function(){
		var time = 0, timeHandle = setInterval(function(){
			if(time >= 3){ clearInterval(timeHandle); return; };time++;
			if(window.AMD_ams){
				clearInterval(timeHandle);
				try{
					var config = zMsg.getRetMsg(0, '__guajian__');
					if(!config) return;
					var data = eval('(' + config.m.replace(/&#39;/g, '\'') + ')');
					showGJ({
						url : window.location.href,
						jumpUrl : config.l,
						imgUrl : config.b,
						style : data.style,
						conn : data.conn,
						bwlist : data.bwlist
					});
				} catch(e){}
			}
		}, 100);
 	});
 })(qv.zero, Zepto);