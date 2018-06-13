/*
 * 道聚城支付组件
 */

/*

读取道具信息
用法：qv.zero.BuyProps.load( propId, callback );
propId: 道具id
callback: 回调函数
example:
qv.zero.BuyProps.load( 32, function( data ){
}); //预加载游戏信息

是否购买了道具
用法：qv.zero.BuyProps.hasBought( propId, callback );
propId: 道具id
callback: 回调函数
example:
qv.zero.BuyProps.hasBought( 32, function( hasbought ){
}); //看是有有购买过

弹出购买道具对话框
用法：qv.zero.BuyProps.dialog( propId, params, callback );
propId: 道具id
params: 默认参数，如包含大区信息plat、platname、partitionid、partitionname、areaid、areaname，或数量 nums、from: 来源标识 等
callback: 回调函数
example:
qv.zero.BuyProps.dialog( 943, {from:'daoju-plugin'});

下单购买道具
用法：qv.zero.BuyProps.buy( propId, params, nums, from, callback );
propId: 道具id
params: 参数，包含大区信息plat、platname、partitionid、partitionname、areaid、areaname
nums: 数量
from: 来源标识
callback: 回调函数
example:
qv.zero.BuyProps.buy( 943, {plat: 2, platname: '', partitionid: 1, partitionname:'', areaid: 2, areaname: ''}, 1, 'other' );
*/

var BuyProps = window.BuyProps = qv.zero.BuyProps = {};
(function($, exports){
	var dialog = {
		alert: function(text){
			$('#qv_zero_buygoods_dialog_tip').text(text).show();
		}
	}
	//获取当前的平台，ios还是android。跟后台通信的时候 1：ios 2：android
	var platCode     = /iphone|ipad|itouch/ig.test(window.navigator.userAgent)? 1 : 2;

	function getBusIdServerSelect(busId){
		var asc = busId.charCodeAt(0);
		if(asc>=48 && asc<=57){
			return window['_'+busId.toUpperCase()+'ServerSelect'];
		} else {
			return window[busId.toUpperCase()+'ServerSelect'];
		}
	}
	function buildAreaStdData(json, busId){
		if(json && json.length)return json;
		var data = getBusIdServerSelect(busId),
			channeldata = data.STD_CHANNEL_DATA,
			ret = [];
		for(var n=0;n<channeldata.length;++n){
			ret.push({t:channeldata[n].t, v:channeldata[n].v, status:"1", s:"", c:""});
		}
		return ret;
	}

	function areaDataFormatter(json, busId){
		if(!json)return json;
		if(!json.length || !json[0].c || json[0].c=='')return json;
		if(json.length && json[0].ck && json[0].sk){
			//标准文件解析
			var system = ["unknown", "ios", "android"][platCode];
			var channel = "qq";
			var areaArr = [];
			for(var n=0;n<json.length;++n){
				if(json[n].ck==channel && json[n].sk==system){
					areaArr.push(json[n]);
				}
			}
			return areaArr.sort(function(x, y) {return +x.v - +y.v});
		} else {
			var areaArr = [],
				areaMap = {},
				tMap3;
			if(mqq.android){
				tMap3 = {'AQQ': 'QQ'};
			} else if(mqq.ios){
				tMap3 = {'IQQ': 'QQ'};
			} else {
				tMap3 = {'AQQ': 'QQ'};
				//tMap3 = {'AQQ': 'Android QQ', 'IQQ': 'IOS QQ', 'AWX': 'Android 微信', 'IWX': 'IOS 微信'};
			}

			for(var n=0; n<json.length; ++n){
				var ch3 = json[n].t.substr(0,3);
				if(!tMap3[ch3]){
					ch3 = 'AQQ';
				}
				if(tMap3[ch3]){
					if(!areaMap[json[n].c]){
						areaMap[json[n].c] = {t:tMap3[ch3],v:json[n].v,status:json[n].status, s:"", c:"", opt_data_array:[]};
					}
					areaMap[json[n].c].opt_data_array.push(json[n]);
				}
			}
			for(var key in areaMap){
				areaArr.push(areaMap[key]);
			}
			return areaArr;
		}
	}
	function callbackRoleInfo(data, callback){
		try{mqq.ui.setLoading({visible: false});}catch(e){};
		areadata = getBusIdServerSelect(data.busId);
		//areadata.STD_DATA = window[busId.toUpperCase()+'ServerSelect'].STD_DATA;
		areadata.STD_DATA = buildAreaStdData(areadata.STD_DATA, data.busId);
		areadata.STD_DATA = areaDataFormatter(areadata.STD_DATA, data.busId);
		if(areadata){
			var compare;
			if(platCode==1){//如果是ios系统则
				compare = '手Q-苹果(ios)';
			} else {
				compare = '手Q-安卓(android)';
			}
			for(var n=0;n<areadata.STD_DATA.length;++n){
				if(areadata.STD_DATA[n].t.toLowerCase() == 'qq' || areadata.STD_DATA[n].t == '手Q' || areadata.STD_DATA[n].t == compare){
					if(areadata.STD_DATA[n].opt_data_array){
						areadata.rootdata = {list:areadata.STD_DATA[n].opt_data_array};
					} else {
						areadata.rootdata = {areaid:areadata.STD_DATA[n].v};
					}
					break;
				}
			}

			if(areadata.rootdata){
				if(areadata.rootdata.list && areadata.rootdata.list.length){
					//有分区的情况
					//detail.module.section_roleinfo.renderer({});
					//areaSelector.render('area', areadata.rootdata.list);
				} else {
					//无分区的情况
					_private.roleInfo[data.propId] = areadata.rootdata;
					//detail.module.section_roleinfo.data = areadata.rootdata;
				}
			} else {
				//端游有分区的情况
				areadata.rootdata = {list:areadata.STD_DATA};
				//areaSelector.render('area', areadata.STD_DATA);
			}
            _private.areaInfo[data.busId] = areadata;
			//detail.setPayButtonVisible(true);
		}
		if(callback){
			callback(data);
		}
	}

	var _private = {
		propInfo : {},
		roleInfo : {},
        areaInfo : {},
		from: false,
		/**
		 * 请求载入并执行一个 JavaScript 文件
		 * @param {string} src js文件的url
		 * @param {function} [callback] 成功回调函数
		 */
		getScript : function (url, callback, errCallback, charset) {
			var script = document.createElement('script');
			script.async = 'async';
			script.charset = charset||"utf-8";
			script.src = url;
			script.onload = callback || function () { };
			script.onerror = errCallback || function() {};
			document.getElementsByTagName('head')[0].appendChild(script);
		},
		//获取道具详情
		getPropDetailFromNet : function( propId , callback ){
			if( !propId ){
				console.log("error propId can't be null");
				return;
			}
			$.ajax( {
				url: 'http://apps.game.qq.com/daoju/go/goods/v3/mq/item',
				data: {
						"uin"   : zUtil.getUin(),
						"propid": propId ,
						"plat"  : platCode
					},
				cache: false,
				// dataType: 'json',
				xhrFields: {
					withCredentials: true
				},
				beforeSend : function(xhr){
					xhr.withCredentials = true;
				},
				success: function(json) {  //成功之后回调
          json = typeof json === 'string' ? JSON.parse(json) : json;
					if(json.result == 0){
                        var data = json.data;
                        if(data.valiDate.length){
                            var item = data.showTarget = data.valiDate[0];
							var totalLeft = parseInt(item.totalLimit)?parseInt(item.left):Number.MAX_VALUE;
							var todayLeft = parseInt(item.todayLimit)?(parseInt(item.todayLimit)-parseInt(item.todayBought)):Number.MAX_VALUE;
							var limitPerOrder = parseInt(item.limitPerOrder);
							data.showTarget.limit = {
								minValue:1,
								maxValue:false,
								totalLimit: parseInt(item.totalLimit) || Number.MAX_VALUE,
								todayLimit: parseInt(item.todayLimit) || Number.MAX_VALUE,
								limitPerOrder: limitPerOrder || Number.MAX_VALUE,
								totalLeft: totalLeft,
								todayLeft: todayLeft,
								left: parseInt(item.left),
								todayBought: parseInt(item.todayBought),
								bought: parseInt(item.bought)
							}
                        }
						_private.propInfo[propId] = data;
                        _private.requestAreaInfo(propId, data, callback);
					} else if([-5805, -5806, -5866, -8211].indexOf(+json.result) !== -1) {
						_dialog.hide();
						zMsg.show('该活动还未开始');
					} else {
						_dialog.hide();
						zMsg.show(json.msg);
					}
					//callback && callback( json );
				},
				timeout:function(){ //超时的处理
					callback && callback( {
						result : 2,
						msg : "timeout"
					})
				},
				error:function( jqXHR, statusText, error ){  //失败之后的回调
					update && callback && callback( {
						result: 5,
						msg   : "网络异常，请稍后再试！"
					} );
				}
			});
		},
		//下单接口
		getBillFromNet : function( params , callback){
			params = params || {};
			params.uin = params.uin || zUtil.getUin() || "";
			params.plat = platCode;
			$.ajax( {
				url: 'http://apps.game.qq.com/cgi-bin/daoju/v3/pay/mqq_buy_new.cgi',
				data: params,
				cache: false,
				dataType: 'json',
				xhrFields: {
					withCredentials: true
				},
				beforeSend : function(xhr){
					xhr.withCredentials = true;
				},
				success: function(json) {  //成功之后回调
					callback && callback( json );
				},
				timeout:function(){ //超时的处理
					callback && callback( {
						result : 2,
						msg : "timeout"
					});
				},
				error:function( jqXHR, statusText, error ){  //失败之后的回调
					callback && callback( {
						result: 5,
						msg   : "网络异常，请稍后再试！"
					} );
				}
			});
		},
		requestAreaInfo: function( propId, data, callback, retry ){
			if(!retry){
				retry = 0;
			}
			try{mqq.ui.setLoading({visible: true});}catch(e){};

			_private.getScript('http://game.qq.com/comm-htdocs/js/game_area/utf8verson/'+data.busId+'_server_select_utf8.js?20140923', function(){
				if(getBusIdServerSelect(data.busId)){
					callbackRoleInfo(data, callback);
				} else {
					if(retry>0){
						requestAreaInfo(callback, retry - 1);
					} else {
						dialog.alert('网络异常，拉取选区信息失败！');
					}
				}
			});
		},
        //需要参数: _appname、iZone、partition、_output_fmt: 1
        requestRoleInfo: function( data, callback ){
            $.ajax( {
                url: 'http://apps.game.qq.com/cgi-bin/daoju/v3/api/query_role.cgi',
                data: data,
                cache: false,
                dataType: 'json',
                xhrFields: {
                    withCredentials: true
                },
				beforeSend : function(xhr){
					xhr.withCredentials = true;
				},
                success: function(json) {  //成功之后回调
                    callback && callback( json );
                },
                timeout:function(){ //超时的处理
                    callback && callback( {
                        result : 2,
                        msg : "timeout"
                    });
                },
                error:function( jqXHR, statusText, error ){  //失败之后的回调
                    callback && callback( {
                        result: 5,
                        msg   : "网络异常，请稍后再试！"
                    } );
                }
            });
        },
        //批价下单后，的回包处理函数
        handlerServerResponse: function(json, param){
            var from = param.from;
            try{mqq.ui.setLoading({visible: false});}catch(e){};
            if("0" == json.result){
                if( from == 'qqwallet' ){
                    var _aid = 'propmall.gamecenter.qq.com.mywallet.00001';
                }else{
                    var _aid = 'propmall.gamecenter.qq.com.' + from;
                }

                if( !param.testMode && window.mqq && mqq.support('mqq.tenpay.buyGoods')){
                    mqq.tenpay.buyGoods({
                        offerId: json.offerId,
                        userId: json.uin,
                        tokenUrl: json.urlParams,
                        numberVisible: false,
                        //unit: '单位',
                        aid: _aid
                    }, function(data){
                        if(data.resultCode==0){
                            //支付成功上报
                            /*report.collect({
                                operModule : 31,
                                moduleType : 3008,
                                operId : 200292,
                                objId : valiDate.code,
                                appId : detail.data && detail.data.busId,
                                srcId : _src
                            });*/
							setTimeout(function(){
								location.reload();
                            }, 1000);
                        } else if(data.resultCode==2 || data.resultCode==-1){
                            //订单已取消！
                            /*setTimeout(function(){
                             location.reload();
                             }, 1000);*/
                            var request = new Image();
                            request.src = 'http://apps.game.qq.com/cgi-bin/daoju/v3/pay/mqq_cancel.cgi?appname='+detail.data.busId+'&ordernum='+json.sSerialNum + '&_r=' + (+new Date());

                            /*report.collect({
                                operModule : 31,
                                moduleType : 3008,
                                operId : 200293,
                                objId : valiDate.code,
                                appId : detail.data && detail.data.busId,
                                srcId : _src
                            });*/
                        } else {
                            /*report.collect({
                                operModule : 31,
                                moduleType : 3008,
                                operId : 200294,
                                objId : valiDate.code,
                                appId : detail.data && detail.data.busId,
                                srcId : _src
                            });*/
                        }
                    });
                } else {
                    var params = {
                        m: 'buy',
                        c: 'goods',
                        //sandbox: 1,
                        pf: 'sq.dj.qbjc',
                        aid: 'sq.dj.qbjc',
                        params: json.urlParams,
						'_wv': 1
                    }
					if(param.testMode){
						params.sandbox = 1;
					}
					var url = 'http://pay.qq.com/h5/index.shtml?' + $.param(params);
					if(mqq.support('mqq.ui.openUrl')){
						mqq.ui.openUrl({
							url: url,
							target: 1
						});
					} else {
						window.open(url , '_blank');
					}
                }
            }else{
                if(json.result == -1022){
                    alert('请先登录！');
                } else if(json.msg){
                    dialog.alert(json.msg);
                } else {
                    dialog.alert('网络异常，请稍后再试！');
                }
            }
        }
	};

    //对话框类
    var _dialog = {
        initlized: false,
        visible: false,
        propParams: {},
        container:$('<div style="position: fixed;top: 0;right: 0;bottom: 0;left: 0;z-index: 20;background-color: rgba(0,0,0,.4);">' +
                        '<div style="box-sizing: border-box;position: absolute;text-align: left;top: 50%;left: 50%;-webkit-transform: translate(-50%,-50%);width: 80%;min-height: 80px;background-color: #FFF;border-radius: 6px;">' +
                            '<div class="qv_zero_buygoods_dialog_content" style="font-size: 15px;color: #5b5b5b;border-bottom: #c8c7cc 1px solid;background-image: none;padding: 16px 14px 10px 14px;">' +
                                '信息加载中，请稍候...' +
                            '</div>' +
                            '<div class="mod-btn">' +
                                '<a class="qv_zero_buygoods_dialog_button" href="javascript:void(0);" style="float: left;width: 50%;height: 40px;text-align: center;display: block;color: #4787c2;line-height: 40px;font-size: 15px;width: 49.2%;border-right: 1px solid #ccc;" action="close">取 消</a>' +
                                '<a class="qv_zero_buygoods_dialog_button qv_zero_buygoods_dialog_submit" href="javascript:void(0);" style="float: left;width: 50%;height: 40px;text-align: center;display: block;color: #4787c2;line-height: 40px;font-size: 15px;" action="close">确 认</a>' +
                            '</div>' +
                        '</div>' +
                    '</div>'),
        currentPropId: false,
        tmpl: '<div style="color: #727271;">请确认以下信息：</div>\
		<div><%=propInfo.propName%>，￥<%=(parseInt(valiDate.curPrice)/100).toFixed(2)%></div>\
		<%if(propInfo.selectArea!=\'0\'){%>\
		<select id="qv_zero_buygoods_dialog_area" style="margin: 12px 0 0;width: 100%;height: 30px;font-weight: inherit;font-size: inherit;font-family: inherit;">\
			<option>请选择区服</option>\
			<% for(var i=0,item; item=areaList[i];i++){ %>\
				<option value="<%=i%>"><%=item.t%></option>\
			<% } %>\
		</select>\
		<%}%>\
		<%if(propInfo.selectRole!=\'0\'){%>\
		<select id="qv_zero_buygoods_dialog_role" style="margin: 12px 0 0;width: 100%;height: 30px;font-weight: inherit;font-size: inherit;font-family: inherit;">\
			<option>请选择角色</option>\
		</select>\
		<%}%>\
		<dl style="color: #5b5b5b;box-sizing: border-box;display: -webkit-box;-webkit-box-sizing: border-box;overflow: hidden;-webkit-box-align: center;height: 40px;line-height: 40px;font-size: 14px;width: 80%;margin: 8px auto ">\
			<dt>数量：</dt>\
			<dd>\
				<div style="display: block;overflow: hidden;width: 90%;height: 22px;background: #fff;border: solid 1px #686868;border-radius: 5px;">\
					<a class="qv_zero_buygoods_dialog_button" href="javascript:void(0);" style="text-decoration: none;color: #fff;width: 20%;line-height: 22px;height: 22px;text-align: center;float: left;display: block;border: medium none;background-image: -webkit-linear-gradient(180deg,#b4b4b4,#878787);background-image: linear-gradient(180deg,#b4b4b4,#878787" action="sub">-</a>\
					<input id="qv_zero_buygoods_dialog_input" value="1" type="text" style="float: left;width: 60%;border: medium none;color: #535353;text-align: center;line-height: 22px;background: #fff;box-shadow: 0 1px 5px #a2a2a2 inset;font-weight: inherit;font-size: inherit;font-family: inherit;">\
					<a class="qv_zero_buygoods_dialog_button" href="javascript:void(0);" style="text-decoration: none;color: #fff;width: 20%;line-height: 22px;height: 22px;text-align: center;float: left;display: block;border: medium none;background-image: -webkit-linear-gradient(180deg,#b4b4b4,#878787);background-image: linear-gradient(180deg,#b4b4b4,#878787" action="add">+</a>\
				</div>\
			</dd>\
		</dl>\
		<div id="qv_zero_buygoods_dialog_tip" style="text-align: center;color: red;display:none;"></div>',
        tmpl_get: function (str, data, env) {
            if( !str ){return;}  //如果么有数据就退出
            if( !arguments.callee.cache )arguments.callee.cache = {};
            // 判断str参数，如str为script标签的id，则取该标签的innerHTML，再递归调用自身
            // 如str为HTML文本，则分析文本并构造渲染函数
            var fn = !/[^\w\-\.:]/.test(str)
                ? arguments.callee.cache[str] = arguments.callee.cache[str] || this.get(document.getElementById(str).innerHTML)
                : function (data, env) {
                var i, variable = [], value = []; // variable数组存放变量名，对应data结构的成员变量；value数组存放各变量的值
                for (i in data) {
                    variable.push(i);
                    value.push(data[i]);
                }
                return (new Function(variable, fn.code))
                    .apply(env || data, value); // 此处的new Function是由下面fn.code产生的渲染函数；执行后即返回渲染结果HTML
            };

            fn.code = fn.code || "var $parts=[]; $parts.push('"
                + str
                    .replace(/\\/g, '\\\\') // 处理模板中的\转义
                    .replace(/[\r\t\n]/g, " ") // 去掉换行符和tab符，将模板合并为一行
                    .split("<%").join("\t") // 将模板左标签<%替换为tab，起到分割作用
                    .replace(/(^|%>)[^\t]*/g, function(str) { return str.replace(/'/g, "\\'"); }) // 将模板中文本部分的单引号替换为\'
                    .replace(/\t=(.*?)%>/g, "',$1,'") // 将模板中<%= %>的直接数据引用（无逻辑代码）与两侧的文本用'和,隔开，同时去掉了左标签产生的tab符
                    .split("\t").join("');") // 将tab符（上面替换左标签产生）替换为'); 由于上一步已经把<%=产生的tab符去掉，因此这里实际替换的只有逻辑代码的左标签
                    .split("%>").join("$parts.push('") // 把剩下的右标签%>（逻辑代码的）替换为"$parts.push('"
                + "'); return $parts.join('');"; // 最后得到的就是一段JS代码，保留模板中的逻辑，并依次把模板中的常量和变量压入$parts数组

            return data ? fn(data, env) : fn; // 如果传入了数据，则直接返回渲染结果HTML文本，否则返回一个渲染函数
        },
		setNum: function( index ){
			var input = $('#qv_zero_buygoods_dialog_input');
			var data = _private.propInfo[this.currentPropId].showTarget.limit;
			var tips = [],
				btnlabel = false;

			if(data.todayLeft<=0){
				tips.push('每日限购'+data.todayLimit+'个');
				dialog.alert('每日限购'+data.todayLimit+'个');
				index = 0;
			} else if(data.totalLeft<=0){
				tips.push('库存不足');
				dialog.alert('库存不足！');
				this.container.find('.section_count_tips').html(tips).show();
				index = 0;
			} else {
				if(data.todayLimit!=Number.MAX_VALUE){
					tips.push('每日限购'+data.todayLimit+'个');
				}
                if(data.left!=0){
                    tips.push('限量'+data.left+'个');
                }
				//合法情况
				if(index < 0){
					index = 0;
				} else if(index < data.minValue){
					index = data.minValue;
				} else if(index > data.totalLeft){
					tips.push('库存余量不足');
				} else if(index > data.limitPerOrder){
					dialog.alert('每个订单最多可购买'+data.limitPerOrder+'个！');
					index = data.limitPerOrder;
				} else if(index > data.todayLeft){
					//tips = '购买数量达到今日上限！';
					var me = this;
					dialog.alert('今日您还可以购买'+data.todayLeft+'个！', function(){
						me.setSelectedIndex(data.todayLeft, true);
						return true;
					});
					btnlabel = '购买数量达到今日上限！';
				}
			}

			/*this.container.find('.amount input').val(index);
			this.data.selectedIndex = index;

			if(!tips.length){
				this.container.find('.minus-num').hide();
			} else {
                $.each(tips, function(index, elem){
                    tips[index] = '<div class="minus-num" style="">'+elem+'</div>';
                });
				$('#minusNumContainer').html(tips.join('')).show();
			}
			this.tips = tips;
			this.btnlabel = btnlabel;*/

			input.val(index);
            this.propParams[this.currentPropId].num = index;
		},
        addEventListener: function(){
            var that = this;
            this.container.click(function(event){
                var action = $(event.target).attr('action');
                var input = $('#qv_zero_buygoods_dialog_input');
                switch( action ){
                    case 'close':
                        _dialog.hide();
                        break;
                    case 'add':
                        var value = parseInt(input.val()) + 1;
                        that.setNum(value);
                        break;
                    case 'sub':
                        var value = parseInt(input.val()) - 1;
                        that.setNum(value);
                        break;
                    case 'submit':
                        //提交按钮处理
                        exports.buy(that.currentPropId, that.propParams[that.currentPropId], that.propParams[that.currentPropId].num, that.from, function(event){
							if(event.type == 'order' && event.data){
								if(event.data.result==0){
									_dialog.hide();
								} else {
									dialog.alert(event.data.msg);
								}
							}
						});
                        break;
                }
            });
        },
        initlize: function( propid ){
            $('body').append(this.container);
            this.addEventListener();
            this.initlized = true;
        },

        show: function( options ){
            this.visible = true;
            var that = this;
            if(!this.initlized){
                this.initlize(options.propid);
            }
            if(options.propid != this.currentPropId){
                that.container.find('div.qv_zero_buygoods_dialog_content').html('信息加载中，请稍候...');
                that.container.find('.qv_zero_buygoods_dialog_submit').attr('action','close');
                exports.load(options.propid, function(json){
                    if(!that.visible){
                        return;
                    }
                    var propid = options.propid;
                    var propInfo = _private.propInfo[propid];
                    var areaInfo = _private.areaInfo[propInfo.busId];
                    var roleInfo = _private.roleInfo[propid];

					propInfo.testMode = options.testMode;

                    that.propParams[propid] = {
                        num: 1
                    }
                    if(propInfo.showTarget){
                        that.container.find('div.qv_zero_buygoods_dialog_content').html(that.tmpl_get(that.tmpl, {
                            propInfo: propInfo,
                            areaList: areaInfo.rootdata.list,
                            roleInfo: roleInfo,
                            valiDate: propInfo.showTarget
                        }));
                        that.currentPropId = propid;
						that.from = options.from;
						var data = {};
                        $('#qv_zero_buygoods_dialog_area').change(function(event){
                            var target = $(event.currentTarget);
							var selectArea = areaInfo.rootdata.list[target.val()];
							var area = that.propParams[propid];
							//注意，当存在c时，说明业务分为大区和小区，v表示小区，c表示大区
							if(selectArea.c){
								area.areaname = selectArea.t;
								area.areaid = selectArea.c;
								area.partitionid = selectArea.v;
							} else {
								area.areaname = selectArea.t;
								area.areaid = selectArea.v;
							}

                            if(propInfo.selectRole=='1'){
                                if(that.isLoading)return;
                                that.isLoading = true;
                                _private.requestRoleInfo({
                                    _appname: propInfo.busId,
                                    iZone: area.areaid,
                                    partition: area.partitionid,
                                    _output_fmt: 1
                                }, function(json){
                                    //获取角色后的回调
                                    that.isLoading = false;
                                    if(json.result==0){
                                        if(json.data.length==1){
                                            area.roleid = json.data[0].id || 0;
                                            area.rolename = decodeURIComponent(json.data[0].name);
                                            $('#qv_zero_buygoods_dialog_role').html('<option>'+ that.safeHTML(area.rolename) +'</option>');
                                        } else if(json.data.length>1){
                                            var roleHtml = [], roleDate = json.data;
                                            for (var i = 0, roleItem; roleItem = roleDate[i]; i++) {
                                            	data[roleItem.id] = decodeURIComponent(roleItem.name)
                                            	roleHtml.push('<option value="', roleItem.id ,'">' , that.safeHTML(data[roleItem.id]), '</option>');
                                            };
                                            $('#qv_zero_buygoods_dialog_role').html(roleHtml.join(''));
                                        }
                                        dialog.alert('');
                                    } else if(json.result == -1){
                                    	area.roleid = '';
                                    	$('#qv_zero_buygoods_dialog_role').html('<option>请选择角色</option>');
                                        dialog.alert('尚未找到您在该大区的角色！');
                                    } else if(json.result == -1022){
										qv.zero.Login.show();
                                    } else {
                                        dialog.alert('网络异常，请稍后再试！');
                                    }
                                });
                            } else if(this.callback){
                                this.hide();
                                this.callback(this.data);
                            }
                        });
						$('#qv_zero_buygoods_dialog_role').change(function(e){
							var target = $(e.currentTarget);
							var area = that.propParams[propid];
							area.roleid = target.val();
							area.rolename = data[area.roleid];
						});
                        that.container.find('.qv_zero_buygoods_dialog_submit').attr('action','submit');
                    } else {
                        that.container.find('div.qv_zero_buygoods_dialog_content').html('该道具合集为空，请稍后再试！');
                    }

                });
            }
			$('#qv_zero_buygoods_dialog_tip').hide();
			this.container.show();
        },
        safeHTML : function(html){
        	if(!html) return html;
        	return html.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/\\/g, '&#39;');
        },
        hide: function(){
            this.visible = false;
            this.container.hide();
        }
    };

	exports.load = function( propId, callback, update ) {
        if(update || !_private.propInfo[propId]){
            _private.getPropDetailFromNet( propId, callback );
        } else {
            callback(_private.propInfo[propId]);
        }
	};
    //是否已经购买道具
    exports.hasBought = function(propId, callback, update){
        exports.load( propId, function (json){
            var hasbought = json && json.showTarget && json.showTarget.userTotalBought;
            callback && callback(hasbought);
        }, update);
    };
	exports.buy = function( propId, params, nums, from, callback ) {
		if(nums<1){
			return;
		}
		var propInfo = _private.propInfo[propId];
		if(propInfo){
            var roleInfo = _private.roleInfo[propId];
            p = $.extend({}, params);
            if(propInfo.selectArea=='0'){
                if(!p.areaid){
                    p.areaid = roleInfo.areaid;
                }
            } else {
                if(!params.areaid){
                    // alert('请选择大区');
                    callback && callback({type:'order', data:{ result : -1, msg : '尚未找到您在该大区的角色！' }});
                    return;
                }
            }
            if(propInfo.selectRole=='0'){
                if(!p.roleid){
                    p.roleid = roleInfo && roleInfo.roleid;
                }
            } else {
                if(!params.roleid){
                    // alert('请选择角色');
                    callback && callback({type:'order', data:{ result : -2, msg : '尚未找到您在该大区的角色！' }});
                    return;
                }
            }
			if(propInfo.testMode){
				p.testMode = true;
			}
            p.propid = propId;
			p.appname = propInfo.busId;
			p.buynum = nums || 1;
			p.from = from || 'propmall.plugin';
            p.uin = zUtil.getUin();
			_private.getBillFromNet(p, function(json){
				callback && callback({type:'order', data:json});
                _private.handlerServerResponse(json, p);
			});
		} else {
			_private.getPropDetailFromNet( propId, function(json){
                exports.buy( propId, params, nums, from, callback );
			});
		}
	};

    exports.dialog = function( propid, options ) {
        options = $.extend({}, options);
        options.propid = propid;
        _dialog.show( options );
    };

})(window.Zepto || window.jQuery, BuyProps);
