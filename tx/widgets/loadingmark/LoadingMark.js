/**
 * @descption 页面的loading层，静态组件
 * @class qv.zero.LoadingMark
 * @author shinelgzli
 * @description 开通送礼包
 * @version 1.0
 * @time 2014-08-19
 * @name qv.zero.LoadingMark
 * @example
 *```
 * qv.zero.LoadingMark.show('加载中');
 * qv.zero.LoadingMark.show();
 * qv.zero.LoadingMark.hide();
 *```
**/
(function(exports,$) {
    function init (id, text) {
   		//先把样式注入到页面上
        zUtil.appendStyle('.zero-ui-dialog{-webkit-transition:opacity 200ms;opacity:0;position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:99999;display:-webkit-box;-webkit-box-orient:horizontal;-webkit-box-pack:center;-webkit-box-align:center;background:rgba(0,0,0,0.4);color:#000;}.zero-ui-dialog-notice{background:transparent;}.dialog-notice,.zero-dialog-notice-container{width:130px;height:110px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-box-pack:center;-webkit-box-align:center;text-align:center;background:rgba(0,0,0,0.65);border-radius:6px;color:#fff;}.zero-ui-loading-white{width:37px;height:37px;display:block;background-image:url(//imgcache.gtimg.cn/vipstyle/game/act/loading_sprite_white.png?_bid=256);background-size:auto 37px;-webkit-animation:rotate2 1s steps(12) infinite;}@-webkit-keyframes rotate2{from{background-position:0 0;}to{background-position:-444px 0;}}');
        $('<div class="zero-ui-dialog zero-ui-dialog-notice" id="' + id + '">\
                <div class="zero-dialog-notice-container">\
                  <i class="zero-ui-loading zero-ui-loading-white"></i>\
                  <span>'+ text + '</span>\
               </div>\
            </div>').appendTo('body');  
    }
    var timer;
    exports.LoadingMark = {
        id : 'lm_'+(+new Date()),
         /**
	     * 打开 loading层
	     * @method show
	     * @for qv.zero.LoadingMark
	     */
        show : function (text) {
        	var me = this;
            text = text || '';
        	clearTimeout(timer);
            $('#' + this.id).remove();
            init(this.id,text);

            $('#' + this.id).css({opacity :1,display:''});
            timer = setTimeout(function(){
            	$('#' + me.id).css({opacity :0,display:'none'});
            },10000);
        },
         /**
	     * 关闭 loading层
	     * @method hide
	     * @for qv.zero.LoadingMark
	     */
        hide : function () {
            $('#' + this.id).css({opacity :0,display:'none'});
            clearTimeout(timer);
        }
    };
})(qv.zero,Zepto);