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
import {forEach, keys, result, isString, isObject, isBoolean, isArray, or, toString} from './utils';
import {AbstractTemplateManager} from './abstract-template-manager';
import {Cache} from './cache';

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
export const RemoteTemplateManager = AbstractTemplateManager.extend({
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
