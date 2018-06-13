/**
* @author loonglong
 * 增加手游大区选择框
 * @version 1.0
 * @date 2014-06-4
 * @name qv.zero.AreaSvrSelector
 * @param {String} config.name 游戏代号
 * @param {Number} config.actid 活动号
 * @param {String} config.serverList 自定义服务列表名称
 * @param {Function} [config.send] 发送请求接口，默认以qv.zero.Http.request
**/
(function(exports){
	//依赖组件库
	//对话框组件 new qv.zero.Dialog({content:t,buttons:[{text:'关闭'}]}).show();
	//var login     = zUtil.require("lib/login/login");      //网络请求组件
	//var util = zUtil.require('lib/util/util');
	var $ = Zepto;
	var _static	  = {};	//声明静态变量
	var platCode   = /iphone|ipad|itouch/ig.test(window.navigator.userAgent)? 2 : 1;
	var roleTipFlag = false;
	//CGI返回的最近在玩的数据里面第一条是最新的，如果第一条都是非法的记录，那就标记下来，页面一定会去请求IDIP数据，保证用户能看到最新的一条记录
	var firstRcnBadItem = null;
	//存储CGI返回的最近在玩的角色数据，而且是指有角色ID但没有角色名称的坏数据
	var recentlyPlayBadData = [];
	//静态模板文件

	//加载样式
	zHttp.loadCss('http://imgcache.gtimg.cn/club/platform/lib/game/mqsvrselector.css?max_age=86400');


	var frameTmpl = '\
    	<div class="ui-dialog show" style="position: fixed;top: 0px; left: 0px;width: 100%; height: 100%;z-index: 20;display: -webkit-box;-webkit-box-orient: horizontal;-webkit-box-pack: center;-webkit-box-align: center;background: rgba(0, 0, 0, 0.4);">\
		<div class="ui-dialog-cnt dialog-startup-cnt" style="-webkit-transform:translateZ(0);border-radius: 6px;width: 270px;-webkit-background-clip: padding-box; background-clip: padding-box; pointer-events: auto;background-color: rgba(253,253,253,.95);position: relative;font-size: 16px;">\
	        <div class="ui-dialog-bd">\
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
	        <div class="ui-dialog-ft">\
	            <button type="button" data-role="button" id="svrSelector_cancerSelect" style="color: #00a5e0;">取消</button>\
	            <button type="button" data-role="button" id="svrSelector_getSure" style="color: #00a5e0;">确定</button>\
	        </div>\
	    </div>\
    </div>\
    	';

	var rcntTmpl = '	<div class="area-row">                                           '+
		'	<label class="ui-checkbox ui-checkbox-s">      					 '+
		'	<label class="ui-checkbox ui-checkbox-s">      					 '+
		'		<input type="checkbox"  roleid="{roleId}" partitionid="{partition}" {checked}/> '+
		'{partitionName}-{roleName}'+
		'   </label>'+
		'	</div>';


	var svrTmpl = '<option value="{partition}" {selected}>{area_name}</option>';


	var rolTmpl = '	<option value="{role_id}"  {selected}>{nick}</option>     ';




	function getUserId() {
		if (typeof G_INFO != 'undefined' && G_INFO && G_INFO.uin) {
			return G_INFO.uin;
		}

		if(/(\d+)/.test(zUtil.getcookie('uin'))) {
			return parseInt(RegExp.$1,10);
		} else {
			return 0;
		}
	}

	/***************************************以上为辅助组件，下面是精华**************************************/
	/**
	 *	Areasvrselectorwx
	 *	构造函数，可以同时有多个实例存在
	 *	@param params {object} {
	*			appId   : number  ,手游的appId
	*			callback: function,成功之后的回调方法
	*		}
	 *	@return obj  {object} {
	*			appId    : number ,手游的appid
	*			gameName : string ,游戏的名称字符串
	*			areaId   : number ,大区id
	*			partition: number ,服务器id
	*			platId   : number ,平台id
	*			roleId   : number ,角色id
	*		}

	 */
	function Areasvrselectorwx( input ){
		if(_static.isRuning || !input ){//如果当前已经有选区浮层在页面中，则不予重复调用
			return;
		}

		_static.isRuning = true;
		input            = input ||{};
		input.callback   = input.callback || function(){};
		var param      = input;                        //参数
		if( !param.appId ){
			console.log("SvrSelector input server error");
			return;
		}
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
		network.getRcntList( param.appId , function( json ){

			if( json && 0 == json.result ){
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
				param.callback && param.callback(json);
			}
		});

		//主路径，在获取区服信息，还有用户最近在玩的列表之后才渲染
		function _process(){
			if(areaDeailLoaded ){
				//CGI的数据和JS的数据回调都请求到了，查询看看是否需要对角色坏数据进行容错处理，处理策略是如果一个好数据都没有那就取单个坏数据进行角色名称请求展示
				(function(cb){
					//console.log("修改之前最近在玩数据rcntList" + JSON.stringify(rcntList));

					if((firstRcnBadItem != null) || (rcntList!=null && rcntList.length == 0 && recentlyPlayBadData !='' && recentlyPlayBadData.length > 0)){
						try {
							if(firstRcnBadItem != null){
								//这种情况的优先级最高,第一个角色不正常一定会去拉取
								recentlyPlayBadData = [firstRcnBadItem];
							}
							var badItem = recentlyPlayBadData[0];
							var badPartition = badItem.partition;
							var badRoleId = badItem.roleId;
							//此时areaInfo的数据已经ready了
							if( areaInfo && areaInfo[0] ){
								/**
								 * http://iyouxi.vip.qq.com/ams3.1.php?_c=queryRoleInfo&
								 * gamename=ttxd&area=2&partition=38&platid=0&g_tk=2094890362&_=1452742521204&callback=jsonp1&g_tk=2094890362
								 * jsonp1({"ret":0,"data":[{"role_id":"20890745790271","nick":"\u221ai38\u4e00\u0396"}],"time":"1452742521","msg":"success"});
								 */
								network.getRoleList( {
									appId    : param.appId,
									gameName : areaInfo[0].game_name,
									platId   : areaInfo[0].plat_id,
									areaId   : areaInfo[0].area_id ? areaInfo[0].area_id:( 1 == platCode ? areaInfo[0].android : areaInfo[0].ios),
									partition: badPartition               //当前的服务器id
								}, function( json , pt ){
									//加这个是因为做了cgi缓存之后，cgi请求可能很久，这样新选择的区数据的缓存已经展示，但是之前选的区的还没有拉取回来。等之前选的区回来的时候，就会导致展示混乱
									if( json && 0 == json.result ){
										var roleList = json.data||[];
										for( var i = 0 ;  i< roleList.length ; i++){
											var cur      =  roleList[i];
											//后台的角色ID可能跟AMS的ID不一样数据类型，比如王者荣耀，而且王者荣耀不同区的角色ID可能是一样的
											if( cur && (String(cur.role_id) == String(badRoleId))){
												//找到匹配的iyouxi角色，重置最近在玩数据
												badItem.roleName = cur.nick;
												badItem.partitionName = badItem.partitionName ? badItem.partitionName : areaInfoMap[badPartition];
												//填充更新
												//rcntList = [badItem];
												rcntList.unshift(badItem);	//使用unshift加到第一个元素
												//console.log("更新坏数据后的最近在玩rcntList" + JSON.stringify(rcntList));
											}
										}
										cb && cb();
									}else{
										//容错处理
										cb && cb();
									}
								});
							}
						} catch (e) {
							// TODO: handle exception
							cb && cb();
						}

					}else{
						cb && cb();
					}
				})(function(){
					dom       = document.createElement("div");

					/*var tplRender = artTemplate.compile(frameTmpl);
					$(dom).html( tplRender({
						"sys"     : platCode
					}));*/
					var placeHtml = '';
					var objFrameTmpl = {};
					if (platCode == 1) {
						placeHtml = '<option value="1" selected>Android</option>';
					} else {
						placeHtml = '<option value="2" selected>IOS</option>';
					}
					objFrameTmpl = {placeHtml:placeHtml};
					var StrFrameTmpl = zUtil.sprintf(frameTmpl, objFrameTmpl);
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
				});


			}
		};


		//更新快捷入口列表
		function _updateRcntList(){

			//存在性验证，只有id存在在服务器列表里面的才展示出来
			var arr = [];
			rcntList = rcntList ? rcntList : [];
			for( var i = 0 ; i < rcntList.length  ; i++){
				var cur = rcntList[i];
				if( cur && cur.partition && areaInfoMap[ cur.partition ]){
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
			//var tplRender = artTemplate.compile(rcntTmpl);
			//container.html( tplRender({ list:rcntList , "dftPartition":dftSvr , "dftRoleId":dftRole} ));

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
				strContainerHtml += zUtil.sprintf(rcntTmpl, objContainerParam);
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

				/*var tplRender = artTemplate.compile(svrTmpl);
				container.html(tplRender({
					list     : areaInfo || [],
					dftSvrId : dftSvr
				}));*/

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
					strSvrTmpl += zUtil.sprintf(svrTmpl, objSvrTmpl);
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


						/*var tplRender = artTemplate.compile(rolTmpl);
						container.html( tplRender({ list: json.data ,
							dftRoleId:dftRole
						}));*/

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
							strRolTmpl += zUtil.sprintf(rolTmpl, objRolTmpl);
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
						/*var tplRender = artTemplate.compile(rolTmpl);
						container.html( tplRender({list: [{"nick":"请选择角色" ,"role_id": -1 }],
							dftRoleId:dftRole
						}));*/

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
							strRolTmpl += zUtil.sprintf(rolTmpl, objRolTmpl);
						}
						container.html(strRolTmpl);


						//温馨提示
						if(roleTipFlag){
							if(json.result == -6){
								var t = '您当前选择框里所选择的大区没有查询到相关的角色信息';
								new qv.zero.Dialog({content:t,buttons:[{text:'关闭'}]}).show();
							}else if(json.result == -88){
								var t = '查询角色请求超时或者请求出现错误，请过一段时间再试';
								new qv.zero.Dialog({content:t,buttons:[{text:'关闭'}]}).show();
							}else{
								//其他归类为服务器端无正常返回的信息
								var t = '没有查到当前大区所属的角色信息，可能是该游戏服务器繁忙，请过一段时间再试';
								new qv.zero.Dialog({
									content:t
									,buttons:[{text:'关闭'}]}).show();
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
				var t = '请选择服务器';
				new qv.zero.Dialog({content:t,buttons:[{text:'关闭'}]}).show();
				return;
			}

			if( -1 == rol ){
				var t = '请选择角色';
				var dialog = new qv.zero.Dialog({
					content:t,
					buttons:[{text:'关闭'}]
				});
				dialog.show();
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

	// 用localStorage缓存数据
	var cacheData = {
		sn: 'qqvipgame_',
		getName : function (name, type) {
			return this.sn + '/' + name.replace(/\//g, '//') + (type ? '/' + type.replace(/\//g, '//') : '');
		},
		get : function(name) {
			var me = this;
			try {
				var value = window.localStorage.getItem(me.getName(name));
				var info = JSON.parse(window.localStorage.getItem(me.getName(name, 'info')));
				value = JSON.parse(value);
			} catch(e) {
				return null;
			}

			try {
				window.localStorage.setItem(me.getName(name, 'info'), JSON.stringify({
					time:  ( info  && parseInt(info.time)) || new Date().getTime(),
					count: ((info  && parseInt(info.count)) || 0) + 1
				}));
			} catch(e) {
				window.localStorage.clear();
				return null;
			}

			return value;
		},
		set : function(name, value) {
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
		getTime : function(name) {
			var me = this;
			try {
				var info = JSON.parse(window.localStorage.getItem(me.getName(name, 'info')));
				return (info && parseInt(info.time)) || 0;
			} catch (e) {
				return 0;
			}
		},
		getCount : function(name) {
			var me = this;
			try {
				var info = JSON.parse(window.localStorage.getItem(me.getName(name, 'info')));
				return (info && parseInt(info.count)) || 0;
			} catch (e) {
				return 0;
			}
		},
		isExpire : function(name, maxSecond, maxCount) {
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

	//网络请求模块
	var network = {
		/**
		 *	拉取游戏的分区分服信息的方法
		 *	目前采用的数据源是ams系统的配置，采用静态文件拉取的方式
		 *	如果拉取回来的 autoLoad == true的话，是目前ams系统数据暂时不可用
		 *	就拉取游戏侧的分区分服信息,目前只有天天炫斗是这么用的，其他都不是。
		 */
		getAreaDetail : function (appId, areaIds, callback ,update){

			var cacheKey  = [ getUserId(), 'getAreaDetail' , appId ].join('/');
			//默认时间是半天12小时
			var maxSecond = 43200, maxCount = 20;
			var cv = cacheData.get(cacheKey);

			if(update == true || !cv || cacheData.isExpire( cacheKey , maxSecond , maxCount)){

				window.qv = window.qv || {
						zero: {Idip:{}}
					};

				zUtil.require(location.protocol + '//imgcache.qq.com/club/common/lib/zero/idip/'+appId+'.js?'+(new Date()).valueOf(), function() {

					var _data = qv.zero.Idip[appId];
					cacheData.set( cacheKey , _data );   //将数据缓存起来,这个要先做，因为processAreaData，会操作_data

					network.processAreaData( appId , areaIds, _data, callback);
				});

			}else{
				network.processAreaData( appId , areaIds, cv, callback);

			}

			return true;
		},

		/**
		 *	功能：将AMS的大区格式适配为游戏中心的大区格式
		 *	如果有autoLoad就使用页面完成。
		 */
		processAreaData : function( appId, areaIds, data, callback){
			data = data || {};
			if(data.autoLoad){        //从ied拉取数据

				var cacheKey  = [getUserId(), 'syncIEDAreaData' ,appId ].join('/');
				var cache     = cacheData.get( cacheKey );
				var maxSecond = 86400, maxCount = 20;

				if(false && cache && !cacheData.isExpire( cacheKey , maxSecond , maxCount )){
					callback && callback( cache );
				}else{
					//login.getScript(location.protocol + '//game.qq.com/comm-htdocs/js/game_area/utf8verson/' + data.game_name.toLowerCase()+'_server_select_utf8.js?'+(new Date()).valueOf(), function() {
					zHttp.send(location.protocol + '//game.qq.com/comm-htdocs/js/game_area/utf8verson/' + data.game_name.toLowerCase()+'_server_select_utf8.js?'+(new Date()).valueOf(), function() {
						var ied_data = window[data.game_name.toUpperCase()+'ServerSelect'];

						if( ied_data ){
							network.syncIEDAreaData( appId, ied_data, data, callback);
						}
					});
				}
				return;
			}
			var json = {
				"data":[],
				"info": {
					game_name: data.game_name || '',
					and_pkg: data.and_pkg || '',
					ios_pkg: data.ios_pkg || '',
					appid: data.appid || '',
					area: data.area || '',
					platid: data.platid || [],
					roleid: data.roleid || ''
				},
				"message":"",
				"result":0
			};

			//合并IOS和android区
			var system = ['ios', 'and'],
				system_map = {'ios':0, 'android':1},
				current_sys = 2==platCode?'ios':'android';
			var serverList = data.serverList;

			if(serverList && serverList.length && !serverList['ios'] && !serverList['android']){
				var arr = [];
				for(var n=0;n<serverList.length;++n){
					arr.push(serverList[n]);
				}
				serverList['ios'] = serverList['android'] = arr;
			}
			var areaMap = {};
			var n = system_map[current_sys];
			var _arr = (serverList && serverList[system[n]]) || [];
			// 指定了区服，且该平台下指定区服
			// null 为拉取全部区服
			areaIds = areaIds && areaIds[system[n]] ? areaIds[system[n]] : null;
			for(var m=0;m<_arr.length;++m){
				if(!areaMap[_arr[m][1]]){
					areaMap[_arr[m][1]] = {
						area_id  : (data.area==-1)?_arr[m][1]:(data.area.length?data.area[n]:data.area),
						area_name: _arr[m][0],
						game_name: data.game_name,
						plat_id: data.platid.length?data.platid[n]:data.platid,
						android: data.platid.length?data.platid[system_map['android']]:data.platid,
						ios: data.platid.length?data.platid[system_map['ios']]:data.platid,
						type: 1
					}
					if(data.area!=-1){
						areaMap[_arr[m][1]].partition = _arr[m][1];
					}
				}
			}

			for( var i = 0 ; i < _arr.length ;i++){
				if( areaMap[_arr[i][1]] && (!areaIds || (',' + areaIds + ',').indexOf(',' + _arr[i][1] + ',') != -1)){
					json.data.push( areaMap[_arr[i][1]] );
				}
			}
			if(json && json.result == 0 && json.data) {

				callback && callback( json, appId );

			}else {

				callback && callback({
					result: (json && json.result) || -1,
					message: (json && json.result) || 'error data'
				}, appId);

			}
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
			//合并IOS和android区
			if(ied_data.STD_SYSTEM_DATA.length){
			} else {
				if(ied_data.STD_CHANNEL_DATA){
					var channelData = ied_data.STD_CHANNEL_DATA;
					var stdData = ied_data.STD_DATA,
						valueMap = {};
					for(var n=0;n<channelData.length;++n){
						if(channelData[n].k == 'qq'){
							config[channelData[n].sk] = channelData[n].v;
							valueMap[channelData[n].sk] = [];
						}
					}

					stdData.sort(function(a,b){
						return parseInt(a.v) - parseInt(b.v);
					});

					for(var n=0;n<stdData.length;++n){
						if(stdData[n].status == '1'){
							if(stdData[n].ck == "qq" && valueMap[stdData[n].sk]){
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
								area_id: (data.area==-1)?current_sys_data[key].v:(data.area.length?data.area[n]:data.area),
								area_name: current_sys_data[key].t,
								game_name: data.game_name,
								ios: data.platid.length?data.platid[system_map['ios']]:data.platid,
								partition: current_sys_data[key].v,
								plat_id: data.platid.length?data.platid[n]:data.platid,
								type: 1
							});
						}
					}
				}
			}

			if (json && json.result == 0 && json.data) {

				callback && callback(json, appId);
				//非节假日期间不开放缓存，简化处理
				//cacheData.set( cacheKey , json );

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
			var burl      = location.protocol + "//iyouxi.vip.qq.com/ams3.1.php?";

			var cacheKey  = [getUserId(), 'getRoleList' , appId , partition].join('/');
			var maxSecond = 86400, maxCount = 6;
			var cv = cacheData.get(cacheKey);

			if( cv && update != true && !cacheData.isExpire( cacheKey , maxSecond , maxCount )){

				callback && callback( cv , params.partition);
				return;
			}else{
				//var gtk = login.getCSRFToken();
				//var gtk = zUtil.getCSRFToken();
				//burl += '_c=queryRoleInfoWx&gamename='+gameName+'&area='+areaId+'&partition='+partition+"&platid="+platId+"&g_tk="+gtk;

				//login.getScriptv2({
				zHttp.send({
					_c     : 'queryRoleInfoWx',
					gamename   : gameName,
					area: areaId,
					partition:partition,
					platid:platId

				},function (json) {
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
					if(item.roleName && item.partitionName){
						//角色名称存在则正常
						goodData.push(item);
					}else{
						if(k == 0){
							firstRcnBadItem = item;
						}
						recentlyPlayBadData.push(item);
					}
				}

				if(goodData.length > 0){
					cv.data = goodData;
				}else{
					//压根没有好数据或者压根没有数据
					cv.data = [];
				}

				callback && callback( cv );

			}else{
				//login.getScriptv2({
				//zHttp.send({
				//	url : location.protocol + '//info.gamecenter.qq.com/cgi-bin/gc_play_info_fcgi',
				//	data: {
				//		module: 'gc_play_info',
				//		method: 'getServerList',
				//		param: {
				//			"appid": appId+"",
				//			"version" : 2,	//本次后台同学说的，加了2的话，CGI会把没有角色名称的记录也给吐出来，但最终还是保证三个。
				//			"tt"   : platCode
				//		}
				//	},
				//	cache   : false,
				//	dataType: 'json',
				//	success : function( json ) {
				//
				//		if( json && 0 == json.result && json.data && json.data.length ){
				//			for( var i = 0 ; i < json.data.length ; i++){
				//				var cur = json.data[i];
				//				//校验cacheTime，引用修改字段
				//				if(typeof cur.cacheTime == "undefined" || cur.cacheTime === 0){
				//					cur.cacheTime = defaultTimeSection;
				//				}
				//				if( cur && cur.partition && cur.partitionName && cur.roleId && cur.roleName ){
				//					cur.roleName = encodeHTML( cur.roleName );    //xss漏洞检测
				//				}else{
				//					//json.data.splice( i , 1);       //如果数据不合法，就直接干掉
				//				}
				//			}
				//			if( json.data && json.data.length ){
				//				cacheData.set(cacheKey ,json );
				//			}
				//			//二次过滤
				//			firstRcnBadItem = null;
				//			recentlyPlayBadData = [];
				//			var goodData = [];
				//			//$.each未能保证遍历的顺序，采用for
				//			for(var k = 0 ; k < json.data.length ; k++){
				//				var item = json.data[k];
				//				if(item.roleName && item.partitionName){
				//					//角色名称存在则正常
				//					goodData.push(item);
				//				}else{
				//					if(k == 0){
				//						firstRcnBadItem = item;
				//					}
				//					recentlyPlayBadData.push(item);
				//				}
				//			}
				//
				//			if(goodData.length > 0){
				//				json.data = goodData;
				//			}else{
				//				//压根没有好数据或者压根没有数据
				//				json.data = [];
				//			}
				//			callback && callback( json );
				//
				//
				//		}else{
				//			callback && callback(json );
				//		}
				//
				//	},
				//	error: function( jqXHR, statusText, errorText) {
				//		callback && callback({
				//			result: -1,
				//			message: errorText
				//		});
				//	}
				//});
			}
		},
		//上报用户最近的区服信息,每次选择都上报。因为里面有时间的信息，会改变用户的顺序
		recordRcntInfo:function( param , callback ){

			param = param || {};
			if( !param.appId ||!param.partition || !param.roleId ){
				return;
			}

			//login.getScriptv2({
			//zHttp.send({
			//	url : location.protocol + '//info.gamecenter.qq.com/cgi-bin/gc_play_info_fcgi',
			//	data: {
			//		module: 'gc_play_info',
			//		method: 'recordServerInfo',
			//		param: {
			//			"appid"         : param.appId+"",
			//			"tt"            : platCode,
			//			"area"   		: param.area,
			//			"plat"   		: param.plat,
			//			"partition"		: param.partition,
			//			"roleId"		: param.roleId,
			//			"partitionName"	: param.partitionName,
			//			"roleName"		: param.roleName
            //
			//		}
			//	},
			//	cache   : false,
			//	dataType: 'json',
			//	success : function( json ) {
            //
			//		callback && callback(json);
            //
			//	},
			//	error: function(jqXHR, statusText, errorText) {
            //
			//		callback && callback({
			//			result: -1,
			//			message: errorText
			//		});
            //
			//	}
			//});
		}
	};

	exports.Areasvrselectorwx = Areasvrselectorwx;

})(qv.zero);