(function(){
	/**
	use like : 
	qv.zero.PublicHeader.show({
		page : this,
		bgPic : 'http://imgcache.gtimg.cn/vipstyle/game/act/20140630_qmsh/header.jpg',
		countBtn : 25685
	});
	**/
	qv.zero.PublicHeader = {};
	var css = '.act-top{height: 229px;}' + '.xf{position:absolute;width:320px;height:42px;}'+
				'.xf .logo{width:95px;padding:7px 0 0 3px;}'+
				'.xf .tips{top:14px;color:#ffffff;font-size:11px;width:295px;text-align: center}'+
				'.xf .mod-style-ks{position:absolute;left:229px;top:7px;width:85px;height:29px;;background-size:85px auto;background-repeat:no-repeat; display:block}'+
				'.xf .notes{position:absolute;top:41px;height:24px;}'+
				'.xf .notes a{display:block;width:320px;height:24px;color:#2d2155;font-size:12px;text-indent:13px;line-height:24px;background:#e1e084;}'+
				'.xf .notes a span{float:right;padding-right:7px;}';
	zUtil.appendStyle(css);
	marqueeContent= [];
	marqueeInterval= []; //定义一些常用而且要经常用到的变量
	marqueeId=0;
	marqueeHeight=24;
	marqueeBox =null;
	function writeHeader(config) {
		var tip = config.tip;	
		if(tip){
			for (var i = 0, len = tip.length; i < len; i++) {
				marqueeContent.push('<a href="#" onclick="' + tip[i].click + ';return false;" >' + tip[i].text + '<span> > </span></a>');
			};
		}
		var headHtml = '<section class="act-top"><div class="xf">'+
					(function (){
						if (config.bgPic) {
							return '<img src="' +config.bgPic+ '" width="320"  /><a id="hStartGame" href="javascript:void(0)" class="mod-style-ks"></a>'
						} else {
							return '';
						}
					})() +(function(){
						if(tip){
							return '<div class="notes">' + 
									'<div id="marqueeBox" style="overflow:hidden;height:'+marqueeHeight+'px" '+
									'onmouseover="qv.zero.PublicHeader.stop()" '+
									'onmouseout="qv.zero.PublicHeader.start()">'+
									'<div>'+marqueeContent[0]+'</div></div>' +
									'</div>';
						} else {
							return '';
						}
					})() +
				'</div></section>';
		if ($('.act-content')) {
			$('.act-content').prepend(headHtml);
		}
		marqueeBox  = document.getElementById('marqueeBox');
		if (marqueeBox) {
			init();
		}
		startGame(config.page,config);
		
	}
	qv.zero.PublicHeader.stop = function () {
		clearInterval(marqueeInterval[0]);
	}
	qv.zero.PublicHeader.start = function() {
		marqueeInterval[0] = setInterval(function(){
			var str=marqueeContent[marqueeId];
			marqueeId++;
			if(marqueeId>=marqueeContent.length) marqueeId=0;
			if(marqueeBox.childNodes.length==1) {
				var nextLine=document.createElement('DIV');
				nextLine.innerHTML=str;
				marqueeBox.appendChild(nextLine);
			}else{
				marqueeBox.childNodes[0].innerHTML=str;
				marqueeBox.appendChild(marqueeBox.childNodes[0]);
				marqueeBox.scrollTop=0;
			}
			clearInterval(marqueeInterval[1]);
			marqueeInterval[1]=setInterval("qv.zero.PublicHeader.marquee()",10);
		}, 3000);
	}
	qv.zero.PublicHeader.marquee = function() {
		marqueeBox.scrollTop++;
		if(marqueeBox.scrollTop%marqueeHeight==marqueeHeight){
			clearInterval(marqueeInterval[1]);
		}
	}
	function init(){
		marqueeId++;
		qv.zero.PublicHeader.start();
	}
	function startGame(context,config) {
		$('#hStartGame').click(function (e) {
			e.preventDefault();
			if (config.countBtn) {
				zHttp.syrequest(config.countBtn,function () {} ,true);
			}
			zUtil.require('SQGameManager',function(){
    			qv.zero.SQGameManager.start(context);	
    		});
    		
		});

	}
	
	qv.zero.PublicHeader.show = writeHeader;
})();