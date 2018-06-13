/**
 * @description 提示弹出层
 * @class qv.zero.Dialog
 * @author: yandeng
 * @require: qv.zepto
 * @date 2016年07月15日
**/
(function($){
	zUtil.appendStyle('@charset "utf-8";article,aside,blockquote,body,button,code,dd,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,input,legend,li,menu,nav,ol,p,pre,section,td,textarea,th,ul{margin:0;padding:0}body{font-family:"Helvetica Neue",Helvetica,STHeiTi,sans-serif;line-height:1.5;font-size:14px;color:#000;background-color:#f8f9fa;-webkit-user-select:none;-webkit-text-size-adjust:none;-webkit-tap-highlight-color:rgba(255,255,255,0);outline:0}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:400}table{border-collapse:collapse;border-spacing:0}fieldset,img{border:0}li{list-style:none}button,input,textarea{font-family:inherit;font-size:inherit;font-weight:inherit;border:0;background:0 0;-webkit-appearance:none;outline:0}button:focus,input:focus,textarea:focus{outline:0;-webkit-tap-highlight-color:transparent}a{-webkit-touch-callout:none;text-decoration:none;color:#00a5e0;outline:0}em,i{font-style:normal}::-webkit-input-placeholder{color:#999}.common-mod-dialog{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.4);display:-webkit-box;-webkit-box-align:center;-webkit-box-pack:center}.common-dialog-content{position:relative;width:290px;height:auto;max-height:369px;padding:20px 15px 10px;box-sizing:border-box;background-color:#fff;border-radius:6px}.common-dialog-close{position:absolute;right:1px;top:-52px;width:32px;height:52px;background:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/close.png) no-repeat center top;background-size:100% auto}.common-dialog-logo{height:120px;margin-bottom:10px;display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center;-webkit-box-orient:vertical}.common-dialog-logo span{display:block;width:73px;height:58px;background-size:100% auto;background-repeat:no-repeat;background-position:center top;margin:auto}.common-dialog-logo p{font-size:17px;color:#fcd73e;text-align:center;position:relative;bottom:-6px}.dialog-info-me{display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center;height:45px;line-height:45px;font-size:14px}.me-scord{display:block;-webkit-box-flex:1;color:#777;text-align:right}.common-dialog-list{height:auto;color: #000;text-align: left;max-height:160px;width:290px;margin-left:-15px;overflow:scroll;padding:0 15px;box-sizing:border-box}.dialog-list-line1{width:100%;height:50px;display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center}.dialog-list-line2{width:100%;height:60px;display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center}.dialog-list-line3{width:100%;height:72px;display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center}.common-dialog-list button{width:85px;height:30px;line-height:30px;background-color:#fcd73e;color:#7a4903;font-size:15px;border-radius:4px}.dialog-list-info{-webkit-box-flex:1}.dialog-list-info h4,.dialog-list-info p{font-weight:400;line-height:1.5}.dialog-cdkey{font-size:12px;color:#7a4903}.dialog-time{font-size:12px;color:#bbb}.user-success{text-align:center;margin:auto}.user-success{color:#777;font-size:12px;margin-top:2px}.ui-center{text-align:center;position:relative;color:rgba(119,119,119,.7);font-size:12px}.me-left{display:block;position:absolute;left:0;top:50%;width:82px;height:2px;margin-left:-1px}.me-right{display:block;position:absolute;right:0;top:50%;width:82px;height:2px;margin-left:-1px}.ui-border-t{border-top:0 solid #e0e0e0}@media screen and (-webkit-min-device-pixel-ratio:2){.ui-border-t{background-repeat:repeat-x;-webkit-background-size:100% 1px;background-position:left top;background-image:-webkit-gradient(linear,left bottom,left top,color-stop(.5,transparent),color-stop(.5,#e0e0e0),to(#e0e0e0));border:0}}.common-dialog-logo{height:120px;display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center;-webkit-box-orient:vertical}.common-single-dialog .common-dialog-logo{height:145px;display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center;-webkit-box-orient:vertical}.dialog-info-result{font-size:14px;color:#777;text-align:center;margin-bottom:28px}.btn-footer{position:relative;left:0;bottom:0;background-color:#fcd73e;color:#7a4903;width:290px;height:50px;font-size:16px;line-height:50px;text-align:center;border-bottom-right-radius:6px;border-bottom-left-radius:6px;margin:0 0 -10px -15px}.common-single-dialog .common-dialog-content{width:290px;height:auto;max-height:290px}.common-dialog-list{height:auto;max-height:204px}.mod-dialog-title{height:auto;max-height:170px}.share-dialog .common-dialog-logo{height:115px;display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center;-webkit-box-orient:vertical}.share-provide{width:100%;text-align:center;color:#777;margin-bottom:5px}.share-cdkey{display:-webkit-box;-webkit-box-align:center;width::254px;height:50px;background:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/share-cdkey.png) no-repeat center top;background-size:100% auto;color:#7a4903;margin-bottom:15px}.cdkey-name{width:60px;text-align:center}.cdkey-number{-webkit-box-flex:1;text-align:center}.share-content{display:-webkit-box;-webkit-box-pack:center;-webkit-box-align:center;height:60px}.share-content li{-webkit-box-flex:1;list-style:none}.share-content span{display:block;margin:auto;width:35px;height:35px;background-size:100% auto;background-position:center;background-repeat:no-repeat}.dialog-pay .common-dialog-content{width:180px;height:180px;background-color:rgba(0,0,0,.7);padding:20px 10px 10px}.dialog-pay .common-dialog-logo{position:relative;height:auto}.pay-title{color:rgba(255,255,255,.6)}.dialog-pay .paybg{position:absolute;top:5px;left:46px;display:block;width:72px;height:0;background:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/paybg.png) no-repeat center top;background-size:100% auto;-webkit-animation:show_height 2s 1s 1 linear forwards}.dialog-pay .paypic{position:absolute;top:-7px;left:106px;display:block;opacity:0;width:14px;height:16px;background:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/paylogo.png) no-repeat center top;background-size:100% auto;-webkit-animation:show_pic .5s 1 cubic-bezier(0,0,1,.34) forwards}@-webkit-keyframes show_height{from{height:0}to{height:38px}}@-webkit-keyframes show_pic{0%{opacity:0;-webkit-transform:translate3d(0,20px,0);transform:translate3d(0,20px,0)}100%{opacity:1;-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.JSshow li{color:#00a5e0;font-size:16px;padding:10px 10px 0 10px}');
	/**
	 * 构造函数
	 * @method Dialog
	 * @param {Object} config
	 * @param {String} config.content 提示语
	 * @param {Array} config.buttons 按钮配置[按钮名称，按钮点击事件]
	 * @example
	 * var dialog = new qv.zero.Dialog({
	 *    title : 'lottSucess',
     *    content : '内容',
     *    buttons : [{
     *        text : '确认',
     *        click : function () {
     *            dialog.hide();          
     *        }
     *    }]
     *});
	 * @for qv.zero.Dialog
	**/

	var titleTpl = {
		lottsuccess : '<span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/prize.png)"></span><p>抽奖成功</p>',
		prizerecords : '<span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/prize2.png)"></span><p>您获得的优惠券</p>',
		lottrecords : '<span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/prize.png)"></span><p>您的获奖记录</p>',
		successopenvip : '<span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/vip.png)"></span><p>成功开通</p>',
		lottfail : '<span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/fail.png)"></span><p>抽奖失败</p>',
		getsuccess :'<span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/prize2.png)"></span><p>领取成功</p>',
		getfail : '<span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/getfail.png)"></span><p>领取失败</p>'
	};

	function Dialog(config){
		this.config = {};
		this.eventConllect = [];
		this.rendered = false;
		$.extend(this.config,{
			id : 'zero_'  +(+new Date)
		},typeof config == 'object' ? config : {content : config});
		this.domId = '#' + this.config.id;
	};
	Dialog.prototype = {
		tpl : '<div class="common-mod-dialog" id="{id}">\
				<div class="dialog-mask"></div>\
				<div class="common-dialog-content">\
					<div class="common-dialog-logo">\
						{title}\
					</div>\
					<div id="common-dialog-close" class="common-dialog-close"></div>\
					<div class="dialog-info-result">{content}</div>\
					{btns}\
				</div>\
			</div>',
		btnTpl : '<section class="btn-footer" data-event="{evtHander}">{text}</section>',
		/**
		 * 显示提示层
		 * @method show
		 * @example 
		 * dialog.show();
		 * @for qv.zero.Dialog
		**/
		show : function () {
			if(!this.rendered){
				this.render();
			}else{
				$(this.domId).show();
			}
		},
		render : function () {
			var tpl = zUtil.sprint( this.tpl,{
				id : this.config.id, 
				title : this.titleEvent(),
				btns : this.renderBtns(), 
				content : this.config.content
			});
			$('body').append(tpl);	
			this.rendered = true;
			this.initEvent();
		},
		titleEvent : function () {
			var html = '', me = this;
			if (typeof this.config.title == 'undefined') {
				return '';
			}

			switch (this.config.title) {
				case 'lottSuccess' : 
					html = titleTpl.lottsuccess;
					break;
				case 'prizeRecords' : 
					html = titleTpl.prizerecords;
					break;
				case 'lottRecords' : 
					html = titleTpl.lottrecords;
					break;
				case 'successOpenvip' : 
					html = titleTpl.successopenvip;
					break;
				case 'lottFail' : 
					html = titleTpl.lottfail;
					break;
				case 'getSuccess' : 
					html = titleTpl.getsuccess;
					break;
				case 'getFail' : 
					html = titleTpl.getfail;
					break;
				default :
				    html = this.config.title
			}
			return html;
		},
		renderBtns : function(){
			var html = '', me = this;
			if (typeof this.config.buttons == 'undefined') {
				return '';
			}
			$.each(this.config.buttons, function(i,b){
				var eb = 'zero_event_'+(+new Date + i);
				html += zUtil.sprint(me.btnTpl, $.extend(b,{evtHander : eb}));
				me.eventConllect.push([eb,b.click]);
			});
			return html;
		},
		initEvent : function () {
			var me = this;
			$(me.eventConllect).each(function(i,e){
				$('[data-event=' +e[0]+ ']').click(function(evt){
					evt.preventDefault();
					e[1] ? e[1](e) : me.hide();
				});
			});

			//关闭按钮
			$('#common-dialog-close').click(function (evt) {
				evt.preventDefault();
				me.hide();
			});
		},
		/**
		 * 隐藏提示层
		 * @method hide
		 * @description 在btn数组的click事件中需要添加dialog.hide()来关闭窗口，如构造函数例子
		 * @example
		 *
		 * dialog.hide();
		 * 
		 * @for qv.zero.Dialog
		**/
		hide : function(clear){
			if(clear === false){
				$(this.domId).hide();
			}else{
				$(this.domId).remove();
				this.rendered = false;
			}
		}
	};
	if(!qv.zero) qv.zero= {};
	qv.zero.Dialog = Dialog; 
})(Zepto);
