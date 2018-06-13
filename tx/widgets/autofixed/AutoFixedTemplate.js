;(function () {//模版专用
	var winW = document.documentElement.clientWidth;
	function autoScale() {
		setTimeout(function() {
			var wrapperC = document.querySelector('.act-wrapper.main'), wrapper, contentC = document.querySelectorAll('div.act-content'), scale, loading;
			if(wrapperC && contentC){
				wrapper = wrapperC.style;
				if(winW > 320){
					scale = (winW/320).toFixed(4);
					var cssText = ';transform:scale('+ scale +');-webkit-transform: scale('+ scale +');transform-origin:top;-webkit-transform-origin: top;';
					Array.prototype.forEach.call(contentC, function(i, j){ i.style.cssText += cssText; });
				}
				loading = document.querySelector('#loading');
				if(loading){
					loading.style.cssText += ';display:none;opacity:0';
				}
				wrapper.opacity = 1;
			}
		}, 300);
	};	
	autoScale();
	window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", autoScale , false); //切换横竖屏
})();