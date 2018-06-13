/**
 * 在页面显示挂件的组件
 * @author payneliu
 * @version 1.0
 * @date 2015-10-16
 * @requires Zepto
 * @namespace
 * 依赖组件 http://imgcache.gtimg.cn/ACT/vip_act/act_data/67527.json.js
 * 在zero加载的时候强制添加这个文件的引用
 */
 ;(function(exports, $) {

    function getPath(url){
        var index = url.indexOf('?');
        if(index > -1){
            return url.substring(0, index);
        } else {
            return url;
        }
    }

    function PennantRender(options){
        this.cfg = options;
        this.url = options.url;//当前页面本身地址
        this.jumpUrl = options.jumpUrl;
        this.imgUrl = options.imgUrl;
        this.plat = options.plat || 1;
        this.style = options.style;
        this.page = options.page;
    };
    //2、检查URL合法性
    PennantRender.prototype.check = function() {
        var isok = !!(this.url.indexOf('://youxi.vip.qq.com/m/act') > -1 && this.jumpUrl && this.imgUrl);
        if(!isok) return false;
        //不能跳转本页面
        isok = (getPath(this.jumpUrl) !== getPath(this.url)); 
        return isok;
    };
    //3、跳转
    PennantRender.prototype.go = function() {
        var url = this.jumpUrl;
        url += url.indexOf('?') > -1 ? '&sid=' : '?sid=';
        url += this.page.getSid();
        url = url.replace(/(\?|&)(adtag=)([^&]*)/gi, '$1$2$3' + this.page.jsonid);
        if(url && window.mqq && (mqq.iOS && mqq.compare("4.5") >= 0 || mqq.android && mqq.compare("4.6") >= 0)){
            mqq.ui.openUrl({url : url, target : 1})
        }else{
            window.location.href = url;
        }
    };
    //1、入口方法
    PennantRender.prototype.render = function() {
        var renderResult = false;
        if(this.check()){
            var url = this.url, jumpUrl = this.jumpUrl, imgUrl = this.imgUrl, style = this.style, plat = this.plat;
            var $body = $(document.body), html, me = this;
            zUtil.appendStyle('#my_pendant.hide{-webkit-animation:bounceOutRight 1s;-webkit-animation-fill-mode:forwards}.tada{-webkit-animation:tada 3.5s 3}@-webkit-keyframes tada{0%{-webkit-transform:scale3d(1,1,1)}3%,6%{-webkit-transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg)}15%,21%,27%,9%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg)}12%,18%,24%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg)}35%{-webkit-transform:scale3d(1,1,1)}}@-webkit-keyframes bounceOutRight{10%{opacity:1;-webkit-transform:translate3d(-20px,0,0)}100%{opacity:0;-webkit-transform:translate3d(400px,0,0)}}');
            style = style || 'right:15px;top:250px;height:78px;z-index:20;width:64.5px;background-size:64.5px auto;';
            html = "<div id='my_pendant' class='tada' style='position:fixed;background-repeat:no-repeat;-webkit-transition: all;background-image:url({imgUrl});{style}'></div>";
            html = html.replace('{style}', style);
            html = html.replace('{imgUrl}', imgUrl);
            //平台合法性判断
            if (plat == 1 || (plat == 2 && zUtil.isIOS()) || (plat == 3 && zUtil.isAndroid())) {
                renderResult = true;
                $body.append(html);
                zUtil.require('AmsEz', function(){
                    // 曝光上报
                    exports.EZ.report({oper_module : 613, module_type : 61301, oper_type:8, oper_id : 203137});
                    var my_pendant = $("#my_pendant");
                    my_pendant.click(function () {
                        try {
                            // 点击上报
                            exports.EZ.report({oper_module : 613, module_type : 61301, oper_type:12, oper_id : 203138});
                            me.go();
                        } catch (e) {
                        }
                    });
                    
                    //挂件只显示9秒
                    setTimeout(function () {
                        my_pendant.removeClass('tada').addClass('hide');
                    }, 9000);
                });
            }
        }
        return renderResult;
    };

    function DBServer(args){
        var me = this;
        this.timer = new TimeServer();
        this.cbs = new exports.CallBack();
        this.args = args;
        zUtil.require('http://imgcache.gtimg.cn/ACT/vip_act/act_data/67527.json.js', function(){
            me.args.hasShiming.add(function(ret){
                me.Shiming = (+ret.flag === 0) ? false : true;
                var data = me._groupData();
                if(data){
                    me.timer.done(function(time){
                        me.nowTimestamp = time;
                        //时间有效性过滤
                        data = data.filter(function (i) {
                            if (i && i.expiration) {
                                var t = +new Date(i.expiration.replace(/-/g, '/'));//结束时间
                                if (i.startTime) {
                                    var startTime = +new Date(i.startTime.replace(/-/g, '/'));
                                    return time > startTime && time < t;
                                } else {
                                    return time < t;
                                }
                            }
                            return false;
                        });
                        me.cbs.execute(me._find(data));
                    });
                }
            });
        });
    };
    
    //1、过滤挂件总配置表（根据当前模版类型|aid匹配返回具体的某一张配置表）
    DBServer.prototype._groupData = function(){
        var data = (window.AMD_67527 || {form:[]}).form,
            feature_data = data[3], 
            aid = (window.page || {pcfg : {aid:''}}).pcfg.aid, //aid
            isShiming = this.Shiming, //是否实名制
            templ = ',' + (window._templateid ? _templateid : '').toLowerCase() + ','; //模版
        if(feature_data){
            //根据当前模版类型 得出 table_id（type=1为模版类型）
            var feature = feature_data.filter(function(i){ return i.feature_type == 1 && (',' + i.value + ',').toLowerCase().indexOf(templ) > -1; });
            //当前项目匹配不到模版类型，则根据当前模版AID类型 得出 table_id（type=0为aid类型）
            if(!feature || !feature.length){
                feature = feature_data.filter(function(i){ 
                    if(i.feature_type == 0 && i.value){
                        var list = i.value.toLowerCase().split(',').filter(function(j){ return j && aid.indexOf(j) > -1; });
                        if(list && list.length) return true;
                        return false;
                    }
                    return false;
                });
            }
            //aid也匹配不到则设置默认数据
            if(!feature || !feature.length){
                feature = [{table_id : 1}];
            }
            //如果当前用户未实名 且 当前模版为游戏移动端模版（ table_id=1 -> form_1 ） 则返回 表5（游戏未实名认证专用配置）
            if(feature[0].table_id == 1 && !isShiming && data[5] && data[5].length){ //临时添加
                return data[5];
            }
            //返回匹配到的表
            return data[feature[0].table_id];
        }
        //默认返回表1（游戏移动端挂件）
        return data[1];
    };
    //2、过滤配置表返回优先级最高的一条配置
    DBServer.prototype._find = function(data){ 
        if(data.length == 0) return null;
        var game = ',' + (this.args.game||'').toLowerCase() + ',', pid = ',' + this.args.pid + ',';
        //判断黑白名单
        data = data.filter(function(i){
            //判断黑名单
            var pids = (',' + i.pid + ',').toLowerCase();//需屏蔽的项目ID（也可以写游戏缩写）
            if(pids.indexOf(pid) > -1) return false;//如果当前项目在屏蔽列表内，就不上挂件
            if(pids.indexOf(game) > -1) return false;//如果当前游戏在屏蔽列表内，就不上挂件
            //判断白名单
            var val = (',' + i.value + ',').toLowerCase();//挂件只在规定值范围内显示(级别为游戏时填写游戏简写；级别为项目时填写项目Id)【多个值时逗号分隔】
            if(val.indexOf(game) > -1) return true;//youxi
            if(val.indexOf(pid) > -1) return true; //pid
            //级别判断
            if(+i.level === 3) return true;//项目级1 | 游戏级2 | 全局3
            return false;
        });
        if(data.length == 0) return null;
        //判断优先级
        data.sort(function(a,b){
            var ap = +a.priority, bp = +b.priority;
            //如果优先级相同，则判断level
            if(ap === bp){
                //level升序排列（项目级1-优先级最高 | 游戏级2 | 全局3-优先级最低）
                return (+a.level) - (+b.level);
            }
            //优先级降序排列，数字越大优先级越高
            return bp - ap;
        });
        return data[0];
    };
    //3、为DB实例添加一个回调函数
    DBServer.prototype.done = function(func){
        this.cbs.add(func);
        return this;
    };
    //获取 企鹅电竞视频挂件配置表 中符合要求的一条数据
    DBServer.prototype._getEgamePendantCfg = function(){
        var nowTimestamp = this.nowTimestamp || +new Date();
        var allForms = (window.AMD_67527 || {form:[]}).form;
        var egameForm = allForms[6];
        var featureForm = allForms[3];
        var thisFeature;
        var isAllow = false;
        //模版类型过滤（feature_type特征类型 - 0：aid，1：模版类型，2：是否实名认证）
        if(featureForm && featureForm.length && egameForm && egameForm.length){
            //根据当前模版类型 得出 table_id
            var templName = ',' + (window._templateid ? _templateid : '').toLowerCase() + ',';
            thisFeature = featureForm.filter(function(i){ 
                return i.feature_type == 1 && (',' + i.value + ',').toLowerCase().indexOf(templName) > -1; 
            });
            //根据当前模版AID类型 得出 table_id
            var aid = (window.page || {pcfg : {aid:''}}).pcfg.aid;
            if(!thisFeature || !thisFeature.length){
                thisFeature = featureForm.filter(function(i){ 
                    if(i.feature_type == 0 && i.value){
                        var list = i.value.toLowerCase().split(',').filter(function(j){ return j && aid.indexOf(j) > -1; });
                        if(list && list.length) return true;
                        return false;
                    }
                    return false;
                });
            }
            //判断：只有当前为游戏类型的模版才允许设置电竞挂件
            if(thisFeature instanceof Array && thisFeature.length && thisFeature[0].table_id == 1){
                isAllow = true;
            }
        }
        //当前模版类型符合
        var legalData = [];
        if(isAllow){
            var thisGame = ',' + (this.args.game||'').toLowerCase() + ',';
            var thisPid = ',' + this.args.pid + ',';
            //过滤合法数据
            legalData = egameForm.filter(function(i){
                //判断平台（全部=1 IOS=2 安卓=3 非IOS=4 非安卓=5）
                var plat = i.plat;
                if(!( plat == 1 || (plat == 2 && zUtil.isIOS()) || (plat == 3 && zUtil.isAndroid()) ))  return false;
                //判断时间有效性
                var st = +new Date((i.st||"2010-01-01 00:00:00").replace(/-/g, '/'));
                var et = +new Date((i.et||"2010-01-01 00:00:00").replace(/-/g, '/'));
                if(!( nowTimestamp > st && nowTimestamp < et )) return false;
                //判断项目黑名单
                var blockPids = (',' + i.bpid + ',').toLowerCase();
                if(blockPids.indexOf(thisPid) > -1) return false;
                //判断项目白名单
                var allowPids = (',' + i.apid + ',').toLowerCase();
                if(i.apid && allowPids.indexOf(thisPid) <= -1) return false;
                //判断游戏白名单
                var allowGame = (',' + i.game + ',').toLowerCase();
                if(allowGame.indexOf(thisGame) > -1) return true;
                return false;
            });
        }
        return (legalData instanceof Array && legalData[0]) || null;
    };
    DBServer.prototype.setEgamePendant = function(page){
        var cfgObj = this._getEgamePendantCfg();
        if(!cfgObj || typeof cfgObj !== "object" || $.isEmptyObject(cfgObj)){
            return;
        }
        page.require('EgamePendant');
    };

    //获取时间服务
    function TimeServer(){
        var _send = zHttp.send, me = this;
        this.cbs = new exports.CallBack();
        me.cbs.execute(+ new Date());
        // zHttp.send = function(url, fn){
        //     _send.call(zHttp, url, function(ret){
        //         // _send && (zHttp.send = _send); //还原 //不能还原，因为这样破坏了aop的替换链条
        //         // _send = null;
        //         me.cbs.execute(ret.time * 1000);
        //         fn && fn(ret);
        //     });
        // }
        // setTimeout(function(){
        //     me.cbs.execute(+ new Date());
        // }, 100);
    }
    TimeServer.prototype.done = function(func){
        this.cbs.add(func);
        return this;
    };

    //挂件
    qv.zero.Page.instance.addReadyFire(function(page){
        if(page && page.hasPendant === false){ //添加禁用的接口
            return;
        }
        var cb;
        if(exports.Shiming.isYX(page)){ //临时
            cb = exports.Shiming.hasShiming();
        } else {
            cb = new exports.CallBack();
            cb.execute({ret : 0, flag : 1});
        }
        var db = new DBServer({game : page.game, pid : page.jsonid, hasShiming : cb });
        var render;
        db.done(function (data) {
            if (data) {
                var url, icon_src;
                //系统平台判断（全部1 IOS2 AND3）
                if (data.plat == 2) {
                    url = data.url2 || data.url;//优先取IOS地址
                    icon_src = data.icon_src2 || data.icon_src;
                } else {
                    url = data.url || data.url2;//默认取安卓地址
                    icon_src = data.icon_src || data.icon_src2;
                }
                render = new PennantRender({
                    url: window.location.href,
                    jumpUrl: url,
                    imgUrl: icon_src,
                    style: data.style,
                    plat: data.plat,
                    page: page
                });
                var renderResult = render.render();
                //当无活动挂件时则渲染
                !renderResult && db.setEgamePendant(page);
            }else{
                db.setEgamePendant(page);
            }

        });
    });

 })(qv.zero, Zepto);