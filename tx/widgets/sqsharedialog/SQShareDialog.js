/**
	* 手Q中带有分享好友，分享空间的弹层
	* @author : kavinkhuang
	* @required  Zero,mqq
	* @date 2014年6月16日17:49:51
	* sid {String} 用户的登录态
	* summaryTxt {String} 弹层里面显示的文本内容
	* shareCfg {Object} 配置文件
	  shareCfg说明
	  friendsShare : {
						title 	  : 'QQ钱包1分钱抢10G流量',
						pagetitle : 'QQ钱包1分钱抢10G流量',
						imageUrl  : 'http://imgcache.gtimg.cn/ACT/svip_act/act_img/carsonpan/201405/1400742306_share.jpg',
						summary   : '',
						appid	  : 101032952,
						targetUrl : 'http://youxi.vip.qq.com/m/act/201406/ltcj.html?pvsrc=312',
						page_url  : 'http://youxi.vip.qq.com/m/act/201406/ltcj.html?pvsrc=312',
						desc	  : 'QQ钱包1分钱抢10G流量',
						name	  : 'QQ钱包'
					},
					qZoneShare : {
						title 	    : 'QQ钱包1分钱抢10G流量',
						summary     : '',
						url         : 'http://youxi.vip.qq.com/m/act/201406/ltcj.html?pvsrc=312',
						desc        : 'QQ钱包1分钱抢10G流量',
						site        : '手机QQ-QQ钱包',
						imageUrl    : 'http://imgcache.gtimg.cn/ACT/svip_act/act_img/carsonpan/201405/1400742306_share.jpg',
						successUrl  : 'http://youxi.vip.qq.com/m/act/201406/ltcj.html?pvsrc=312&sid={sid}',
						failUrl     : 'http://youxi.vip.qq.com/m/act/201406/ltcj.html?pvsrc=312&sid={sid}', // 分享成功之后回来的页面
						callbackUrl : 'http://youxi.vip.qq.com/m/act/201406/ltcj.html?pvsrc=312&sid={sid}'
					}
	**/
(function(exports){
	
	zHttp.loadCss('http://' + zUtil.widgetDomain  + zUtil.widgetPath + '/sqsharedialog/SQShareDialog.css');
	var SQShareDialog = function(sid,summaryTxt,shareCfg){
		if ($('#share-dialog').length || !sid) {
			return ;
		};
		this.sid = sid;
		this.shareCfg = shareCfg || {};
		this.summaryTxt = summaryTxt;
		var module = $(this.tmpl);
		this.ui = {
			wrap : module,
			closeBtn : module.find('.closeBtn'),
			content : module.find('.SQShare-content'),
			friendsShareBtn : module.find('.SQShare-friendsShareBtn'),
			qZoneShareBtn : module.find('.SQShare-qZoneShareBtn')
		};
		this.ui.content.html(summaryTxt);
		this.ui.wrap.appendTo( $('body') );
		this.init();
	};

	SQShareDialog.prototype = {
		constructor : SQShareDialog,
		tmpl : '<div class="SQShareDialog-style">\
					<div class="act-mask"></div>\
					<div class="act-dialog" id="share-dialog">\
					    <button class="close closeBtn"><span></span></button>\
					    <div class="inner SQShare-content">\
					    </div>\
					    <footer class="footer"><!--一个按钮时添加类 onebtn -->\
					        <button class="SQShare-friendsShareBtn">喊好友来参加</button>\
					        <button class="SQShare-qZoneShareBtn">分享到QQ空间</button>\
					    </footer>\
					</div>\
				</div>',
		apis : {
			shareFriends : 'http://openmobile.qq.com/api/check?page=shareindex.html&style=9&status_os=0&sdkp=0&nobar=1',
			shareQzone : 'http://openmobile.qq.com/api/check2?page=qzshare.html&loginpage=loginindex.html&logintype=qzone'
		},
		init : function(){
			this.regEvent();
		},
		regEvent : function(){
			var self = this;
			this.ui.closeBtn.on('click',function(){
				self._remove();
			});
			this.ui.friendsShareBtn.on('click',function(){
				self.shareToFriends();
			});
			this.ui.qZoneShareBtn.on('click',function(){
				self.shareToQzone();
			});
		},
		shareToFriends : function(){
			var cfg,url;
			cfg = this.shareCfg.friendsShare;
			cfg.nobar = 1;
			cfg.sid = this.sid;
			cfg.summary = this.summaryTxt;
			url = this.apis.shareFriends + '&' + $.param(cfg);
			this._remove();
			this.redicet(url);
		},
		shareToQzone : function(){
			var cfg,url;
			cfg = this.shareCfg.qZoneShare;
			cfg.summary = this.summaryTxt;
			cfg.successUrl = cfg.successUrl.replace('{sid}',this.sid);
			cfg.failUrl	= cfg.failUrl.replace('{sid}',this.sid);
			cfg.callbackUrl = cfg.callbackUrl.replace('{sid}',this.sid);
			cfg.sid = this.sid;
			url = this.apis.shareQzone + '&' + $.param(cfg);
			this._remove();
			this.redicet(url);
		},
		redicet : function(url){
			if (mqq && mqq.ui) {
				if (mqq.ui.openUrl) {
					mqq.ui.openUrl({
						url : url,
						target : 1,
						style : 1
					});
				} else {
					location.href = url;
				}
			} else {
				location.href = url;
			}
		},
		_remove : function(){
			this.ui.wrap.remove();
		}
	}
	exports.SQShareDialog = SQShareDialog;
})(qv.zero);