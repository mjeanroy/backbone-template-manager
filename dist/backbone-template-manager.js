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
const clone = _.clone;

const or = (val, def) => isUndefined(val) ? def : val;

const toString = val => {
  if (isNull(val) || isUndefined(val)) {
    return String(val);
  }

  if (isNumber(val) || isString(val) || isBoolean(val)) {
    return val.toString();
  }

  // Object or array: use JSON.stringify
  return JSON.stringify(val);
};

const firstEntry = obj => obj[keys(obj)[0]];

/**
 * Partial implementation of template manager.
 * A template manager is a simple class that can be used to fetch
 * templates according to several strategies, such as:
 *  - Querying the DOM for templates.
 *  - Make an ajax call to fetch templates on the server.
 */
class AbstractTemplateManager {
  /**
   * Constructor using options as arguments.
   * The constructor will automatically called the `initialize` function
   * with a valid options object (empty object if no options given).
   *
   * @param {object} options Optional options.
   * @constructor
   */
  constructor(options) {
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
  initialize(options) {
  }

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

    const onDone = after(sources.length, results => {
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
      errors: {}
    };

    forEach(sources, source => {
      this._doFetch(source, {
        success: template => {
          results.success[source] = template;
          onDone(results);
        },

        error: error => {
          results.errors[source] = error;
          onDone(results);
        }
      });
    });
  }

  /**
   * Clear template manager (i.e clear cache if appropriate).
   *
   * @return {void}
   */
  clear() {
  }

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
  }
}

// Default selector factory, used if no factory is specified during
// initialization.
const defaultSelectorFactory = id => `[data-template-id="${id}"]`;

class DomTemplateManager extends AbstractTemplateManager {

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
    this._cache = {};
  }

  /**
   * Clear DOM cache.
   * @return {void}
   */
  clear() {
    this._cache = {};
  }

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
      if (has(cache, id)) {
        success(cache[id]);
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
        cache[id] = node.html();
        success(cache[id]);
      }
    });
  }
}

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

class RemoteTemplateManager extends AbstractTemplateManager {
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
    this._cache = {};

    // Try to initialize cache with JavaScript templates created
    // at build time.
    const JST = options.JST;
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
        throw new Error(`Cannot infer JST variables from: ${toString(JST)}`);
      }
    }
  }

  /**
   * Clear request cache.
   * @return {void}
   */
  clear() {
    this._cache = {};
  }

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

    if (!has(cache, id) || isNull(cache[id])) {
      const prefix = this._prefix || '';
      const suffix = this._suffix || '';
      const method = this._method;
      const url = createUrl(id, prefix, suffix);
      cache[id] = Backbone.ajax({
        url: url,
        method: method
      });
    }

    // If template is already in the cache.
    const cachedValue = cache[id];
    if (isString(cachedValue)) {
      setTimeout(() => {
        success(cachedValue);
      });

      return;
    }

    const onSuccess = data => {
      // Remove promise from cache and populate with template.
      cache[id] = data;

      // Trigger success.
      success(data);
    };

    const onError = xhr => {
      // Remove from cache, maybe we will be luckier on next try.
      cache[id] = null;

      // Then, trigger error callback.
      error({
        status: xhr.status,
        message: xhr.responseText
      });
    };

    cache[id].then(onSuccess, onError);
  }
}

let _compile = html => _.template(html);

/**
 * Default compile function.
 *
 * @param {string} html HTML Input.
 * @return {function} Render function.
 */
const compile = html => _compile(html);

/**
 * Override the default compile function.
 *
 * @param {function} compileFn The new compile function.
 * @return {void}
 */
const overrideCompile = compileFn => {
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
const overrideTemplateManager = templateManager => {
  // Clear template manager before overriding it.
  _templateManager.clear();

  // Set new default template manager.
  _templateManager = templateManager;
};

const EVT_PREFIX = 'render';

class TemplateView extends Backbone.View {
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
  }

  /**
   * Default template manager for the view: by default, delegate
   * to`defaults.templateManager` but sub classes may override this function to
   * provide a template manager for this view particularly.
   *
   * @return {TemplateView} The template manager for this view.
   */
  templateManager() {
    return templateManager();
  }

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
  }

  /**
   * Default implementation.
   *
   * This will create an object such as:
   *  ```
   *    {
   *      model: model.toJSON(options),
   *      collection: collection.toJSON(options)
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
  }

  /**
   * Default render function:
   *
   *  1. Get view template manager.
   *  2. Fetch templates.
   *  3. Compile templates.
   *  4. Produce data model (calling `toJSON`).
   *  4. Render view with templates.
   *
   * @return {TemplateView} Current view (for chaining).
   */
  render() {
    const templates = result(this, 'templates');
    if (!isEmpty(templates)) {
      // Trigger event
      this.trigger(`${EVT_PREFIX}:loading`);

      // Get view's template manager.
      // Use _.result if template manager is a static variable defined
      // on the class.
      const tmplMngr = result(this, 'templateManager');

      // Fetch templates and render view on success.
      tmplMngr.fetch(templates, {
        success: results => {
          this._renderTemplates(templates, results);
          this.trigger(`${EVT_PREFIX}:success`);
        },

        error: () => {
          this.trigger(`${EVT_PREFIX}:error`);
          // Should we throw an exception?
        }
      });

      return this;
    }
  }

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
    const main = isArray(templates) ? results[0] : results;
    const partials = isArray(results) ? results : null;
    const output = this._toHTML(main, partials);
    this._setHtml(output);
    return this;
  }

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
  }

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
  }
}

// Add `extend` method from Backbone.
TemplateView.extend = Backbone.View.extend;

export { DomTemplateManager, RemoteTemplateManager, compile, overrideCompile, templateManager, overrideTemplateManager, TemplateView };