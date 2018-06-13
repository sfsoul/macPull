/*
    移动端购买道具组件
    使用方法：
    qv.zero.BuyGoods.buy({
        serviceid : '1003', 
        gameData : { //区服选择器参数
            game : 'ttkp'
        },
        itemid : '', 
        mqq : true //会走mqq的支付
    });
    或者：
    qv.zero.BuyGoods.buy({ //支持AMS下单
        gameData : { //区服选择器参数
            game : 'ttkp'
        },
        mqq : true //会走mqq的支付
    });
    qv.zero.BuyGoods.onsuccess = function(){}
    qv.zero.BuyGoods.onpause = function(){}
    qv.zero.BuyGoods.onhome = function(){}
    或
    qv.zero.BuyGoods.init({
        onsuccess : function(){},
        onpause : function(){},
        onhome : function(){}
    });
*/
(function($, exports, undefined){
    //订单管理
    function BillManager (args){
        function getCSRFToken(){
            var hash = 5381;
            var skey = zUtil.getcookie('skey');
            if (skey) {
                for (var i = 0, len = skey.length; i < len; i++) {
                    hash += (hash << 5) + skey.charCodeAt(i);
                }
                return hash & 2147483647;
            } else {
                return false;
            }
        }
        function getSystemInfo(){
            var networkType = 1,    //网络类型
            systemVersion = 1;  //系统版本
            var deferred = new zDefer.defer();
            if(window.mqq && mqq.compare('0') > 0){
                mqq.device.getNetworkType(function(result){
                    if (result.result == 0) {
                        networkType = result.data;
                    }
                    mqq.device.getDeviceInfo(function(json){
                        if (json.result == 0) {
                            systemVersion = json.systemVersion;
                        }
                        deferred.resolve({'networkType': networkType, 'systemVersion': systemVersion});
                    });
                });
            } else {
                setTimeout(function(){deferred.resolve({'networkType': networkType, 'systemVersion': systemVersion});}, 0); //pc测试时使用
            }
            return deferred.promise;
        }
        function request(data, cgi){
            var deferred = new zDefer.defer();
            var url = route(cgi);
            $.ajax({
                url: url,
                data: {param : JSON.stringify({ testkey1 : data }), g_tk: getCSRFToken()},
                cache: false,
                dataType: 'json',
                timeout: 20000,
                beforeSend : function(xhr){
                    xhr.withCredentials = true;
                },
                success: function (json, status, xhr) {
                    if(json.ecode === 1004029){
                        deferred.reject({ ret : 5, msg : json.msg});
                    } else if(!json.data || !json.data.testkey1){
                        deferred.reject({ ret : 120002, result: 120002, msg : '未登录'});
                    } else {
                        var data = json.data.testkey1.retBody;
                        deferred.resolve(data);
                    }
                },
                error: function (jqXHR, statusText, error) {
                    deferred.reject({ ret : 5, msg : '网络异常，请稍后再试'});
                }
            })
            return deferred.promise;
        }
        function getBill(data, cgi){
            var deferred = new zDefer.defer();
            getSystemInfo().then(function(sysInfo){
                var param = data.param || {};
                param.qqver = '' + sysInfo.systemVersion;
                param.net = '' + sysInfo.networkType;

                return request(data, cgi).then(function(ret){
                    deferred.resolve(ret);
                }).otherwise(function(ret){
                    deferred.reject(ret);
                });
            });
            return deferred.promise;
        }

        function getBillAMS(data){
            var deferred = new zDefer.defer();
            getSystemInfo().then(function(sysInfo){
                var param = data.param || {};
                param.qqver = '' + sysInfo.systemVersion;
                param.net = '' + sysInfo.networkType;

                zHttp.request({
                    qqver : sysInfo.systemVersion, net :sysInfo.networkType, actid: args.actid, 
                    tt: param.tt, reserve_buf: param.reserve_buf}, function (ret){
                        if(ret.ret !== 0){
                            ret.data && (ret.data.join = ret.data.join || ''); //防止前端出错
                        }
                        ret.result = ret.ret;
                        deferred.resolve(ret);
                });
            });
            return deferred.promise;
        }

        var result;
        if(!args || !args.actid){
            result = {
                getBill : getBill,
                getUrl : function(json){
                    return json.data.url_params;
                }
            };
        }else if(args.actid){
            result = {
                getBill : getBillAMS,
                getUrl : function(json){
                    return json.data.op;
                }
            };
        }       
        return result;
    }

    function route(cgi){
        if(zUtil.isDebug()){
            var url = 'http://gamecentertest.3g.qq.com/cgi-bin/' + cgi;
        } else {
            var url = 'http://pay.vip.qq.com/cgi-bin/' + cgi;
        }
        return url;
    }
    function getValueWithDefault(data, key, defaultvalue){
        if(!data) return defaultvalue;
        var val = data[key];
        return (val === null || val === void 0) ? defaultvalue : val;
    }
    function paramFormat(data){
        var dict = {platid: 'plat_id', area: 'zone_id', partition: 'server_id', roleid: 'role_id'};
        var ret = [], key;
        for (var i in data) {
            key = dict[i] || i;
            ret.push(key + '$' + getValueWithDefault(data, i , ''));
        }
        return ret.join('|');
    };
    function href(url){
        url && setTimeout(function(){
            if(window.mqq && (mqq.iOS && mqq.compare("4.5") >= 0 || mqq.android && mqq.compare("4.6") >= 0)){
                mqq.ui.openUrl({url : url,target : 0})
            }else{
                window.location.href = url;
            }
        }, 50);
    };
    var platCode     = /iphone|ipad|itouch/ig.test(window.navigator.userAgent)? '2' : '1';

    var BuyGoods = exports.BuyGoods =  {
        _getBill : function(param){
            return BillManager(param);
        },
        _getSvr : function(gamedata){
            var deferred = new zDefer.defer();
            if(gamedata){
                zUtil.require(['AreaSvrSelector'], function(){
                    var key = gamedata.game + '_svr';
                    var svr = this[key] || (this[key] = new exports.AreaSvrSelector(gamedata));
                    svr.show({
                        send : function(args){
                            deferred.resolve(args);
                        }
                    });
                }, {scope : this});
            } else {
                setTimeout(function(){deferred.resolve({});}, 0);
            }
            return deferred.promise;
        },
        _done : function(data, param){
            var url;
            if(zUtil.isDebug()){
                url = 'http://pay.qq.com/h5/index.shtml?m=buy&c=goods&pf=qq_m_qq-2001-html5-2011-gamecenter&sandbox=1&params=' + data.url_params;
            } else {
                url = 'http://pay.qq.com/h5/index.shtml?m=buy&c=goods&pf=qq_m_qq-2001-html5-2011-gamecenter&params=' + data.url_params;
            }
            url += this._callbackurl('success', JSON.stringify(param))
            href(url);
        },
        _donewithmqq : function(data, param){
            var me = this, url_params = decodeURIComponent(data.url_params), busappid, m;
            m = /\/(\d{9,})\//.exec(url_params);
            if(m && (busappid = m[1])){
                mqq.tenpay.buyGoods({
                    offerId : busappid, //字符串
                    userId : zUtil.getUin(),
                    tokenUrl : url_params
                }, function (result){
                    if(result.resultCode === 0 && ( result.payState === 0 || result.provideState === 0 )){
                        me.onsuccess && me.onsuccess(param);
                    } else if(result.resultCode === 2 || result.payState === 1){
                        me.onsuccess && me.onpause(param);
                    }
                });
            } else {
                zMsg.show("参数错误！");
            }
        },
        _callbackurl : function(type, args){
            var url = window.location.href;
            url = url.substr(0,url.indexOf("?")) + '?_wv=1&_cb_='
            switch(type){
                case 'success':
                    url = '&ru=' + window.encodeURIComponent(url + 'buy_success&_a_=' + encodeURIComponent(window.encodeURIComponent(args)));
                break;
                case 'pause':
                    url = '&pu=' + window.encodeURIComponent(url + 'buy_pause&_a_=' + encodeURIComponent(window.encodeURIComponent(args)));
                break;
                case 'home':
                    url = '&hu=' + window.encodeURIComponent(url + 'buy_home&_a_=' + encodeURIComponent(window.encodeURIComponent(args)));
                break;
            }
            return url;
        },
        _dealUrl : function(){
            var url = window.location.href;
            url = url.replace(/&_cb_=[^&]*/, '').replace(/&_a_=[^&]*/, '');
            try{
                history.replaceState && history.replaceState(null, document.title, url);
            } catch(e){
                // window.location.href = url;
            }
        },
        _dealcallback: function(){
            var cb = zURL.get('_cb_'), args = zURL.get('_a_'), param;
            try{ param = JSON.parse(decodeURIComponent(window.decodeURIComponent(args))); } catch(e){}
            this._dealUrl();
            if(cb){
                switch(cb){
                    case 'buy_success' :
                    this.onsuccess && this.onsuccess(param);
                    break;
                    case 'buy_pause' :
                    this.onpause && this.onpause(param);
                    break;
                    case 'buy_home' :
                    this.onhome && this.onhome(param);
                    break;
                }
            }
        },
        buy : function(param){
            var me = this;
            zUtil.require(['deferred'], function(){
                var itemid = param.itemid, serviceid = param.serviceid, gamedata = param.gameData,
                    tt = platCode, itemnum = param.itemnum || 1, billMan = me._getBill(param);
                me._getSvr(gamedata).then(function(area_arg){
                    area_arg.appid = param.appid || 0;
                    return billMan.getBill({
                        param : {
                            tt : tt,
                            service_id : serviceid,
                            item_id : itemid,
                            item_num : itemnum,
                            reserve_buf: paramFormat($.extend({}, area_arg, param.exts))
                        },
                        module : 'midas_pay',
                        method : 'buy_goods'
                    }, 'midas_pay_buy_goods');
                }).then(function(ret){
                    var report_id = param.report_id;
                    if(ret.result === 0){
                        report_id && zHttp.request({actid : report_id}, function(){});
                        me[param.mqq ? '_donewithmqq' : '_done']({url_params : billMan.getUrl(ret)}, param);
                    } else if(ret.result === 120002) {
                        zUtil.ensureLogin();
                    } else {
                        var done;
                        if (param.doneCallback) {
                            done = param.doneCallback(ret);
                        } else {
                            done = true;
                        }
                        if(done === true){
                             switch(ret.result){
                                case 101009:
                                    zMsg.show("您今天的参与次数，已达到活动限量。");
                                    break;
                                case 101010:
                                    zMsg.show("您的参与次数，已达到活动限量，请期待下次活动");
                                    break;
                                case 101011:
                                    zMsg.show("对不起，已经购买完，请期待下次活动");
                                    break;
                                case 101012:
                                    zMsg.show("对不起，活动还没开始，请期待~");
                                    break;
                                case 101013:
                                    zMsg.show("对不起，活动已结束，请期待下次活动");
                                    break;
                                default :
                                    zMsg.show("系统繁忙，请稍候重试！");
                            }
                        }
                    }
                }).otherwise(function(ret){ //调用失败
                    zMsg.show("系统繁忙，请稍候重试！");
                });
            });
        },
        queryTicket : function(idlist ,cb){
            var me = this, billMan = me._getBill();
            zUtil.require(['deferred'], function(){
                billMan.getBill({
                    param : {
                        tt : platCode,
                        item_id_list : idlist
                    },
                    module : 'midas_pay',
                    method : 'query_limit'
                },  zUtil.isDebug() ? 'gc_league_race_asyn_fcgi' : 'midas_pay_info').then(cb).otherwise(cb);
            });
        },
        init : function(param){
            $.extend(this, param);
        }
    };
    //在页面初始化之后执行
    exports.Page && exports.Page.instance.addReadyFire(function(){
       BuyGoods._dealcallback();
    });
})(Zepto, qv.zero);