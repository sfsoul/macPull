//电竞右下角挂件floating的扩展
(function(exports, $){

	var btnId = 'egameFloatingBtn';

	var btnTmpl = '<div id="{id}" style="position:fixed;bottom:{bottom};right:{right};width:{width};height:{height};z-index:{zindex}">\
		<img src="{imgUrl}" style="width:100%;height:100%">\
	</div>';

	var maskId = 'egameFloatingMask';
	var ifrId = 'egameFloatingIfr';

	var maskTmpl = '<div id="{id}" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.4);-webkit-box-orient:horizontal;-webkit-box-pack:center;-webkit-box-align:center;z-index:{zindex}">\
		<iframe id="'+ifrId+'" name="'+ifrId+'" src="{src}" frameborder="0" allowtransparency="true" style="width:{width};height:{height};"></iframe>\
	</div>';

	var _private = {
		getPixel: function(str, basePercent){
			if (str.indexOf('px')>-1){
				return parseInt(str.split('px')[0]) || 0;
			} else if (str.indexOf('%')>-1) {
				var percent = parseInt(str.split('%')[0]) || 0;
				if (basePercent) {
					return +(basePercent * percent / 100).toFixed(2);
				} else {
					return percent;
				}
			} else {
				return parseInt(str);
			}
		}
	};

	function timeToStamp(str){
		if(!str) {
			return 0;
		}
		var d = new Date();
		var ars = str.split(' ');

		var ts = ars[0].split('-');
		d.setFullYear(+ts[0], ts[1]-1, +ts[2]);

		if (ars[1]) {
			var as = ars[1].split(':');
			d.setHours(+as[0]); d.setMinutes(+as[1]);
		} else {
			d.setHours(0); d.setMinutes(0);
		}

		d.setSeconds(0);
		return d.getTime();
	}

	exports.egameFloating = {
		version: '1.0.0',
		config: {
			imgUrl: '',
			actUrl: '',
			jsonid: 0,//当前活动id
			actId: 0,//目标活动id
			timeRange: {},//时间范围
			btnWidth: '65px',//130
			btnHeight: '75px',//150
			btnBottom: $(window).height() - 417 - 75 + 'px',//140
			btnRight: $(window).width() - 227 - 65 + 'px',//30
			btnZindex: 30,
			maskWidth: $(window).width() + 'px',//252
			maskHeight: '300px',//212
			afterClick: function(){}
		},
		init: function(params){
			this.config = $.extend(this.config, params);
			if (!this.config.imgUrl || !this.config.actUrl) {
				// console.log('初始化参数错误');
				return null;
			}
			if (zUtil.isQGame()){
				return;
			}
			//参数校验
			this.fixParam();

			if (this.config.timeRange && this.config.timeRange.start && this.config.timeRange.end) {
				var startTime = timeToStamp(this.config.timeRange.start),
					endTime = timeToStamp(this.config.timeRange.end),
					currentTime = Date.now();
				if (currentTime < startTime || currentTime > endTime) {
					//超出时间不显示
					return;
				}
			}

			document.domain = 'qq.com';//解决跨域

			this.appendBtn();

			this.initCloseEvent();
		},
		fixParam: function(){
			this.config.actUrl = this.config.actUrl.replace('http://', 'https://');
		},
		appendBtn: function(){
			if ($('#'+btnId).length) {
				//当前已经挂载过
				return;
			}

			var setting = {
				id: btnId,
				imgUrl: this.config.imgUrl,
				width: this.config.btnWidth,
				height: this.config.btnHeight,
				bottom: this.config.btnBottom,
				right: this.config.btnRight,
				zindex: this.config.btnZindex
			};
			var html = zUtil.sprint(btnTmpl, setting);
			$('body').append(html);

			this.bindBtnEvent();
		},
		bindBtnEvent: function(){
			var me = this;
			$('#'+btnId).on('click', function(){
				me.showMask();
				if (me.config.afterClick && typeof me.config.afterClick == 'function') {
					me.config.afterClick();
				}
			});
		},
		appendMask: function(){
			if ($('#'+maskId).length) {
				//当前已经挂载过了
				return;
			}

			var setting = {
				id: maskId,
				src: this.config.actUrl,
				width: this.config.maskWidth,
				height: this.config.maskHeight,
				zindex: this.config.btnZindex + 2
			};
			var html = zUtil.sprint(maskTmpl, setting);
			$('body').append(html);

			this.bindMaskEvent();
		},
		bindMaskEvent: function(){
			var me = this;
			$('#egameFloatingMask').on('touchmove', function(evt){
				//阻止滑动
				evt.preventDefault();
				return false;
			}).on('click', function(evt){
				//点击空白关闭
				me.hideMask();
			});
		},
		showMask: function(){
			if (!_private.isAppendMask) {
				this.appendMask();
			}
			$('#'+maskId).css('display', '-webkit-box');
		},
		hideMask: function(){
			$('#'+maskId).css('display', 'none');
		},
		initCloseEvent: function(){
			var me = this;
			window.__closeEgameMask = function(){
				me.hideMask();
			};
		},
		initMaskPage: function(page){
			var me = this;
			document.domain = 'qq.com';//解决跨域
			var $btn = $('[data-bus="egameMask"]');
			$('body').css('background-color', 'transparent');
			if (zHttp && window.parent && window.parent.zHttp) {
	            zHttp.SSOSend_bak = zHttp.SSOSend;
	            zHttp.SSOSend = function(url, fn){
	                parent.zHttp.SSOSend.call(parent.zHttp, zHttp.getSSOSendUrl(url), fn);
	            };
	        }
	        if (window.mqq && window.parent && window.parent.mqq) {
	        	mqq.app.isAppInstalled = parent.mqq.app.isAppInstalled;
	        }
	        if (zUtil && window.parent && window.parent.mqq) {
	        	zUtil.openUrl_bak = zUtil.openUrl;
	        	zUtil.openUrl = function(url, actid, newwb) {
	        		//@todo兼容电竞逻辑
	        		parent.mqq.ui.openUrl({url: url, target: 1});
	        	};
	        }

            $btn.on('click', function(){
                if (window.top && window.top.__closeEgameMask) {
                	window.top.__closeEgameMask();
                }
            });
		},
		usePggNative: function(callback){
			zUtil.require('egameExtend', function(){
	            qv.zero.pgg && qv.zero.pgg.usePggLib && qv.zero.pgg.usePggLib(function(){
	            	callback && callback();
	            });
	        });
		},
	};

})(qv.zero, Zepto);