/**
 * 消息处理，静态类
 * @author shinelgzli payneliu 
 * @version 6.0.2
 * @class qv.zero.Msg
 * @date 2016-08-15
 * @requires 
 * @name qv.zero.Msg
 * @namespace
 * @example
 * 如何获取活动号对应返回码的消息对象：
 * qv.zero.Msg.getRetMsg(actid, code);
 * 如何获取抽奖活动号对应返回等级消息对象：
 * qv.zero.Msg.getLotMsg(actid, code);
 */
/*global qv,window,zUtil,OZ*/
qv.zero.Msg = {
    /**
     * 版本号 
     */
    version: '6.0.2',
	/*
	**/
    __cache: {},
    /**
     * 数据消息加载状态，若为true,则说明加载完成
     */
    dataStatus: false,
    /**
     * 绑定静若处子消息数据源,AbstractPage已经自动调用，一般不需要调用
     * @param {Object|String} config 配置信息，可以直接传userID，如果传入Object,看以下定义
     * @param {Number} config.userJsonID 独立的提示信息文件ID
     * @param {Boolean}  [config.hasLotCode] 是否启用抽奖返回码配置信息
     * @param {Function} [callback] 数据源绑定成功后执行
     * @return void
     */
    bindDataSource: function (config, callback) {
        var cfg = { hasRetCode: true, hasBaseCode: true }, jsonid, me = this, urls = [], commUrl = 'https://i.gtimg.cn/ACT/vip_act/act_data/';
        $.extend(cfg, config);
        jsonid = cfg.jsonid;
        this.jsonid = jsonid;

        if (!cfg.hasRetCode || !jsonid) {
            return;
        }
        var uid = 'AMD_' + jsonid, bid = 'AMD_ams', st;
        if (window[uid] && window[bid]) {
            this.installData(callback, uid, bid);
        } else {
            if (cfg.hasBaseCode) {
                urls.push(commUrl + 'ams.json.js');
            }
            if(isFinite(cfg.game)){ //外部游戏game是appid
                urls.push('https://i.gtimg.cn/club/common/lib/zero/sdk/' + (cfg.game || cfg.appid) + '.js');
            } else {
                urls.push(commUrl + 'game.json.js');
                urls.push('https://i.gtimg.cn/club/common/lib/zero/idip/' + (cfg.game || cfg.appid) + '.js');
            }
            urls.push(commUrl + jsonid + '.json.js');
            qv.zero.Module.require(urls, function () {
                me.installData(callback, uid, bid);
            }, {
                    onerror: function () {
                        qv.zero.Module.require('Dialog', function(){
                            zMsg.show('页面有个错误：可能是静态数据或游戏的idip配置没同步！');
                        });
                    }
                });
        }
    },
    installData: function (callback, uid, bid) {
        this.baseMsg = window[bid];
        this.userMsg = window[uid].msg;
        this.dataStatus = true;
        callback();
    },
    //初始化游戏的数据
    //数据格式：{"n":"游戏名称","e":"cdk地址","c":游戏类型 1,"m":"官网地址","d":"","a":"appid"}
    installGameData: function (game, val) {
        var data = window.AMD_game || (window.AMD_game = {});
        data[game] = val;
    },
    /**
     * 以json格式返回AMS项目静态配置表单的数据
     * @for qv.zero.Msg
     * @method getFormData
     * @param {Number} [id] 表单号，若有指定，则返回指定的表格数据，否则直接返回整个静态配置。
     * @return {Array} 
     */
    getFormData: function (id) {
        var form = window['AMD_' + this.jsonid].form[id];
        return form ? $.extend(true, [], form) : null;
    },

    /**
     * 提取对应活动号及返回码的提示信息
     * @for qv.zero.Msg
     * @method getRetMsg
     * @param {Number} actid 活动号
     * @param {Number} code 返回码 
     * @return {Object} {msg : '', btnText : '', url : ''}
     */
    getRetMsg: function (actid, code) {
        var msg = this.userMsg[actid] ? this.userMsg[actid][code] : null;

        if (!msg) {
            msg = this.userMsg['0'] ? this.userMsg['0'][code] : null;
        }
        if (!msg) {
            msg = this.baseMsg[code] || this.baseMsg['10000'];
        }
        return msg ? $.extend(true, {}, msg) : '好挤好挤，我还是稍等一会再来吧~';
    },
    /**
     * 提取活动号对应的等级的提示信息
     * @for qv.zero.Msg
     * @method getLotMsg
     * @param {Number} actid 活动号
     * @param {Number} level 等级 
     * @return {Object} {msg : '', btnText : '', url : ''}
     */
    getLotMsg: function (actid, level) {
        var lott = this.userMsg[actid].lott || { 10000: { m: "恭喜您抽中了{name}", b: "", l: "" } },
            msg = lott[level] || lott['10000'];
        if (!msg) {
            msg = { msg: '很遗憾，您没中奖哦，继续加油吧！' };
        }
        return $.extend(true, {}, msg);
    },

    /**
   * 弹出带有【确认】按钮的对话框
   * @for qv.zero.Msg
   * @method show
   * @param {String} msg 提示语
   * @return {void}
   **/
    show: function (msg) {
        var dialog = new qv.zero.Dialog(msg);
        dialog.show();
        return dialog;
    },
    /**
    * 弹出带有【确定】和【进入游戏】的对话框
    * @for qv.zero.Msg
    * @method showWithGameBtn
    * @param {String} msg 提示语
    * @param {Obect} page 页面的page
    * @param {Object} args,若在zHttp请求接口中调用，则这里args为请求的参数列表
    * @param {String} btnText 右边按钮文字
    **/
    showWithGameBtn: function (msg, page, args, btnText) {
        var gameBtn = [
            btnText || '进入游戏',
            function () {
                zUtil.require('SQGameManager', function () {
                    qv.zero.SQGameManager.start({ jsonid: page.jsonid, game: ((args || 0).game || page.game) });
                });
            }];
        return this.showDialog(msg, gameBtn);
    },
    /**
    * 获取带有【开通会员】的对话框的配置，在zHttp.showResponse接口中
    * 会根据活动提示语配置中的按钮配置“openVip“会自动映射到这个配置中，从而弹出对应的对话框，其他用户类比
    * 比如，可以在给zMsg对象添加一个自定义的对话框，然后在提示语中使用：
    * zMsg.getShowOtherDialogConfig : function(msg, page,args){
    * return ['点击我', function(){alert('点击我');}]
    *}，然后在提示语按钮配置中配置'showOther'
    * @for qv.zero.Msg
    * @method getOpenVipDialogConfig
    * @param {String} msg 提示语
    * @param {Obect} page 页面的page
    * @param {Object} args,若在zHttp请求接口中调用，则这里args为请求的参数列表
    **/
    getOpenVipDialogConfig: function (msg, page, args) {
        return [
            '开通会员',
            function () {
                OZ.report({ operType: '点击', operDesc: '开通会员' });
                var p = $.param({
                    sid: page.getSid(),
                    aid: page.pcfg.aid,
                    m: 1
                });
                window.location.href = "//vip.qq.com/m/join.html?act=true&3g=true&sc=vip&" + p;
            }];
    },
    /**
    * 带有【开通超级会员】的对话框，参考getOpenVipDialogConfig接口的说明
    * @for qv.zero.Msg
    * @method getOpenCjVipDialogConfig
    * @param {String} msg 提示语
    * @param {Obect} page 页面的page
    * @param {Object} args,若在zHttp请求接口中调用，则这里args为请求的参数列表
    **/
    getOpenCjVipDialogConfig: function (msg, page, args) {
        return [
            '开通超级会员',
            function () {
                OZ.report({ operType: '点击', operDesc: '开通超级会员' });
                var p = $.param({
                    sid: page.getSid(),
                    aid: page.pcfg.aid,
                    n: 1
                });
                window.location.href = "//pay.qq.com/h5/index.shtml?m=buy&c=cjclub&pf=2100" + p;
            }];
    },
    /**
    * 带【自定义按钮】的对话框
    * @for qv.zero.Msg
    * @method showCustomDialog
    * @param {String} msg 提示语
    * @param {Array} btn 按钮配置[按钮名称，按钮点击事件]
    * @example
    * ['发送微博',function () {}]
    **/
    showCustomDialog: function (msg, btn) {
        return this.showDialog(msg, btn);
    },
    /**
    * 弹出带【自定义按钮】的对话框
    * @for qv.zero.Msg
    * @method showDialog
    * @param {String} msg 提示语
    * @param {Array} btn 按钮配置[按钮名称，按钮点击事件]
    * @example
    * ['发送微博',function () {}]
    **/
    showDialog: function (msg, btn) {
        var dialog = new qv.zero.Dialog({
            content: msg,
            buttons: [{ text: '确定' }, {
                text: btn[0],
                click: function () {
                    btn[1].call(this);
                    dialog.hide();
                }
            }]
        });
        dialog.show();
        return dialog;
    },
    /**
    * 显示对话框
    * eg：
    * zMsg.showMessageBox({ msg: 'haha' });
    */
    showMessageBox: function (data) {
        data = $.extend(true, { msg: '', left: { text: '确定', click: false } }, data);
        var buttons = [];
        WrapperClose(data.left); //包装
        WrapperClose(data.middle);
        WrapperClose(data.right);

        var dialog = new qv.zero.Dialog({
            content: data.msg,
            buttons: buttons
        });
        dialog.show();
        return dialog;

        //包装close函数
        function WrapperClose(cfg) {
            if (cfg) {
                /*jshint expr:true*/
                buttons.push(cfg);
                var func = cfg.click;
                if (typeof func === 'function') {
                    cfg.click = function () {
                        var ret = func.call(dialog);
                        !ret && dialog.hide();
                    };
                }
            }
        }
    }
};
