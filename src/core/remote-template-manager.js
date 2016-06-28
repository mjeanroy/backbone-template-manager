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
import {has, result, isNull, or} from 'core/utils';
import {AbstractTemplateManager} from 'core/abstract-template-manager';

const DEFAULT_PREFIX = '/templates';
const DEFAULT_SUFFIX = '.template.html';

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
      const url = `${prefix}/${id}${suffix}`;
      cache[id] = Backbone.ajax({
        url: url,
        method: method
      });
    }

    const onSuccess = data => success(data);
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
