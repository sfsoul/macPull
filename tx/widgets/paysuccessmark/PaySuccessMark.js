/**
 * @descption 页面的支付成功后的loading层，静态组件
 * @class qv.zero.PaySucessMark
 * @author yandeng
 * @description 支付成功后的浮层
 * @version 1.0
 * @time 2016-07-19
 * @name qv.zero.PaySucessMark
 * @example
 *```
 * qv.zero.PaySucessMark.show();
 * qv.zero.PaySucessMark.hide();
 *```
**/
(function(exports,$) {
    function init (id) {
        $('<div id ="' + id +'" class="common-mod-dialog dialog-mini dialog-pay" style="display: -webkit-box;">\
            <div class="dialog-mask"></div>\
            <div class="common-dialog-content">\
                <div class="common-dialog-logo">\
                    <span style="background-image:url(//i.gtimg.cn/vipstyle/mobile/tmpl/common/img/dialog/pay.png)"></span>\
                    <span class="paybg"></span>\
                    <span class="paypic"></span>\
                    <p>支付成功</p>\
                </div>\
                <p class="pay-title">一大波优惠券正向你袭来请在活动页面点击领取！</p>\
            </div>\
        </div>').appendTo('body');
    }
    var timer;
    exports.PaySuccessMark = {
        id : 'pm_'+(+new Date()),
         /**
	     * 打开 loading层
	     * @method show
	     * @for qv.zero.LoadingMark
	     */
        show : function () {
        	var me = this;
        	clearTimeout(timer);
            $('#' + this.id).remove();
            init(this.id);

            $('#' + this.id).css({opacity :1,display:'-webkit-box'});
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