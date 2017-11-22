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

import Backbone from 'backbone';
import _ from 'underscore';

const noop = _.noop;
const has = _.has;
const keys = _.keys;
const after = _.after;
const isNull = _.isNull;
const isUndefined = _.isUndefined;
const isString = _.isString;
const isNumber = _.isNumber;
const isArray = _.isArray;
const isObject = _.isObject;
const isBoolean = _.isBoolean;
const defaults = _.defaults;
const isEmpty = _.isEmpty;
const result = _.result;
const every = _.every;
const forEach = _.forEach;

const or = (val, def) => isUndefined(val) ? def : val;

/**
 * Trim a string, using native `String.prototype.trim` if available or a regexp
 * as a fallback.
 * @param {string} val String value to trim.
 * @return {string} Trimmed value.
 */
const trim = (val) => {
  if (!val || !isString(val)) {
    return val;
  }

  return String.prototype.trim ?
    String.prototype.trim.call(val) :
    val.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
};

const toString = (val) => {
  if (isNull(val) || isUndefined(val)) {
    return String(val);
  }

  if (isNumber(val) || isString(val) || isBoolean(val)) {
    return val.toString();
  }

  // Object or array: use JSON.stringify
  return JSON.stringify(val);
};

const firstEntry = (obj) => obj[keys(obj)[0]];

/**
 * Partial implementation of template manager.
 * A template manager is a simple class that can be used to fetch
 * templates according to several strategies, such as:
 *  - Querying the DOM for templates.
 *  - Make an ajax call to fetch templates on the server.
 *
 * Constructor using options as arguments.
 * The constructor will automatically called the `initialize` function
 * with a valid options object (empty object if no options given).
 *
 * @param {object} options Optional options.
 * @constructor
 * @class
 */
const AbstractTemplateManager = function(options) {
  this.options = options || {};
  this.initialize(this.options);
};

AbstractTemplateManager.prototype = {
  /**
   * Initalize function.
   *
   * @param {object} options Option object.
   * @return {void}
   * @abstract
   */
  initialize(options) {
  },

  /**
   * Fetch a template (or an array of templates).
   *
   * If templates is a string, then a single template is fetched, otherwise each
   * templates in the array will be fetched.
   *
   * Option argument can defined a `success` and an `error` callback:
   *  - The `success` callback will be resolved with the template value if first
   *    argument is a string, or an object (key is the template id, value is the
   *    resolved template) if first argument is an array.
   *  - The `error` callback will be resolved if at least one template cannot be
   *    resolved. This callback will be called with the error object as first argument
   *    and valid template (i.e the ones that could be resolved).
   *
   * Note that if first argument is not a string or an array of string, an error
   * will be thrown.
   *
   * @param {(string|Array<string>)} templates Templates to fetch (required).
   * @param {object} options Option object.
   * @return {void}
   */
  fetch(templates, options) {
    let opts = options || {};

    let sources;
    let singular;
    if (isString(templates)) {
      singular = true;
      sources = [templates];
    } else if (isArray(templates) && !isEmpty(templates) && every(templates, isString)) {
      singular = false;
      sources = templates;
    } else {
      throw new Error(`Templates must be a string or an array of string, found: ${toString(templates)}`);
    }

    let success = opts.success || noop;
    let error = opts.error || noop;
    let done = opts.done || noop;

    const onDone = after(sources.length, (results) => {
      let ok;
      let ko;

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
    const results = {
      success: {},
      errors: {},
    };

    forEach(sources, (source) => {
      this._doFetch(source, {
        success: (template) => {
          results.success[source] = template;
          onDone(results);
        },

        error: (error) => {
          results.errors[source] = error;
          onDone(results);
        },
      });
    });
  },

  /**
   * Clear template manager (i.e clear cache if appropriate).
   *
   * @return {void}
   */
  clear() {
  },

  /**
   * Fetch a single template.
   * This method must be overridden by sub classes, default implementation
   * throw an error.
   *
   * @param {string} template Template to fetch.
   * @param {object} options Options object containing success / error callback.
   * @return {void}
   * @abstract
   */
  _doFetch(template, options) {
    throw new Error('Method "doFetch" should be implemented');
  },
};

AbstractTemplateManager.extend = Backbone.View.extend;

/**
 * Flag to check if ES6 Map are supported by the runtime environment (for example,
 * it is not supported without polyfill in IE 8, 9, 10).
 * @type {boolean}
 */
const SUPPORT_ES6_MAP = typeof Map !== 'undefined';

const Cache = SUPPORT_ES6_MAP ? Map : (() => {
  /**
   * A NIL Object that will be used to flag entries that has been previously deleted.
   * As V8 deoptimize entire function using the `delete` operator, this
   * implementation does not use `delete` at all and use this object instance
   * to flag "missing" entry.
   */
  const NIL_OBJECT = {};

  /**
   * Map implementation fallback.
   */
  return class FallbackMap {
    /**
     * Create the cache.
     * @constructor
     */
    constructor() {
      this._o = {};
    }

    /**
     * Check if the given `key` is associated to a value in the
     * cache.
     *
     * @param {string} key The key.
     * @return {boolean} `true` if the entry is in the cache, `false` otherwise.
     */
    has(key) {
      return has(this._o, key) && this._o[key] !== NIL_OBJECT;
    }

    /**
     * Get the value associated to the given key, or `undefined` if the
     * entry is not in the cache.
     *
     * @param {string} key The entry id.
     * @return {*} The value associated to the given key.
     */
    get(key) {
      return this.has(key) ? this._o[key] : undefined;
    }

    /**
     * Put entry in the cache (override the old one if an entry already exist).
     *
     * @param {string} key The entry id.
     * @param {*} value The entry value.
     * @return {void}
     */
    set(key, value) {
      this._o[key] = value;
    }

    /**
     * Clear the cache.
     *
     * @return {void}
     */
    clear() {
      this._o = {};
    }

    /**
     * Remove entry in the cache.
     *
     * @param {string} key Entry id.
     * @return {void}
     */
    delete(key) {
      if (has(this._o, key)) {
        this._o[key] = NIL_OBJECT;
      }
    }
  };
})();

// Default selector factory, used if no factory is specified during
// initialization.
const defaultSelectorFactory = (id) => `[data-template-id="${id}"]`;

/**
 * Template Manager implementation that fetch templates from the DOM, each templates
 * will be search with a given selector.
 * @class
 */
const DomTemplateManager = AbstractTemplateManager.extend({
  /**
   * Initialize template manager (i.e initialize empty cache).
   *
   * Options object can be used to override default selector factory.
   * The default will build selector such as:
   *   `[data-template-id="${id}"]`
   *
   * @param {object} options Options object.
   * @return {void}
   */
  initialize(options) {
    this.selector = or(options.selector, defaultSelectorFactory);
    this._cache = new Cache();
  },

  /**
   * Clear DOM cache.
   * @return {void}
   */
  clear() {
    this._cache.clear();
  },

  /**
   * Fetch template from the dom.
   * Error callback will be triggered if no DOM element can be found or if
   * selector match more than one element.
   *
   * @param {string} id DOM selector.
   * @param {Object} options Options object, containing success/error callbacks.
   * @return {void}
   * @override
   */
  _doFetch(id, options) {
    setTimeout(() => {
      const success = options.success;
      const error = options.error;
      const cache = this._cache;

      // Already in cache.
      if (cache.has(id)) {
        success(cache.get(id));
        return;
      }

      // Query template in the DOM.
      const selector = this.selector(id);
      const node = Backbone.$(selector);
      if (isEmpty(node) || node.length === 0) {
        error({data: `Cannot find template: ${id}`});
      } else if (node.length > 1) {
        error({data: `Found multiple templates for selector: ${selector}`});
      } else {
        // Put in the cache for next resolution.
        const html = trim(node.html());
        cache.set(id, html);
        success(html);
      }
    });
  },
});

const URL_SEPARATOR = '/';
const DEFAULT_PREFIX = '/templates/';
const DEFAULT_SUFFIX = '.template.html';
const createUrl = (path, prefix, suffix) => {
  const firstPath = path.charAt(0);
  const lastPath = path.length > 1 ? path.charAt(path.length - 1) : '';
  const lastPrefix = prefix.charAt(prefix.length - 1);
  const firstSuffix = suffix.charAt(0);

  let realPath = path;

  if (firstPath === URL_SEPARATOR && lastPrefix === URL_SEPARATOR) {
    // Avoid double slash with prefix.
    realPath = path.slice(1);
  } else if (firstPath !== URL_SEPARATOR && lastPrefix !== URL_SEPARATOR) {
    // Prepend with slash (should it be an option?).
    realPath = `/${path}`;
  }

  // Avoid double slash with suffix.
  if (lastPath === URL_SEPARATOR && firstSuffix === URL_SEPARATOR) {
    realPath = realPath.slice(0, realPath.length - 1);
  }

  return `${prefix}${realPath}${suffix}`;
};

/**
 * Template Manager that will fetch templates from a remote endpoint.
 *
 * Each template URL will (by default) be built with:
 * - A prefix (default is `/templates`).
 * - A suffix (default is `.template.html`).
 *
 * Each template will (by default) be fetched with `GET` method.
 * @class
 */
const RemoteTemplateManager = AbstractTemplateManager.extend({
  /**
   * Initialize template manager with options, with:
   * - prefix: default is '/templates'.
   * - suffix: default is '.template.html'.
   * - method: default is 'GET'.
   *
   * An empty cache is initialized.
   *
   * @param {object} options Options object.
   * @return {void}
   */
  initialize(options) {
    this._prefix = or(result(options, 'prefix'), DEFAULT_PREFIX);
    this._suffix = or(result(options, 'suffix'), DEFAULT_SUFFIX);
    this._method = options.method || 'GET';
    this._cache = new Cache();

    // Try to initialize cache with JavaScript templates created
    // at build time.
    const JST = options.JST;
    if (JST) {
      let o;

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
        throw new Error(`Cannot infer JST variables from: ${toString(JST)}`);
      }

      // Put everything in the cache.
      forEach(keys(o || {}), (k) => {
        this._cache.set(k, o[k]);
      });
    }
  },

  /**
   * Clear request cache.
   * @return {void}
   */
  clear() {
    this._cache.clear();
  },

  /**
   * Fetch template and trigger success callback if request succed,
   * error callback on failure.
   *
   * @param {string} id Template id.
   * @param {object} options Option object, containing success/error callbacks.
   * @return {void}
   */
  _doFetch(id, options) {
    const success = options.success;
    const error = options.error;
    const cache = this._cache;

    if (!cache.has(id)) {
      const prefix = this._prefix || '';
      const suffix = this._suffix || '';
      const method = this._method;
      const url = createUrl(id, prefix, suffix);
      cache.set(id, Backbone.ajax({
        url: url,
        method: method,
      }));
    }

    // If template is already in the cache.
    const cachedValue = cache.get(id);
    if (isString(cachedValue)) {
      setTimeout(() => {
        success(cachedValue);
      });

      return;
    }

    const onSuccess = (data) => {
      // Remove promise from cache and populate with template.
      cache.set(id, data);

      // Trigger success.
      success(data);
    };

    const onError = (xhr) => {
      // Remove from cache, maybe we will be luckier on next try.
      cache.delete(id);

      // Then, trigger error callback.
      error({
        status: xhr.status,
        message: xhr.responseText,
      });
    };

    cache.get(id).then(onSuccess, onError);
  },
});

let _compile = (html) => _.template(html);

/**
 * Default compile function.
 *
 * @param {string} html HTML Input.
 * @return {function} Render function.
 */
const compile = (html) => _compile(html);

/**
 * Override the default compile function.
 *
 * @param {function} compileFn The new compile function.
 * @return {void}
 */
const overrideCompile = (compileFn) => {
  _compile = compileFn;
};

let _templateManager = new RemoteTemplateManager();

/**
 * Default template manager (default is the remote template
 * manager).
 *
 * @return {object} Global template manager.
 */
const templateManager = () => _templateManager;

/**
 * Override the default template manager.
 *
 * @param {object} templateManager Thew new default template manager.
 * @return {void}
 */
const overrideTemplateManager = (templateManager) => {
  // Clear template manager before overriding it.
  _templateManager.clear();

  // Set new default template manager.
  _templateManager = templateManager;
};

const PREFIX = `render`;

/**
 * The view `render:loading` event.
 * @type {string}
 */
const VIEW_RENDER_LOADING = `${PREFIX}:loading`;

/**
 * The view `render:success` event.
 * @type {string}
 */
const VIEW_RENDER_SUCCESS = `${PREFIX}:success`;

/**
 * The view `render:error` event.
 * @type {string}
 */
const VIEW_RENDER_ERROR = `${PREFIX}:error`;

/**
 * The view `render:error` event.
 * @type {string}
 */
const VIEW_RENDER_DONE = `${PREFIX}:done`;

/**
 * Implementation of `Backbone.View` that use a template manager to fetch templates
 * and render the view.
 * View data are retrieved using `toJSON` method: by default, this method return the
 * result of `model.toJSON({view: true})` and/or `collection.toJSON({view: true}) method as
 * an object such as:
 * ```
 *   {
 *     model: view.model.toJSON({view: true}),           // not set if view.model does not exist
 *     collection: view.collection.toJSON({view: true}), // not set if view.collection does not exist
 *   }
 * ```
 *
 * @class
 */
const TemplateViewMixin = {
  /**
   * Template / Array of templates to load to render the view.
   * May return:
   *  - A single string.
   *  - An array of strings.
   *
   * Each entry should be:
   *  - A selector in the DOM if view use an instance of DomTemplateManager.
   *  - A template URL if view use an instance of RemoteTemplateManager.
   *
   * @return {string|array<string>} Templates to load in the browser.
   */
  templates() {
    return null;
  },

  /**
   * Default template manager for the view: by default, delegate
   * to`defaults.templateManager` but sub classes may override this function to
   * provide a template manager for this view particularly.
   *
   * @return {TemplateView} The template manager for this view.
   */
  templateManager() {
    return templateManager();
  },

  /**
   * Compile HTML and produce a render function: by default, delegate
   * to`defaults.compile` but sub classes may override this function to
   * provide a custom compile implementation for this view particularly.
   *
   * @param {string} html HTML input.
   * @return {function} Render function.
   */
  compile(html) {
    return compile(html);
  },

  /**
   * Default implementation.
   *
   * This will create an object such as:
   *  ```
   *    {
   *      model: model.toJSON(options),
   *      collection: collection.toJSON(options),
   *    }
   *  ```
   *
   * Note that if `model` or `collection` are not defined, it will not be
   * added to the result object.
   *
   * @param {object} options Optional options given to the `toJSON` methods of models.
   * @return {object} Data object rendered into the view.
   */
  toJSON(options) {
    // Result object.
    const results = {};

    // Add `view` options to let model knows that `toJSON` is called from a view.
    const opts = defaults(options || {}, {
      view: true,
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

  /**
   * Hook triggered when is going to be rendered (template has not been fetched yet).
   * Default is a no-op.
   * @return {void}
   */
  onBeforeRender() {
  },

  /**
   * Hook triggered when view is rendered (template has been fetched and view has
   * been rendered with view-model).
   * Default is a no-op.
   * @return {void}
   */
  onRender() {
  },

  /**
   * Hook triggered when view is rendered (template has been fetched and view has
   * been rendered with view-model).
   * Default is a no-op.
   * @return {void}
   */
  onRenderError() {
  },

  /**
   * Hook triggered when view rendering is done (success or error).
   * Default is a no-op.
   * @param {Object} err The error, if an error occurred during rendering.
   * @return {void}
   */
  onRendered(err) {
  },

  /**
   * Fetch templates.
   * The `success` or `error` callbacks may be given in the `options`
   * parameter.
   *
   * @param {Object} options Options, may contain `success` or `error` callbacks.
   * @return {void}
   */
  fetchTemplates(options) {
    this._doFetchTemplates(options);
  },

  /**
   * Render templates with view model.
   *
   * @return {void}
   */
  renderTemplates() {
    const templates = result(this, 'templates');
    const options = {
      success: (results) => {
        // View may not have any templates to render.
        if (results) {
          this._renderTemplates(templates, results);
        }

        this._triggerRenderSuccess();
      },

      error: (err) => {
        this._triggerRenderError(err);
      },
    };

    this._triggerBeforeRender();
    this._doFetchTemplates(options, templates);
  },

  /**
   * Fetch templates.
   * The `success` or `error` callbacks may be given in the `options`
   * parameter.
   *
   * @param {Object} options Options, may contain `success` or `error` callbacks.
   * @param {*} templates Templates to fetch.
   * @return {void}
   */
  _doFetchTemplates(options = {}, templates = result(this, 'templates')) {
    const success = options.success || noop;
    const error = options.error || noop;

    if (!isEmpty(templates)) {
      // Get view's template manager.
      // Use _.result if template manager is a static variable defined
      // on the class.
      const templateManager$$1 = result(this, 'templateManager');

      // Fetch templates and trigger success/error callbacks.
      templateManager$$1.fetch(templates, {success, error});
    } else {
      // View does not have templates to render, trigger success
      // callback.
      success(null);
    }
  },

  /**
   * Trigger events and callbacks that notify of view rendering.
   * @return {void}
   */
  _triggerBeforeRender() {
    this.trigger(VIEW_RENDER_LOADING);
    this.onBeforeRender();
  },

  /**
   * Trigger events and callback that notify of view rendering (in success).
   * @return {void}
   */
  _triggerRenderSuccess() {
    this.trigger(VIEW_RENDER_SUCCESS);
    this.onRender();
    this._triggerRenderDone();
  },

  /**
   * Trigger events and callback that notify of view rendering (in error).
   * @param {Object} err Optional error details.
   * @return {void}
   */
  _triggerRenderError(err = null) {
    this.trigger(VIEW_RENDER_ERROR, err);
    this.onRenderError();
    this._triggerRenderDone(err);
  },

  /**
   * Trigger events and callback that notify that view rendering is done.
   * @param {Object} err Optional data to send in event (when view has not been rendered in success).
   * @return {void}
   */
  _triggerRenderDone(err = null) {
    this.trigger(VIEW_RENDER_DONE, err);
    this.onRendered(err);
  },

  /**
   * Render templates into the view.
   * This function should not be called directly but it can be overridden
   * with custom logic.
   *
   * @param {(string|array<string>)} templates Set of templates sources.
   * @param {(string|object<string, string>)} results Fetched templates.
   * @return {TemplateView} Current view (for chaining).
   */
  _renderTemplates(templates, results) {
    const multiple = isArray(templates);
    const main = multiple ? results[templates[0]] : results;
    const partials = multiple ? results : null;
    const output = this._toHTML(main, partials);
    this._setHtml(output);
    return this;
  },

  /**
   * Produce HTML output from main template and optional partials.
   * This function should not be called directly but it can be overridden
   * with custom logic.
   *
   * @param {string} main Main template.
   * @param {?(object<string, string>)} partials Optional partials.
   * @return {string} HTML output.
   */
  _toHTML(main, partials) {
    const html = this.compile(main);
    return html(this.toJSON(), partials);
  },

  /**
   * Update view content with new html output.
   * This function should not be called directly but it can be overridden
   * with custom logic (use sanitization for example).
   *
   * @param {string} output New html content.
   * @return {TemplateView} Current view (for chaining).
   */
  _setHtml(output) {
    this.$el.html(output);
    return this;
  },
};

/**
 * Implementation of `Backbone.View` that use a template manager to fetch templates
 * and render the view.
 * View data are retrieved using `toJSON` method: by default, this method return the
 * result of `model.toJSON({view: true})` and/or `collection.toJSON({view: true}) method as
 * an object such as:
 * ```
 *   {
 *     model: view.model.toJSON({view: true}),           // not set if view.model does not exist
 *     collection: view.collection.toJSON({view: true}), // not set if view.collection does not exist
 *   }
 * ```
 *
 * @class
 */
const TemplateView = Backbone.View.extend(TemplateViewMixin).extend({
  /**
   * Default render function:
   *
   *  1. Get view template manager.
   *  2. Fetch templates.
   *  3. Compile templates.
   *  4. Produce data model (calling `toJSON`).
   *  5. Render view with templates.
   *  6. Trigger events and callbacks (success or error).
   *
   * @return {TemplateView} Current view (for chaining).
   */
  render() {
    this.renderTemplates();
    return this;
  },
});

/**
 * Public API.
 */

export { DomTemplateManager, RemoteTemplateManager, compile, overrideCompile, templateManager, overrideTemplateManager, TemplateViewMixin, TemplateView, VIEW_RENDER_LOADING, VIEW_RENDER_SUCCESS, VIEW_RENDER_ERROR, VIEW_RENDER_DONE };
