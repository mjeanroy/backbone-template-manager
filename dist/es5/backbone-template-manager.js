/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Mickael Jeanroy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('BackboneTemplateManager', ['exports', 'backbone', 'underscore'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('backbone'), require('underscore'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Backbone, global._);
    global.BackboneTemplateManager = mod.exports;
  }
})(this, function (exports, _backbone, _underscore) {
  'use strict';

  exports.__esModule = true;
  exports.VIEW_RENDER_DONE = exports.VIEW_RENDER_ERROR = exports.VIEW_RENDER_SUCCESS = exports.VIEW_RENDER_LOADING = exports.TemplateView = exports.TemplateViewMixin = exports.overrideTemplateManager = exports.templateManager = exports.overrideCompile = exports.compile = exports.RemoteTemplateManager = exports.DomTemplateManager = undefined;

  var _backbone2 = _interopRequireDefault(_backbone);

  var _underscore2 = _interopRequireDefault(_underscore);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      'default': obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var noop = _underscore2['default'].noop;
  var _has = _underscore2['default'].has;
  var keys = _underscore2['default'].keys;
  var after = _underscore2['default'].after;
  var isNull = _underscore2['default'].isNull;
  var isUndefined = _underscore2['default'].isUndefined;
  var isString = _underscore2['default'].isString;
  var isNumber = _underscore2['default'].isNumber;
  var isArray = _underscore2['default'].isArray;
  var isObject = _underscore2['default'].isObject;
  var isBoolean = _underscore2['default'].isBoolean;
  var defaults = _underscore2['default'].defaults;
  var isEmpty = _underscore2['default'].isEmpty;
  var result = _underscore2['default'].result;
  var every = _underscore2['default'].every;
  var forEach = _underscore2['default'].forEach;

  var or = function or(val, def) {
    return isUndefined(val) ? def : val;
  };

  var trim = function trim(val) {
    if (!val || !isString(val)) {
      return val;
    }

    return String.prototype.trim ? String.prototype.trim.call(val) : val.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };

  var toString = function toString(val) {
    if (isNull(val) || isUndefined(val)) {
      return String(val);
    }

    if (isNumber(val) || isString(val) || isBoolean(val)) {
      return val.toString();
    }

    // Object or array: use JSON.stringify
    return JSON.stringify(val);
  };

  var firstEntry = function firstEntry(obj) {
    return obj[keys(obj)[0]];
  };

  var AbstractTemplateManager = function AbstractTemplateManager(options) {
    this.options = options || {};
    this.initialize(this.options);
  };

  AbstractTemplateManager.prototype = {
    initialize: function initialize(options) {},
    fetch: function fetch(templates, options) {
      var _this = this;

      var opts = options || {};

      var sources = void 0;
      var singular = void 0;
      if (isString(templates)) {
        singular = true;
        sources = [templates];
      } else if (isArray(templates) && !isEmpty(templates) && every(templates, isString)) {
        singular = false;
        sources = templates;
      } else {
        throw new Error('Templates must be a string or an array of string, found: ' + toString(templates));
      }

      var success = opts.success || noop;
      var error = opts.error || noop;
      var done = opts.done || noop;

      var onDone = after(sources.length, function (results) {
        var ok = void 0;
        var ko = void 0;

        if (singular) {
          ok = firstEntry(results.success);
          ko = firstEntry(results.errors);
        } else {
          ok = results.success;
          ko = results.errors;
        }

        if (isEmpty(ko)) {
          success(ok);
        } else {
          error(ko);
        }

        done(ok, ko);

        // Free memory.
        success = error = done = null;
      });

      // Store success / errors while fetching templates.
      var results = {
        success: {},
        errors: {}
      };

      forEach(sources, function (source) {
        _this._doFetch(source, {
          success: function success(template) {
            results.success[source] = template;
            onDone(results);
          },

          error: function error(_error) {
            results.errors[source] = _error;
            onDone(results);
          }
        });
      });
    },
    clear: function clear() {},
    _doFetch: function _doFetch(template, options) {
      throw new Error('Method "doFetch" should be implemented');
    }
  };

  AbstractTemplateManager.extend = _backbone2['default'].View.extend;

  var SUPPORT_ES6_MAP = typeof Map !== 'undefined';

  var Cache = SUPPORT_ES6_MAP ? Map : function () {
    var NIL_OBJECT = {};

    return function () {
      function FallbackMap() {
        _classCallCheck(this, FallbackMap);

        this._o = {};
      }

      FallbackMap.prototype.has = function has(key) {
        return _has(this._o, key) && this._o[key] !== NIL_OBJECT;
      };

      FallbackMap.prototype.get = function get(key) {
        return this.has(key) ? this._o[key] : undefined;
      };

      FallbackMap.prototype.set = function set(key, value) {
        this._o[key] = value;
      };

      FallbackMap.prototype.clear = function clear() {
        this._o = {};
      };

      FallbackMap.prototype['delete'] = function _delete(key) {
        if (_has(this._o, key)) {
          this._o[key] = NIL_OBJECT;
        }
      };

      return FallbackMap;
    }();
  }();

  // Default selector factory, used if no factory is specified during
  // initialization.
  var defaultSelectorFactory = function defaultSelectorFactory(id) {
    return '[data-template-id="' + id + '"]';
  };

  var DomTemplateManager = AbstractTemplateManager.extend({
    initialize: function initialize(options) {
      this.selector = or(options.selector, defaultSelectorFactory);
      this._cache = new Cache();
    },
    clear: function clear() {
      this._cache.clear();
    },
    _doFetch: function _doFetch(id, options) {
      var _this2 = this;

      setTimeout(function () {
        var success = options.success;
        var error = options.error;
        var cache = _this2._cache;

        // Already in cache.
        if (cache.has(id)) {
          success(cache.get(id));
          return;
        }

        // Query template in the DOM.
        var selector = _this2.selector(id);
        var node = _backbone2['default'].$(selector);
        if (isEmpty(node) || node.length === 0) {
          error({ data: 'Cannot find template: ' + id });
        } else if (node.length > 1) {
          error({ data: 'Found multiple templates for selector: ' + selector });
        } else {
          // Put in the cache for next resolution.
          var html = trim(node.html());
          cache.set(id, html);
          success(html);
        }
      });
    }
  });

  var URL_SEPARATOR = '/';
  var DEFAULT_PREFIX = '/templates/';
  var DEFAULT_SUFFIX = '.template.html';
  var createUrl = function createUrl(path, prefix, suffix) {
    var firstPath = path.charAt(0);
    var lastPath = path.length > 1 ? path.charAt(path.length - 1) : '';
    var lastPrefix = prefix.charAt(prefix.length - 1);
    var firstSuffix = suffix.charAt(0);

    var realPath = path;

    if (firstPath === URL_SEPARATOR && lastPrefix === URL_SEPARATOR) {
      // Avoid double slash with prefix.
      realPath = path.slice(1);
    } else if (firstPath !== URL_SEPARATOR && lastPrefix !== URL_SEPARATOR) {
      // Prepend with slash (should it be an option?).
      realPath = '/' + path;
    }

    // Avoid double slash with suffix.
    if (lastPath === URL_SEPARATOR && firstSuffix === URL_SEPARATOR) {
      realPath = realPath.slice(0, realPath.length - 1);
    }

    return '' + prefix + realPath + suffix;
  };

  var RemoteTemplateManager = AbstractTemplateManager.extend({
    initialize: function initialize(options) {
      var _this3 = this;

      this._prefix = or(result(options, 'prefix'), DEFAULT_PREFIX);
      this._suffix = or(result(options, 'suffix'), DEFAULT_SUFFIX);
      this._method = options.method || 'GET';
      this._cache = new Cache();

      // Try to initialize cache with JavaScript templates created
      // at build time.
      var JST = options.JST;
      if (JST) {
        var o = void 0;

        if (isString(JST)) {
          // 1- Name of the variable.
          o = window[JST];
        } else if (isBoolean(JST)) {
          // 2- Default name is JST.
          o = window.JST;
        } else if (isObject(JST) && !isArray(JST)) {
          // 3- The cache object is given.
          o = JST;
        } else {
          // 4- Don't know how to handle this variable!
          throw new Error('Cannot infer JST variables from: ' + toString(JST));
        }

        // Put everything in the cache.
        forEach(keys(o || {}), function (k) {
          _this3._cache.set(k, o[k]);
        });
      }
    },
    clear: function clear() {
      this._cache.clear();
    },
    _doFetch: function _doFetch(id, options) {
      var success = options.success;
      var error = options.error;
      var cache = this._cache;

      if (!cache.has(id)) {
        var prefix = this._prefix || '';
        var suffix = this._suffix || '';
        var method = this._method;
        var url = createUrl(id, prefix, suffix);
        cache.set(id, _backbone2['default'].ajax({
          url: url,
          method: method
        }));
      }

      // If template is already in the cache.
      var cachedValue = cache.get(id);
      if (isString(cachedValue)) {
        setTimeout(function () {
          success(cachedValue);
        });

        return;
      }

      var onSuccess = function onSuccess(data) {
        // Remove promise from cache and populate with template.
        cache.set(id, data);

        // Trigger success.
        success(data);
      };

      var onError = function onError(xhr) {
        // Remove from cache, maybe we will be luckier on next try.
        cache['delete'](id);

        // Then, trigger error callback.
        error({
          status: xhr.status,
          message: xhr.responseText
        });
      };

      cache.get(id).then(onSuccess, onError);
    }
  });

  var _compile = function _compile(html) {
    return _underscore2['default'].template(html);
  };

  var _compile2 = function _compile2(html) {
    return _compile(html);
  };

  var overrideCompile = function overrideCompile(compileFn) {
    _compile = compileFn;
  };

  var _templateManager = new RemoteTemplateManager();

  var _templateManager2 = function _templateManager2() {
    return _templateManager;
  };

  var overrideTemplateManager = function overrideTemplateManager(templateManager) {
    // Clear template manager before overriding it.
    _templateManager.clear();

    // Set new default template manager.
    _templateManager = templateManager;
  };

  var PREFIX = 'render';

  var VIEW_RENDER_LOADING = PREFIX + ':loading';

  var VIEW_RENDER_SUCCESS = PREFIX + ':success';

  var VIEW_RENDER_ERROR = PREFIX + ':error';

  var VIEW_RENDER_DONE = PREFIX + ':done';

  var TemplateViewMixin = {
    templates: function templates() {
      return null;
    },
    templateManager: function templateManager() {
      return _templateManager2();
    },
    compile: function compile(html) {
      return _compile2(html);
    },
    toJSON: function toJSON(options) {
      // Result object.
      var results = {};

      // Add `view` options to let model knows that `toJSON` is called from a view.
      var opts = defaults(options || {}, {
        view: true
      });

      // Add model if it exists.
      if (this.model) {
        results.model = this.model.toJSON(opts);
      }

      // Add collection if it exists.
      if (this.collection) {
        results.collection = this.collection.toJSON(opts);
      }

      return results;
    },
    onBeforeRender: function onBeforeRender() {},
    onRender: function onRender() {},
    onRenderError: function onRenderError() {},
    onRendered: function onRendered(err) {},
    fetchTemplates: function fetchTemplates(options) {
      this._doFetchTemplates(options);
    },
    renderTemplates: function renderTemplates() {
      var _this4 = this;

      var templates = result(this, 'templates');
      var options = {
        success: function success(results) {
          // View may not have any templates to render.
          if (results) {
            _this4._renderTemplates(templates, results);
          }

          _this4._triggerRenderSuccess();
        },

        error: function error(err) {
          _this4._triggerRenderError(err);
        }
      };

      this._triggerBeforeRender();
      this._doFetchTemplates(options, templates);
    },
    _doFetchTemplates: function _doFetchTemplates() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var templates = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : result(this, 'templates');

      var success = options.success || noop;
      var error = options.error || noop;

      if (!isEmpty(templates)) {
        // Get view's template manager.
        // Use _.result if template manager is a static variable defined
        // on the class.
        var templateManager$$1 = result(this, 'templateManager');

        // Fetch templates and trigger success/error callbacks.
        templateManager$$1.fetch(templates, { success: success, error: error });
      } else {
        // View does not have templates to render, trigger success
        // callback.
        success(null);
      }
    },
    _triggerBeforeRender: function _triggerBeforeRender() {
      this.trigger(VIEW_RENDER_LOADING);
      this.onBeforeRender();
    },
    _triggerRenderSuccess: function _triggerRenderSuccess() {
      this.trigger(VIEW_RENDER_SUCCESS);
      this.onRender();
      this._triggerRenderDone();
    },
    _triggerRenderError: function _triggerRenderError() {
      var err = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      this.trigger(VIEW_RENDER_ERROR, err);
      this.onRenderError();
      this._triggerRenderDone(err);
    },
    _triggerRenderDone: function _triggerRenderDone() {
      var err = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      this.trigger(VIEW_RENDER_DONE, err);
      this.onRendered(err);
    },
    _renderTemplates: function _renderTemplates(templates, results) {
      var main = isArray(templates) ? results[0] : results;
      var partials = isArray(results) ? results : null;
      var output = this._toHTML(main, partials);
      this._setHtml(output);
      return this;
    },
    _toHTML: function _toHTML(main, partials) {
      var html = this.compile(main);
      return html(this.toJSON(), partials);
    },
    _setHtml: function _setHtml(output) {
      this.$el.html(output);
      return this;
    }
  };

  var TemplateView = _backbone2['default'].View.extend(TemplateViewMixin).extend({
    render: function render() {
      this.renderTemplates();
      return this;
    }
  });

  exports.DomTemplateManager = DomTemplateManager;
  exports.RemoteTemplateManager = RemoteTemplateManager;
  exports.compile = _compile2;
  exports.overrideCompile = overrideCompile;
  exports.templateManager = _templateManager2;
  exports.overrideTemplateManager = overrideTemplateManager;
  exports.TemplateViewMixin = TemplateViewMixin;
  exports.TemplateView = TemplateView;
  exports.VIEW_RENDER_LOADING = VIEW_RENDER_LOADING;
  exports.VIEW_RENDER_SUCCESS = VIEW_RENDER_SUCCESS;
  exports.VIEW_RENDER_ERROR = VIEW_RENDER_ERROR;
  exports.VIEW_RENDER_DONE = VIEW_RENDER_DONE;
});