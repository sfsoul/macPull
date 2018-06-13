/**
* 收藏夹 管理组件
*/
;(function(exports, $) {
    exports.FavoriteManager = (function(){
        var tt = /iphone|ipad|itouch/ig.test(window.navigator.userAgent) ? 2 : 1;
        var pid = exports.Http.page.jsonid;
        var reportURL = 'http://info.gamecenter.qq.com/cgi-bin/gc_user_activity_v2_async_fcgi';

        return {
            /**
            * 添加至收藏夹
            */
            addFavorite : function(PID, callback){
                if(typeof(PID) === 'function'){
                    callback = PID;
                    PID = 0;
                }
                PID = PID || pid;
                var url = [reportURL,
                '?param={"key": {"param": {"tt":', tt, ',"actId": "', PID,
                '","source":1}, "module": "gc_user_activity_v2","method": "report_user_activity_record"}}'].join("");

                callback = callback || function (json){ zMsg.show('成功收藏至个人中心'); };
                zHttp.ajax({
                    url : url,
                    timeout : 2000,
                    callback : function(json){
                        if(json.result === 5){
                            zMsg.show(json.msg);
                        } else {
                            var data = json.data.key.retBody;
                            if(data.result === -120000){
                                qv.zero.Login.login();    
                            } else if(data.result === 0 || data.result === 180005/*已经收藏过*/) {
                                data.ret = data.result;
                                callback && callback(data);
                            } else {
                                zMsg.show('系统繁忙，请稍后再试');
                            }
                        }
                    }
                });
            },
            /**
            * 查询是否收藏的活动
            */
            queryFavoriteState : function(PID, callback){
                if(typeof(PID) === 'function'){
                    callback = PID;
                    PID = 0;
                }
                PID = PID || pid; //默认当前的项目id
                var url = [reportURL,
                '?param={"key": {"param": {"tt":', tt, ',"actId": "', PID,
                '","source":1}, "module": "gc_user_activity_v2","method": "get_collect_activity_status"}}'].join("");

                zHttp.ajax({
                    url : url,
                    timeout : 2000,
                    callback : function(json){
                        if(json.result === 5){
                            zMsg.show(json.msg);
                        } else {
                            var data = json.data.key.retBody;
                            if(data.result === -120000){
                                qv.zero.Login.login();    
                            } else if(data.result === 0) {
                                data.ret = data.result;
                                callback && callback(data);
                            } else {
                                zMsg.show('系统繁忙，请稍后再试');
                            }
                        }
                    }
                });
            }
        };
    })();

    zUtil.reportGameCenter = exports.FavoriteManager.addFavorite;
})(qv.zero, Zepto);