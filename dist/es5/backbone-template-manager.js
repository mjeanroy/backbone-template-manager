/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mickael Jeanroy
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
  exports.TemplateView = exports.overrideTemplateManager = exports.templateManager = exports.overrideCompile = exports.compile = exports.RemoteTemplateManager = exports.DomTemplateManager = undefined;

  var _backbone2 = _interopRequireDefault(_backbone);

  var _underscore2 = _interopRequireDefault(_underscore);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var noop = _underscore2.default.noop;
  var has = _underscore2.default.has;
  var keys = _underscore2.default.keys;
  var after = _underscore2.default.after;
  var isNull = _underscore2.default.isNull;
  var isUndefined = _underscore2.default.isUndefined;
  var isString = _underscore2.default.isString;
  var isNumber = _underscore2.default.isNumber;
  var isArray = _underscore2.default.isArray;
  var isObject = _underscore2.default.isObject;
  var isBoolean = _underscore2.default.isBoolean;
  var defaults = _underscore2.default.defaults;
  var isEmpty = _underscore2.default.isEmpty;
  var result = _underscore2.default.result;
  var every = _underscore2.default.every;
  var forEach = _underscore2.default.forEach;
  var clone = _underscore2.default.clone;

  var or = function or(val, def) {
    return isUndefined(val) ? def : val;
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

  /**
   * Partial implementation of template manager.
   * A template manager is a simple class that can be used to fetch
   * templates according to several strategies, such as:
   *  - Querying the DOM for templates.
   *  - Make an ajax call to fetch templates on the server.
   */

  var AbstractTemplateManager = function () {
    /**
     * Constructor using options as arguments.
     * The constructor will automatically called the `initialize` function
     * with a valid options object (empty object if no options given).
     *
     * @param {object} options Optional options.
     * @constructor
     */

    function AbstractTemplateManager(options) {
      _classCallCheck(this, AbstractTemplateManager);

      this.options = options || {};
      this.initialize(this.options);
    }

    /**
     * Initalize function.
     *
     * @param {object} options Option object.
     * @return {void}
     * @abstract
     */


    AbstractTemplateManager.prototype.initialize = function initialize(options) {};

    AbstractTemplateManager.prototype.fetch = function fetch(templates, options) {
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
    };

    AbstractTemplateManager.prototype.clear = function clear() {};

    AbstractTemplateManager.prototype._doFetch = function _doFetch(template, options) {
      throw new Error('Method "doFetch" should be implemented');
    };

    return AbstractTemplateManager;
  }();

  // Default selector factory, used if no factory is specified during
  // initialization.
  var defaultSelectorFactory = function defaultSelectorFactory(id) {
    return '[data-template-id="' + id + '"]';
  };

  var DomTemplateManager = function (_AbstractTemplateMana) {
    _inherits(DomTemplateManager, _AbstractTemplateMana);

    function DomTemplateManager() {
      _classCallCheck(this, DomTemplateManager);

      return _possibleConstructorReturn(this, _AbstractTemplateMana.apply(this, arguments));
    }

    DomTemplateManager.prototype.initialize = function initialize(options) {
      this.selector = or(options.selector, defaultSelectorFactory);
      this._cache = {};
    };

    DomTemplateManager.prototype.clear = function clear() {
      this._cache = {};
    };

    DomTemplateManager.prototype._doFetch = function _doFetch(id, options) {
      var _this3 = this;

      setTimeout(function () {
        var success = options.success;
        var error = options.error;
        var cache = _this3._cache;

        // Already in cache.
        if (has(cache, id)) {
          success(cache[id]);
          return;
        }

        // Query template in the DOM.
        var selector = _this3.selector(id);
        var node = _backbone2.default.$(selector);
        if (isEmpty(node) || node.length === 0) {
          error({ data: 'Cannot find template: ' + id });
        } else if (node.length > 1) {
          error({ data: 'Found multiple templates for selector: ' + selector });
        } else {
          // Put in the cache for next resolution.
          cache[id] = node.html();
          success(cache[id]);
        }
      });
    };

    return DomTemplateManager;
  }(AbstractTemplateManager);

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

  var RemoteTemplateManager = function (_AbstractTemplateMana2) {
    _inherits(RemoteTemplateManager, _AbstractTemplateMana2);

    function RemoteTemplateManager() {
      _classCallCheck(this, RemoteTemplateManager);

      return _possibleConstructorReturn(this, _AbstractTemplateMana2.apply(this, arguments));
    }

    RemoteTemplateManager.prototype.initialize = function initialize(options) {
      this._prefix = or(result(options, 'prefix'), DEFAULT_PREFIX);
      this._suffix = or(result(options, 'suffix'), DEFAULT_SUFFIX);
      this._method = options.method || 'GET';
      this._cache = {};

      // Try to initialize cache with JavaScript templates created
      // at build time.
      var JST = options.JST;
      if (JST) {
        if (isString(JST)) {
          // 1- Name of the variable.
          this._cache = clone(window[JST] || {});
        } else if (isBoolean(JST)) {
          // 2- Default name is JST.
          this._cache = clone(window.JST || {});
        } else if (isObject(JST) && !isArray(JST)) {
          // 3- The cache object is given.
          this._cache = clone(JST);
        } else {
          // 4- Don't know how to handle this variable!
          throw new Error('Cannot infer JST variables from: ' + toString(JST));
        }
      }
    };

    RemoteTemplateManager.prototype.clear = function clear() {
      this._cache = {};
    };

    RemoteTemplateManager.prototype._doFetch = function _doFetch(id, options) {
      var success = options.success;
      var error = options.error;
      var cache = this._cache;

      if (!has(cache, id) || isNull(cache[id])) {
        var prefix = this._prefix || '';
        var suffix = this._suffix || '';
        var method = this._method;
        var url = createUrl(id, prefix, suffix);
        cache[id] = _backbone2.default.ajax({
          url: url,
          method: method
        });
      }

      // If template is already in the cache.
      var cachedValue = cache[id];
      if (isString(cachedValue)) {
        setTimeout(function () {
          success(cachedValue);
        });

        return;
      }

      var onSuccess = function onSuccess(data) {
        // Remove promise from cache and populate with template.
        cache[id] = data;

        // Trigger success.
        success(data);
      };

      var onError = function onError(xhr) {
        // Remove from cache, maybe we will be luckier on next try.
        cache[id] = null;

        // Then, trigger error callback.
        error({
          status: xhr.status,
          message: xhr.responseText
        });
      };

      cache[id].then(onSuccess, onError);
    };

    return RemoteTemplateManager;
  }(AbstractTemplateManager);

  var _compile = function _compile(html) {
    return _underscore2.default.template(html);
  };

  /**
   * Default compile function.
   *
   * @param {string} html HTML Input.
   * @return {function} Render function.
   */
  var _compile2 = function _compile2(html) {
    return _compile(html);
  };

  /**
   * Override the default compile function.
   *
   * @param {function} compileFn The new compile function.
   * @return {void}
   */
  var overrideCompile = function overrideCompile(compileFn) {
    _compile = compileFn;
  };

  var _templateManager = new RemoteTemplateManager();

  /**
   * Default template manager (default is the remote template
   * manager).
   *
   * @return {object} Global template manager.
   */
  var _templateManager2 = function _templateManager2() {
    return _templateManager;
  };

  /**
   * Override the default template manager.
   *
   * @param {object} templateManager Thew new default template manager.
   * @return {void}
   */
  var overrideTemplateManager = function overrideTemplateManager(templateManager) {
    // Clear template manager before overriding it.
    _templateManager.clear();

    // Set new default template manager.
    _templateManager = templateManager;
  };

  var EVT_PREFIX = 'render';

  var TemplateView = function (_Backbone$View) {
    _inherits(TemplateView, _Backbone$View);

    function TemplateView() {
      _classCallCheck(this, TemplateView);

      return _possibleConstructorReturn(this, _Backbone$View.apply(this, arguments));
    }

    TemplateView.prototype.templates = function templates() {
      return null;
    };

    TemplateView.prototype.templateManager = function templateManager() {
      return _templateManager2();
    };

    TemplateView.prototype.compile = function compile(html) {
      return _compile2(html);
    };

    TemplateView.prototype.toJSON = function toJSON(options) {
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
    };

    TemplateView.prototype.render = function render() {
      var _this6 = this;

      var templates = result(this, 'templates');
      if (!isEmpty(templates)) {
        // Trigger event
        this.trigger(EVT_PREFIX + ':loading');

        // Get view's template manager.
        // Use _.result if template manager is a static variable defined
        // on the class.
        var tmplMngr = result(this, 'templateManager');

        // Fetch templates and render view on success.
        tmplMngr.fetch(templates, {
          success: function success(results) {
            _this6._renderTemplates(templates, results);
            _this6.trigger(EVT_PREFIX + ':success');
          },

          error: function error() {
            _this6.trigger(EVT_PREFIX + ':error');
            // Should we throw an exception?
          }
        });

        return this;
      }
    };

    TemplateView.prototype._renderTemplates = function _renderTemplates(templates, results) {
      var main = isArray(templates) ? results[0] : results;
      var partials = isArray(results) ? results : null;
      var output = this._toHTML(main, partials);
      this._setHtml(output);
      return this;
    };

    TemplateView.prototype._toHTML = function _toHTML(main, partials) {
      var html = this.compile(main);
      return html(this.toJSON(), partials);
    };

    TemplateView.prototype._setHtml = function _setHtml(output) {
      this.$el.html(output);
      return this;
    };

    return TemplateView;
  }(_backbone2.default.View);

  // Add `extend` method from Backbone.
  TemplateView.extend = _backbone2.default.View.extend;

  exports.DomTemplateManager = DomTemplateManager;
  exports.RemoteTemplateManager = RemoteTemplateManager;
  exports.compile = _compile2;
  exports.overrideCompile = overrideCompile;
  exports.templateManager = _templateManager2;
  exports.overrideTemplateManager = overrideTemplateManager;
  exports.TemplateView = TemplateView;
});