/**
 * 选择大区框中显示大区和选择的服务器
 * @version 1.0
 * @datetime 2014-10-22
 * @author shinelgzli
 * @name qv.zero.PCGameAreaSvrSelector
 * @param config
 * @param {String} config.game 游戏代号
 * @param {Number} config.actid 活动号
 * @param {Number} [config.tiptxt] 显示在对话框的提示语
 * @param {Boolean} config.renderMode 自定义渲染模式：默认为all，支持all/server/area/arearole
 * @param {Function} [config.send] 发送请求接口，默认以qv.zero.Http.request
 * @param {Function} [config.callback] 请求后执行，默认以qv.zero.Http.showResponse实现
 * @param {Boolean | String} config.rbtn 可选， 右侧按钮的样式,默认为true,即为开始游戏，flase为不显示右侧按钮，'openVip'为开通游戏按钮 
 * @param {Object} [config.roleInfoParams] {} 获取角色信息额外参数
 * @example
 * renderMode 自定义渲染模式：默认为all，支持all/server/area/arearole：
 * 		all渲染模式：		大区，服务器，角色
 * 		server渲染模式：	大区，服务器
 * 		area渲染模式：  	大区
 * 		arearole渲染模式： 	大区，角色 
 * @example
 * var ass = new qv.zero.PCGameAreaSvrSelector({
 *     game : 'lol',
 *     actid : 11111
 * });
 * ass.show();
 * @example
 * var ass = new qv.zero.PCGameAreaSvrSelector({
 *     game : 'lol',
 * });
 * ass.show({actid : 1111});
 * @example
 * 如果想自定选择大区的确定按钮，可以传入send接口自定处理
 * send : function( args, callback){
 * 	//args，即可大区信息，包括 actid, roleid, area, area_name(已转码)
 *  //callback，即为参数的callback
 * 	//do something
 *  //如果把大区的信息发给另一个请求，然后再执行默认的请求
 *  zHttp.send({actid : youractid});
 *  //默认的请求
 *  zHttp.request(args, this.callback);
 * }
 * @class
 */
(function(exports, $){
var sid = zURL.get('sid');
/**
 * @constructor
 * @exports PCGameAreaSvrSelector as qv.zero.PCGameAreaSvrSelector
*/
function PCGameAreaSvrSelector(config) {
    //自动加载大区选项数据
    this.dataName = config.name.toUpperCase() + 'ServerSelect';
    if (config.name.toUpperCase() == 'JFZR') {
        this.dataName = 'JFServerSelect';
    }
    this.ds = this.getDataSource(config.name);
	if (!window[this.dataName]) {
		zUtil.require(this.ds, null, {charset : (this.charset || 'gbk')});
    }
    this.rendered = false;
    this.eventreg = false;
    $.extend(this, config);
};
/**
 * @exports ExtAreaSvrSelector.prototype as qv.zero.ExtAreaSvrSelector.prototype
*/
PCGameAreaSvrSelector.prototype = {
    /**
     *V5的游戏名与游戏大区那边的映射
     * @private
     */
    gnMap : {
        qxzb : 7,
        _9j : '9j',
        _9 : 9,
		_3 : 3,
        nba: 'nba2k',
        jfzr : 'jf'
    },
	renderMode : 'default',
    //其他格式的数据,需要特别处理
    specsrc : {
    	'qqbl' : [(window.location.protocol === 'https:' ? 'https://proxy1.vip.qq.com/tx_tls_gate=cgi.bl.qq.com/gw/getzone.jsp?var=qqbl_areadata' : 'http://cgi.bl.qq.com/gw/getzone.jsp?var=qqbl_areadata'),'utf-8'],
		'jjxf' : ['http://youxi.vip.qq.com/common/area_data/jjxf.js','utf-8']
    },
    getDataSource : function (game) {
    	if(this.specsrc[game]){
    		this.charset = this.specsrc[game][1];
    		return this.specsrc[game][0];
    	}
    	return 'http://game.qq.com/comm-htdocs/js/game_area/' + (this.gnMap[game] || game) + '_server_select.js';
    },
	//提示语结构
	getTipTpl : function () {
		return '<p style="margin:10px 0;" class="tiptxt">' + (this.tiptxt || '') + '</p>';
	},
	//角色结构
	getRoleTpl : function () {
		return  '<select class="role_select" name="roel_select" style="margin-top:10px;width:100%;height:30px;"></select>';
	},
	//服务器结构
	getSvrTpl : function () {
		return  '<select class="svr_select" name="svr_select" style="margin-top:10px;width:100%;height:30px;"></select>';
	},
	//大区结构
	getAreaTpl : function() {
		return  '<select class="area_select" name="area_select" style="margin-top:10px;width:100%;height:30px;"></select>';
	},
    /**
     * 只有大区的渲染模式
     * @return {void}
     */
    areaRender : function () {
        return [this.getAreaTpl()];
    },
	/**
     * 只有大区和服务器的渲染模式 
     * @return {array}
     */
    serverRender : function() {
        return [ this.getAreaTpl() + this.getSvrTpl() + this.getTipTpl()];   
    },
	/**
     * 只有大区和角色的渲染模式 
     * @return {array}
     */
	arearoleRender : function(){
		return  [ this.getAreaTpl() +this.getRoleTpl() + this.getTipTpl()];
	},
	/**
     * 全部渲染模式 （大区、服务器、角色）
     * @return {array}
     */
	defaultRender : function(){
		return  [this.getAreaTpl() + this.getSvrTpl() + this.getRoleTpl() + this.getTipTpl()];
	},
	/**
	* 设置提示语
	*/
	setTipTxt : function (msg) {
		this.selector.find('p.tiptxt').html(msg || '');
	},
    /**
     * 正常的渲染模式，包括大区，服务器，角色 
     * @return {void}
     */
    render : function() {
        var html = '请根据以下需求进行选择：<br>';
        html += this[this.renderMode + 'Render']();
        this.popBox = new qv.zero.Dialog({
            autoShow : false,
            content : html,
            buttons: [
                {text:'取消', click:$.proxy(this.hide,this)},
                {text:'确认', click:$.proxy(this.submit,this)}
            ]
        });
        this.rendered = true;
    },
    /**
     * 打开大区选择界面
     * @param {Object} config 配置参数列表，与实现化的参数一样，可以覆盖实例 化时的参数
     * @return {void}
     */
    show : function(config) {
        var me = this;
        qv.zero.Login.ensure(function() {
        	zUtil.require(me.ds,function(){
        		this.specsrc[this.name] && this.needealExcute();
        		this.areaSvrData = window[this.dataName]['STD_DATA'];
        		if (!this.rendered) {
	                this.render();
	            }
	            $.extend(this, config || {});
                
                this.popBox.show();
                this.id = this.popBox.domId;
                this.selector = $(this.id);
                this.area = this.selector.find('.area_select');
                this.svr = this.selector.find('.svr_select');
                this.role = this.selector.find('.role_select');
                
				
	            if (!this.eventreg) {
	                !this.isMode('area') && this.initEvent();
                    this.initOptions();
                }
				//this.setTipTxt(this.tiptxt);
        	}, {charset : this.charset || 'gbk', scope : me});
        });
    },
	isMode : function (mode){
		return this.renderMode === mode;
	},
    /**
     * 隐藏大区界面
     * @return {void}
     */
    hide : function() {
        this.popBox.hide(false);
    },
    /**
     * 初始化事件
     * @return {void} 
     */
    initEvent : function() {
        this.area.bind('change', $.proxy(this.onAreaChange, this));
        this.svr.bind('change', $.proxy(this.onSvrChange, this));
        this.eventreg = true;
    },

    /**
     *  将大区名赋值给下拉框
     * @return {void}
     */
    initOptions : function(valed) {
        this.setOptionVal(this.area,{text:'请选择大区', value: -1},true);
        this.setOptionVal(this.svr,{text:'请选择服务器', value: -1},true);
        this.setOptionVal(this.role,{text:'请选择角色', value: -1},true);
        $.each(this.areaSvrData, $.proxy(function(index, data){
            this.setOptionVal(this.area,{text: data.t, value: this.isMode('arearole') ? data.v : index});
        }, this));
    },
    /**
     * 设置下拉选择框的选项 
     */
    setOptionVal : function (select,props,clear ) {
        clear && select.empty();
        $(zUtil.sprintf('<option value="{value}" status="{status}">{text}</option>', props)).appendTo(select);
    },
    /**
     * 大区选择联动 
     * @return {void}
     */
    onAreaChange : function() {
        var areaValue = this.area.val() || -1;
        this.setOptionVal(this.svr, {text:'请选择服务器', value : -1}, true);
        this.setOptionVal(this.role, {text: '请选择角色', value: -1}, true);
        if (this.isMode('arearole')) {
             this.setOptionVal(this.svr,{text: '空', value: 0, status: 1}, true);
             this.onSvrChange();
             return ;
        }
        /*根据大区将相应的服务器名赋给下拉框*/
        if (-1 != areaValue) {
            var jnSvr = this.areaSvrData[areaValue]['opt_data_array'], text;
            for (var key in jnSvr ) {
                text = 0 == jnSvr[key]['status'] ? jnSvr[key]['t'] + '(停机)' : jnSvr[key]['t'];
                this.setOptionVal(this.svr, {text: text, value: jnSvr[key]['v'], status: jnSvr[key]['status']}, false);
            }
        }
    },
    getRoleInfo : function(){
      return this.roleInfo;  
    },
    /**
     * 服务器选择联动 
     * @return {void}
     */
    onSvrChange : function() {
        if(0 == this.getSelected(this.svr).attr('status')) {
            zMsg.show('非常抱歉，此服务器正停机维护中');
            return;
        }
        this.setOptionVal(this.role,{text: '请选择角色', value: -1},true);
        var areaval = this.isMode('arearole') ? this.area.val() : this.svr.val() || -1, 
            me = this,roleHtml = '';

        if (-1 != areaval && !this.isMode('server')) {
            //var postUrl =  zURL.appendParams(me.roleInfoparams, qv.zero.Http.baseUrl + '?_c=queryRoleInfo&gamename=' + this.game +'&area=' + areaval);
            zHttp.request({_c:'queryRoleInfo', gamename:this.name, area:areaval, sid:sid}, function(json) {
                var code = json['ret'], role;
                if (code == 0 && json.data.length > 0) {
                    me.roleInfo = json.data;
                    $.each(json.data, function(index, data){
                          roleHtml += zUtil.sprintf('<option value="{role_id}">{nick}</option>', data);
                    });
                    me.role.html(roleHtml);
                } else if(code == 10002) {
                    qv.zero.Login.show();
                } else {
                    zMsg.show("在该服务器上查询不到角色信息~");
                }
            });
        }
    },
    /**
     * 验证 逻辑
     * @param {Object} area 大区
     * @param {Object} svr 服务器
     * @param {Object} role 角色
     * @return {void}
     */
    validate : function(area, svr, role) {
        if (this.isMode('area')) {
            if (!area) {
                zMsg.show('请选择大区！');
                return false;
            }
        } else {
            var status = this.getSelected(this.svr).attr('status');
            if (0 == status) {
                zMsg.show('非常抱歉，此服务器正停机维护中！');
                return false;
            } else if (-1 == area) {
                zMsg.show('请选择大区！');
                return false;
            } else if (-1 == svr) {
                zMsg.show('请选择服务器！');
                return false;
            } else if (-1 == role && !this.isMode('server')) {
                zMsg.show('请选择游戏角色！');
                return false;
            }
        }
        return true;
    },
    /**
     * 获取角色名字 
     */
    getRoleName : function () {
    	return  this.role.val() == -1 ? '' : this.getSelected(this.role).html();
    },
    /**
    * 获取选择的option
    */
    getSelected : function (tar) {
        return tar.children('option').not(function(){return !this.selected;});
    },
    /**
     * 获取大区名字 
     */
    getAreaName : function () {
        var areaName = this.getSelected(this.area).html();
		switch(this.renderMode){
			case 'arearole' : 
				return areaName;
			case 'area' : 
				return areaName;
			default : 
				return areaName + '-' + this.getSelected(this.svr).html();
		};               
    },
    /**
     * 提交并发送请求 
     * @return {void}
     */
    submit : function() {
        var area, svr, role, areaName, args, areaid;
        if (this.isMode('area')) {
            area = $("#"+this.popBox.id).find('input[type=radio]:checked').val();
        } else {
            area = this.area.val();
            svr = this.svr.val();
            role = this.role.val();
        }
        if (this.validate(area, svr, role) === true) {
            areaid = this.isMode('arearole') ? area : svr;
            args = {sid:sid, actid: this.actid, roleid: role, area: areaid, area_name: encodeURIComponent(this.getAreaName()) , role_name : encodeURIComponent(this.getRoleName())};
            if (this.send) {
                this.send(args, this.callback);
            } else {
                zHttp.request(args, this.callback, this.rbtn);
            }
            this.hide();
        }
        return false;
    },
    needealExcute : function () {
    	var areas = window[this.name + '_areadata'].area;
    	var G_data = this.name.toUpperCase() + 'ServerSelect';
    	window[G_data] = { STD_DATA :  [] };
    	var data = window[G_data].STD_DATA, zones;
    	$.each(areas, function (index, area) {
    		zones = [];
    		$.each(area.zone, function(j, e){
    			zones.push({t : e.name, v: e.id, status : e.status});
    		});
    		data.push({t : area.name, v : index+1, opt_data_array : zones});
    	});
    }
};
exports.PCGameAreaSvrSelector = PCGameAreaSvrSelector; 
})(qv.zero, Zepto);