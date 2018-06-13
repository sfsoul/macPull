/*
* 模版模块曝光监控上报 ModExposureReport
* 	依赖 qv.zero.SetOnCloseHandler、qv.zero.EZ
*	回调事件名name=moduleExpoosure | 优先级level=10
* 	上报的节点特征为 
*	1、模块：			<div class="act-mod" 	data-modid="1" data-expid="11"	data-clkid="111" data-modtype="1111" ></div>
*	2、模块内的某节点：	<div class="act-mod"><a data-modid="1" data-expid="11"	data-clkid="111" data-modtype="1111" ></a></div>
*	3、自定义按钮：		<div class="act-mod"><a data-modid="1" data-expid="11"	data-clkid="111" data-modtype="1111" class="custom-btn" ></a></div>
*	字段映射：
*	{ 
*		oper-module : modid,		//modid固定分配
*		moduletype : modtype,		//modtype由业务动态设置
*		oper_id : expid | clkid 	//expid固定分配(曝光行为)，clikid由业务动态设置(点击行为)
*	}
*/
;(function(exports){
	zUtil.require(['SetOnCloseHandler','AmsEz'],function(){	
		var soch = new qv.zero.SetOnCloseHandler({'name':'moduleExpoosure', 'level':10, 'handler': function(){
				exposureRequest(maxScrollPosition);
			}});
	 	var $window = $(window),
	 		winHeight = +$window.height(), //屏幕高度
	 		documentHeight = $('div.act-content').height(),//文档高度
	 		maxScrollPosition = winHeight, //用户浏览最大深度
	 		scrollDounce = debounce( scrollViewReport, 500),//节流后的监听函数
	 		now = (Date.now || function() { return new Date().getTime(); });
	 	$window.on('scroll',scrollDounce);//绑定滚动事件
	 	//监听滚动事件上报
	 	function scrollViewReport(){
	 		if( maxScrollPosition >= documentHeight ){
	 			//全部上报完毕解绑滚动条监听
	 			$window.off('scroll',scrollDounce);
	 			//console.log('Has reached the bottom of the screen!')
	 			return;	
	 		}
	 		var scrollPosition = ($window.scrollTop()-0+winHeight);//当前  滚动条位置
	 		if( scrollPosition>maxScrollPosition ){
	 			maxScrollPosition = scrollPosition;
	 		}
	 		//console.log( '当前最大浏览深度：',maxScrollPosition );
	 	}
	 	/*获取曝光dom的位置
			data-modid = oper_module
			data-modtype = module_type
			data-operid = oper_id
			data-createtime = module_cid
	 	*/
	 	function getDomPosition(maxScrollPosition){
	 		var mods = $('div.act-wrapper.main > div.act-content > div.act-mod , div.act-wrapper.main > div.act-top div.act-mod'), modIsStatic, $btns, $btn, $mod, modId, modType, btnPosition, btnTop, modPosition=0, modPositionArr=[0], exposureDomArr=[], modHeight=0, modCreateTime, btnCreateTime;
	 		$.each(mods,function(modIndex,mod){
	 			$mod = $(mod);
	 			modIsStatic = +$mod.data('isstatic')===1; //是否是固定模块(即100%曝光模块)
	 			modHeight = ( $mod.css('display') == 'none' ) ? 0 : (+$mod.height()||0);//每个模块的高度，隐藏模块为0
	 			modPosition = modPositionArr[modIndex];//保存当前模块距离文档顶部的高度
	 			modPositionArr.push( modPosition+modHeight );//将本模块的高度和上一个模块的顶部距离 相加 得到下一个模块的顶部距离
	 			//判断模块是否曝光 偏移量为10
	 			if( (!modIsStatic && modPosition+10 >= maxScrollPosition) || modHeight==0){
	 				//模块位置+偏移量 大于 滚动位置 说明还没滚动到该模块 || 隐藏模块不曝光
	 				return true;
	 			}
	 			modId = $mod.data('modid') || 0;
	 			moduleType = $mod.data('modtype') || 0;
	 			modCreateTime = $mod.data('createtime') || $mod.parents('.act-top').data('createtime') || 0;
	 			//判断模块是否上报
	 			if( modId ){
	 				exposureDomArr.push({ oper_id: $mod.data('operid')||0, oper_module:modId,  module_type:moduleType, module_cid:modCreateTime, loc_id:modPosition+","+0 }); //, el : mod
	 			}
	 			//遍历模块内的上报按钮（自定义按钮 && 显示声明上报按钮）
	 			$btns = $mod.find('[data-modid]');
	 			$btns.each(function(btnIndex,btn){
	 				$btn = $(btn);
	 				btnTop = parseInt($btn.css('top')) || 0;
	 				btnPosition = modPosition+btnTop;
	 				btnCreateTime = $btn.data('createtime') || modCreateTime;
	 				//判断按钮是否曝光，偏移量为10
	 				if( !modIsStatic && btnPosition+10 >= maxScrollPosition ){
	 					return true;
	 				}
	 				exposureDomArr.push({ oper_id: $btn.data('operid')||0, oper_module:$btn.data('modid'), module_type:$btn.data('modtype')||0, module_cid:btnCreateTime, loc_id:btnPosition+','+(parseInt($btn.css('left')) || 0) }); //, el : btn
	 			})
	 		});
			return exposureDomArr;
	 		//return exposureDomArr.sort(function(a,b){ return a.top - b.top});
	 	}
		var exposureData = {
			oper_type : 8,
			page_deep : 0,//用户浏览深度
			page_height : documentHeight,
			modules : []//曝光的节点 [{module_id : 358,module_cid : 179039338539,module_type : 0,loc : '20,34'},{module_id : 359,module_cid : 179039338540,module_type : 0,loc : '40,55'}];
		};
	 	function exposureRequest( maxScrollPosition ){
	 		exposureData.page_deep = maxScrollPosition;
	 		exposureData.modules = getDomPosition(maxScrollPosition);
	 		exports.EZ.report(exposureData);
	 		setTimeout(function(){
	 			soch.done();
	 		},500);
	 	}
	 	function debounce(func, wait, immediate) {
		    var timeout, args, context, timestamp, result;
		    var later = function() {
		      var last = now() - timestamp;
		      if (last < wait && last >= 0) {
		        timeout = setTimeout(later, wait - last);
		      } else {
		        timeout = null;
		        if (!immediate) {
		          result = func.apply(context, args);
		          if (!timeout) context = args = null;
		        }
		      }
		    };
		    return function() {
		      context = this;
		      args = arguments;
		      timestamp = now();
		      var callNow = immediate && !timeout;
		      if (!timeout) timeout = setTimeout(later, wait);
		      if (callNow) {
		        result = func.apply(context, args);
		        context = args = null;
		      }
		      return result;
		    };
		};
	});
})(qv.zero);