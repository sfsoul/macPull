/**
 * @class qv.zero.AreaSvrSelector
 * @author payneliu
 * @name qv.zero.AreaSvrSelector(config);
 * @description 手游大区选择组件
 * @version 1.0
 * @time 2016-01-04
 * @param config
 * @param {String} config.name 游戏名称
 * @param {Number} config.actid 活动号
 * @param {String} config.serverList 可选,在imgcache.qq.com\htdocs\club\common\lib\zero\idip目录各个游戏名下自定义大区列表名称，如果是数组，则为一组列表，如果是对象，则为ios和android两组对象
 * @param {String} config.charset 可选，请求游戏接口时的编码,默认为gbk
 * @param {Boolean | String} config.rbtn 可选， 右侧按钮的样式,默认为true,即为开始游戏，flase为不显示右侧按钮，'openVip'为开通游戏按钮
 * @param {Function} [config.send] 可选， 发送请求接口，默认以qv.zero.Http.request
 **/
(function(exports, $) {
    var sid = zURL.get('sid');
    var ios = zUtil.isIOS();
    var CallBack = qv.zero.CallBack;

    var rcnt_templ = '<div class="select-area-title">选择您的游戏角色</div><div class="area-check" id="rcnt_play_con"> </div>'; //最近在玩的
    var area_templ = '<select style="margin:10px 0px 0px;width:100%;height:30px;" class="area">{option}</select>'; //区服选择
    var role_templ = '<select style="width:100%; margin-top:10px;height:30px" class="roleid"><option value="">请选择...</option></select>'; //角色模版
    var role_item_templ = '<option value="{role_id}">{nick}</option>';
    var platCode = /iphone|ipad|itouch/ig.test(window.navigator.userAgent) ? 2 : 1;
    /*安全的html过滤*/
    function safeHTML(html) {
        if (html) {
            return html.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/\\/g, '&#39;');
        }
        return '';
    };
    /*多个callback都已经执行完成*/
    function when(cbs, funx) {
        var len = cbs && cbs.length,
            list, count = 0;
        if (len) {
            list = [];
            for (var i = 0, cb; cb = cbs[i]; i++) {
                cb.add(dealcallback(i));
            }
        }

        function dealcallback(index) {
            return function(data) {
                list[index] = data;
                count++;
                if (count >= len) {
                    funx.apply(null, list);
                }
            };
        }
    };
    /**
     * 有区与角色的选择器 view
     */
    function AreaSvrView(cfg) {
        this.DataSvr = cfg.datasvr;
        this.Templ = cfg.Templ;
        this.RcntView = null;
        this.init(cfg);
    }

    $.extend(true, AreaSvrView.prototype, {
        init: function(cfg) {
            this.render_end_promise = new CallBack();
            this.uinq = (AreaSvrView.uinq = (AreaSvrView.uinq || 0) + 1); //唯一id
            this.AreaData = this.DataSvr.getAreaData();
            this.AreaListManager = new AreaListManager({
                DataSvr: this.DataSvr
            });
            this.EventNS = '_delegateEventsview' + this.uinq; //事件命名空间
            this.el = $(document);
            this._report_control = new CallBack();
        },
        initEvent: function() {
            // 绑定页面控制事件
            var id = this.id = this.popBox.config.id;
            this.selector = $('#' + id);
            this.area = this.selector.find('.area');
            this.roleId = this.selector.find('.roleid');
            this.area.bind('change', $.proxy(this.onAreaChange, this));
            this.render_end_promise.execute(true); //呈现完成
        },
        show: function() {
            var me = this;
            if (this.rendered) { //如果已经render了就显示
                this.render_end_promise.add(function() {//这里是异步的
                    me.popBox.show();
                });
            } else {
                this.rendered = true;
                var show = this.Templ.indexOf('{option}') > -1 ? this.show_area() : this.show_role();
                show.add(function(html) {
                    me.trigger('beforerender', html);
                    me.showDialog(html); //显示界面
                    me.trigger('afterrender', 1);
                    zUtil.oneExec('AreaSvrView_initEvent_' + me.uinq, function() { //只会执行一次
                        this.initEvent();
                    }, 1, me);
                });
                when([this.render_end_promise, this.AreaListManager.isReady, this.AreaData], function(_, data, areadata) { //先获取最近在玩的数据
                    if (data) {
                        data = data || {};
                        if(areadata && areadata.length && data.list && data.list.length){
                            data.list.forEach(function(i){ //初始化数据
                                if(!i.partitionName){
                                    var result = areadata.filter(function(j){ return j[1] == i.partition; });
                                    if(result.length){
                                        i.partitionName = result[0][0];
                                    }
                                }
                            });
                        }
                        var rv = me.RcntView = new RcntView({
                            data: data.list || [],
                            content: me.selector,
                            modifyAreaUI: function(param) {
                                me.modify(param);
                            },
                            dftPartition: data.dftPartition,
                            dftRoleId: data.dftRoleId
                        });
                        rv.render();
                        rv.initEvent();
                    }
                });
            }
        },
        show_area: function() { //显示区服信息
            var me = this,
                cb = new CallBack();
            this.AreaData.add(function(data) { //拉取area数据
                me.AreaDataList = data; //记录真实的数据
                var html = '<option value="">请选择服务器</option>';
                $.each(data, function(i, svr) {
                    var zoneId = typeof svr[2] !== 'undefined' ? svr[2] : '';
                    html += '<option value="' + svr[1] + '" data-zoneid="' + zoneId + '">' + svr[0] + '</option>';
                });
                html = zUtil.sprint(me.Templ, {
                    option: html
                });
                cb.execute(html);
            });
            return cb;
        },
        show_role: function() {
            var me = this,
                cb = new CallBack();
            cb.execute(this.Templ);
            return cb;
        },
        onAreaChange: function() {
            var me = this,
                partition = this.area.val();
            this.loadRoleList(partition);
        },
        //必须在呈现完成之后调用
        existPartition: function(partition) {
            var exists = false;
            partition = +partition;
            if (partition && this.AreaDataList) {
                exists = this.AreaDataList.filter(function(item) {
                    return +item[1] === partition;
                }).length > 0;
            }
            return exists;
        },
        hide: function(data) {
            this.trigger('hide', Object.prototype.toString.call(data) === '[object Array]' ? {source: 'user'} : data);
            this.popBox.hide(false);
        },
        submit: function() {
            var data = this.getData();
            $.extend(true, data, {
                platid: this.DataSvr.platId,
                area: this.DataSvr.areaId
            });
            if (this.validate(data)) {
                this.trigger('submit', data);
                var me = this;
                this._readyReportArea(data); //更新本地缓存与上报
            }
        },
        /**
         * 上报对外接口
         * @return {[type]} [description]
         */
        reportArea : function(json){
            if(+json.ret === 0){ //执行成功了再上报
                this._report_control.execute(0);
            }
            this._report_control = new CallBack(); //重新new是由于不想后面的上报立即上报
        },
        /**
         * 准备上报
         * @param  {[type]} data [description]
         * @return {[type]}      [description]
         */
        _readyReportArea : function(data){
            var me = this;
            this._report_control.add(function(){ //延迟上报
                me.AreaListManager.ModifyAreaCache(function() { //更新本地缓存
                    me.DataSvr.recordRcntInfo(data); //上报数据
                });
            });
        },
        validate: function(data) {
            if (!data.partition || !data.area) {
                zMsg.show('请选择服务器！');
                return false;
            }
            if (!data.roleid) {
                zMsg.show('请选择游戏角色！');
                return false;
            }
            return true;
        },
        /*获取区服数据*/
        getData: function() {
            var area_data = this.getCtrlData(this.area),
                role_data = this.getCtrlData(this.roleId);
            return {
                partition: area_data.id,
                roleid: role_data.id,
                partitionName: area_data.name,
                roleName: role_data.name
            };
        },
        //获取select的选中数据
        getCtrlData: function(content) {
            var id = content.val();
            return {
                id: id,
                name: content.find('option[value="' + id + '"]').text()
            };
        },
        modify: function(data_new) { //修改显示
            /*1. 传过来的有区服角色；2. 只有区服*/
            var me = this,
                data_old = this.getData();
            var partition_new = data_new.partition,
                roleid_new = data_new.roleid,
                roleName_new = data_new.roleName,
                partition_old = data_old.partition,
                roleid_old = data_old.roleid;

            if (partition_new && this.existPartition(partition_new)) {
                if (partition_old !== partition_new) { //更换了区服
                    this.area.val(partition_new);
                    if(!roleid_new){
                        this.loadRoleList(partition_new); //处理roleid超大作为数字处理产生的bug
                        return;
                    } else {
                        this.AreaListManager.selectItem(data_new); //选择一项
                    }
                }
                if (roleid_old !== roleid_new || data_old.roleName !== roleName_new) { //更换了角色
                    if (roleid_new && roleName_new) { //有区服、角色

                        this.roleId.html(zUtil.sprint(role_item_templ, {
                            role_id: roleid_new,
                            nick: safeHTML(roleName_new)
                        })); //xss
                        this.roleId.val(roleid_new);

                        this.AreaListManager.selectItem(data_new); //选择一项
                    } else { // 缺少角色信息
                        this.loadRoleList(partition_new);
                    }
                }
            } //else不用处理
        },
        loadRoleList: function(partition) {
            var me = this;
            partition && this.DataSvr.getRoleList(partition).add(function(json) { //获取角色信息
                if (json.ret === 0) {
                    if ($.isArray(json.data)) {
                        var html = '';
                        $.each(json.data, function(i, data) {
                            !data.nick && (data.nick = data.role_id);
                            data.nick = safeHTML(data.nick); //xss
                            html += zUtil.sprint(role_item_templ, data);
                        })
                        me.roleId.html(html);

                        var curData = me.getData();
                        me.AreaListManager.addData(curData); //添加数据
                        me.RcntView.modifyReoleName(curData); //修改上面的数据
                    } else {
                        zMsg.show('您在该服务器上还没有角色哦！');
                        me.roleId.html('<option value="">请选择...</option>');
                    }
                } else if (json.ret == 10002) {
                    qv.zero.Login.show();
                } else {
                    zMsg.show('在该服务器上查询不到角色信息~');
                    me.roleId.html('<option value="">请选择...</option>');
                }
            });
        },
        showDialog: function(html) {
            this.popBox = new qv.zero.Dialog({
                title: "请选择游戏大区",
                content: html,
                buttons: [{
                    text: '取消',
                    click: $.proxy(this.hide, this)
                }, {
                    text: '确认',
                    click: $.proxy(this.submit, this)
                }]
            });
            this.popBox.show();
        },
        on: function(ename, handle) {
            ename += this.EventNS;
            this.el.on(ename, handle);
        },
        trigger: function(ename, data) {
            ename += this.EventNS;
            this.el.trigger(ename, data);
        },
        destroy : function(){
            var ns = this.EventNS; //注销事件
            this.el.off(ns + 'submit');
            this.el.off(ns + 'hide');
            this.el.off(ns + 'beforerender');
            this.el.off(ns + 'afterrender');

            //清空ui
            this.selector && this.selector.remove();
            this.rendered = null;
            this.render_end_promise = null;
            this._report_control = null;
            this.DataSvr = null;
            this.RcntView = null;
            this.selector = null;
            this.area = null;
            this.roleId = null;
        }
    });

    /**
     * 静默的区服选择器
     * @param {Object} cfg 参数
     */
    function SilentAreaSvrView(cfg){
        this._cfg = cfg;
        this.DataSvr = cfg.datasvr;
        this.handles = {};
        this.AreaSvrView = null; //没有默认区服的时候使用弹出区服的选择框
        this.AreaListManager = new AreaListManager({
            DataSvr: this.DataSvr
        });
    }
    $.extend(true, SilentAreaSvrView.prototype, {
        show : function(){
            this.AreaListManager.ready(function(data){
                if(data && data.list && data.list[0]){ //有数据
                    var odata = data.list[0], areadata = {
                        partition: odata.partition,
                        roleid: odata.roleid,
                        partitionName: odata.partitionName,
                        roleName: odata.roleName,
                        platid: this.DataSvr.platId,
                        area: this.DataSvr.areaId
                    };
                    this.trigger('submit', areadata); //将数据获取回来之后直接触发提交事件
                } else { //没有数据弹出区服选择器
                    if(!this.AreaSvrView){
                        var that = this;
                        this.AreaSvrView = new AreaSvrView(this._cfg);
                        this.AreaSvrView.on('submit', function(e, data){ //触发事件
                            that.trigger('submit', data);
                        });
                    }
                    this.AreaSvrView.show();
                }
            }, this);
        },
        hide : function(){},
        on : function(ename, handle){
            (this.handles[ename] || (this.handles[ename] = [])).push(handle);
        },
        trigger : function(ename, data){
            var handle = this.handles[ename];
            if(handle && handle.length){
                var e = new Event(ename);
                for(var i = 0, h; h = handle[i]; ++i){
                    h(e, data);
                }
            }
        },
        destroy : function(){
            this._cfg = null;
            this.DataSvr = null;
            this.handles = null;
            if(this.AreaSvrView){
                this.AreaSvrView.destroy();
                this.AreaSvrView = null;
            }
        }
    });
    //1 ：数据的类型、
    var DataType = {
        GAME : 1, //游戏方上报、
        IDIP : 2, //idip查询
        GIFT : 3, //领取礼包上报
        LOCALCACHE : 4 //本地缓存
    };
    //本地区服管理
    function AreaListManager(cfg) {
        this.DataSvr = cfg.DataSvr;
        this.isReady = new CallBack();

        this.DataSvr.ready(function(datasvr) {
            this.appid = datasvr.appid;
            this.platId = datasvr.platId;
            this.areaId = datasvr.areaId;
            this.cacheKey = [zUtil.getUin(), 'getRcntList', this.appid].join('/');

            this.selectedIndex = -1; //选中的项
            this.AMSAreaData = this.DataSvr.getAreaDataSync(); //同步获取AMS配置的区服数据

            this.init();
        }, this);
    }

    $.extend(true, AreaListManager.prototype, {
        init: function() {
            var cache = qv.zero.cache,
                me = this,
                cacheKey = this.cacheKey;
            var curTime = Math.round(new Date().getTime() / 1000);
            var defaultTimeSection = this.defaultTimeSection = curTime + 86400; //默认一天
            var cachedata = cache.get(cacheKey);
            if (cachedata) { //缓存操作
                me._doNext(cachedata, false);
            } else {
                this.DataSvr.getRcntList().add(function(data) {
                    //需要处理过滤、过期等操作
                    for (var i = 0, cur; cur = data[i]; i++) {
                        //校验cacheTime，引用修改字段
                        if (typeof cur.cacheTime === "undefined" || cur.cacheTime === 0) {
                            cur.cacheTime = defaultTimeSection;
                        }
                        if (cur && cur.partition && cur.roleId) {
                            cur.plat = me.platId; //以当前的数据为准
                            cur.area = me.areaId;
                            cur.s = DataType.GIFT;
                            if(cur.roleName)
                                cur.roleName = safeHTML(cur.roleName); //xss漏洞检测
                            else
                                cur.s = DataType.GAME;
                        } else {
                            data.splice(i, 1); //如果数据不合法，就直接干掉
                            i--;
                        }
                    }
                    me._doNext(data, true);
                    me._saveAreaCache();
                });
            }
        },
        ready: function(funx, context) {
            this.isReady.add(function(data) {
                funx.call(context, data);
            });
        },
        //添加数据 同步函数
        addData: function(data) {
            if (data) {
                var len = this.AreaList.length,
                    item = this._findDataById(data);
                if (item.index === -1) {
                    $.extend(true, data, {
                        i: len,
                        s: DataType.IDIP, //idip查询
                        plat: this.platId,
                        area: this.areaId,
                        dis : true
                    });
                    if (len > 0) {
                        data.cacheTime = this.AreaList[0].cacheTime;
                    } else {
                        data.cacheTime = this.defaultTimeSection; //默认的缓存时间
                    }
                    this.AreaList.push(data);
                    this.selectedIndex = len; //选中最后一项
                } else {
                    this.selectedIndex = item.index; //选中该项                        
                    item.data.roleName = data.roleName; //需要修改名称
                    item.data.roleid = data.roleid; //修改roleid js超大数字的bug
                }
            }
        },
        /*选中其中一项*/
        selectItem: function(data) {
            this.ready(function() {
                if (data) {
                    var item = this._findDataById(data);
                    if (item.index > -1) {
                        this.selectedIndex = item.index;
                    }
                }
            }, this);
        },
        /*更新缓存*/
        ModifyAreaCache: function(reportop) {
            this.ready(function() {
                if (this._needReportArea()) {
                    reportop();
                }
                this._beforeSaveData(); //初始化的时候不做处理
                this._saveAreaCache();
            }, this);
        },
        /*根据partition、roleid 查询数据*/
        _findDataById: function(data) {
            var list = this.AreaList,
                len = this.AreaList.length,
                i = 0;
            for (var item; item = list[i]; i++) {
                if (item.partition == data.partition && (item.roleid == data.roleid || !item.roleid/*处理roleid超大作为数字处理产生的bug*/ 
                    || this.appid == 1104466820 /*[王者]一个区服一个角色*/)) {
                    break;
                }
            }
            i = i >= len ? -1 : i;
            return {
                index: i,
                data: this.AreaList[i]
            };
        },
        /*继续下一步操作*/
        _doNext: function(data, noneusecache) {
            this.AreaList = noneusecache ? this._initData(data) : this._initCachedata(data);
            this._bug_20160311(this.AreaList);/*处理roleid超大作为数字处理产生的bug*/
            this._dealDisplay();
            this.isReady.execute(this._composeArg(this.AreaList));
        },
        /*保存数据*/
        _saveAreaCache: function() {
            var data = this.AreaList;
            if (data && data.length) {
                var curTime = Math.round(new Date().getTime() / 1000);
                qv.zero.cache.add(this.cacheKey, data, (data[0].cacheTime - curTime) * 1000);
            }
        },
        /*保存数据之前处理数据*/
        _beforeSaveData: function() {
            var data = this.AreaList;
            var index = this.selectedIndex;

            if (index > 0) {
                var item = data.splice(index, 1)[0];
                data.unshift(item);
            }
            if (data.length > 3) {
                this.AreaList = data.slice(0, 3); //只取前三条
            }
        },
        /*是否需要上报数据*/
        _needReportArea: function() {
            var index = this.selectedIndex,
                selectedItem = this.AreaList[index],
                isneed = false;
            if (selectedItem) {
                if (selectedItem.s === DataType.GAME || selectedItem.s === DataType.IDIP) { //新增的数据
                    isneed = true;
                } else if (index !== 0) { //更改了顺序
                    isneed = true;
                }
            }
            return isneed;
        },
        /*拼装数据*/
        _composeArg: function(data) {
            var frist = (data[0] || {});
            return {
                list: data,
                dftPartition: frist.partition,
                dftRoleId: frist.roleid
            };
        },
        /*处理是否显示*/
        _dealDisplay: function() {
            var pdata = this.AMSAreaData,
                data = this.AreaList;
            for (var k = 0, kitem; kitem = data[k]; k++) {
                var find = false;
                for (var i = 0, item; item = pdata[i]; i++) {
                    if (kitem.partition == item[1]) {
                        find = true;
                        break;
                    }
                }
                kitem.dis = find; //是否显示
            }
        },
        /*初始化数据*/
        _initData: function(data) {
            data = data || [];
            var index = 0;
            data.map(function(i) {
                i.roleid = i.roleId; //将数据抚平
                delete i.roleId;
                i.i = index++;
            });
            return data;
        },
        /*初始化缓存数据*/
        _initCachedata : function(data){
            data = data || [];
            var index = 0;
            data.map(function(i) {
                i.s = DataType.LOCALCACHE; //表示数据来至缓存
            });
            return data;
        },
        /*处理roleid超大作为数字处理产生的bug*/
        _bug_20160311 : function(data){
            var max = Number.MAX_SAFE_INTEGER || (Math.pow(2,53) - 1);
            data.map(function(cur){
                if(parseInt(cur.roleid, 10) > max){
                    cur.s = DataType.GAME;
                    cur.roleid = '';
                    cur.roleName = '';
                }
            });
        }
    });

    function RcntView(cfg) {
        this.data = cfg.data || [];
        this.content = cfg.content.find('#rcnt_play_con');
        this.modifyAreaUI = cfg.modifyAreaUI;
        this.dftPartition = cfg.dftPartition;
        this.dftRoleId = cfg.dftRoleId;
    }

    $.extend(true, RcntView.prototype, {
        initEvent: function() {
            var me = this;
            this.content.on("click", 'input', function(evt) {
                var dom = $(this);

                if (dom.attr("checked")) { //如果选中了,就选中。清除其他的，并且更换下面的选项

                    var partitionId = dom.attr("data-partitionid");
                    var partitionName = dom.attr("data-partitionname");
                    var roleId = dom.attr("data-roleid");
                    var roleName = dom.attr("data-rolename");

                    me.modifyAreaUI({
                        partition: partitionId,
                        roleid: roleId,
                        partitionName: partitionName,
                        roleName: roleName,
                        isinstall: false
                    }); //更新界面
                }
            });

            if (this.dftPartition && this.dftRoleId) {
                var dftpName = this.getValBykey('partitionName', 'partition', this.dftPartition);
                var dftrName = this.getValBykey('roleName', 'roleid', this.dftRoleId);
                me.modifyAreaUI({
                    partition: this.dftPartition,
                    roleid: this.dftRoleId,
                    partitionName: dftpName,
                    roleName: dftrName,
                    isinstall: true
                }); //初始化
            } else if(this.dftPartition){ //处理roleid超大作为数字处理产生的bug
                var dftpName = this.getValBykey('partitionName', 'partition', this.dftPartition);
                me.modifyAreaUI({
                    partition: this.dftPartition,
                    roleid: '',
                    partitionName: dftpName,
                    roleName: '',
                    isinstall: true
                }); //初始化
            }
        },
        render: function() {
            var html = [],
                dftPartition = this.dftPartition,
                dftRoleId = this.dftRoleId;
            for (var i = 0, item; item = this.data[i]; i++) {
                if (item.dis) { //显示
                    html.push(' <div class="area-row">');
                    html.push(' <label class="ui-checkbox ui-checkbox-s">');
                    html.push('     <input type="radio" name="area_role"  data-roleid="', item.roleid, '" data-partitionid="', item.partition, '" data-rolename="', item.roleName, '" data-partitionname="', item.partitionName, '"', (dftPartition == item.partition && dftRoleId == item.roleid ? "checked" : ""), '/> ');
                    html.push(item.partitionName, '-', item.roleName);
                    html.push('   </label>');
                    html.push(' </div>');
                }
            };
            this.content.html(html.join(''));
        },
        getValBykey: function(key, key2, val) {
            var ret = this.data.filter(function(i) {
                return i[key2] == val;
            });
            return (ret[0] || {})[key];
        },
        /*获取选中的项*/
        getSelectedData: function() {
            var dom = this.content.find('input:checked');
            return {
                partition: dom.attr("data-partitionid"),
                partitionName: dom.attr("data-partitionname"),
                roleid: dom.attr("data-roleid"),
                roleName: dom.attr("data-rolename")
            };
        },
        //更改呈现的顺序
        modifyUIOrder: function() {
            this.content.find('input:checked').closest('.area-row').insertBefore(this.content.children()[0]);
        },
        /**
         * 修改角色名称
         * @param  {any} serverdata {list :[], partition: ''}
         * @return {void}            [description]
         */
        modifyReoleName: function(serverdata) {
            var item, litem, localdata = this.data,
                partition = serverdata.partition;
            for (var j = localdata.length - 1; j >= 0; j--) {
                litem = localdata[j];
                if(partition == litem.partition){
                    if(litem.roleid === serverdata.roleid || !litem.roleid){
                        litem.roleid = serverdata.roleid;
                        litem.roleName = serverdata.roleName;
                    }
                    litem.partitionName = serverdata.partitionName;
                }
            }
            this.dftPartition = partition;
            this.dftRoleId = serverdata.roleid;
            this.render(); //重新呈现
        }
    });

    function DataServer(cfg) {
        this.game = String(cfg.game).toLowerCase();
        this.sourceKey = cfg.sourceKey;
        this.options = cfg; //hold住配置数据
        this.init(cfg);
    }

    $.extend(true, DataServer.prototype, {
        init: function() {
            var newGame = this.game;
            var cb = this._ready = new CallBack();
            var wxSubfix = zUtil.isQGameWX && zUtil.isQGameWX()? '_wx' : '';
            var idipPath = isFinite(newGame) ? zUtil.idipPath.replace('idip', 'sdk') : zUtil.idipPath;
            zUtil.require(['http://' + zUtil.widgetDomain + idipPath + '/' + newGame + wxSubfix + '.js', 'cache'], function() {
                var params = this.AreaData = qv.zero.Idip[newGame];

                if ($.isArray(params.platid)) {
                    this.platId = ios ? params.platid[0] : params.platid[1];
                } else {
                    this.platId = params.platid;
                }
                if ($.isArray(params.area)) {
                    this.areaId = ios ? params.area[0] : params.area[1];
                } else if (params.area !== -1) {
                    this.areaId = params.area;
                }
                this.appid = params.appid;
                this._ready.execute(this);
            }, {
                scope: this
            });
        },
        /*是否准备完毕*/
        ready: function(funcx, context) {
            this._ready.add(function(data) {
                funcx.call(context, data);
            });
        },
        /*获取区服数据信息*/
        getAreaData: function() {
            var cb = new CallBack();
            this.ready(function() {
                cb.execute(this.getAreaDataSync());
            }, this);
            return cb;
        },
        /*同步获取区服数据信息*/
        getAreaDataSync: function () {
            var key = this.sourceKey || 'serverList',
                data = this.AreaData[key];
            if (!data) {
                if(key.indexOf('serverList') === -1){ //指定区服
                    return this.getAreaDataByPartitions(key);
                } else {
                    return [];
                }
            }
            if (ios) {
                return data.ios || [];
            } else {
                return data.and || [];
            }
        },
        /* 根据partition获取指定的区服 */
        getAreaDataByPartitions: function (partitions) {
            if (!partitions) {
                return [];
            }
            var parts = partitions.split(','), item, result = [],
                data = this.AreaData.serverList || {},
                part = (ios ? data.ios : data.and) || [];
            for (var i = 0, len = parts.length; i < len; ++i) {
                item = parts[i];
                item = item.replace(/^-*|-*$/g, ''); //去掉首尾的 - 
                var p = item.split('-');
                if (p.length > 1) { //范围
                    var begin = Number(p[0]), end = Number(p[1]);
                    for(; begin <= end; ++begin){
                        result.push(begin);
                    }
                } else if(p[0]){ //指定的区服
                    result.push(Number(p[0]));
                }
            }
            var list = [];
            for(var i = 0, len = part.length; i < len; ++i){ //查找指定的区服
                if(result.indexOf(part[i][1]) > -1){
                    list.push(part[i]);
                }
            }
            return list;
        },
        /*拉取指定区服的角色*/
        getRoleList: function(partition) {
            var cb = new CallBack();
            var params = {
                _c: this.options.controller || 'queryRoleInfo',
                gamename: this.game,
                area: this.areaId,
                platid: this.platId,
                partition: partition
            };
            if (zUtil.isQGameWX && zUtil.isQGameWX()) {
                params._wxLogin=1;
                var gameSvr = qv.zero.Idip[this.game];
                var wxappid = gameSvr && gameSvr.wxappid? gameSvr.wxappid : '';
                var _param = {wx_appid: wxappid};
                params._param = encodeURIComponent(JSON.stringify(_param));
            }

            zHttp.request(params, function(json) {
                cb.execute(json);
            });
            return cb;
        },
        /*获取后台的最近在玩的区服*/
        getRcntList: function() {
            var cb = new CallBack();
            if (zUtil.isQGameWX && zUtil.isQGameWX()) {
                //微信内先不请求最近在玩@todo
                cb.execute([]);
            } else {
                zHttp.ajax({
                    url: 'http://info.gamecenter.qq.com/cgi-bin/gc_play_info_fcgi?param={"key":{"param":{"tt":' + platCode + ',"appid":"' + this.appid + '","version":2},"module":"gc_play_info","method":"getServerList"}}',
                    cache: false,
                    timeout: 1000,
                    callback: function(json) {
                        if (json.ret !== 5) {
                            var retBody = json.data.key.retBody;
                            if (retBody.result === -120000) {
                                qv.zero.Login.show();
                            } else {
                                var data = retBody.data || [];
                                cb.execute(data);
                            }
                        } else {
                            cb.execute([]);
                        }
                    }
                });
            }
            return cb;
        },
        /*上报新数据至后台*/
        recordRcntInfo: function(param) {
            if (zUtil.isQGameWX && zUtil.isQGameWX()) {
                //微信内先不请求最近在玩@todo
                return;
            }
            zHttp.ajax({
                url: 'http://info.gamecenter.qq.com/cgi-bin/gc_play_info_fcgi?param={"key":{"param":{"tt":' + platCode + ',"appid":"' + this.appid + '","area":' + this.areaId + ',"plat":' + this.platId + ',"partition":' + param.partition + ',"roleId":"' + param.roleid + '","partitionName":"' + param.partitionName + '","roleName":"' + param.roleName + '"},"module":"gc_play_info","method":"recordServerInfo"}}',
                cache: false,
                timeout: 1000
            });
        }
    });

    /**
     * 对象容器，用于缓存
     */
    var ObjectContent = {
        cache : {},
        getObject : function(key, construct, param){
            var key = this.createkey(key), obj = this.cache[key];
            if(!obj){
                obj = this.cache[key] = new construct(param);
            }
            return obj;
        },
        hasCache : function(key){
            return !!this.cache[this.createkey(key)]
        },
        createkey : function(key){
            return '__ass__' + key;
        },
        destroy : function(key){ //销毁
            var key = this.createkey(key), obj = this.cache[key];
            if(obj){
                obj.destroy && obj.destroy();
                this.cache[key] = null;
                obj = null;
            }
        }
    }

    /**
     * 事件连接器；解决一个视图对应多个实例，事件接受者错乱的问题
     */
    function EventAdapter(content){
        this._accepter = content;
        this.hasmonitor = {};
    }
    $.extend(EventAdapter.prototype, {
        monitor : function(pusher, ename, hendles){
            if(!this.hasmonitor[ename]){
                this.hasmonitor[ename] = true;
                var me = this;
                pusher.on(ename, function(){
                    hendles.apply(me._accepter, arguments);
                });
            }
        },
        setAccepter : function(obj){
            this._accepter = obj;
        }
    });

    /*区服选择对象*/
    function AreaSvrSelector(config) {
        $.extend(this, config);
        this.name = this.name || this.game;
        this.silent = !!config.silent;
        this.__prekey__ = this.name.toLowerCase() + '-' + (this.serverList || 'serverList') + '-';
        this.initData();
    }

    $.extend(true, AreaSvrSelector.prototype, {
        getKey: function(name){
            return this.__prekey__ + (name || '');
        },
        initData : function(){
            var asv = this.silent ? SilentAreaSvrView : AreaSvrView;
            var datasvr = this.DataServer = ObjectContent.getObject(this.getKey('DataServer'), DataServer, {
                    game: this.name,
                    sourceKey: this.serverList || 'serverList',
                    controller: this.controller //查询角色的控制器
                }),
                me = this;

            datasvr.ready(function(svr) {
                var asKey = this.getKey(this.silent ? 'SilentAreaSvrView' : 'AreaSvrView'), epkey = this.getKey('EventAdapter'),
                    hasCache = ObjectContent.hasCache(epkey);
                this.AreaSvrView = ObjectContent.getObject(asKey, asv, {
                    datasvr: svr,
                    Templ: rcnt_templ + area_templ + role_templ
                });

                this.EventAdapter = ObjectContent.getObject(epkey, EventAdapter, this);

                if(!hasCache){
                    this.initEvent(); //给AreaSvrView 绑定事件,如果是缓存的数据，则不需要再次绑定。其他的动作请另外处理。
                }
            }, this);
        },
        initEvent: function() {
            this.EventAdapter.monitor(this.AreaSvrView, 'submit', function(e, data) {
                var me = this, game = this.name.toLowerCase();
                var args = {
                    actid: me.actid,
                    area: data.area,
                    platid: data.platid,
                    zoneid: me.zoneid,
                    partition: data.partition,
                    sid: sid,
                    roleid: data.roleid,
                    game: game
                };
                me.cacheHitState(args); //保存缓存命中数据
                if (me.send) {
                    me.send(args, me.callback);
                } else {
                    var rbtn;
                    if (typeof me.rbtn === 'boolean') {
                        rbtn = me.rbtn;
                    } else if (typeof me.rbtn === 'string') {
                        rbtn = me.rbtn;
                    } else {
                        rbtn = true;
                    }
                    zHttp.syrequest(args, me.callback, rbtn);
                }
                me.hide({source: 'submit'});
            });
            this.EventAdapter.monitor(this.AreaSvrView, 'hide', function(e, data) {
                this.cancel && this.cancel(data);
            });
        },
        /**
         * @for qv.zero.AreaSvrSelector
         * @method show
         * @description 选区框显示
         * @param {String} config.name 游戏名称
         * @param {Number} config.actid 活动号
         * @param {String} [config.serverList] 在imgcache.qq.com\htdocs\club\common\lib\zero\idip目录各个游戏名下自定义大区列表名称，如果是数组，则为一组列表，如果是对象，则为ios和android两组对象
         * @param {String} [config.charset] 请求游戏接口时的编码,默认为gbk
         * @param {Boolean | String} [config.rbtn] 右侧按钮的样式,默认为true,即为开始游戏，flase为不显示右侧按钮，'openVip'为开通游戏按钮
         * @param {Function} [config.send] ， 发送请求接口，默认以qv.zero.Http.request
         * @example
         *  列子一，简单调用，默认大区列表：
         *  var ass = new qv.zero.AreaSvrSelector({
         *     name : 'Ttxd',
         *     actid : 26493    
         *  });
         *  ass.show();
         *  例子二，自定义大区列表、请求游戏编码的接口及弹出层右边按钮：
         *  var ass = new qv.zero.AreaSvrSelector({
         *     name : 'Ttxd',
         *     actid : 26493,
         *     serverList : 'serverList1',
         *     charset : 'UTF-8',
         *     rbtn : 'openVip'
         *  });
         *  ass.show();
         *  列子三，传入回调
         *  var ass = new qv.zero.AreaSvrSelector({
         *     name : 'Ttxd',
         *     send : function (args) {
         *           zHttp.request({actid : 26493,roleid : args.roleid,area : args.area,partition: args.partition})
         *     }   
         *  });
         *  ass.show();
         * @return {void}
         */
        show: function(config) {
            $.extend(this, config);
            this.ready(function() {
                this.EventAdapter.setAccepter(this);
                this.AreaSvrView.show();
            }, this);
        },
        /**
         * @method hide
         * @description 选区框关闭
         * @for qv.zero.AreaSvrSelector
         * @return {void}
         */
        hide: function(data) {
            this.ready(function() {
                this.AreaSvrView.hide(data || {source: 'code'});
            }, this);
        },
        /*这个是异步的*/
        ready: function(funx, context) {
            this.DataServer.ready(function() {
                funx.call(context || window);
            });
        },
        /**
         * 从缓存中获取默认的角色信息
         * @return {Object} 角色信息
         */
        getDefaultRoleInfoFromCache : function(callback){
            var cb = new CallBack();
            this.ready(function() {
                this.AreaSvrView.AreaListManager.ready(function(data){
                    var ret = null;
                    data && data.list && (ret = data.list[0]);
                    ret = ret || {};
                    ret = convertData(ret, 'area,partition,partitionName,plat,roleName,roleid'.split(','));
                    callback && callback(ret);
                    cb.execute(ret);
                });
            }, this);
            return cb;
        },
        /**
         * 从缓存中获取所有的角色信息
         * @return {Array} 角色信息列表
         */
        getAllRoleInfoFromCache : function(callback){
            var cb = new CallBack();
            this.ready(function() {
                this.AreaSvrView.AreaListManager.ready(function(data){
                    var ret = null, arr = [];
                    data && data.list && (ret = data.list);
                    ret = ret || [];
                    ret.map(function(i){
                        arr.push(convertData(i, 'area,partition,partitionName,plat,roleName,roleid'.split(',')));
                    });
                    callback && callback(arr);
                    cb.execute(arr);
                });
            }, this);
            return cb;
        },
        /**
         * 修改ServerList
         */
        setServerList : function(key){
            if(this.serverList !== key){
                this.serverList = key;
                this.__prekey__ = this.name.toLowerCase() + '-' + (this.serverList || 'serverList') + '-';
                this.destroy();
                this.initData(); //初始化
            }
        },
        /**
         * 销毁对象
         * @return {void}
         */
        destroy : function(){
            ObjectContent.destroy(this.getKey('DataServer'));
            ObjectContent.destroy(this.getKey('AreaSvrView'));
            ObjectContent.destroy(this.getKey('EventAdapter'));
        },
        /**
         * 最近使用的角色的接口(原始接口)
         * @return {CallBack}
         */
        getRcntList: function(){
            return this.DataServer.getRcntList();
        },
        /**
         * 根据partition获取角色
         * @return {CallBack}
         */
        getRoleList: function (partition) {
            return this.DataServer.getRoleList(partition);
        },
        /**
         * 获取所有区服信息
         */
        getAreaList: function(){
            return this.DataServer.getAreaData();
        },
        /**
         * 通知组件变更了数据(写入变更数据)
         * data: {partition: 0, roleid: 0, partitionName:'', roleName: ''}
         */
        notify: function(data){
            if(this.AreaSvrView && this.AreaSvrView.AreaListManager.AreaList){
                this.AreaSvrView.AreaListManager.addData(data);
                this.cacheHitState($.extend({game: this.name}, data));
            }
        },
        /**
         * 保存请求的命中数据
         * @param  {object} data 请求数据
         */
        cacheHitState: function(data){
            var key = (data.game || '').toLowerCase() + '_' + (data.partition || 0);
            if(!ObjectContent.hasCache(key)){
                var al = this.AreaSvrView.AreaListManager.AreaList || [], state = DataType.LOCALCACHE;
                if(al.length > 0){
                    for(var i = 0, item; item = al[i]; ++i){
                        if(item.roleid == data.roleid && item.partition == data.partition){
                            state = item.s;
                            setTimeout(function(){ //延迟防止数据错误
                                item && (item.s = DataType.LOCALCACHE); //后面就是缓存了
                                ObjectContent.getObject(key , Object).state = DataType.LOCALCACHE;
                            }, 500);
                            break;
                        }
                    }
                }
                ObjectContent.getObject(key , Object).state = state;
            }
        }
    });

    function convertData(data, keys){
        var ret = {}; keys = keys || [], data = data || {};
        for(var i = 0, item, obj; item = keys[i]; i++){
            obj = data[item];
            (obj !== void 0) && (ret[item] = obj);
        }
        return ret;
    }

    /**
     * 命中缓存
     * @param  {Object}  data 请求的数据
     * @return {Boolean}      返回是否命中缓存
     */
    AreaSvrSelector.cacheHitState = function(data){
        var key = (data.game || '').toLowerCase() + '_' + (data.partition || 0);
        return ObjectContent.getObject(key, Object).state || DataType.LOCALCACHE;
    };
    /**
     * 触发上报区服数据
     * @return {[type]} [description]
     */
    AreaSvrSelector.reportArea = function(game, json){
        var key = game.toLowerCase() + 'AreaSvrView';
        if(ObjectContent.hasCache(key)){
            var asv = ObjectContent.getObject(key);
            asv && asv.reportArea && asv.reportArea(json); //触发上报
        }
    };
    exports.AreaSvrSelector = AreaSvrSelector;

    //注册函数
    if(window.zHttp && zHttp.bindRequestWidget){
        zHttp.bindRequestWidget({onReady : function(args){
            if(args && 'partition' in args && 'roleid' in args){
                args.cache_hit = AreaSvrSelector.cacheHitState(args);
                args.area_selector = 1;
            }
        }, onComplete : function(args, i, json){
            if(args.game){
                AreaSvrSelector.reportArea(args.game, json);
            }
        }});
    }
})(qv.zero, Zepto);
