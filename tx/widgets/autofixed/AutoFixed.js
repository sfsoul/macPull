define('zero/widgets/autofixed/AutoFixed', ['et/zepto/zepto'], function(require, exports, module) {
    require('et/zepto/zepto');
    (function(){
        var autoScale = function () {
            setTimeout(function() {
                var winW = $(document).width();
                var scale = (winW/320).toString().substring(0, 6);
                var cssText = '-webkit-transform: scale('+ scale +');-webkit-transform-origin: top;';
                $('.act-bg,.act-content').attr('style', cssText);
            }, 300);
        };
        if ($(document).width() > 320) {
            autoScale();
        }
        window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", autoScale , false); //切换横竖屏
    })();
});