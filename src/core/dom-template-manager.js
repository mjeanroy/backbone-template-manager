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
import {has, isEmpty, or} from 'core/utils';
import {AbstractTemplateManager} from 'core/abstract-template-manager';

// Default selector factory, used if no factory is specified during
// initialization.
const defaultSelectorFactory = id => `[data-template-id="${id}"]`;

export class DomTemplateManager extends AbstractTemplateManager {
  /**
   * Initialize template manager (i.e initialize empty cache).
   *
   * Options object can be used to override default selector factory.
   * The default will build selector such as:
   *   `[data-template-id="${id}"]`
   *
   * @param {object} options Options object.
   */
  initialize(options) {
    this.selector = or(options.selector, defaultSelectorFactory);
    this._cache = {};
  }

  /**
   * Clear DOM cache.
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
   * @param {object} options Options object, containing success/error callbacks.
   */
  _doFetch(id, options) {
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
  }
}
