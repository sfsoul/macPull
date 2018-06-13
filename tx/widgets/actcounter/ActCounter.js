/**
 * 统计抽奖或预约的人数
 * @class qv.zero.countnumber
 * @author yandeng
 * @description 统计抽奖或预约的人数
 * @version 1.0
 * @time 2014-08-125
 * @name qv.zero.countnumber
 * @requires jQuery
**/
(function(exports,$) {
	ActCounter = {
		/**
		 * @显示统计
		 * @for qv.zero.countnumber
		 * @method show
		 * @param {Number} config.actid 传入需要统计的活动号
		 * @param {String} config.pageid  显示数字的页面id
		 * @example
		 * qv.zero.ActCounter.show({
		 *		page : page,
		 *		actid : 26654,
		 *		pageid : '#lottnumber' 
		 *	});
		**/
		show : function (config) {
			this.actid = config.actid;
			this.pageid = config.pageid || '#lottnumber';
			this.page = config.page;
			this.count();
		},
		count : function () {
			var me = this;
			zHttp.send({_c : 'load',actids : this.actid,sid :this.page.getSid()},function (json) {
				if(json && json.ret == 0){
					try{
						var total = json.data[me.actid]._cnt.total;
						$(me.pageid).text(total);
					}catch(e){}
				}
			});
		}
	}
	
	exports.ActCounter = ActCounter;
})(qv.zero,Zepto);