/**
* 长按开始与结束都会触发事件
* 默认开始300ms之后开始触发开始事件
* 移动或者结束长按会触发结束事件
* 设置 $.fn.beginEndTap.defaults.start 可以修改时长
* @author payneliu
* @required zepto
* @date 2016年2月23日18:52:00
**/
(function($){

	function beginEndTap(element){
		var startTx, startTy, lTapTimer, isSatrt = false /*是否开始*/, isEnd = false;
		element.on( 'touchstart', function( e ){
		  if( lTapTimer ){
		    clearTimeout( lTapTimer );
		    lTapTimer = null;
		  }
		  var touches = e.touches[0];
		  startTx = touches.clientX;
		  startTy = touches.clientY;

		  lTapTimer = setTimeout(function(){
		  	isSatrt = true;
		  	isEnd = false;
			element.trigger('zero:beginendtap_begin');
		  }, beginEndTap.defaults.start );

		  e.preventDefault();
		}, false );

		element.on( 'touchmove', function( e ){
		  var touches = e.touches[0],
		    endTx = touches.clientX,
		    endTy = touches.clientY;

		  if(Math.abs(endTx - startTx) > 5 || Math.abs(endTy - startTy) > 5){
		  	triggerEnd();
		  }
		}, false );

		element.on( 'touchend', function( e ){
		  triggerEnd();
		}, false );

		function triggerEnd(){
			if( lTapTimer ){
			    clearTimeout( lTapTimer );
			    lTapTimer = null;
			  }
			  if(isSatrt && !isEnd){
			  	isEnd = true;
			  	isSatrt = false;
			  	element.trigger('zero:beginendtap_end');
			  }
		}
	}

	//目标：$('.a').beginEndTap(function(){}, function(){});
	$.fn.beginEndTap = function(bhandler, ehandler){
		return this.each(function(){
			var that = $(this), bind = that.data('beginendtap');
			if(!bind){
				that.data('beginendtap', 1);
				beginEndTap(that);
			}
			bhandler && that.on('zero:beginendtap_begin', function(e){
				bhandler(e);
			});
			ehandler && that.on('zero:beginendtap_end', function(e){
				ehandler(e);
			});
		});
	};

	beginEndTap.defaults = $.fn.beginEndTap.defaults = {
		start : 300
	};
})(Zepto);