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

import {noop, keys, after, isString, isEmpty, isArray, every, forEach, toString} from './utils';

const firstEntry = obj => obj[keys(obj)[0]];

/**
 * Partial implementation of template manager.
 * A template manager is a simple class that can be used to fetch
 * templates according to several strategies, such as:
 *  - Querying the DOM for templates.
 *  - Make an ajax call to fetch templates on the server.
 */
export class AbstractTemplateManager {
  /**
   * Constructor using options as arguments.
   * The constructor will automatically called the `initialize` function
   * with a valid options object (empty object if no options given).
   *
   * @param {object?} options Optional options.
   */
  constructor(options) {
    this.options = options || {};
    this.initialize(this.options);
  }

  /**
   * Initalize function.
   *
   * @param {object} options Options object (may be an empty object).
   */
  initialize() {
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
   * @param {string|array<string>} templates Templates to fetch (required).
   * @param {object?} options Option object.
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
   */
  _doFetch() {
    throw new Error('Method "doFetch" should be implemented');
  }
}
