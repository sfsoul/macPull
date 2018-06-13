//宝箱cgi 的组件

// getChestDetail
//获取协助好友列表
/*qv.zero.giftCGI.getChestDetail({boxId: '3941-1212-4545-1212121', appId: '10021212'}, function(json){

 });*/

// grapChest
//攻击boss
/*qv.zero.giftCGI.grapChest({boxId: '3941-1212-4545-1212121', appId: '10021212'}, function(json){

 });*/

// pickChest
//提取协助奖励
/*qv.zero.giftCGI.pickChest({boxId: '3941-1212-4545-1212121', appId: '10021212', platId : '', area: '', partition:'', roleId:''}, function(json){

 });*/

// pickBonusChest
// 提取终极奖励
// actid 是宝箱的产品ID
// boxid 是宝箱ID
/*qv.zero.giftCGI.pickBonusChest({boxId: '3941-1212-4545-1212121', appId: '10021212', platId : '', area: '', partition:'', roleId:'', actid:''}, function(json){

 });*/

;
(function (exports, $) {

    var giftObj = exports.giftCGI = {};
    var platCode = /iphone|ipad|itouch/ig.test(window.navigator.userAgent) ? 2 : 1;
    //获取宝箱详情
    giftObj.getChestDetail = function (param, callback) {
        var data = {
            module: "gc_chest",
            method: "GetChestDetail",
            param: {
                "tt": platCode,
                "boxId": param.boxId,
                "appId": param.appId + ""         //需要字符串
            }
        };
        ajax(data, function (json) {
            if (json && 0 == json.result && json.data) {
                var rdata = json.data;
                rdata.nick = encodeHTML(rdata.nick);

                rdata.recvInfo.length && $.each(rdata.recvInfo, function (i, cur) {
                    if (cur && cur.des && cur.des[0]) {
                        cur.nick = encodeHTML(cur.nick);
                    }
                });
            }
            callback && callback(json);
        });
    };

    //抢宝箱
    giftObj.grapChest = function (param, callback) {
        var data = {
            module: "gc_chest",
            method: "GrapChest",
            param: {
                "tt": platCode,
                "boxId": param.boxId,
                "appId": param.appId + ""         //需要字符串
            }
        };
        ajax(data, function (json) {
            callback && callback(json);
        });
    };

    //提取宝箱
    giftObj.pickChest = function (param, callback) {
        var data = {
            module: "gc_chest",
            method: "PickChest",
            param: {
                "tt": platCode,
                "appId": param.appId,
                "boxId": param.boxId,
                "platId": param.platId,
                "area": param.areaId,
                "partition": +param.partition,
                "roleId": param.roleId
            }
        };
        ajax(data, function (json) {
            callback && callback(json);
        });
    };

    //提取BOSS宝箱
    giftObj.pickBonusChest = function (param, callback) {
        var data = {
            module: "gc_chest",
            method: "PickBonusChest",
            param: {
                "tt": platCode,
                "appId": param.appId,
                "boxId": param.boxId,
                "platId": param.platId,
                "area": param.areaId,
                "partition": +param.partition,
                "roleId": param.roleId,
                "actId": param.actId || 0
            }
        };
        ajax(data, function (json) {
            callback && callback(json);
        });
    };
    //上报数据
    giftObj.collect = function (params) {
        var data = $.extend({
            uin: zUtil.getUin() || "",
            timestamp: Date.now(),
            platid: /iphone|ipad|itouch/ig.test(window.navigator.userAgent) ? 0 : 1,
            sq_ver: (window.mqq && mqq.QQVersion) || '',
            device_type: '',
            net_type: '',
            resolution: window.innerWidth + '*' + window.innerHeight,
            ret_id: 0
        }, {
            src_id: params.srcId || "",
            module_id: params.moduleId || '',
            module_type: params.moduleType || '',
            oper_id: params.operId || '',
            oper_type: params.operType || '',
            obj_id: params.objId || 0,
            loc_id: params.locId || '',
            gameappid: params.gameAppid + "" || '',
            pay_way: params.payWay || "",
            pay_fee: params.payFee || "",
            goods_type: params.goodsType || "",
            goods_id: params.goodsId || "",
            item_type: params.itemType || "",
            item_id: params.itemId || "",
            item_num: params.itemNum || "",
            item_valid: params.itemValid || "",
            ext1: params.ext1 || "",
            ext2: params.ext2 || "",
            ext3: params.ext3 || "",
            ext4: params.ext4 || "",
            ext5: params.ext5 || "",
            ext6: params.ext6 || "",
            ext7: params.ext7 || "",
            ext8: params.ext8 || "",
            ext9: params.ext9 || "",
            ext10: params.ext10 || ""
        });
        setTimeout(function () {
            var paramArr = [];
            for (var i in data) {
                paramArr.push("&" + i + "=" + data[i]);
            }
            var url = "http://vp.qq.com/cgi-bin/report?r=reportData/doReport&tbName=dc00288&t=" + Math.random() + paramArr.join("");
            var img = new Image();
            img.src = url;

        }, 0);
    };
    function getCSRFToken() {
        var hash = 5381, str = zUtil.getcookie('skey') || "";
        for (var i = 0, len = str.length; i < len; ++i) {
            hash += (hash << 5) + str.charCodeAt(i);
        }
        return hash & 0x7fffffff;
    }

    function createUrl(route, params) {
        var defaultParams = $.extend(true, {}, parseQueryString(window.location.search));
        defaultParams.sid = zURL.get('sid');
        var domain = 'gift.gamecenter.qq.com';
        if (window.location.hostname.split('.').slice(-3).join('.') == '3g.qq.com') {
            domain = window.location.host;
        } else if (window.location.search.indexOf('&debug=') > -1 ||
            window.location.search.indexOf('?debug=') > -1) {
            domain = 'gamecentertest.cs0309.3g.qq.com';
        }
        return 'http://' + domain + route + '?' + $.param($.extend(true, {g_tk: getCSRFToken()}, defaultParams, params));
    }

    function parseQueryString(queryString) {
        var strArr = String(queryString).replace(/^[\?&#]/, '').replace(/&$/, '').split('&'),
            sal = strArr.length,
            i, j, ct, p, lastObj, obj, lastIter, undef, chr, tmp, key, value,
            postLeftBracketPos, keys, keysLen,
            fixStr = function (str) {
                return decodeURIComponent(str.replace(/\+/g, '%20'));
            },
            array = {};

        for (i = 0; i < sal; i++) {
            tmp = strArr[i].split('=');
            key = fixStr(tmp[0]);
            value = (tmp.length < 2) ? '' : fixStr(tmp[1]);

            while (key.charAt(0) === ' ') {
                key = key.slice(1);
            }
            if (key.indexOf('\x00') > -1) {
                key = key.slice(0, key.indexOf('\x00'));
            }
            if (key && key.charAt(0) !== '[') {
                keys = [];
                postLeftBracketPos = 0;
                for (j = 0; j < key.length; j++) {
                    if (key.charAt(j) === '[' && !postLeftBracketPos) {
                        postLeftBracketPos = j + 1;
                    }
                    else if (key.charAt(j) === ']') {
                        if (postLeftBracketPos) {
                            if (!keys.length) {
                                keys.push(key.slice(0, postLeftBracketPos - 1));
                            }
                            keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
                            postLeftBracketPos = 0;
                            if (key.charAt(j + 1) !== '[') {
                                break;
                            }
                        }
                    }
                }
                if (!keys.length) {
                    keys = [key];
                }
                for (j = 0; j < keys[0].length; j++) {
                    chr = keys[0].charAt(j);
                    if (chr === ' ' || chr === '.' || chr === '[') {
                        keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
                    }
                    if (chr === '[') {
                        break;
                    }
                }

                obj = array;
                for (j = 0, keysLen = keys.length; j < keysLen; j++) {
                    key = keys[j].replace(/^['"]/, '').replace(/['"]$/, '');
                    lastIter = j !== keys.length - 1;
                    lastObj = obj;
                    if ((key !== '' && key !== ' ') || j === 0) {
                        if (obj[key] === undef) {
                            obj[key] = {};
                        }
                        obj = obj[key];
                    }
                    else { // To insert new dimension
                        ct = -1;
                        for (p in obj) {
                            if (obj.hasOwnProperty(p)) {
                                if (+p > ct && p.match(/^\d+$/g)) {
                                    ct = +p;
                                }
                            }
                        }
                        key = ct + 1;
                    }
                }
                lastObj[key] = value;
            }
        }
        return array;
    }

    function encodeHTML(str) {
        if (typeof str == 'string') {
            var ar = ['&', '&amp;', '<', '&lt;', '>', '&gt;', '"', '&quot;'];
            for (var i = 0; i < ar.length; i += 2) {
                str = str.replace(new RegExp(ar[i], 'g'), ar[1 + i]);
            }
            return str;
        }
        return str;
    }

    function ajax(data, callback) {
        $.ajax({
            url: createUrl("/cgi-bin/gc_chest_fcgi"),
            data: {'tt': platCode, param: JSON.stringify({'testkey1': data})},
            xhrFields: {
                withCredentials: true
            },
            cache: false,
            dataType: 'json',
            timeout: 20000,
            success: function (json) {
                var result = json.data.testkey1.retBody;
                result.ret = result.result;
                callback && callback(result);
            },
            error: function () {
                callback && callback({
                    result: 5,
                    ret: 5,
                    msg: "网络异常，请稍后再试！"
                });
            }
        });
    }

})(qv.zero, Zepto);