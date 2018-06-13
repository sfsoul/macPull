/**
 * @class qv.zero.PublicFooter
 * @author yandeng
 * @name qv.zero.PublicFooter(config);
 * @description 公共底部
 * @version 1.0
 * @time 2014-11-20
 * @param config
 * @param {String} bgImg 背景图片
**/
;(function (exports,$) {
	var PublicFooter = function () {
		this.bgImgUrl = 'http://imgcache.gtimg.cn/vipstyle/mobile/tmpl/common/img/bg_6.jpg';
		this.msgHtml = '<img src="{bgImg}" width="320">\
				<a type="button" class="recom-btn" href="javascript:;">参与</a>\
				<div class="act-recom">\
					<div class="recom-thumb">\
	                  	<span style="background-image:url({appidImg}?100*100)"></span>\
	              	</div>\
		            <div class="recom-info">\
	                  <h4>{app_name}</h4>\
	                  <p>{title}</p>\
	                  <p>{desc}</p>\
		            </div>\
				</div>';
		this.loadCss();
	    this.show();
	    
	}
	PublicFooter.prototype = {
		show : function () {
			var me = this;
			page.addReadyFire(function () {
				var appid = qv.zero.Idip[page.game]['appid'];
				var bgImg = $('.PublicFooter').data('bgimg');
				zHttp.send({_c:'GameCenter', _f:'GameRecommend', appid:appid,sid : page.getSid()},function (json) {
					var gameMessage = json.data[0];
					gameMessage.url = gameMessage.url.replace(/{sid}/g,page.getSid());
					gameMessage.bgImg = (bgImg || me.bgImgUrl).replace(/^\s*https?:/, window.location.protocol);
					gameMessage.appidImg = '//download.wegame.qq.com/gc/formal/common/' + gameMessage.appid + '/thumImg.png';
					me.msgHtml = zUtil.sprintf(me.msgHtml,gameMessage);
					$('.PublicFooter').html(me.msgHtml);
					me.modelOz();
					page.bindClick('.recom-btn',function () {
						OZ.report({operType: '点击' , operDesc: '推荐游戏'});
						window.location.href = gameMessage.url;
					});
				});
			});
		},
		loadCss : function () {
			$('<link>').attr({
				type : 'text/css',
				rel : 'stylesheet',
				href : '//imgcache.gtimg.cn/vipstyle/mobile/tmpl/common/css/style.css'
			}).appendTo('head');
		},
		modelOz : function () {
			var growFlag = true;
			//测试滚动加载
			$(window).on('scroll',function () {
				var modelTop = $('.PublicFooter').offset().top + $('.PublicFooter').height();
				var windowPageYOffset = $(this).scrollTop();
				var windowPageYOffsetAddHeight = windowPageYOffset + $(this).height();
				if (growFlag) {
					if (modelTop >= windowPageYOffset && modelTop <= windowPageYOffsetAddHeight) {
						growFlag = false;
						OZ.report({operType: '曝光' , operDesc: '推荐游戏曝光'});
					}
				}
			});
		}
	}
	new PublicFooter();

})(qv.zero,Zepto);