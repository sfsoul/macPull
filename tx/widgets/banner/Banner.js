/**
 *  banner.js
 *	运营页面banner的显示
 *	author:payneliu
 *	date: 201505 
 */
;(function(exports, $) {
	var ua = window.navigator.userAgent;
	var platCode     = /iphone|ipad|itouch/ig.test(ua)? 2 : 1;

	exports.Banner = Banner;

	function Banner(num, dom){
		this.Num = num;
		this.Dom = dom;
	}
	Banner.prototype.render = function() {
		var me = this;
		zUtil.require(['slip'], function(){
			if(me.data){
				render(me.data, me.Dom);
				initEvent(me.Dom, me.data.length);
			} else {
				getBanner(me.Num, function(json){
					if(json.result == 0){
						var data = json.data.banners, bannerpointer = {};
						me.data = getSimpleBannerData(structifyBannerData(data), bannerpointer);
						render(me.data, me.Dom);
						initEvent(me.Dom, me.data.length);
					} else {
						me.Dom.hide();
					}
				});
			}
		});
	};

	function initEvent(banmain, piccount){
		var _bannerSlipPlaying  = true;
		var _bannerSlipStopTimer= 0;
		var banMain = banmain;
		var picCount = piccount;
		var ban = banMain.find('.banner'), bannerSlip;

		function bindSlipEvent(){
			if(picCount > 1){
				bannerSlip = qv.zero.slip("page", ban.get(0), {
	                change_time : 3000,
	                num         : picCount + 2,
	                parent_wide_high: 320,
	                endFun:function(){
                        var that       = this;
                        var p          = that.page;
                        currentPic = (p + picCount - 1) % (picCount) + 1;
                        setTimeout(function(){
                            banMain.find('.focus li').removeClass("on").eq((p + picCount - 1) % (picCount)).addClass("on");
                            if (p == 0) {
                                that.toPage(that.num - 2);
                            } else if (p == that.num - 1) {
                                that.toPage(1);
                            }
                        },100);
                    }
	            });
		        bannerSlip.toPage(1);

		        function stopBannerPlay(e){
	                _bannerSlipPlaying=false;
	                bannerSlip.stopChange();
	            }
	            function stopBannerPlayTime(e){
	                if( !_bannerSlipPlaying ){
	                    bannerSlip.startChange();
	                    _bannerSlipPlaying=true;
	                }
	                clearTimeout(_bannerSlipStopTimer);
	                _bannerSlipStopTimer=setTimeout(stopBannerPlay,30000)
	            }
	            stopBannerPlayTime();
			} else {
				ban[0].style.webkitTransform = "translate3d(0px, 0px, 0px)";
                ban[0].style.width = 'auto';
			}
		}
		bindSlipEvent();

		banMain.on("click", '.item', function() {
			var url = this.getAttribute("data-pageurl");
			if(url){
				url += url.indexOf('?') > -1 ? '&sid=' : '?sid=';
				url += page.getSid();
				if(mqq && (mqq.iOS && mqq.compare('4.5') >= 0 || mqq.android && mqq.compare('4.6') >= 0)){
					mqq.ui.openUrl({url : url,target : 1})
				}else{
					window.location.href = url;
				}
			}
			bannerSlip && bannerSlip._transitionEnd({stopPropagation:function(){}});		//slipjs的bug, 点击事件会停止轮播
		});
	};

	function render(data, moduleDom){
		var html = [], len = data.length;
		for ( var i = -1, index; index = (i + len) % len, i < len + 1; i++ ) {
			html.push('<div class="item" data-pageurl="', data[index].pageUrl ,'">');
			html.push('<img src="', data[index].imgFullUrl, '" width="320" \/>');
			html.push('</div>');
			if (len == 1) { break; }
		}
		var ban = $('.banner', moduleDom).html(html.join('')).css('width', len > 1 ? ((len + 2) * 100 + '%') : '100%');
		html.length = 0;
		for(var i=0;i<len;i++){
			html.push('<li'+(i==0?' class="on"':'')+'></li> ')
		}
		$('.focus', moduleDom).html(html.join(''));
	};

	function structifyBannerData(data){
		var bannerdata = [];
		$.each(data, function(index, elem){
			var bannerGroup = {};
			var banners = elem.banners;
			$.each(banners, function(index, elem){
				bannerGroup[elem.imgFullUrl] = elem;
				elem.next = banners[(index+1)%banners.length].imgFullUrl;
			});
			bannerGroup.first = banners[0] && banners[0].imgFullUrl;
			bannerGroup.appid = elem.appid;
			bannerdata.push(bannerGroup);
		});
		return bannerdata;
	};
	function getSimpleBannerData( bannerdata, bannerpointer ){
		var simpleData = [];
		$.each(bannerdata, function(index, elem){
			var pointer = bannerpointer[elem.appid];
			if(!pointer || !elem[pointer]){
				pointer = bannerpointer[elem.appid] = elem.first;
			}
			simpleData.push(elem[pointer]);
		});
		return simpleData;
	};
	function getCSRFToken(){
		var hash = 5381, str = zUtil.getcookie('skey')||"";
		for (var i = 0, len = str.length; i < len; ++i) {
			hash += (hash << 5) + str.charCodeAt(i);
		}
		return hash & 0x7fffffff;
	};
	function createUrl(route, params){
		var defaultParams = {sid : zURL.get('sid')};
		var domain = 'gamecenter.qq.com';
		if (window.location.hostname.split('.').slice(-3).join('.') == '3g.qq.com') {
			domain = window.location.host;
		} else if(window.location.search.indexOf('&debug=') > -1 ||
				  window.location.search.indexOf('?debug=') > -1 ){
			domain = 'gamecentertest.cs0309.3g.qq.com';
		}
		return 'http://' + domain + route + '?' + $.param($.extend(true, {g_tk : getCSRFToken()}, defaultParams, params));
	};
	function getBanner(maxbannercount, callback){ //获取Banner的数据
		maxbannercount = maxbannercount || '5';
		var data = {
			module: 'gc_gameinfo_v2',
			method: 'getBanner',
			param: {
				"maxBannerCount": maxbannercount,
				tt : platCode
			}
		};
		$.ajax({
			url     : createUrl("/cgi-bin/gc_gameinfo_v2_fcgi"),
			data 	: {param : JSON.stringify({'key' : data })},
			cache   : false,
			dataType: 'json',
			timeout : 8,
			success : function(json){
				var data = json && json.data && json.data.key && json.data.key.retBody;
				if (data && data.result == 0 && data.data && data.data.banners && data.data.banners.length) {
					callback && callback(data);
				} else {
					callback && callback({
						result : 1,
						ret    : 1,
						msg    : "other"
					});
				}
			},
			timeout : function(json){
				callback && callback({
					result : 2,
					ret    : 2,
					msg    : "timeout"
				});
			},
			error 	: function(){
				callback && callback({
					result : 5,
					ret    : 5,
					msg    : "网络异常，请稍后再试！"
				});
			}
		});
	}
}(qv.zero, Zepto));