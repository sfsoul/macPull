/**
 * 设置气泡、挂件、表情等个性装扮
 * @class qv.zero.deckOP
 * @author payneliu
 * @description 设置气泡、挂件、表情等个性装扮
 * @version 1.0
 * @time 2015-07-1
 * @name qv.zero.deckOP
 * @requires Zepto
 * eg: qv.zero.deckOP.setBubble(251, function(){})
 * eg: qv.zero.deckOP.setPendant(338, function(){})
 * eg: qv.zero.deckOP.setEmoji(11359, function(){})
**/
(function (exports, $) {
	var defaultParam = {
    	uin : zUtil.getUin(),
		sid : zURL.get('sid'),
		g_tk : getToken(),
		client : (mqq.iOS ? 'iphoneQQ' : 'androidQQ'),
		platformId : (mqq.iOS ? '3' : '2'),
		version : mqq.QQVersion,
		format: 'jsonp',
		timeout : 50
    };
    //获取长token
	function getCSRFToken(){
        var salt = 5381, sid = zUtil.getcookie('skey') || qv.zero.URL.get('sid') || '';
		var md5key ='tencentQQVIP123443safde&!%^%1282';
		//var key = zHttp.page.onlySid ? sid : ( this.getcookie('skey') || sid || '');
		var key = sid;
		var hash = [],
		ASCIICode;
		hash.push((salt << 5));
		for (var i = 0, len = key.length; i < len; ++i) {
			ASCIICode = key.charAt(i).charCodeAt(0);
			hash.push((salt << 5) + ASCIICode);
			salt = ASCIICode;
		}
		return this.getMD5(hash.join('') + md5key);
    }
    //获取短token
    function getToken (){
		var hash = 5381, str = zUtil.getcookie('skey') || "";
        for (var i = 0, len = str.length; i < len; ++i) {
            hash += (hash << 5) + str.charCodeAt(i);
        }
        return hash & 0x7fffffff;
	}
    function getParam(opt){
    	return $.extend(defaultParam, opt);
    }
    function Success(data, succ){
    	if(typeof succ === 'function'){
    		succ(data);
    	} else if(data && (data.ret != 0 || data.data.ret != 0)) {
			zMsg.show("系统繁忙，请稍候重试！");
		}
    }
    function Error(error){
    	if(typeof error === 'function'){
			error();
		} else {
			zMsg.show('哎呀~失败了，再试一次吧~');
		}
    }
    var deckOP = exports.deckOP = {};
    //设置气泡 id: 为气泡的id
    deckOP.setBubble = function(id, success, error){
		$.ajax({
			url: '//g.vip.qq.com/bubble/setup', 
			data: getParam({'id' : id}), 
			dataType: 'jsonp', 
			cache: false,
			success : function(data){//{"data":{"msg":"ok","ret":0,"url":""},"msg":"操作成功","ret":0}
				Success(data, success);
			},
			error : function(){
				Error(error);
			}
		});
    };
    //设置挂件 id ： 挂件的id
    deckOP.setPendant = function(id, success, error){
		$.ajax({
			url: '//g.vip.qq.com/cgi-bin/addon/setup', 
			data: getParam({'id' : id, 'dataVersion' : defaultParam.version}),
			dataType: 'jsonp', 
			cache: false,
			success : function(data){//{"data":{"msg":"ok","ret":0,"url":""},"msg":"操作成功","ret":0}
				Success(data, success);
			},
			error : function(){
				Error(error);
			}
		});
    };

    //设置表情 id ： 表情的id
    deckOP.setEmoji = function(id, success, error){
    	$.ajax({
			url: 'http://logic.content.qq.com/emoji/freeAdd', 
			data: getParam({'tabId' : id}),
			dataType: 'jsonp', 
			cache: false,
			success : function(data){//{"data":{"msg":"ok","ret":0,"url":""},"msg":"操作成功","ret":0}
				Success(data, success);
			},
			error : function(){
				Error(error);
			}
		});
    };

    deckOP.setBackground = function(id, success, error){
    	$.ajax({
			url: 'http://logic.content.qq.com/background/bg_setup_check', 
			data: getParam({'id' : id, 'platform': defaultParam.platformId, 'qqVersion' : defaultParam.version}),
			dataType: 'jsonp', 
			cache: false,
			success : function(data){//{"data":{"msg":"","ret":1004,"url":""},"msg":"操作成功","ret":0}
				Success(data, success);
			},
			error : function(){
				Error(error);
			}
		});
    };
})(qv.zero, Zepto);