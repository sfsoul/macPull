/**
* 页面长按的插件
* 默认长按1S
* 设置 $.fn.longTap.defaults.delay 可以修改时长
* @author payneliu
* @required zepto
* @date 2016年2月23日17:27:00
**/
(function($){

	function longTap(element){
		var startTx, startTy, lTapTimer;
		element.on( 'touchstart', function( e ){
		  if( lTapTimer ){
		    clearTimeout( lTapTimer );
		    lTapTimer = null;
		  }
		  var touches = e.touches[0];
		  startTx = touches.clientX;
		  startTy = touches.clientY;

		  lTapTimer = setTimeout(function(){
			element.trigger('zero:longtap');
		  }, longTap.defaults.delay );

		  e.preventDefault();
		}, false );

		element.on( 'touchmove', function( e ){
		  var touches = e.touches[0],
		    endTx = touches.clientX,
		    endTy = touches.clientY;

		  if( lTapTimer && (Math.abs(endTx - startTx) > 5 || Math.abs(endTy - startTy) > 5) ){
		    clearTimeout( lTapTimer );
		    lTapTimer = null;
		  }
		}, false );

		element.on( 'touchend', function( e ){
		  if( lTapTimer ){
		    clearTimeout( lTapTimer );
		    lTapTimer = null;
		  }
		}, false );
	}

	//目标：$('.a').longTap(function(){});
	$.fn.longTap = function(handler){
		return this.each(function(){
			var that = $(this), bind = that.data('longtap');
			if(!bind){
				that.data('longtap', 1);
				longTap(that);
			}
			handler && that.on('zero:longtap', function(e){
				handler(e);
			});
		});
	};

	longTap.defaults = $.fn.longTap.defaults = {
		delay : 1000
	};

})(Zepto);