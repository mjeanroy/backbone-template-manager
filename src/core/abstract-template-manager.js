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

const firstEntry = obj => obj[_.keys(obj)[0]];

export class AbstractTemplateManager {
  constructor(options) {
    this.options = options || {};
    this.initialize(this.options);
  }

  initialize() {
    // No op, should be implemented by subclass.
  }

  fetch(templates, options) {
    let opts = options || {};

    let sources;
    let singular;
    if (_.isString(templates)) {
      singular = true;
      sources = [templates];
    } else if (_.isArray(templates) && _.every(templates, _.isString)) {
      singular = false;
      sources = templates;
    } else {
      throw new Error(`Templates must be a string or an array of string, found: ${templates}`);
    }

    let success = opts.success || _.noop;
    let error = opts.error || _.noop;
    let done = opts.done || _.noop;

    const onDone = _.after(sources.length, results => {
      const ok = singular ? firstEntry(results.success) : results.success;
      const ko = singular ? firstEntry(results.errors) : results.errors;

      if (_.isEmpty(ko)) {
        success(ok);
      } else {
        error(ko);
      }

      done(ok, ko);

      // Free memory.
      success = error = done = null;
    });

    const results = {
      success: {},
      errors: {}
    };

    _.forEach(sources, source => {
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

  _doFetch() {
    throw new Error('Method "doFetch" should be implemented');
  }
}
