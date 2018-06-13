(function() {
var $, OriDomi, addStyle, anchorList, anchorListH, anchorListV, baseName, capitalize, cloneEl, createEl, css, defaults, defer, elClasses, getGradient, hideEl, isSupported, k, libName, noOp, prefixList, prep, ref, showEl, styleBuffer, supportWarning, testEl, testProp, v,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

libName = 'OriDomi';

isSupported = true;

supportWarning = function(prop) {
  if (typeof console !== "undefined" && console !== null) {
    console.warn(libName + ": Missing support for `" + prop + "`.");
  }
  return isSupported = false;
};

testProp = function(prop) {
  var full, j, len1, prefix;
  for (j = 0, len1 = prefixList.length; j < len1; j++) {
    prefix = prefixList[j];
    if ((full = prefix + capitalize(prop)) in testEl.style) {
      return full;
    }
  }
  if (prop in testEl.style) {
    return prop;
  }
  return false;
};

addStyle = function(selector, rules) {
  var prop, style, val;
  style = "." + selector + "{";
  for (prop in rules) {
    val = rules[prop];
    if (prop in css) {
      prop = css[prop];
      if (prop.match(/^(webkit|moz|ms)/i)) {
        prop = '-' + prop;
      }
    }
    style += (prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()) + ":" + val + ";";
  }
  return styleBuffer += style + '}';
};

getGradient = function(anchor) {
  return css.gradientProp + "(" + anchor + ", rgba(0, 0, 0, .5) 0%, rgba(255, 255, 255, .35) 100%)";
};

capitalize = function(s) {
  return s[0].toUpperCase() + s.slice(1);
};

createEl = function(className) {
  var el;
  el = document.createElement('div');
  el.className = elClasses[className];
  return el;
};

cloneEl = function(parent, deep, className) {
  var el;
  el = parent.cloneNode(deep);
  el.classList.add(elClasses[className]);
  return el;
};

hideEl = function(el) {
  return el.style[css.transform] = 'translate3d(-99999px, 0, 0)';
};

showEl = function(el) {
  return el.style[css.transform] = 'translate3d(0, 0, 0)';
};

prep = function(fn) {
  return function() {
    var a0, a1, a2, anchor, angle, opt;
    if (this._touchStarted) {
      return fn.apply(this, arguments);
    } else {
      a0 = arguments[0], a1 = arguments[1], a2 = arguments[2];
      opt = {};
      angle = anchor = null;
      switch (fn.length) {
        case 1:
          opt.callback = a0;
          break;
        case 2:
          if (typeof a0 === 'function') {
            opt.callback = a0;
          } else {
            anchor = a0;
            opt.callback = a1;
          }
          break;
        case 3:
          angle = a0;
          if (arguments.length === 2) {
            if (typeof a1 === 'object') {
              opt = a1;
            } else if (typeof a1 === 'function') {
              opt.callback = a1;
            } else {
              anchor = a1;
            }
          } else if (arguments.length === 3) {
            anchor = a1;
            if (typeof a2 === 'object') {
              opt = a2;
            } else if (typeof a2 === 'function') {
              opt.callback = a2;
            }
          }
      }
      if (angle == null) {
        angle = this._lastOp.angle || 0;
      }
      anchor || (anchor = this._lastOp.anchor);
      this._queue.push([fn, this._normalizeAngle(angle), this._getLonghandAnchor(anchor), opt]);
      this._step();
      return this;
    }
  };
};

defer = function(fn) {
  return setTimeout(fn, 0);
};

noOp = function() {};

$ = (typeof window !== "undefined" && window !== null ? (ref = window.$) != null ? ref.data : void 0 : void 0) ? window.$ : null;

anchorList = ['left', 'right', 'top', 'bottom'];

anchorListV = anchorList.slice(0, 2);

anchorListH = anchorList.slice(2);

testEl = document.createElement('div');

styleBuffer = '';

prefixList = ['Webkit', 'Moz', 'ms'];

baseName = libName.toLowerCase();

elClasses = {
  active: 'active',
  clone: 'clone',
  holder: 'holder',
  stage: 'stage',
  stageLeft: 'stage-left',
  stageRight: 'stage-right',
  stageTop: 'stage-top',
  stageBottom: 'stage-bottom',
  content: 'content',
  mask: 'mask',
  maskH: 'mask-h',
  maskV: 'mask-v',
  panel: 'panel',
  panelH: 'panel-h',
  panelV: 'panel-v',
  shader: 'shader',
  shaderLeft: 'shader-left',
  shaderRight: 'shader-right',
  shaderTop: 'shader-top',
  shaderBottom: 'shader-bottom'
};

for (k in elClasses) {
  v = elClasses[k];
  elClasses[k] = baseName + "-" + v;
}

css = new function() {
  var j, key, len1, ref1;
  ref1 = ['transform', 'transformOrigin', 'transformStyle', 'transitionProperty', 'transitionDuration', 'transitionDelay', 'transitionTimingFunction', 'perspective', 'perspectiveOrigin', 'backfaceVisibility', 'boxSizing', 'mask'];
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    key = ref1[j];
    this[key] = key;
  }
  return this;
};

(function() {
  var key, p3d, prefix, ref1, styleEl, value;
  for (key in css) {
    value = css[key];
    css[key] = testProp(value);
    if (!css[key]) {
      return supportWarning(value);
    }
  }
  p3d = 'preserve-3d';
  testEl.style[css.transformStyle] = p3d;
  if (testEl.style[css.transformStyle] !== p3d) {
    return supportWarning(p3d);
  }
  css.gradientProp = (function() {
    var hyphenated, j, len1, prefix;
    for (j = 0, len1 = prefixList.length; j < len1; j++) {
      prefix = prefixList[j];
      hyphenated = "-" + (prefix.toLowerCase()) + "-linear-gradient";
      testEl.style.backgroundImage = hyphenated + "(left, #000, #fff)";
      if (testEl.style.backgroundImage.indexOf('gradient') !== -1) {
        return hyphenated;
      }
    }
    return 'linear-gradient';
  })();
  ref1 = (function() {
    var grabValue, j, len1, plainGrab, prefix;
    for (j = 0, len1 = prefixList.length; j < len1; j++) {
      prefix = prefixList[j];
      plainGrab = 'grab';
      testEl.style.cursor = (grabValue = "-" + (prefix.toLowerCase()) + "-" + plainGrab);
      if (testEl.style.cursor === grabValue) {
        return [grabValue, "-" + (prefix.toLowerCase()) + "-grabbing"];
      }
    }
    testEl.style.cursor = plainGrab;
    if (testEl.style.cursor === plainGrab) {
      return [plainGrab, 'grabbing'];
    } else {
      return ['move', 'move'];
    }
  })(), css.grab = ref1[0], css.grabbing = ref1[1];
  css.transformProp = (prefix = css.transform.match(/(\w+)Transform/i)) ? "-" + (prefix[1].toLowerCase()) + "-transform" : 'transform';
  css.transitionEnd = (function() {
    switch (css.transitionProperty.toLowerCase()) {
      case 'transitionproperty':
        return 'transitionEnd';
      case 'webkittransitionproperty':
        return 'webkitTransitionEnd';
      case 'moztransitionproperty':
        return 'transitionend';
      case 'mstransitionproperty':
        return 'msTransitionEnd';
    }
  })();
  (function(i) {
    var anchor, j, len1, ref2;
    addStyle(elClasses.active, {
      backgroundColor: i('transparent'),
      backgroundImage: i('none'),
      boxSizing: i('border-box'),
      border: i('none'),
      outline: i('none'),
      padding: i('0'),
      transformStyle: i(p3d),
      mask: i('none'),
      position: 'relative'
    });
    addStyle(elClasses.clone, {
      margin: i('0'),
      boxSizing: i('border-box'),
      overflow: i('hidden'),
      display: i('block')
    });
    addStyle(elClasses.holder, {
      width: '100%',
      position: 'absolute',
      top: '0',
      bottom: '0',
      transformStyle: p3d
    });
    addStyle(elClasses.stage, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      transform: 'translate3d(-9999px, 0, 0)',
      margin: '0',
      padding: '0',
      transformStyle: p3d
    });
    ref2 = {
      Left: '0% 50%',
      Right: '100% 50%',
      Top: '50% 0%',
      Bottom: '50% 100%'
    };
    for (k in ref2) {
      v = ref2[k];
      addStyle(elClasses['stage' + k], {
        perspectiveOrigin: v
      });
    }
    addStyle(elClasses.shader, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      opacity: '0',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      transitionProperty: 'opacity'
    });
    for (j = 0, len1 = anchorList.length; j < len1; j++) {
      anchor = anchorList[j];
      addStyle(elClasses['shader' + capitalize(anchor)], {
        background: getGradient(anchor)
      });
    }
    addStyle(elClasses.content, {
      margin: i('0'),
      position: i('relative'),
      float: i('none'),
      boxSizing: i('border-box'),
      overflow: i('hidden')
    });
    addStyle(elClasses.mask, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      overflow: 'hidden',
      transform: 'translate3d(0, 0, 0)',
      outline: '1px solid transparent'
    });
    addStyle(elClasses.panel, {
      width: '100%',
      height: '100%',
      padding: '0',
      position: 'absolute',
      transitionProperty: css.transformProp,
      transformOrigin: 'left',
      transformStyle: p3d
    });
    addStyle(elClasses.panelH, {
      transformOrigin: 'top'
    });
    addStyle(elClasses.stageRight + " ." + elClasses.panel, {
      transformOrigin: 'right'
    });
    return addStyle(elClasses.stageBottom + " ." + elClasses.panel, {
      transformOrigin: 'bottom'
    });
  })(function(s) {
    return s + ' !important';
  });
  styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  if (styleEl.styleSheet) {
    styleEl.styleSheet.cssText = styleBuffer;
  } else {
    styleEl.appendChild(document.createTextNode(styleBuffer));
  }
  return document.head.appendChild(styleEl);
})();

defaults = {
  vPanels: 3,
  hPanels: 3,
  perspective: 1000,
  shading: 'hard',
  speed: 700,
  maxAngle: 90,
  ripple: 0,
  oriDomiClass: libName.toLowerCase(),
  shadingIntensity: 1,
  easingMethod: '',
  gapNudge: 1.5,
  touchEnabled: true,
  touchSensitivity: .25,
  touchStartCallback: noOp,
  touchMoveCallback: noOp,
  touchEndCallback: noOp
};

OriDomi = (function() {
  function OriDomi(el1, options) {
    var a, anchor, anchorSet, axis, classSuffix, content, contentHolder, count, i, index, j, l, len1, len2, len3, len4, len5, len6, len7, len8, m, mask, maskProto, metric, o, offsets, panel, panelConfig, panelKey, panelN, panelProto, percent, prev, proto, q, r, ref1, ref2, ref3, rightOrBottom, shaderProto, shaderProtos, side, stageProto, t, u, w;
    this.el = el1;
    if (options == null) {
      options = {};
    }
    this._onMouseOut = bind(this._onMouseOut, this);
    this._onTouchLeave = bind(this._onTouchLeave, this);
    this._onTouchEnd = bind(this._onTouchEnd, this);
    this._onTouchMove = bind(this._onTouchMove, this);
    this._onTouchStart = bind(this._onTouchStart, this);
    this._stageReset = bind(this._stageReset, this);
    this._conclude = bind(this._conclude, this);
    this._onTransitionEnd = bind(this._onTransitionEnd, this);
    this._step = bind(this._step, this);
    if (!isSupported) {
      return;
    }
    if (!(this instanceof OriDomi)) {
      return new OriDomi(this.el, options);
    }
    if (typeof this.el === 'string') {
      this.el = document.querySelector(this.el);
    }
    if (!(this.el && this.el.nodeType === 1)) {
      if (typeof console !== "undefined" && console !== null) {
        console.warn(libName + ": First argument must be a DOM element");
      }
      return;
    }
    this._config = new function() {
      for (k in defaults) {
        v = defaults[k];
        if (k in options) {
          this[k] = options[k];
        } else {
          this[k] = v;
        }
      }
      return this;
    };
    this._config.ripple = Number(this._config.ripple);
    this._queue = [];
    this._panels = {};
    this._stages = {};
    this._lastOp = {
      anchor: anchorList[0]
    };
    this._shading = this._config.shading;
    if (this._shading === true) {
      this._shading = 'hard';
    }
    if (this._shading) {
      this._shaders = {};
      shaderProtos = {};
      shaderProto = createEl('shader');
      shaderProto.style[css.transitionDuration] = this._config.speed + 'ms';
      shaderProto.style[css.transitionTimingFunction] = this._config.easingMethod;
    }
    stageProto = createEl('stage');
    stageProto.style[css.perspective] = this._config.perspective + 'px';
    for (j = 0, len1 = anchorList.length; j < len1; j++) {
      anchor = anchorList[j];
      this._panels[anchor] = [];
      this._stages[anchor] = cloneEl(stageProto, false, 'stage' + capitalize(anchor));
      if (this._shading) {
        this._shaders[anchor] = {};
        if (indexOf.call(anchorListV, anchor) >= 0) {
          for (l = 0, len2 = anchorListV.length; l < len2; l++) {
            side = anchorListV[l];
            this._shaders[anchor][side] = [];
          }
        } else {
          for (m = 0, len3 = anchorListH.length; m < len3; m++) {
            side = anchorListH[m];
            this._shaders[anchor][side] = [];
          }
        }
        shaderProtos[anchor] = cloneEl(shaderProto, false, 'shader' + capitalize(anchor));
      }
    }
    contentHolder = cloneEl(this.el, true, 'content');
    maskProto = createEl('mask');
    maskProto.appendChild(contentHolder);
    panelProto = createEl('panel');
    panelProto.style[css.transitionDuration] = this._config.speed + 'ms';
    panelProto.style[css.transitionTimingFunction] = this._config.easingMethod;
    offsets = {
      left: [],
      top: []
    };
    ref1 = ['x', 'y'];
    for (o = 0, len4 = ref1.length; o < len4; o++) {
      axis = ref1[o];
      if (axis === 'x') {
        anchorSet = anchorListV;
        metric = 'width';
        classSuffix = 'V';
      } else {
        anchorSet = anchorListH;
        metric = 'height';
        classSuffix = 'H';
      }
      panelConfig = this._config[panelKey = classSuffix.toLowerCase() + 'Panels'];
      if (typeof panelConfig === 'number') {
        count = Math.abs(parseInt(panelConfig, 10));
        percent = 100 / count;
        panelConfig = this._config[panelKey] = (function() {
          var q, ref2, results;
          results = [];
          for (q = 0, ref2 = count; 0 <= ref2 ? q < ref2 : q > ref2; 0 <= ref2 ? q++ : q--) {
            results.push(percent);
          }
          return results;
        })();
      } else {
        count = panelConfig.length;
        if (!((99 <= (ref2 = panelConfig.reduce(function(p, c) {
          return p + c;
        })) && ref2 <= 100.1))) {
          throw new Error(libName + ": Panel percentages do not sum to 100");
        }
      }
      mask = cloneEl(maskProto, true, 'mask' + classSuffix);
      if (this._shading) {
        for (q = 0, len5 = anchorSet.length; q < len5; q++) {
          anchor = anchorSet[q];
          mask.appendChild(shaderProtos[anchor]);
        }
      }
      proto = cloneEl(panelProto, false, 'panel' + classSuffix);
      proto.appendChild(mask);
      for (rightOrBottom = r = 0, len6 = anchorSet.length; r < len6; rightOrBottom = ++r) {
        anchor = anchorSet[rightOrBottom];
        for (panelN = t = 0, ref3 = count; 0 <= ref3 ? t < ref3 : t > ref3; panelN = 0 <= ref3 ? ++t : --t) {
          panel = proto.cloneNode(true);
          content = panel.children[0].children[0];
          content.style.width = content.style.height = '100%';
          if (rightOrBottom) {
            panel.style[css.origin] = anchor;
            index = panelConfig.length - panelN - 1;
            prev = index + 1;
          } else {
            index = panelN;
            prev = index - 1;
            if (panelN === 0) {
              offsets[anchor].push(0);
            } else {
              offsets[anchor].push((offsets[anchor][prev] - 100) * (panelConfig[prev] / panelConfig[index]));
            }
          }
          if (panelN === 0) {
            panel.style[anchor] = '0';
            panel.style[metric] = panelConfig[index] + '%';
          } else {
            panel.style[anchor] = '100%';
            panel.style[metric] = panelConfig[index] / panelConfig[prev] * 100 + '%';
          }
          if (this._shading) {
            for (i = u = 0, len7 = anchorSet.length; u < len7; i = ++u) {
              a = anchorSet[i];
              this._shaders[anchor][a][panelN] = panel.children[0].children[i + 1];
            }
          }
          content.style[metric] = content.style['max' + capitalize(metric)] = (count / panelConfig[index] * 10000 / count) + '%';
          content.style[anchorSet[0]] = offsets[anchorSet[0]][index] + '%';
          this._transformPanel(panel, 0, anchor);
          this._panels[anchor][panelN] = panel;
          if (panelN !== 0) {
            this._panels[anchor][panelN - 1].appendChild(panel);
          }
        }
        this._stages[anchor].appendChild(this._panels[anchor][0]);
      }
    }
    this._stageHolder = createEl('holder');
    this._stageHolder.setAttribute('aria-hidden', 'true');
    for (w = 0, len8 = anchorList.length; w < len8; w++) {
      anchor = anchorList[w];
      this._stageHolder.appendChild(this._stages[anchor]);
    }
    if (window.getComputedStyle(this.el).position === 'absolute') {
      this.el.style.position = 'absolute';
    }
    this.el.classList.add(elClasses.active);
    showEl(this._stages.left);
    this._cloneEl = cloneEl(this.el, true, 'clone');
    this._cloneEl.classList.remove(elClasses.active);
    hideEl(this._cloneEl);
    this.el.innerHTML = '';
    this.el.appendChild(this._cloneEl);
    this.el.appendChild(this._stageHolder);
    this.el.parentNode.style[css.transformStyle] = 'preserve-3d';
    this.accordion(0);
    if (this._config.ripple) {
      this.setRipple(this._config.ripple);
    }
    if (this._config.touchEnabled) {
      this.enableTouch();
    }
  }

  OriDomi.prototype._step = function() {
    var anchor, angle, fn, next, options, ref1;
    if (this._inTrans || !this._queue.length) {
      return;
    }
    this._inTrans = true;
    ref1 = this._queue.shift(), fn = ref1[0], angle = ref1[1], anchor = ref1[2], options = ref1[3];
    if (this.isFrozen) {
      this.unfreeze();
    }
    next = (function(_this) {
      return function() {
        var args;
        _this._setCallback({
          angle: angle,
          anchor: anchor,
          options: options,
          fn: fn
        });
        args = [angle, anchor, options];
        if (fn.length < 3) {
          args.shift();
        }
        return fn.apply(_this, args);
      };
    })(this);
    if (this.isFoldedUp) {
      if (fn.length === 2) {
        return next();
      } else {
        return this._unfold(next);
      }
    } else if (anchor !== this._lastOp.anchor) {
      return this._stageReset(anchor, next);
    } else {
      return next();
    }
  };

  OriDomi.prototype._isIdenticalOperation = function(op) {
    var j, key, len1, ref1, ref2;
    if (!this._lastOp.fn) {
      return true;
    }
    if (this._lastOp.reset) {
      return false;
    }
    ref1 = ['angle', 'anchor', 'fn'];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      key = ref1[j];
      if (this._lastOp[key] !== op[key]) {
        return false;
      }
    }
    ref2 = op.options;
    for (k in ref2) {
      v = ref2[k];
      if (v !== this._lastOp.options[k] && k !== 'callback') {
        return false;
      }
    }
    return true;
  };

  OriDomi.prototype._setCallback = function(operation) {
    if (!this._config.speed || this._isIdenticalOperation(operation)) {
      this._conclude(operation.options.callback);
    } else {
      this._panels[this._lastOp.anchor][0].addEventListener(css.transitionEnd, this._onTransitionEnd, false);
    }
    return (this._lastOp = operation).reset = false;
  };

  OriDomi.prototype._onTransitionEnd = function(e) {
    e.currentTarget.removeEventListener(css.transitionEnd, this._onTransitionEnd, false);
    return this._conclude(this._lastOp.options.callback, e);
  };

  OriDomi.prototype._conclude = function(cb, event) {
    return defer((function(_this) {
      return function() {
        _this._inTrans = false;
        _this._step();
        return typeof cb === "function" ? cb(event, _this) : void 0;
      };
    })(this));
  };

  OriDomi.prototype._transformPanel = function(el, angle, anchor, fracture) {
    var transPrefix, x, y, z;
    x = y = z = 0;
    switch (anchor) {
      case 'left':
        y = angle;
        transPrefix = 'X(-';
        break;
      case 'right':
        y = -angle;
        transPrefix = 'X(';
        break;
      case 'top':
        x = -angle;
        transPrefix = 'Y(-';
        break;
      case 'bottom':
        x = angle;
        transPrefix = 'Y(';
    }
    if (fracture) {
      x = y = z = angle;
    }
    return el.style[css.transform] = "rotateX(" + x + "deg) rotateY(" + y + "deg) rotateZ(" + z + "deg) translate" + transPrefix + this._config.gapNudge + "px)";
  };

  OriDomi.prototype._normalizeAngle = function(angle) {
    var max;
    angle = parseFloat(angle, 10);
    max = this._config.maxAngle;
    if (isNaN(angle)) {
      return 0;
    } else if (angle > max) {
      return max;
    } else if (angle < -max) {
      return -max;
    } else {
      return angle;
    }
  };

  OriDomi.prototype._setTrans = function(duration, delay, anchor) {
    if (anchor == null) {
      anchor = this._lastOp.anchor;
    }
    return this._iterate(anchor, (function(_this) {
      return function(panel, i, len) {
        return _this._setPanelTrans.apply(_this, [anchor].concat(slice.call(arguments), [duration], [delay]));
      };
    })(this));
  };

  OriDomi.prototype._setPanelTrans = function(anchor, panel, i, len, duration, delay) {
    var delayMs, j, len1, ref1, shader, side;
    delayMs = (function() {
      switch (delay) {
        case 0:
          return 0;
        case 1:
          return this._config.speed / len * i;
        case 2:
          return this._config.speed / len * (len - i - 1);
      }
    }).call(this);
    panel.style[css.transitionDuration] = duration + 'ms';
    panel.style[css.transitionDelay] = delayMs + 'ms';
    if (this._shading) {
      ref1 = (indexOf.call(anchorListV, anchor) >= 0 ? anchorListV : anchorListH);
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        side = ref1[j];
        shader = this._shaders[anchor][side][i];
        shader.style[css.transitionDuration] = duration + 'ms';
        shader.style[css.transitionDelay] = delayMs + 'ms';
      }
    }
    return delayMs;
  };

  OriDomi.prototype._setShader = function(n, anchor, angle) {
    var a, abs, b, opacity;
    abs = Math.abs(angle);
    opacity = abs / 90 * this._config.shadingIntensity;
    if (this._shading === 'hard') {
      opacity *= .15;
      if (this._lastOp.angle < 0) {
        angle = abs;
      } else {
        angle = -abs;
      }
    } else {
      opacity *= .4;
    }
    if (indexOf.call(anchorListV, anchor) >= 0) {
      if (angle < 0) {
        a = opacity;
        b = 0;
      } else {
        a = 0;
        b = opacity;
      }
      this._shaders[anchor].left[n].style.opacity = a;
      return this._shaders[anchor].right[n].style.opacity = b;
    } else {
      if (angle < 0) {
        a = 0;
        b = opacity;
      } else {
        a = opacity;
        b = 0;
      }
      this._shaders[anchor].top[n].style.opacity = a;
      return this._shaders[anchor].bottom[n].style.opacity = b;
    }
  };

  OriDomi.prototype._showStage = function(anchor) {
    if (anchor !== this._lastOp.anchor) {
      hideEl(this._stages[this._lastOp.anchor]);
      this._lastOp.anchor = anchor;
      this._lastOp.reset = true;
      return this._stages[anchor].style[css.transform] = 'translate3d(' + (function() {
        switch (anchor) {
          case 'left':
            return '0, 0, 0)';
          case 'right':
            return "-" + this._config.vPanels.length + "px, 0, 0)";
          case 'top':
            return '0, 0, 0)';
          case 'bottom':
            return "0, -" + this._config.hPanels.length + "px, 0)";
        }
      }).call(this);
    }
  };

  OriDomi.prototype._stageReset = function(anchor, cb) {
    var fn;
    fn = (function(_this) {
      return function(e) {
        if (e) {
          e.currentTarget.removeEventListener(css.transitionEnd, fn, false);
        }
        _this._showStage(anchor);
        return defer(cb);
      };
    })(this);
    if (this._lastOp.angle === 0) {
      return fn();
    }
    this._panels[this._lastOp.anchor][0].addEventListener(css.transitionEnd, fn, false);
    return this._iterate(this._lastOp.anchor, (function(_this) {
      return function(panel, i) {
        _this._transformPanel(panel, 0, _this._lastOp.anchor);
        if (_this._shading) {
          return _this._setShader(i, _this._lastOp.anchor, 0);
        }
      };
    })(this));
  };

  OriDomi.prototype._getLonghandAnchor = function(shorthand) {
    switch (shorthand.toString()) {
      case 'left':
      case 'l':
      case '4':
        return 'left';
      case 'right':
      case 'r':
      case '2':
        return 'right';
      case 'top':
      case 't':
      case '1':
        return 'top';
      case 'bottom':
      case 'b':
      case '3':
        return 'bottom';
      default:
        return 'left';
    }
  };

  OriDomi.prototype._setCursor = function(bool) {
    if (bool == null) {
      bool = this._touchEnabled;
    }
    if (bool) {
      return this.el.style.cursor = css.grab;
    } else {
      return this.el.style.cursor = 'default';
    }
  };

  OriDomi.prototype._setTouch = function(toggle) {
    var eString, eventPair, eventPairs, j, l, len1, len2, listenFn, mouseLeaveSupport;
    if (toggle) {
      if (this._touchEnabled) {
        return this;
      }
      listenFn = 'addEventListener';
    } else {
      if (!this._touchEnabled) {
        return this;
      }
      listenFn = 'removeEventListener';
    }
    this._touchEnabled = toggle;
    this._setCursor();
    eventPairs = [['TouchStart', 'MouseDown'], ['TouchEnd', 'MouseUp'], ['TouchMove', 'MouseMove'], ['TouchLeave', 'MouseLeave']];
    mouseLeaveSupport = 'onmouseleave' in window;
    for (j = 0, len1 = eventPairs.length; j < len1; j++) {
      eventPair = eventPairs[j];
      for (l = 0, len2 = eventPair.length; l < len2; l++) {
        eString = eventPair[l];
        if (!(eString === 'TouchLeave' && !mouseLeaveSupport)) {
          this.el[listenFn](eString.toLowerCase(), this['_on' + eventPair[0]], false);
        } else {
          this.el[listenFn]('mouseout', this._onMouseOut, false);
          break;
        }
      }
    }
    return this;
  };

  OriDomi.prototype._onTouchStart = function(e) {
    var axis1, ref1;
    if (!this._touchEnabled || this.isFoldedUp) {
      return;
    }
    e.preventDefault();
    this.emptyQueue();
    this._touchStarted = true;
    this.el.style.cursor = css.grabbing;
    this._setTrans(0, 0);
    this._touchAxis = (ref1 = this._lastOp.anchor, indexOf.call(anchorListV, ref1) >= 0) ? 'x' : 'y';
    this["_" + this._touchAxis + "Last"] = this._lastOp.angle;
    axis1 = "_" + this._touchAxis + "1";
    if (e.type === 'mousedown') {
      this[axis1] = e["page" + (this._touchAxis.toUpperCase())];
    } else {
      this[axis1] = e.targetTouches[0]["page" + (this._touchAxis.toUpperCase())];
    }
    return this._config.touchStartCallback(this[axis1], e);
  };

  OriDomi.prototype._onTouchMove = function(e) {
    var current, delta, distance;
    if (!(this._touchEnabled && this._touchStarted)) {
      return;
    }
    e.preventDefault();
    if (e.type === 'mousemove') {
      current = e["page" + (this._touchAxis.toUpperCase())];
    } else {
      current = e.targetTouches[0]["page" + (this._touchAxis.toUpperCase())];
    }
    distance = (current - this["_" + this._touchAxis + "1"]) * this._config.touchSensitivity;
    if (this._lastOp.angle < 0) {
      if (this._lastOp.anchor === 'right' || this._lastOp.anchor === 'bottom') {
        delta = this["_" + this._touchAxis + "Last"] - distance;
      } else {
        delta = this["_" + this._touchAxis + "Last"] + distance;
      }
      if (delta > 0) {
        delta = 0;
      }
    } else {
      if (this._lastOp.anchor === 'right' || this._lastOp.anchor === 'bottom') {
        delta = this["_" + this._touchAxis + "Last"] + distance;
      } else {
        delta = this["_" + this._touchAxis + "Last"] - distance;
      }
      if (delta < 0) {
        delta = 0;
      }
    }
    this._lastOp.angle = delta = this._normalizeAngle(delta);
    this._lastOp.fn.call(this, delta, this._lastOp.anchor, this._lastOp.options);
    return this._config.touchMoveCallback(delta, e);
  };

  OriDomi.prototype._onTouchEnd = function(e) {
    if (!this._touchEnabled) {
      return;
    }
    this._touchStarted = this._inTrans = false;
    this.el.style.cursor = css.grab;
    this._setTrans(this._config.speed, this._config.ripple);
    return this._config.touchEndCallback(this["_" + this._touchAxis + "Last"], e);
  };

  OriDomi.prototype._onTouchLeave = function(e) {
    if (!(this._touchEnabled && this._touchStarted)) {
      return;
    }
    return this._onTouchEnd(e);
  };

  OriDomi.prototype._onMouseOut = function(e) {
    if (!(this._touchEnabled && this._touchStarted)) {
      return;
    }
    if (e.toElement && !this.el.contains(e.toElement)) {
      return this._onTouchEnd(e);
    }
  };

  OriDomi.prototype._unfold = function(callback) {
    var anchor;
    this._inTrans = true;
    anchor = this._lastOp.anchor;
    return this._iterate(anchor, (function(_this) {
      return function(panel, i, len) {
        var delay;
        delay = _this._setPanelTrans.apply(_this, [anchor].concat(slice.call(arguments), [_this._config.speed], [1]));
        return (function(panel, i, delay) {
          return defer(function() {
            _this._transformPanel(panel, 0, anchor);
            if (_this._shading) {
              _this._setShader(i, anchor, 0);
            }
            return setTimeout(function() {
              showEl(panel.children[0]);
              if (i === len - 1) {
                _this._inTrans = _this.isFoldedUp = false;
                if (typeof callback === "function") {
                  callback();
                }
                _this._lastOp.fn = _this.accordion;
                _this._lastOp.angle = 0;
              }
              return defer(function() {
                return panel.style[css.transitionDuration] = _this._config.speed;
              });
            }, delay + _this._config.speed * .25);
          });
        })(panel, i, delay);
      };
    })(this));
  };

  OriDomi.prototype._iterate = function(anchor, fn) {
    var i, j, len1, panel, panels, ref1, results;
    ref1 = panels = this._panels[anchor];
    results = [];
    for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
      panel = ref1[i];
      results.push(fn.call(this, panel, i, panels.length));
    }
    return results;
  };

  OriDomi.prototype.enableTouch = function() {
    return this._setTouch(true);
  };

  OriDomi.prototype.disableTouch = function() {
    return this._setTouch(false);
  };

  OriDomi.prototype.setSpeed = function(speed) {
    var anchor, j, len1;
    for (j = 0, len1 = anchorList.length; j < len1; j++) {
      anchor = anchorList[j];
      this._setTrans((this._config.speed = speed), this._config.ripple, anchor);
    }
    return this;
  };

  OriDomi.prototype.freeze = function(callback) {
    if (this.isFrozen) {
      if (typeof callback === "function") {
        callback();
      }
    } else {
      this._stageReset(this._lastOp.anchor, (function(_this) {
        return function() {
          _this.isFrozen = true;
          hideEl(_this._stageHolder);
          showEl(_this._cloneEl);
          _this._setCursor(false);
          return typeof callback === "function" ? callback() : void 0;
        };
      })(this));
    }
    return this;
  };

  OriDomi.prototype.unfreeze = function() {
    if (this.isFrozen) {
      this.isFrozen = false;
      hideEl(this._cloneEl);
      showEl(this._stageHolder);
      this._setCursor();
      this._lastOp.angle = 0;
    }
    return this;
  };

  OriDomi.prototype.destroy = function(callback) {
    this.freeze((function(_this) {
      return function() {
        _this._setTouch(false);
        if ($) {
          $.data(_this.el, baseName, null);
        }
        _this.el.innerHTML = _this._cloneEl.innerHTML;
        _this.el.classList.remove(elClasses.active);
        return typeof callback === "function" ? callback() : void 0;
      };
    })(this));
    return null;
  };

  OriDomi.prototype.emptyQueue = function() {
    this._queue = [];
    defer((function(_this) {
      return function() {
        return _this._inTrans = false;
      };
    })(this));
    return this;
  };

  OriDomi.prototype.setRipple = function(dir) {
    if (dir == null) {
      dir = 1;
    }
    this._config.ripple = Number(dir);
    this.setSpeed(this._config.speed);
    return this;
  };

  OriDomi.prototype.constrainAngle = function(angle) {
    this._config.maxAngle = parseFloat(angle, 10) || defaults.maxAngle;
    return this;
  };

  OriDomi.prototype.wait = function(ms) {
    var fn;
    fn = (function(_this) {
      return function() {
        return setTimeout(_this._conclude, ms);
      };
    })(this);
    if (this._inTrans) {
      this._queue.push([fn, this._lastOp.angle, this._lastOp.anchor, this._lastOp.options]);
    } else {
      fn();
    }
    return this;
  };

  OriDomi.prototype.modifyContent = function(fn) {
    var anchor, i, j, l, len1, len2, panel, ref1, selectors, set;
    if (typeof fn !== 'function') {
      selectors = fn;
      set = function(el, content, style) {
        var key, value;
        if (content) {
          el.innerHTML = content;
        }
        if (style) {
          for (key in style) {
            value = style[key];
            el.style[key] = value;
          }
          return null;
        }
      };
      fn = function(el) {
        var content, j, len1, match, ref1, selector, style, value;
        for (selector in selectors) {
          value = selectors[selector];
          content = style = null;
          if (typeof value === 'string') {
            content = value;
          } else {
            content = value.content, style = value.style;
          }
          if (selector === '') {
            set(el, content, style);
            continue;
          }
          ref1 = el.querySelectorAll(selector);
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            match = ref1[j];
            set(match, content, style);
          }
        }
        return null;
      };
    }
    for (j = 0, len1 = anchorList.length; j < len1; j++) {
      anchor = anchorList[j];
      ref1 = this._panels[anchor];
      for (i = l = 0, len2 = ref1.length; l < len2; i = ++l) {
        panel = ref1[i];
        fn(panel.children[0].children[0], i, anchor);
      }
    }
    return this;
  };

  OriDomi.prototype.accordion = prep(function(angle, anchor, options) {
    return this._iterate(anchor, (function(_this) {
      return function(panel, i) {
        var deg;
        if (i % 2 !== 0 && !options.twist) {
          deg = -angle;
        } else {
          deg = angle;
        }
        if (options.sticky) {
          if (i === 0) {
            deg = 0;
          } else if (i > 1 || options.stairs) {
            deg *= 2;
          }
        } else {
          if (i !== 0) {
            deg *= 2;
          }
        }
        if (options.stairs) {
          deg *= -1;
        }
        _this._transformPanel(panel, deg, anchor, options.fracture);
        if (_this._shading) {
          if (options.twist || options.fracture || (i === 0 && options.sticky)) {
            return _this._setShader(i, anchor, 0);
          } else if (Math.abs(deg) !== 180) {
            return _this._setShader(i, anchor, deg);
          }
        }
      };
    })(this));
  });

  OriDomi.prototype.curl = prep(function(angle, anchor, options) {
    angle /= indexOf.call(anchorListV, anchor) >= 0 ? this._config.vPanels.length : this._config.hPanels.length;
    return this._iterate(anchor, (function(_this) {
      return function(panel, i) {
        _this._transformPanel(panel, angle, anchor);
        if (_this._shading) {
          return _this._setShader(i, anchor, 0);
        }
      };
    })(this));
  });

  OriDomi.prototype.ramp = prep(function(angle, anchor, options) {
    this._transformPanel(this._panels[anchor][1], angle, anchor);
    return this._iterate(anchor, (function(_this) {
      return function(panel, i) {
        if (i !== 1) {
          _this._transformPanel(panel, 0, anchor);
        }
        if (_this._shading) {
          return _this._setShader(i, anchor, 0);
        }
      };
    })(this));
  });

  OriDomi.prototype.foldUp = prep(function(anchor, callback) {
    if (this.isFoldedUp) {
      return typeof callback === "function" ? callback() : void 0;
    }
    return this._stageReset(anchor, (function(_this) {
      return function() {
        _this._inTrans = _this.isFoldedUp = true;
        return _this._iterate(anchor, function(panel, i, len) {
          var delay, duration;
          duration = _this._config.speed;
          if (i === 0) {
            duration /= 2;
          }
          delay = _this._setPanelTrans.apply(_this, [anchor].concat(slice.call(arguments), [duration], [2]));
          return (function(panel, i, delay) {
            return defer(function() {
              _this._transformPanel(panel, (i === 0 ? 90 : 170), anchor);
              return setTimeout(function() {
                if (i === 0) {
                  _this._inTrans = false;
                  return typeof callback === "function" ? callback() : void 0;
                } else {
                  return hideEl(panel.children[0]);
                }
              }, delay + _this._config.speed * .25);
            });
          })(panel, i, delay);
        });
      };
    })(this));
  });

  OriDomi.prototype.unfold = prep(OriDomi.prototype._unfold);

  OriDomi.prototype.map = function(fn) {
    return prep((function(_this) {
      return function(angle, anchor, options) {
        return _this._iterate(anchor, function(panel, i, len) {
          return _this._transformPanel(panel, fn(angle, i, len), anchor, options.fracture);
        });
      };
    })(this)).bind(this);
  };

  OriDomi.prototype.reset = function(callback) {
    return this.accordion(0, {
      callback: callback
    });
  };

  OriDomi.prototype.reveal = function(angle, anchor, options) {
    if (options == null) {
      options = {};
    }
    options.sticky = true;
    return this.accordion(angle, anchor, options);
  };

  OriDomi.prototype.stairs = function(angle, anchor, options) {
    if (options == null) {
      options = {};
    }
    options.stairs = options.sticky = true;
    return this.accordion(angle, anchor, options);
  };

  OriDomi.prototype.fracture = function(angle, anchor, options) {
    if (options == null) {
      options = {};
    }
    options.fracture = true;
    return this.accordion(angle, anchor, options);
  };

  OriDomi.prototype.twist = function(angle, anchor, options) {
    if (options == null) {
      options = {};
    }
    options.fracture = options.twist = true;
    return this.accordion(angle / 10, anchor, options);
  };

  OriDomi.prototype.collapse = function(anchor, options) {
    if (options == null) {
      options = {};
    }
    options.sticky = false;
    return this.accordion(-this._config.maxAngle, anchor, options);
  };

  OriDomi.prototype.collapseAlt = function(anchor, options) {
    if (options == null) {
      options = {};
    }
    options.sticky = false;
    return this.accordion(this._config.maxAngle, anchor, options);
  };

  OriDomi.VERSION = '1.1.5';

  OriDomi.isSupported = isSupported;

  return OriDomi;

})();

if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
  module.exports = OriDomi;
} else if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
  define(function() {
    return OriDomi;
  });
} else {
  window.OriDomi = OriDomi;
}

if (!$) {
  return;
}

$.prototype.oriDomi = function(options) {
  var el, instance, j, l, len1, len2, method, methodName;
  if (!isSupported) {
    return this;
  }
  if (options === true) {
    return $.data(this[0], baseName);
  }
  if (typeof options === 'string') {
    methodName = options;
    if (typeof (method = OriDomi.prototype[methodName]) !== 'function') {
      if (typeof console !== "undefined" && console !== null) {
        console.warn(libName + ": No such method `" + methodName + "`");
      }
      return this;
    }
    for (j = 0, len1 = this.length; j < len1; j++) {
      el = this[j];
      if (!(instance = $.data(el, baseName))) {
        instance = $.data(el, baseName, new OriDomi(el, options));
      }
      method.apply(instance, Array.prototype.slice.call(arguments).slice(1));
    }
  } else {
    for (l = 0, len2 = this.length; l < len2; l++) {
      el = this[l];
      if (instance = $.data(el, baseName)) {
        continue;
      } else {
        $.data(el, baseName, new OriDomi(el, options));
      }
    }
  }
  return this;
};

}).call(this);
