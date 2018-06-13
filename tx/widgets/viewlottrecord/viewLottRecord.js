/**
 * 查看抽奖历史记录
 * Zepto
 * mqq
 * @author yandeng
 * @example
 * @param {Number} config.id 必选，需求查询的抽奖记录的抽奖id
 * qv.zero.viewLottRecord({
 *    actid : 41379
 * });
 */
;(function(exports, $) {
    var tpl = {
        recordTpl : '<div class="flow_pop">\
            <h3 style="font-weight:bold;font-size:14px;line-height:22px;padding-bottom:10px;text-align: center;">您的获奖记录</h3>\
            <ul>\
                <li style="list-style: none;">\
                <span style="width:115px;display: inline-block;text-align:center">奖品</span>\
                <span style="width:110px;display: inline-block;text-align:center">获得次数</span>\
                </li>{listTpl}\
            </ul>\
        </div>',
        prizeTpl : '<li style="line-height:20px;list-style: none;">\
            <span style="width:115px;display: inline-block;text-align:center">{prizeName}</span>\
            <span style="width:110px;display: inline-block;text-align:center">{prizeNumber}</span>\
        </li>'
    };
    var lottRecord = function (config) {
        $.extend(this,config); 
        if (!config.actid) {
            return;
        }
        this.init();
    };
    lottRecord.prototype = {
        init : function () {
            var me = this;
            zHttp.request({actid : this.actid},function (json) {
                if (json.ret == 0) {
                    var lottData = json.data.op,
                    lottObject = [],
                    prizeObject = {},
                    lotIndex = 1,
                    lottHtml = '',
                    prizeHtml = '',
                    prizeArray = {};
                    if (lottData.length == 0) {
                        prizeHtml = '你还木有奖品啦！';
                    } else {
                        //过滤重复的数组
                        for (var i = 0;i < lottData.length;i++) {
                            for (var j = i+1;j<lottData.length;j++) {
                                if (lottData[i]['val']['level'] == lottData[j]['val']['level'] && lottData[i]['val']['actid'] == lottData[j]['val']['actid']) {
                                    lotIndex++;
                                    lottData.splice(j,1);
                                    j--;
                                }
                            }
                            lottObject.push([lottData[i]['val']['name'],lotIndex]);
                            lotIndex = 1;
                        }
                        $.each(lottObject,function (i,data) {
                            prizeObject['prizeName'] = data[0];
                            prizeObject['prizeNumber'] = data[1];
                            lottHtml += zUtil.sprint(tpl.prizeTpl,prizeObject);
                        });
                        prizeArray['listTpl'] = lottHtml;
                        prizeHtml = zUtil.sprint(tpl.recordTpl,prizeArray);
                    }
                    zMsg.show(prizeHtml);
                }
            }); 
        }
    }
    exports.viewLottRecord = function (cfg) {
        return new lottRecord(cfg);
    }
})(qv.zero, Zepto);
