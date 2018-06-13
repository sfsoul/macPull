/**
 * 微信手游选区选角色组件
 *
 */
(function(exports, $) {
    var _static	  = {};	//声明静态变量
    var platCode   = /iphone|ipad|itouch/ig.test(window.navigator.userAgent)? 2 : 1;
    var roleTipFlag = false;
    //CGI返回的最近在玩的数据里面第一条是最新的，如果第一条都是非法的记录，那就标记下来，页面一定会去请求IDIP数据，保证用户能看到最新的一条记录
    var firstRcnBadItem = null;
    //存储CGI返回的最近在玩的角色数据，而且是指有角色ID但没有角色名称的坏数据
    var recentlyPlayBadData = [];
    //静态模板文件

    var frameTmpl = '\
    	<div class="wxgame-ui-dialog show">\
		<div class="wxgame-ui-dialog-cnt dialog-startup-cnt">\
	        <div class="wxgame-ui-dialog-bd">\
	            <section class="dialog-select-area">\
                    <div class="select-area-title">选择您的游戏角色</div>\
                    <h4>快速选择角色：</h4>\
                    <div class="area-check" id="rcnt_play_con"> </div>\
                    <div class="area-select">\
				    	<select name="" id="selectSys">\
				    		{placeHtml\}\
				    	</select>\
				    	<select name="" id="selectSvr" ><option value="-1">请选择服务器</option></select>\
				    	<select name="" id="selectRol" ><option value="-1">请选择角色</option></select>\
                    </div>\
		       </section>\
	        </div>\
	        <div class="wxgame-ui-dialog-ft">\
	            <button type="button" data-role="button" id="svrSelector_cancerSelect" style="color: #00a5e0;">取消</button>\
	            <button type="button" data-role="button" id="svrSelector_getSure" style="color: #00a5e0;">确定</button>\
	        </div>\
	    </div>\
    </div>\
    	';
    // 最近玩的游戏
    var rcntTmpl = '	<div class="area-row">                                           '+
        '	<label class="ui-checkbox ui-checkbox-s">      					 '+
        '	<label class="ui-checkbox ui-checkbox-s">      					 '+
        '		<input type="checkbox"  roleid="{roleId}" partitionid="{partition}" {checked}/> '+
        '{partitionName}-{roleName}'+
        '   </label>'+
        '	</div>';

    //选区
    var svrTmpl = '<option value="{partition}" {selected}>{area_name}</option>';

    //选角色
    var rolTmpl = '	<option value="{role_id}"  {selected}>{nick}</option>     ';

    function getUserId() {
        var openid = zUtil.getcookie('wxvip_openid');
        if(openid) {
            return openid;
        } else {
            return 'wxvip';
        }
    }

    var cacheData = {
        sn: 'qqvipgame_',
        getName: function (name, type) {
            return this.sn + '/' + name.replace(/\//g, '//') + (type ? '/' + type.replace(/\//g, '//') : '');
        },
        get: function (name) {
            var me = this;
            try {
                var value = window.localStorage.getItem(me.getName(name));
                var info = JSON.parse(window.localStorage.getItem(me.getName(name, 'info')));
                value = JSON.parse(value);
            } catch (e) {
                return null;
            }

            try {
                window.localStorage.setItem(me.getName(name, 'info'), JSON.stringify({
                    time: ( info && parseInt(info.time)) || new Date().getTime(),
                    count: ((info && parseInt(info.count)) || 0) + 1
                }));
            } catch (e) {
                window.localStorage.clear();
                return null;
            }

            return value;
        },
        set: function (name, value) {
            var me = this;
            var json = JSON.stringify(value);
            try {
                window.localStorage.setItem(me.getName(name), json);
                window.localStorage.setItem(me.getName(name, 'info'), JSON.stringify({
                    time: new Date().getTime(),
                    count: 0
                }));
            } catch (e) {
                window.localStorage.clear();
                return false;
            }
            return true;
        },
        getTime: function (name) {
            var me = this;
            try {
                var info = JSON.parse(window.localStorage.getItem(me.getName(name, 'info')));
                return (info && parseInt(info.time)) || 0;
            } catch (e) {
                return 0;
            }
        },
        getCount: function (name) {
            var me = this;
            try {
                var info = JSON.parse(window.localStorage.getItem(me.getName(name, 'info')));
                return (info && parseInt(info.count)) || 0;
            } catch (e) {
                return 0;
            }
        },
        isExpire: function (name, maxSecond, maxCount) {
            var me = this;

            var time = me.getTime(name);
            var count = me.getCount(name);

            if (time === 0) {
                return true;
            }
            if (Math.abs(new Date().getTime() - time) > maxSecond * 1000) {
                return true;
            }
            if (count > maxCount) {
                return true
            }

            return false;
        }
    };


    /**
     * 格式化字符串，对字符串中{\w\d+}的占位替换
     * @method sprintf
     * @for qv.zero.Util
     * @param {string} str 字符串
     * @param {Object} param 键值对
     * @return {string}
     * @example sprintf('Hello {name}!', {name : 'world'});//output: Hello world!
     * @example sprintf('Hello, {0} {1}', 'word','!') //output: Hello worid !
     * authou loonglong
     */
    function sprintf(str, param) {
        var args = arguments;
        var data = !$.isPlainObject(param) ? (function(){
            var p = Array.prototype.slice.call(args);
            return p.splice(1, p.length);
        })() :  param;
        return str.replace(/\{([\d\w]+)\}/g, function(m, n) {
            return typeof(data[n]) != 'undefined' ? String(data[n]).toString() : m;
        });
    }

    /***************************************以上为辅助组件，下面是精华**************************************/
    /**
     *	SvrSelector
     *	构造函数，可以同时有多个实例存在
     *	@param params {object} {
	*			appId   : number  ,手游的appId
	*		    game : string , 手游名称缩写
	*			callback: function,成功之后的回调方法
	*		}
     *	@return obj  {object} {
	*			appId    : number ,手游的appid
	*			game : string ,游戏的名称字符串
	*			areaId   : number ,大区id
	*			partition: number ,服务器id
	*			platId   : number ,平台id
	*			roleId   : number ,角色id
	*		}

     */
    function SvrSelector( input ){
        if(_static.isRuning || !input ){//如果当前已经有选区浮层在页面中，则不予重复调用
            return;
        }

        _static.isRuning = true;
        input            = input ||{};
        input.callback   = input.callback || function(){};
        var param      = input;                        //参数
        if( !param.appId || !param.game){
            console.log("SvrSelector input server error");
            return;
        }

        _static.game = param.game;

        var areaIds = param.areaIds;
        this.areaIds = (areaIds && typeof areaIds == 'object') ?
        {ios: (areaIds.ios || '').toString().replace(/\s/g, ''), and: (areaIds.and || '').toString().replace(/\s/g, '')} : null;
        //没有sid，无法访问后续的接口，这里直接提示错误.  这里对skey做了一次改造，有可能不需要sid.todo.....
        var type            = -1;                           //默认是不需要选区选服的游戏
        var rcntLoaded      = false;                        //是否已经加载了最近在玩
        var areaDeailLoaded = false;                   //是否已经加载了区服信息
        var dom             = null;                         //选区选服组件的dom

        var areaInfo        = null;                         //区服信息
        var areaInfoMap     = {};                           //以serverid为key的数据
        var roleIdMap       = {};                           //角色和角色id对映表
        var rcntList        = null;                         //最近在玩的角色列表
        var dftSvr          = null;                         //默认服务器
        var dftRole         = null;                         //默认角色

        var dftServerKey = [ getUserId(), 'dftServerKey'  , param.appId  ].join('/');  //上次选中服务器缓存id
        var dftRoleKey   = [ getUserId(), 'dftRoleKey'    , param.appId  ].join('/');  //上一次返回的用的角色缓存id

        //拉取最近在玩的区服信息列表
        rcntList = [];
        network.getRcntList( param.appId , function( json ){

            if( json && 0 == json.ret ){
                rcntList   = json.data || [];
            }else{
                rcntList   = [];
            }
            rcntLoaded = true;
            _process();

        });

        //拉取当前的服务器信息
        network.getAreaDetail(param.appId, this.areaIds, function( json ){

            if( json && 0 == json.result && json.data && json.data.length){

                areaDeailLoaded = true;
                areaInfo  = json.data;

                for( var i = 0 ; i < areaInfo.length ; i++){
                    var cur = areaInfo[i];
                    if( cur ){
                        areaInfoMap[ cur.partition ] = cur.area_name;
                    }
                }
                _process();

            }else{
                _static.isRuning = false;
                /*param.callback && param.callback({        //不需要选区选服的游戏
                 type  : -1,
                 appId : param.appId
                 });*/
                //不需要选区选服的游戏
                if (json && 0 == json.result) {
                    json = {
                        "result"   : 0,
                        "appId"    : param.appId,
                        "platId"   : zUtil.isIOS() ? 0 : 1,
                        "areaId"   : 1,
                        "partition": 1,
                        "roleId"   : 1
                    }
                }
                param.callback && param.callback(json);
            }
        });

        //主路径，在获取区服信息，还有用户最近在玩的列表之后才渲染
        function _process(){
            if( rcntLoaded && areaDeailLoaded ){
                //CGI的数据和JS的数据回调都请求到了
                dom       = document.createElement("div");
                var placeHtml = '';
                var objFrameTmpl = {};
                if (platCode == 1) {
                    placeHtml = '<option value="1" selected>Android</option>';
                } else {
                    placeHtml = '<option value="2" selected>IOS</option>';
                }
                objFrameTmpl = {placeHtml:placeHtml};
                var StrFrameTmpl = sprintf(frameTmpl, objFrameTmpl);
                $(dom).html(StrFrameTmpl);


                document.body.appendChild( dom ); //添加上框架
                dftSvr  = cacheData.get( dftServerKey );      //初始化svrid
                dftRole = cacheData.get( dftRoleKey );       //初始化roleid

                /**
                 * 首次弹窗，标记位
                 */
                roleTipFlag = false;
                _updateRcntList();      //展示列表
                _updateSvrList();       //更新服务器列表

                _bind();
            }
        };


        //更新快捷入口列表
        function _updateRcntList(){

            //存在性验证，只有id存在在服务器列表里面的才展示出来
            var arr = [];
            for( var i = 0 ; i < rcntList.length  ; i++){
                var cur = rcntList[i];
                if( cur && cur.partition && areaInfoMap[ cur.partition ]){
                    cur.partitionName = areaInfoMap[cur.partition];
                    arr.push( cur );
                }
            }
            rcntList = arr;

            //如果默认的没有这个，就展示列表
            if( rcntList && rcntList.length && !dftSvr && !dftRole ){
                dftSvr  = rcntList[0].partition;
                dftRole = rcntList[0].roleId;
            }

            var container = $("#rcnt_play_con");
            var strContainerHtml = '';
            for(i = 0; i< rcntList.length && i < 3; i++) {
                var item=rcntList[i];
                var roleId = item.roleId;
                var partition = item.partition;
                var checked = '';
                if (dftSvr==item.partition&&dftRole==item.roleId) {
                    checked = "checked";
                }
                var partitionName = item.partitionName;
                var roleName = item.roleName;
                var objContainerParam = {
                    roleId:roleId,
                    partition:partition,
                    checked:checked,
                    partitionName:partitionName,
                    roleName:roleName
                }
                strContainerHtml += sprintf(rcntTmpl, objContainerParam);
            }
            container.html(strContainerHtml);

        };

        //更新服务器列表
        function _updateSvrList(){
            if( areaInfo && areaInfo[0]){

                var container = $("#selectSvr");

                if( !dftSvr ){       //如果没有默认的话,就默认展示第一个服务器
                    dftSvr  = areaInfo[0].partition;
                }

                var strSvrTmpl = '';
                for(var i = 0 , item ; item = areaInfo[i] ; i++){
                    var partition = item.partition;
                    var selected = dftSvr==item.partition?"selected":"";
                    var area_name = item.area_name;
                    var objSvrTmpl = {
                        partition:partition,
                        selected:selected,
                        area_name:area_name,
                    };
                    strSvrTmpl += sprintf(svrTmpl, objSvrTmpl);
                }
                container.html(strSvrTmpl);

                _updateRoleList( dftSvr );
            }
        };

        //更新角色列表,每次页面都需要更新
        function _updateRoleList( partition ){

            var container = $("#selectRol");

            if( areaInfo && areaInfo[0] ){

                gameInfo = areaInfo[0];

                network.getRoleList( {
                    appId    : param.appId,
                    gameName : gameInfo.game_name,
                    platId   : gameInfo.plat_id,
                    areaId   : areaInfo[0].area_id ? areaInfo[0].area_id:( 1 == platCode ? areaInfo[0].android : areaInfo[0].ios),
                    partition: partition               //当前的服务器id
                }, function( json , pt ){

                    if( pt != $("#selectSvr").val()){       //加这个是因为做了cgi缓存之后，cgi请求可能很久，这样新选择的区数据的缓存已经展示，但是之前选的区的还没有拉取回来。等之前选的区回来的时候，就会导致展示混乱
                        return;
                    }

                    if( json && 0 == json.result ){
                        roleTipFlag = true;
                        var strRolTmpl = '';
                        var list = json.data;
                        for( var i = 0 ,item ; item = list[i] ; i++){
                            var role_id = item.role_id;
                            var	selected = dftRole==item.role_id ? "selected":"";
                            var nick = item.nick;
                            var objRolTmpl = {
                                role_id:role_id,
                                selected:selected,
                                nick:nick
                            }
                            strRolTmpl += sprintf(rolTmpl, objRolTmpl);
                        }
                        container.html(strRolTmpl);

                        var roleList = json.data||[];
                        for( var i = 0 ;  i< roleList.length ; i++){
                            var cur      =  roleList[i];
                            if( cur ){
                                roleIdMap[ cur.role_id ] = cur.nick;
                            }
                        }

                    }else{
                        var strRolTmpl = '';
                        var list = [{"nick":"请选择角色" ,"role_id": -1 }];
                        for( var i = 0 ,item ; item = list[i] ; i++){
                            var role_id = item.role_id;
                            var	selected = dftRole==item.role_id ? "selected":"";
                            var nick = item.nick;
                            var objRolTmpl = {
                                role_id:role_id,
                                selected:selected,
                                nick:nick
                            }
                            strRolTmpl += sprintf(rolTmpl, objRolTmpl);
                        }
                        container.html(strRolTmpl);

                        //温馨提示
                        if(roleTipFlag){
                            if(json.result == -6){
                                zMsg.show("您当前选择框里所选择的大区没有查询到相关的角色信息");
                            }else if(json.result == -88){
                                zMsg.show("查询角色请求超时或者请求出现错误，请过一段时间再试");
                            }else{
                                //其他归类为服务器端无正常返回的信息
                                zMsg.show("没有查到当前大区所属的角色信息，可能是该游戏服务器繁忙，请过一段时间再试");
                            }
                        }else{
                            roleTipFlag = true;
                        }


                    }
                });
            }
        };

        //禁止页面滑动
        function _stopScroll(){
            return false;
        };

        //绑定方法
        function _bind(){

            var selectSys = $("#selectSys");
            var selectSvr = $("#selectSvr");
            var selectRol = $("#selectRol");

            //禁止页面滑动
            $(document.body).bind("touchmove" , _stopScroll);

            //选中服务器的时候，ios下面有可能出现误点。导致弹窗消失的问题。
            selectSvr.bind("focus" , function( evt ){
                _forbidBtns();
            });

            //这里需要选择角色的，需要重新拉取角色的信息
            selectSvr.bind("change" , function( evt ){

                var tar = selectSvr.val();

                ( -1 != tar ) && _updateRoleList( tar ); //每次选择区的时候，都重新拉取角色

                //当这里有手动修改的迹象的时候，上面的checked都关掉
                $("#rcnt_play_con input").each(function( i , item ){
                    item.checked = false;
                });
            });

            //选择角色的时候，也会让上面的快速选择消失
            selectRol.bind("change" , function( evt ){

                //当这里有手动修改的迹象的时候，上面的checked都关掉
                $("#rcnt_play_con input").each(function( i , item ){
                    item.checked = false;
                });
            });

            //选择快捷方式的事件,选择了之后，单选
            $("#rcnt_play_con input").bind("change" , function( evt ){
                var dom = $(this);

                if( dom.attr( "checked" )){          //如果选中了,就选中。清除其他的，并且更换下面的选项

                    $("#rcnt_play_con input").each(function( i , item ){
                        if( item != dom[0] ){
                            item.checked = false;
                        }
                    });

                    var partitionId = dom.attr("partitionid");
                    var roleId      = dom.attr("roleid");

                    dftSvr  = partitionId;
                    dftRole = roleId;

                    _updateSvrList();
                }
            });


            var confirmBtn = $("#svrSelector_getSure");
            var concelBtn  = $("#svrSelector_cancerSelect");
            confirmBtn.bind("click" ,function(evt){ //点击确定将选择的信息返回回去,检查是否合法，然后将信息返回回去
                !switchKey && _check( param.callback );
            });

            concelBtn.bind("click" , function(evt){  //点击取消关闭
                !switchKey && _close();
            });
        };

        var switchKey = false;
        //禁止掉下方的取消和确定按钮 1s
        function _forbidBtns(){

            switchKey = true;

            setTimeout( function(){
                switchKey = false;
            } , 1000 );

        };

        //关闭方法
        function _close( ){

            //取消禁止页面滑动
            $(document.body).unbind("touchmove" , _stopScroll);
            dom && document.body.removeChild( dom );
            dom = null;
            _static.isRuning = false;
        }

        //检查是否合法
        function _check( cb ){
            var selectSys = $("#selectSys");
            var selectSvr = $("#selectSvr");
            var selectRol = $("#selectRol");

            var partition = selectSvr.val()||-1;
            var rol       = selectRol.val()||-1;

            if( -1 == partition){
                zMsg.show("请选择服务器");
                return;
            }

            if( -1 == rol ){
                zMsg.show("请选择角色");
                return;
            }

            var retObj = {
                "result"   : 0,
                "appId"    : param.appId,
                "platId"   : areaInfo[0].plat_id*1,
                "areaId"   : areaInfo[0].area_id?areaInfo[0].area_id*1:(1 == platCode ? areaInfo[0].android*1 : areaInfo[0].ios*1),
                "partition": partition*1,
                "roleId"   : rol
            }

            cb && cb( retObj );

            cacheData.set( dftServerKey , partition      );            //缓存默认服务器数据
            cacheData.set( dftRoleKey   , rol      );           //缓存角色数据

            network.recordRcntInfo( {							 //上报用户成功选择的区服信息
                appId 			: param.appId,
                area  			: areaInfo[0].area_id?areaInfo[0].area_id*1:(1 == platCode ? areaInfo[0].android*1 : areaInfo[0].ios*1),
                plat			: areaInfo[0].plat_id*1,
                partition		: partition*1,
                roleId			: rol,
                partitionName	: areaInfoMap[partition] ,
                roleName		: roleIdMap[ rol ]

            } );
            //什么时候更新缓存减轻对服务器的压力：当本次领取礼包的时候如果领取的角色ID在最近在玩的列表里面，那么就不用删除缓存，如果不在后台返回的最近在玩列表里面那么就需要更新缓存
            var isInRcntList = false;	//默认是不在的
            $.each(rcntList,function(kk,item){
                if(item && item.roleId && item.partition && String(item.partition) == String(partition) && String(item.roleId) == String(rol)){
                    //找到了，在缓存里面
                    isInRcntList = true;
                    return false;
                }
            });
            if(!isInRcntList){
                //需要清空最近在玩缓存，下一次走CGI拉取最新数据
                network.clearRcnt( param.appId );
            }
            /*for( var i = 0 ; i < rcntList.length ; i++ ){
             var cur = rcntList[i];
             if(  cur && cur.roleId != rol){
             network.clearRcnt( param.appId );
             }
             }*/

            _close();
        };



    };

    // 字符串非法字符过滤
    function encodeHTML(str) {
        if(typeof str == 'string'){
            var ar = ['&', '&amp;', '<', '&lt;', '>', '&gt;', '"', '&quot;', '\\s', '&nbsp;'];
            for (var i = 0; i < ar.length; i += 2){
                str = str.replace(new RegExp(ar[i], 'g'), ar[1 + i]);
            }
            return str;
        }
        return str;
    }

    //网络请求模块
    var network = {
        /**
         *	拉取游戏的分区分服信息的方法
         *	目前采用的数据源是ams系统的配置，采用静态文件拉取的方式
         *	如果拉取回来的 autoLoad == true的话，是目前ams系统数据暂时不可用
         *	就拉取游戏侧的分区分服信息,目前只有天天炫斗是这么用的，其他都不是。
         */
        getAreaDetail : function (appId, areaIds, callback ,update){
            var cacheKey  = [ getUserId(), 'syncIEDAreaData' , appId ].join('/');
            //默认时间是半天12小时
            var maxSecond = 43200, maxCount = 20;
            var cv = cacheData.get(cacheKey);

            if(update == true || !cv || cacheData.isExpire( cacheKey , maxSecond , maxCount)) {
                var gameName = _static.game;
                // 修正王者荣耀
                if (gameName.toLowerCase() == 'sgame') {
                    gameName = 'yxzj';
                }

                network.loadScript(location.protocol + '//game.qq.com/comm-htdocs/js/game_area/utf8verson/' + gameName.toLowerCase() + '_server_select_utf8.js?' + (new Date()).valueOf(), function () {
                    var ied_data = window[gameName.toUpperCase() + 'ServerSelect'];

                    if (ied_data) {
                        network.syncIEDAreaData(appId, ied_data, {
                            game_name: _static.game,
                            platid: [0, 1],
                            area: -1,
                        }, callback);
                    }
                });
            } else {
                callback && callback(cv, appId);
            }

            return true;
        },
        //功能：将互娱的大区格式适配为游戏中心的大区格式
        syncIEDAreaData : function( appId, ied_data, data, callback , update){

            var cacheKey = [getUserId(), 'syncIEDAreaData' ,appId ].join('/');
            var json = {
                "data":[],
                "message":"",
                "result":0
            };
            var config = {}
            var systemData = ied_data.STD_SYSTEM_DATA;
            var stdData = ied_data.STD_DATA,
                valueMap = {};

            if (!systemData.length) {
                systemData = [{k: 'ios'}, {k: 'android'}];
            }
            for(var n=0;n<systemData.length;++n){
                valueMap[systemData[n].k] = [];
            }

            stdData.sort(function(a,b){
                return parseInt(a.v) - parseInt(b.v);
            });

            for(var n=0;n<stdData.length;++n){
                if(stdData[n].status == '1'){
                    if(stdData[n].ck == "weixin" && valueMap[stdData[n].sk]){
                        valueMap[stdData[n].sk].push(stdData[n]);
                    }
                }
            }
            var system = ['ios', 'and'],
                system_map = {'ios':0, 'android':1},
                current_sys = 2==platCode?'ios':'android',
                current_sys_data = valueMap[current_sys],
                n = system_map[current_sys];
            if(current_sys_data){
                for(var key in current_sys_data){
                    json.data.push({
                        android: data.platid.length?data.platid[system_map['android']]:data.platid,
                        area_id: (data.area==-1)?current_sys_data[key].c : 1,
                        area_name: current_sys_data[key].t,
                        game_name: data.game_name,
                        ios: data.platid.length?data.platid[system_map['ios']]:data.platid,
                        partition: current_sys_data[key].v,
                        plat_id: data.platid.length?data.platid[n]:data.platid,
                        type: 1
                    });
                }
            }

            if (json && json.result == 0 && json.data) {

                callback && callback(json, appId);

                cacheData.set( cacheKey , json );

            } else {
                _static.isRuning = false;
                callback && callback({
                    result: -1,
                    message: (json && json.result) || 'error data'
                }, appId);
            }
        },

        //拉取角色信息
        getRoleList : function( params , callback ,update ){
            var gameName  = params.gameName || "";
            var appId     = params.appId;
            var platId    = parseInt( params.platId );
            var areaId    = params.areaId;
            var partition = params.partition;
            var burl      = location.protocol + "//iyouxi3.vip.qq.com/ams3.1.php?";

            var cacheKey  = [getUserId(), 'getRoleList' , appId , partition].join('/');
            var maxSecond = 86400, maxCount = 6;
            var cv = cacheData.get(cacheKey);

            if( cv && update != true && !cacheData.isExpire( cacheKey , maxSecond , maxCount )){

                callback && callback( cv , params.partition);
                return;
            }else{
                var gtk = network.getCSRFToken();
                burl += '_c=queryRoleInfoWx&gamename='+gameName+'&area='+areaId+'&partition='+partition+"&platid="+platId+"&g_tk="+gtk;

                network.send({
                    url     : burl,
                    cache   : false,
                    dataType: 'jsonp',
                    success : function(json) {
                        if (json && json.ret == 0 && json.data && json.data.length) {

                            var arr     = [];
                            for( var i  = 0 ; i < json.data.length ; i ++){
                                var cur = json.data[i];
                                if( cur && cur.role_id && cur.nick){
                                    cur.nick = encodeHTML( cur.nick );      //xss过滤
                                    arr.push(  cur );
                                }
                            }
                            var res = {
                                result: 0,
                                data  : arr,
                                msg   : json.msg||""
                            };

                            cacheData.set( cacheKey , res );
                            callback && callback( res ,params.partition);

                        } else {
                            callback({
                                result: (json && json.ret) || -1,
                                message: (json && json.ret) || 'error data'
                            },params.partition);
                        }
                    },
                    error: function( xhr, errorType , error ) {
                        _static.isRuning = false;
                        callback({
                            result: -88,	//自定义-88表示服务超时
                            message: errorType
                        });
                    }
                })
            }
        },
        //清空最近在玩区服的列表，要更新了
        clearRcnt:function( appId ){

            var cacheKey  = [getUserId(), 'getRcntList' , appId].join('/');
            cacheData.set( cacheKey , null );

        },
        /**
         * 获取用户的最近使用的信息
         * 本部分是额外的辅助功能，即使用户角色不在预选列表里面，用户也可以在选择框里面选择自己的角色。
         * "data" : [ {
					"area" : 2,
					"partition" : 38,
					"partitionName" : "IQQ38区",
					"plat" : 0,
					"roleId" : "20890745790271",
					"roleName" : "√i38一Ζ",
					"cacheTime" : 1231524564
				} ]

         新增cacheTime缓存时间字段
         */
        getRcntList:function( appId , callback ,update ){

            var cacheKey  = [getUserId(), 'getRcntList' , appId].join('/');
            //默认时间是1小时，但可以通过后台动态生成的缓存时间进行动态决定是否启用缓存内容
            var maxSecond = 172800, maxCount = 50;	//local下延长cache机制，2天
            var cv = cacheData.get(cacheKey);
            //动态决定是否可取
            var curTime = Math.round(new Date().getTime() / 1000);
            var defaultTimeSection = curTime + 3600;	//默认一小时
            var canUsed = true;
            if(cv && $.isArray(cv.data) && cv.data.length){
                var n = cv.data[0];
                if(typeof n.cacheTime == "number" && n.cacheTime < curTime){
                    //弃用缓存
                    canUsed = false;
                }
            }else{
                canUsed = false;
            }

            if(canUsed && cv && update != true && !cacheData.isExpire( cacheKey , maxSecond , maxCount )){
                //二次过滤
                firstRcnBadItem = null;
                recentlyPlayBadData = [];
                var goodData = [];
                //$.each未能保证遍历的顺序，采用for
                for(var k = 0 ; k < cv.data.length ; k++){
                    var item = cv.data[k];
                    if(item.roleName){
                        //角色名称存在则正常
                        goodData.push(item);
                    }
                }

                if (goodData.length > 0) {
                    cv.data = goodData;
                }else{
                    //压根没有好数据或者压根没有数据
                    cv.data = [];
                }

                callback && callback( cv );

            }else{
                network.send({
                    url : location.protocol + '//iyouxi3.vip.qq.com/ams3.1.php?',
                    data: {
                        '_c' : 'QueryRecentRoleWx',
                        'appid' : appId,
                        'platid' : zUtil.isAndroid() ? 1 : 0,
                        'g_tk': network.getCSRFToken()
                    },
                    cache   : false,
                    dataType: 'jsonp',
                    success : function( json ) {
                        if( json && 0 == json.ret && json.data && json.data.length ) {
                            for (var i = 0; i < json.data.length; i++) {
                                var cur = json.data[i];
                                //校验cacheTime，引用修改字段
                                if (typeof cur.cacheTime == "undefined" || cur.cacheTime === 0) {
                                    cur.cacheTime = defaultTimeSection;
                                }
                                if (cur && cur.partition && cur.roleId && cur.roleName) {
                                    cur.roleName = encodeHTML(cur.roleName);    //xss漏洞检测
                                } else {
                                    //json.data.splice( i , 1);       //如果数据不合法，就直接干掉
                                }
                            }
                            if (json.data && json.data.length) {
                                cacheData.set(cacheKey, json);
                            }
                            //二次过滤
                            firstRcnBadItem = null;
                            recentlyPlayBadData = [];
                            var goodData = [];
                            //$.each未能保证遍历的顺序，采用for
                            for (var k = 0; k < json.data.length; k++) {
                                var item = json.data[k];
                                if (item.roleName) {
                                    //角色名称存在则正常
                                    goodData.push(item);
                                }
                            }

                            if (goodData.length > 0) {
                                json.data = goodData;
                            } else {
                                //压根没有好数据或者压根没有数据
                                json.data = [];
                            }
                            callback && callback(json);
                        } else {
                            callback && callback({ret: 0, data: []});
                        }
                    },
                    error: function( jqXHR, statusText, errorText) {
                        callback && callback({
                            result: -1,
                            message: errorText
                        });
                    }
                });
            }
        },
        //上报用户最近的区服信息,每次选择都上报。因为里面有时间的信息，会改变用户的顺序
        recordRcntInfo:function( param , callback ){
            return false; // 暂时不上报
        },
        extReport: function(url) {
            var url = url.split("?")[0];
            var urlArr = url.split(".");
            var len = urlArr.length - 1;
            var suffix = urlArr[len];
            if (suffix == "js" || suffix == "css" || suffix == "html") {
                return true;
            }
            return false;
        },
        reportCode: function(url, type, startTime,code,errortype,netWorkInfo) {
            var endTime = new Date();
            if (network.extReport(url)) {
                return;
            }
            var os = 'unknown';
            if (window.mqq && mqq.iOS) {
                os = 'ios';
            } else if (window.mqq && mqq.android) {
                os = 'android';
            }
            var errortype = errortype || "";
            var netWorkInfo = netWorkInfo || "";
            if (/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/.test(url)) {
                var report = new Image();
                var url = "http://report.huatuo.qq.com/code.cgi";
                if (location.protocol == 'https:') {
                    url = "https://report.huatuo.qq.com/code.cgi";
                }
                report.src = url + '?domain=' + encodeURIComponent(RegExp.$4 || '') + '&cgi=' + encodeURIComponent((RegExp.$5 || '')) + '&type=' + type + '&code=' + code +'&time=' + (endTime - startTime) + '&rate=10' + '&platform=' + os + '&uin=0&expansion1='+ errortype + '&expansion2='+ netWorkInfo;
            }

        },
        //使用方式和$.ajax一样，但是添加了返回码上报
        send: function(option) {
            var startTime = new Date();
            var src = option.url;
            var succ = option.success;
            var err = option.error;
            var code = 0; //返回码
            var type = 1; //上报类型，1成功 2失败 3逻辑失败
            option.success = function(data) {
                succ && succ.apply(null, arguments);
                if (data && data.ret != 0) {
                    type = 3;
                    code = data.ret;
                }
                network.reportCode(src, type, startTime, code);
            }
            option.error = function(data, errortype) {
                err && err.apply(null, arguments);
                if (window.mqq && mqq.support && mqq.support('mqq.device.getNetworkType')) {
                    mqq.device.getNetworkType(function(netWorkInfo) {
                        if (netWorkInfo == 0) { //无网络
                            type = 3;
                            code = 9001;
                        } else {
                            if (errortype) {
                                if (errortype == "timeout") {
                                    type = 2;
                                    code = 9002;
                                } else if (errortype == "parsererror") {
                                    type = 2;
                                    code = 9003;
                                } else if (errortype == "error") {
                                    type = 2;
                                    code = 9004;
                                } else {
                                    type = 2;
                                    code = 9005;
                                }
                            } else {
                                type = 2;
                                code = 9006;
                            }
                        }
                        network.reportCode(src, type, startTime, code, errortype, netWorkInfo);
                    });
                }
            }
            option.timeout = 60000;
            $.ajax(option);
        },
        loadScript : function(url, callback, charset, errCallback) {
            if( typeof callback == 'string') {
                charset = callback;
                callback = function(){};
            }
            var sc = document.createElement("script"), head = document.getElementsByTagName("head")[0];
            sc.setAttribute("charset", charset || "utf-8");

            sc.src = url;
            sc.onload = function() {
                /*jshint expr:true */
                callback && callback();
                head.removeChild(sc);
            };
            /*jshint expr:true */
            errCallback && (sc.onerror = function(){
                errCallback();
                head.removeChild(sc);
            });
            head.appendChild(sc);
        },
        loadCss : function(cssText) {
            $('<style>').attr({
                type : 'text/css',
                rel : 'stylesheet'
            }).text(cssText).appendTo('head');
        },
        getCSRFToken : function(){
            return zUtil.getCSRFToken();
        }
    };
    network.loadCss('.wxgame-ui-dialog{position:fixed;top:0;left:0;width:100%;height:100%;z-index:19;display:-webkit-box;-webkit-box-orient:horizontal;-webkit-box-pack:center;-webkit-box-align:center;background:rgba(0,0,0,.4);display:none}.wxgame-ui-dialog.show{display:-webkit-box;display:box}.wxgame-ui-dialog-hd{height:3pc;line-height:3pc;text-align:center;position:relative}.wxgame-ui-dialog-cnt{border-radius:6px;width:270px;background-clip:padding-box;pointer-events:auto;background-color:hsla(0,0%,99%,.95);position:relative;font-size:1pc}.wxgame-ui-dialog-bd{min-height:71px;border-top-left-radius:6px;border-top-right-radius:6px;padding:18px;display:-webkit-box;display:box;-webkit-box-pack:center;-webkit-box-align:center;-webkit-box-orient:vertical}.wxgame-ui-dialog-bd>h4{margin-bottom:4px;width:100%;text-align:center}.wxgame-ui-dialog-bd>div,.wxgame-ui-dialog-bd>ul{width:100%}.wxgame-ui-dialog-ft{border-bottom-left-radius:6px;border-bottom-right-radius:6px;display:-webkit-box;width:100%;box-sizing:border-box;-webkit-box-align:center;border-top:1px solid #e0e0e0;height:42px;line-height:42px}.wxgame-ui-dialog-close:before{font-family:iconfont!important;font-size:2pc;line-height:44px;font-style:normal;-webkit-font-smoothing:antialiased;-webkit-text-stroke-width:.2px;color:rgba(0,0,0,.5);content:"?";color:#828282;display:block;line-height:2pc;position:absolute;top:3px;right:3px}.wxgame-ui-dialog-close:active{opacity:.5}.wxgame-ui-dialog-ft button{color:#00a5e0;text-align:center;border-right:1px solid #e0e0e0;width:100%;line-height:42px;background:0 0;display:block;margin:0!important;-webkit-box-flex:1}.wxgame-ui-dialog-ft button:active{background-color:rgba(0,0,0,.1)!important}.wxgame-ui-dialog-ft button:first-child{border-bottom-left-radius:6px}.wxgame-ui-dialog-ft button:last-child{border-right:0;border-bottom-right-radius:6px}@media screen and (-webkit-min-device-pixel-ratio:2){.wxgame-ui-dialog-ft{position:relative;border:0;background-position:left top;background-image:-webkit-gradient(linear,left bottom,left top,color-stop(.5,transparent),color-stop(.5,#e0e0e0),to(#e0e0e0));background-repeat:repeat-x;-webkit-background-size:100% 1px}.wxgame-ui-dialog-ft button{border-right:0;background-position:right top;background-image:-webkit-gradient(linear,left top,right top,color-stop(.5,transparent),color-stop(.5,#e0e0e0),to(#e0e0e0));background-repeat:repeat-y;-webkit-background-size:1px 100%}.wxgame-ui-dialog-ft button:last-child{background:0 0}}.dialog-select-area .ui-checkbox input,.dialog-select-area .ui-checkbox-s input{margin-right:5px;width:20px}.dialog-select-area .area-select{padding-top:5px}.dialog-select-area .area-row{line-height:28px;font-size:14px;color:#000}.dialog-select-area .select-area-title{text-align:center;font-weight:700;color:#000;font-size:1pc}.dialog-select-area h4{margin:0 0 3px;font-size:9pt;color:grey;font-weight:400;border:none;line-height:14px;padding-top:10px}.dialog-select-area select{width:100%;height:36px;margin:0 0 8px;padding:0 0 0 7px;border-radius:6px;font-size:14px;border:1px solid #a9a9a9;background-color:#fff;-webkit-appearance:menulist}');

    exports.WxSvrSelector = SvrSelector;
})(qv.zero, Zepto);