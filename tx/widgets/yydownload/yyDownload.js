/**
* 预约下载
* payneliu
* 2016-04-19
* 
* 其中cmd可是set，get，del，分别是预约，获取预约状态，删除预约状态
* channel：渠道标识，需要传gameCenter
* subscribeid：应用宝提供的应用宝预下载ID，需要应用宝提供
* 其他为安卓机器标识
*/

;(function (exports, $) {
    zUtil.require('SQGameManager'); //预先加载这个组件
    var MQQ = window.mqq;

    function yyDownloadManager(){
        this.init();
    }
    $.extend(yyDownloadManager.prototype, {
        init : function(){
            this.uin = zUtil.getUin();
            if(zUtil.isDebug()){
                this.url = 'http://clientwebview.cs0309.imtt.qq.com/ajax/WspSubscription'; //测试环境地址
            } else {
                this.url = 'http://yybcms.app.qq.com/ajax/WspSubscription'; //正式环境地址
            }
        },
        /**
         * 执行命令
         * @param  string    cmd 命令字：set，get，del，分别是预约，获取预约状态，删除预约状态
         * @return callback  promise对象    
         */
        execCmd : function(subscribeid, cmd, cb){
            var callback = new qv.zero.CallBack(), 
                uin = this.uin, url = this.url;
            if(MQQ && MQQ.device && MQQ.device.getDeviceInfo){
                MQQ.device.getDeviceInfo(function(data){
                    if(data && data.androidID){
                        url += '?' + $.param({
                            subscribeid : subscribeid,
                            cmd : cmd,
                            androidId : data.androidID,
                            imei : data.identifier,
                            imsi : data.imsi,
                            mac : data.macAddress,
                            uin : uin,
                            channel : 'gameCenter'
                        });
                        $.ajax({
                            url : url,
                            dataType: 'jsonp',
                            jsonpCallback : 'jsonp',
                            beforeSend : function(xhr, param){
                                param.url = param.url.replace('&callback=', '&jsonp='); //兼容以前的老版本
                            },
                            success : function(json){
                                cb && cb(json);
                                callback.execute(json);
                            },
                            error : function(){
                                var json = {
                                    result : 5,
                                    ret    : 5,
                                    msg    : "网络异常，请稍后再试！"
                                };
                                cb && cb(json);
                                callback.execute(json);
                            }
                        });
                    }
                });
            }
            return callback;
        },
        get : function(subscribeid, cb){
            return this.execCmd(subscribeid, 'get', cb);
        },
        set : function(subscribeid, cb){
            return this.execCmd(subscribeid, 'set', cb);
        },
        del : function(subscribeid, cb){
            return this.execCmd(subscribeid, 'del', cb);
        }
    });

    var yydownloadmanager = new yyDownloadManager();

    var yy = exports.YY = {};
    /**
     * 预约下载
     */
    yy.yyDownload = function(appid, subscribeid, cb){
        var callback = new qv.zero.CallBack();
        yydownloadmanager.set(subscribeid, function(json){
            if(json.ret === 0){
                zUtil.require('SQGameManager', function(){
                    qv.zero.SQGameManager.report(appid, {
                        operModule: 17,
                        moduleType: 1714,
                        operId: 201625,
                        operType: 1,
                        objId: json.ret + '_' + json.return + '_' + json.guid + '_' + json.subscribeid
                    });
                });
            }
            var success = json['return'] == 0;
            cb && cb(success);
            callback.execute(success);
        });
        return callback;
    };

    /**
     * 是否预约下载
     */
    yy.hasyyDownload = function(subscribeid, cb){
        var callback = new qv.zero.CallBack();
        yydownloadmanager.get(subscribeid, function(json){
            var success = json['return'] == 0;
            cb && cb(success);
            callback.execute(success);
        });
        return callback;
    }


}(qv.zero, Zepto));