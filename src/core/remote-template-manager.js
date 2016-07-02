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
import {has, result, isNull, isString, isObject, isBoolean, isArray, clone, or, toString} from './utils';
import {AbstractTemplateManager} from './abstract-template-manager';

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

export class RemoteTemplateManager extends AbstractTemplateManager {
  /**
   * Initialize template manager with options, with:
   * - prefix: default is '/templates'.
   * - suffix: default is '.template.html'.
   * - method: default is 'GET'.
   *
   * An empty cache is initialized.
   *
   * @param {object} options Options object.
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
      setTimeout(() => success(cachedValue));
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
