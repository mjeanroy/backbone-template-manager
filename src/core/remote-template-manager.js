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

import _ from 'underscore';
import Backbone from 'backbone';
import {AbstractTemplateManager} from 'core/abstract-template-manager';

const DEFAULT_PREFIX = '/templates';
const DEFAULT_SUFFIX = '.template.html';
const or = (val, def) => _.isUndefined(val) ? def : val;

export class RemoteTemplateManager extends AbstractTemplateManager {
  initialize(options) {
    this._prefix = or(_.result(options, 'prefix'), DEFAULT_PREFIX);
    this._suffix = or(_.result(options, 'suffix'), DEFAULT_SUFFIX);
    this._method = options.method || 'GET';
    this._cache = {};
  }

  /**
   * Clear request cache.
   */
  clear() {
    this._cache = {};
  }

  _doFetch(id, options) {
    const success = options.success;
    const error = options.error;
    const cache = this._cache;

    if (!_.has(cache, id) || _.isNull(cache[id])) {
      const prefix = this._prefix || '';
      const suffix = this._suffix || '';
      const method = this._method;
      const url = `${prefix}/${id}${suffix}`;
      cache[id] = Backbone.ajax({
        url: url,
        method: method
      });
    }

    cache[id]
      .done(data => success(data))
      .fail(xhr => {
        // Remove from cache, maybe we will be luckier on next try.
        cache[id] = null;

        error({
          status: xhr.status,
          message: xhr.responseText
        });
      });
  }
}
