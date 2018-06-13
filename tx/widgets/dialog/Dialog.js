/**
 * @description 提示弹出层
 * @class qv.zero.Dialog
 * @author: shinelgzli
 * @require: qv.zepto
 * @date 2014年05月26日10:33:13
**/
(function($){
	zUtil.appendStyle('[class*=embed-btn]{-webkit-user-select:none;-webkit-box-sizing:border-box;-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer;overflow:hidden;position:relative;display:block;width:100%;text-align:center;vertical-align:top;text-decoration:none;font-weight:700}.embed-btn-mod{border:0 none;color:#0079ff;background:0;margin:0}.embed-btn-mod:active{background:#d9d9d9}.mod-game-dialog{position:fixed;top:0;right:0;bottom:0;left:0;z-index:20;background-color:rgba(0,0,0,0.4)}.mod-game-dialog-content{box-sizing:border-box;position:absolute;text-align:left;top:50%;left:50%;-webkit-transform:translate(-50%,-50%);width:270px;min-height:80px;background-color:#FFF;border-radius:6px}.mod-game-dialog-content .mod-txt{font-size:14px;color:#3a3a3a;border-bottom:#c8c7cc 1px solid;background-image:none;padding:16px 14px}.mod-game-dialog-content .mod-btn{display:0}.mod-game-dialog-content .mod-btn button{box-sizing:border-box;font-size:15px;line-height:27px;box-flex:1;-webkit-box-flex:1;border-right:#c8c7cc 1px solid;background-image:none;padding:8px 2px}.mod-game-dialog-content .mod-btn button:last-child{border-right:0}.mod-game-dialog-content .mod-btn button:active{background:rgba(0,0,0,.1)}@media screen and -webkit-min-device-pixel-ratio20{.mod-game-dialog-content .mod-txt{background:0 left bottom repeat-x;border-bottom:0;background-size:100% 1px;-wekit-background-size:100% 1px}.mod-game-dialog-content .mod-btn button{background:0 right top repeat-y;border-right:0;background-size:1px 100%;-wekit-background-size:1px 100%}.mod-game-dialog-content .mod-btn button:last-child{background-image:none}}.mod-game-dialog-content .mod-btn{display:box;display:-webkit-box}');
	/**
	 * 构造函数
	 * @method Dialog
	 * @param {Object} config
	 * @param {String} config.content 提示语
	 * @param {Array} config.buttons 按钮配置[按钮名称，按钮点击事件]
	 * @example
	 * var dialog = new qv.zero.Dialog({
     *    content : msg,
     *    buttons : [{text : '确定'},{
     *        text : btn[0],
     *        click : function () {
     *            btn[1].call(this);
     *            dialog.hide();          
     *        }
     *    }]
     *});
	 * @for qv.zero.Dialog
	**/

	function Dialog(config){
		this.config = {};
		this.eventConllect = [];
		this.rendered = false;
		if(qv.zero.Event){
			qv.zero.Event.attach(this);
		}
		$.extend(this.config,{
			id : 'zero_'  +(+new Date),
			buttons : [{
				text : '确定'
			}]
		},typeof config == 'object' ? config : {content : config});
		this.domId = '#' + this.config.id;
	};
	Dialog.prototype = {
		
		tpl : '<article class="mod-game-dialog" id="{id}">\
				<div class="mod-game-dialog-content">\
					<div class="mod-txt">{content}</div>\
					<div class="mod-btn">\
						{btns}\
					</div>\
				</div>\
			  </article>',
			
		btnTpl : '<button class="embed-btn-mod" data-event="{evtHander}">{text}</button>',
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
			var tpl = zUtil.sprint( this.tpl,{id : this.config.id, btns : this.renderBtns(), content : this.config.content});
			$('body').append(tpl);	
			this.rendered = true;
			this.initEvent();
		},
		
		renderBtns : function(){
			var html = '', me = this;
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
					me.emit && me.emit('click', i);
				});
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
				this.eventConllect = [];
				$(this.domId).remove();
				this.rendered = false;
			}
		}
	};
	if(!qv.zero) qv.zero= {};
	qv.zero.Dialog = Dialog; 
})(Zepto);
