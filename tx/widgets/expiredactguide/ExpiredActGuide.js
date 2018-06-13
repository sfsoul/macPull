(function(exports,$) {
	qv.zero.Page.instance.addReadyFire(function(){
		var me = this;
        function outDateReport (op, id,pl){
            $.ajax({dataType:'jsonp',url:'http://pf.vip.qq.com/common/oz.php?ver=3&actid=513486&opid='+ op +'&clk='+ id +'&pvsrc='+pl+'&labels=19,22&ext=&msg=&club=0&t='+(new Date()).getTime()});
        };
        function getUin() {
            if (/(\d+)/.test(zUtil.getcookie('uin'))) {
                return parseInt(RegExp.$1, 10);
            } else {
                return 0;
            }
        };
        function showOutDateDialog (desc, url){
            qv.zero.Login.ensure(function(){
                desc = desc || '我们特别为你准备了2015年最新活动，超给力福利等你来！';
                var msg = '<div> <div style="text-align: center;"><strong>当前活动已过期</strong></div> <div>{desc}</div> </div>', reportid = me.jsonid;
                desc = msg.replace('{desc}', desc);
                var dialog = new qv.zero.Dialog({
                    content : desc,
                    buttons : [{text : '取消'},{
                        text : '查看详情',
                        click : function() {
                            //上报点击按钮的pv
                            outDateReport(reportid,2,'h5');
                            go(url);
                        }
                    }]
                });
                dialog.show();
                //上报弹窗出现的pv
                outDateReport(reportid,1,'h5');
            });
        };
        function convertToMainConfig(config){ //主配置的转换
            return {
                name : config.f_1 || '',
                url_m : config.f_2 || '',
                desc_m : config.f_3 || '',
                subIndex : config.f_4 || '2',
                url_pc : config.f_5 || '',
                desc_pc : config.f_6 || ''
            };
        };
        function convertToSubConfig(config){ //子配置的转换
            return {
                name : config.f_1 || '',
                url : config.f_2 || '',
                desc : config.f_3 || ''
            };
        };
        function go(url){
            url && setTimeout(function(){
                if(window.mqq && (mqq.iOS && mqq.compare("4.5") >= 0 || mqq.android && mqq.compare("4.6") >= 0)){
                    mqq.ui.openUrl({url : url,target : 1})
                }else{
                    window.location.href = url;
                }
            }, 100);
        };

        function ConfigManager(configs){
            this.Configs = configs;
            var mainConfig = configs[1] || [];
            this.mainConfig = [];
            for (var i = 0, len = mainConfig.length; i < len; i++) {
                this.mainConfig.push(convertToMainConfig(mainConfig[i] || {}));
            };
        }
        ConfigManager.prototype.getGuide = function(page){
            var aid;
            if(page && page.pcfg && (aid = page.pcfg.aid) && (~aid.indexOf('.y.') || ~aid.indexOf('.yx.') || ~aid.indexOf('.youxi.')) &&
               window.location.href.indexOf('://youxi.vip.qq.com/m/act/') > -1){
                return new ExpiredGuide_youxi(this.mainConfig[0] ,page, this.Configs);
            } else if(page && page.pcfg && page.pcfg.bus && page.pcfg.bus == 6){
                return new ExpiredGuide_zengzhiqd(this.mainConfig[2] ,page, this.Configs);
            } else {
                return new ExpiredGuide_other(this.mainConfig[1] ,page, this.Configs);
            }
        };

        function ExpiredGuide_youxi(mainconfig, page, configs){ //游戏的引导对象
            this.mainconfig = mainconfig;
            this.page = page;
            this.subConfig = [];
            this.game = (this.page && this.page.pcfg && this.page.pcfg.g) || '';
            var subconfig = configs[mainconfig.subIndex];
            for (var i = 0, len = subconfig.length; i < len; i++) {
                this.subConfig.push(convertToSubConfig(subconfig[i] || {}));
            };
        }
        ExpiredGuide_youxi.prototype.done = function() {
            var guideCfg = this.getConfig(this.game);
            qv.zero.LoadingMark.hide();
            if(!this.game || !guideCfg){ //默认的引导
                guideCfg = {
                    desc : this.mainconfig.desc_m,
                    url : this.mainconfig.url_m
                };
            } 
            guideCfg.url && showOutDateDialog(guideCfg.desc, guideCfg.url);
        };
        ExpiredGuide_youxi.prototype.getConfig = function(game){
            var configs = this.subConfig;
            for (var i = configs.length - 1; i >= 0; i--) {
                if(configs[i].name.toLowerCase() === game.toLowerCase()){
                    return configs[i];
                }
            };
        };

        function ExpiredGuide_other(mainconfig, page, configs){ //其他类的引导对象
            this.mainconfig = mainconfig || {};
            this.url = this.mainconfig.url_m || '';
            this.desc = this.mainconfig.desc_m || '';
            this.page = page;
        }
        ExpiredGuide_other.prototype.done = function() {
            this.url && showOutDateDialog(this.desc, this.url);
        };

        function ExpiredGuide_zengzhiqd(mainconfig, page, configs){ //增值渠道的引导对象
            this.mainconfig = mainconfig || {};
            this.url = this.mainconfig.url_m || '';
            this.desc = this.mainconfig.desc_m || '';
            this.page = page;
        }
        ExpiredGuide_zengzhiqd.prototype.done = function() {
            this.url && showOutDateDialog(this.desc, this.url);
        };
        function executeExpiredGuide(page){
            if(typeof(page.ExpiredGuideHandle) === 'function' && 
                page.ExpiredGuideHandle() === false){ //预留钩子，方便自定义过期处理,返回false 即可不会走这里的逻辑
                return;
            }
            page.require('http://imgcache.gtimg.cn/ACT/vip_act/act_data/22892.json.js', function(){ //加载数据
                if(window.AMD_22892){
                    var configs = AMD_22892.form, mainConfig = configs[1], configManager = new ConfigManager(configs), expiredGuide;
                    if(mainConfig){
                        expiredGuide = configManager.getGuide(page);
                        expiredGuide.done();
                    }
                }
            });
        }

        var cfg = window['AMD_' + me.jsonid].cfg;
        zHttp.send({_c : 'util'},function(json){
            me.page_open_time = json.time * 1000; //页面打开的时间
            if(json.time > cfg.et) {
                executeExpiredGuide(me);
            }
        });
        zUtil.require('aop', function(){ 
            zAOP.intercept_a_s('request', { after : function(param){ //拦截request方法
                var json = param.args[0];
                if(json.actid && json.ret == 10004){
                    executeExpiredGuide(me);
                    return false;
                }
            }}, zHttp, 1);
        });
	})
})(qv.zero, Zepto);