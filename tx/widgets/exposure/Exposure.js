/*
* 曝光组件 exposure
* @xiexun 2017-08-09
* @zero
*
*/
;(function(exports) {
  var defalut = {
    sel: '.editor-area>[data-exposure]',
    delay:　500
   };

  function Exposure() {
    this._switch = undefined;   // 定时器开关
    this.scrollTop = undefined; // 滚动条高度
  };

  /*
  * 初始化函数
  *　＠param {Object}
  *  - sel {String} 选择器
  *  - delay {Number} 延时时间
  */
  Exposure.prototype.init = function(params) {
    var _this = this;
    params = $.extend({}, defalut, params)
    this.screenHeight = window.innerHeight || window.screen.height;
    this.delay = params.delay;
    // 查找出 dom 结构并且排序
    this.arr = $(params.sel).sort(function(x, y) {
      return x.offsetTop - y.offsetTop
    });
    // 事件监听
    this.listen();
    this.scrollFn = function() {
      _this.star();        // 函数节流
    }
    // 滚动条监听
    $(window).scroll(this.scrollFn);
  };

  // 事件监听
  Exposure.prototype.listen = function() {
      var _this = this;
      page.on('exposure.export', function(data) {
          data && _this.report(data);
      })
  }

  //
  Exposure.prototype.star = function() {
    var _this = this;
    clearTimeout(this._switch); //
    this._switch = setTimeout(function() {
      _this.count();
    }, this.delay)
  };

  /*
  * 统计函数
  */
  Exposure.prototype.count = function() {
    // 假如全部完成曝光
    if(this.arr.length === 0) {
        $(window).unbind('scroll', this.scrollFn);    // 取消滚动条监听
        return;
    }
    var index = -1;
    var currentTop = window.pageYOffset + this.screenHeight;
    for(var i = 0, length = this.arr.length; i < length; i++) {
      // 曝光条件: dom高度 < 滚动条高度 + 可视区域高度
      if(this.arr[i].offsetTop > currentTop) {
        index = i;
        break;
      }
    };
    if(index === -1) {
      index = this.arr.length;  // 假如未赋值，则认为全部曝光
    } else if(index === 0) {
      return  // 滚动条回滚则不进行上报
    }
    var exportArr = this.arr.slice(0, index);
    this.arr = this.arr.slice(index, this.arr.length);  // 去除已上报的元素
    var modules = exportArr.map(function(index, item) {
        try {
          var params = JSON.parse(item.getAttribute('data-exposure') || '{}');
        } catch(err) {console.log(err)}
        return {
          oper_id: params.oper_id,
          oper_module: params.oper_module,
          module_type: params.module_type,
          module_cid: item.getAttribute('data-uid')
        }
    });
    this.report([].slice.call(modules));
  };

  // 上报函数
  Exposure.prototype.report = function(modules) {
    if(qv.zero.EZ) {
      qv.zero.EZ.report({
          oper_type: 8,
          page_deep: 100,
          page_height: this.scrollTop + this.screenHeight,
          modules: modules,
          request_type: 'post'
      });
    }
  };

  var exposure = exports.exposure = new Exposure();

  exposure.init();
})(qv.zero)
