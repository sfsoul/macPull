/**
 * Created by v_czjzhang on 2018/4/24.
 */
page.addReadyFire(function () {
    zHttp.loadScript('http://game.gtimg.cn/images/js/su/danMu.beta.min.js', function () {
        zHttp.loadScript('http://imgcache.gtimg.cn/c/=/club/mobile_web/zepto.fx.js', function () {
            var barrages = document.querySelectorAll('[data-bus="barrage"]');

            barrages.forEach(function (dom) {
                var args = JSON.parse(dom.getAttribute('data-args'));
                var comments = args.comments || [];
                var flyTime = args.flyTime;
                var colors = [args.fontColor];

                new danMu({
                    device: 'm',
                    stage: $(dom),
                    comments: comments,
                    danMuHtml: "<span>{comment}</span>",
                    colors: colors,
                    flyTime: +flyTime,
                    timeInterval: 1200,
                    randomSort: true
                });
            });
        });
    });
});