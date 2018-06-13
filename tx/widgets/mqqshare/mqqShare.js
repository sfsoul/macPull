/**
 * @description 手Q分享组件
 * @author: breezefeng
 * @date 2015年11月18日 16:20:13
 *
 * 使用方法:
 * 在Page对象的afterInit方法里面调用：qv.zero.mqqShare.initShare();
 * 同时定义getShareData方法设置分享的相关参数，如下：
 * setShareData: function () {
        return {
            title: '分享标题',//分享标题
            desc: '分享内容', //分享内容
            imageUrl: '',    //分享图片
            shareUrl: location.href,//分享url
            sourceName: '游戏特权中心',//消息来源名称
            back: true//发送消息之后是否返回到web页面
        }
    }
 * 如果要拉起手Q分享面板，则可以直接调用qv.zero.showShare()方法
 *
 */
(function (exports) {
    var _private = {
        initShare: function (callback) {

            if (_private.initShareOK) return;

            // 手Q右上角分享
            _private.getEnvironmentType(function (type) {
                if (type) {
                    _private.setOnQQShareHandler(function (shareType) {
                        _private.showShareMenu(shareType, callback);
                    });
                }
            });

            _private.initShareOK = true;
        },
        getEnvironmentType: function (callback) {
            var isQQEnv = /(iPad|iPhone|iPod).*? (IPad)?QQ\/([\d\.]+)|\bV1_AND_SQI?_([\d\.]+)(.*? QQ\/([\d\.]+))?/.test(navigator.userAgent);
            if (typeof callback == 'function') {
                callback(isQQEnv);
            }
            return isQQEnv;
        },
        /**
         * 手Qwebview页面右上角分享监听
         * @param {Function} callback(type)
         */
        setOnQQShareHandler: function (callback) {
            mqq && mqq.ui && mqq.ui.setOnShareHandler(callback);
        },
        /**
         * 手Q分享
         * @param {Object} params
         * {String} title 必填，消息标题
         * {String} desc 必填，消息摘要。原 summary 参数，可以继续使用 summary
         * {Number} shareType 分享的目标类型，0：QQ好友；1：QQ空间；2：微信好友；3：微信朋友圈。默认为 0
         * {String} shareUrl 必填，点击消息后的跳转url。原 targetUrl 参数，可以继续使用 targetUrl
         * {String} imageUrl 必填，消息左侧缩略图url。图片推荐使用正方形，宽高不够时等比例撑满，不会变形。原 imageUrl 参数，可以继续使用 imageUrl
         * {Boolean} back  ( v5.0 v4.7.2 ) 发送消息之后是否返回到web页面，默认false，直接到AIO
         * {String} shareElement  ( v5.0 v5.0 ) 分享的类型，目前支持图文和音乐分享。news：图文分享类型，audio：音乐分享类型，video：视频分享类型。默认为news
         * {String} flashUrl  ( v5.0 v5.0 ) 如果分享类型是音乐或者视频类型，则填写流媒体url
         * {String} puin  ( v5.0 v5.0 ) 公众帐号uin，用于自定义结构化消息尾巴，只在公众账号分享的时候填写，若不是请不要填，当puin没有索引到本地记录，则显示sourceName字段的文本，若没有sourceName字段，则直接显示puin数字
         * {String} sourceName  ( v5.0 v5.0 ) 公众帐号昵称，仅当有puin字段并且puin没有索引到本地记录时生效
         * {String} appid  ( v5.0 v5.0 ) 来源 appid，在QQ互联申请的的 appid，如果有，可以填上
         * {String} sourceName 消息来源名称，默认为空，优先读取 appid 对应的名字，如果没有则读取 puin 对应的公众账号名称
         * {String} toUin  ( v5.0 v5.0 ) 分享给指定的好友或群，如果存在这个参数，则不拉起好友选择界面 (针对分享给好友)
         * {Number} uinType  ( v5.0 v5.0 ) 分享给指定的好友或群的uin类型: 0：好友；1：群 (针对分享给好友)
         * @param {Function} callback (result)
         * {Object} result
         * {Number} retCode 0：用户点击发送，完成整个分享流程；1：用户点击取消，中断分享流程
         *  Note  注意：分享给微信和朋友圈的消息获取不到回调，因此 callback 不会被执行
         */
        setQQShare: function (params, callback) {
            var shareParams = {
                'title': params.title || '',
                'desc': params.desc || ' ',
                'share_type': params.shareType || 0,
                'share_url': params.shareUrl || '',
                'image_url': params.imageUrl || '',
                'back': params.back || false,
                'shareElement': params.shareElement || 'news',
                'flash_url': params.flashUrl || '',
                'puin': 2747277822, //QQ手游的公众号puin,
                'sourceName': 'QQ手游',
                'appid': params.appid,
                'toUin': params.toUin || '',
                'uinType': params.uinType || 0
            };

            mqq && mqq.ui && mqq.ui.shareMessage(shareParams, callback);
        },
        showShareMenu: function (shareType, sharedCallback) {
            // 5.3.2 以下版本直接分享到QQ

            var params = zHttp.page.setShareData() || {};
            params.title = params.title || document.title;
            params.shareUrl = params.shareUrl || window.location.href;
            typeof params.back != 'boolean' && (params.back = true);

            params.shareType = shareType || 0;

            // 执行分享
            _private.setQQShare(params, function (json) {
                sharedCallback && sharedCallback(json, params.shareType);
            });
        },
        /**
         * 显示分享面板
         */
        showShare: function () {
            // 5.3.2 支持手动调用分享面板
            if (mqq.support && mqq.support('mqq.ui.showShareMenu')) {
                mqq.ui.showShareMenu();
            } else {
                _private.showShareMenu();
            }
        }
    };
    exports.mqqShare = {
        initShare: _private.initShare,
        showShare: _private.showShare
    }
})(qv.zero);