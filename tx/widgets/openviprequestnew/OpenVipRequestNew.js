/**
 * 开通会员或超级会员送礼包
 * @class qv.zero.OpenVipRequestNew
 * @author breezefeng
 * @description 开通送礼包
 * @version 1.0.2
 * @time 2018-1-12
 * @name qv.zero.OpenVipRequestNew
 * @requires Zepto
 **/

(function (exports, $) {
    var OpenVipRequestNew = {
        /**
         * 显示开通送
         * @param {String} [config.aid] [必传]aid统计字段
         * @param {Number} [config.month] 开通会员数量
         * @param {Number} [config.actid] 开通会员后请求的id活动号
         * @param {String} [config.tab] 开通类型，vip（会员）， svip（超级会员，可升级），svipt（超级会员，不可升级）。传入改参数，超级会员tab页，当前无升级功能
         * @example
         * ```
         * page.bindClick('.act-btn1',function (e) {
    	 *	qv.zero.OpenVipRequest.show({
		 *			aid : 'mvip.pingtai.android.mywallet_test',
		 *			tab : 'vip'
		 *			month : 1,
		 *			actid : 28699
		 *		});
    	 *});
         *```
         * @note no override
         * @method show
         * @for qv.zero.openviprequest
         **/
        show: function (config) {
            this.aid = config.aid || '';
            this.month = config.month || 1;
            this.actid = config.actid || '';
            this.tab = config.tab || 'vip';
            if (this.tab === 'svipt') { //兼容超级会员
                this.tab = 'svip';
            }
            this.isCanChange = config.isCanChange || false;
            this.extendParam = config.extendParam || {}; //扩展参数
            this.CallBack = qv.zero.CallBack;
            this.init(config);
        },
        //下载smartpay组件
        loadsmartpay: function () {
            var loadcb = new this.CallBack();
            zUtil.require('http://imgcache.gtimg.cn/club/platform/lib/pay/smartpay.js?_bid=193', function () {
                loadcb.execute(1);
            });
            return loadcb;
        },
        init: function (args) {
            var me = this;
            //在选区服的时候，下载smartpay组件
            var cb = new this.CallBack();
            private_data.args = args;
            zHttp.syrequest(args, function (json) {
                cb.execute(json);
            });
            this.CallBack.all([cb, this.loadsmartpay()]).add(function (json) {
                json = json[0];
                if (json.ret == 20108 || json.ret == 30301 || json.ret == 20126 || json.ret == 20801) {
                    me.pay();
                } else {
                    zHttp.showResponse(json, json.actid);
                }
            });
        },
        //支付
        pay: function () {
            qw.smartPay.openService($.extend({}, this.extendParam, {
                data: null,
                aid: this.aid,
                type: this.tab,
                month: this.month,

                disableChannel: 'mcard, hfpay', // 禁用话费渠道
                isAskFriendPay: false,   // 好友代付
                disableUpgrade: true,     // 禁用会员升级超级会员
                isSend: false,            // 赠送好友
                isCanChange: this.isCanChange,//强制开通月份不可以修改，如果是安卓平台，并且是强制月份，则直接跳转支付

                onPayCallback: function (result) {
                    if (result && result.ret == 0) {
                        setTimeout(function () { //延时0.5S领取东西
                            zHttp.syrequest(private_data.args);
                        }, 500);
                    }
                }
            }));
        }
    }, private_data = {};

    exports.OpenVipRequestNew = OpenVipRequestNew;
})(qv.zero, Zepto);
