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

import {has} from './utils';

/**
 * Flag to check if ES6 Map are supported by the runtime environment (for example,
 * it is not supported without polyfill in IE 8, 9, 10).
 * @type {boolean}
 */
const SUPPORT_ES6_MAP = typeof Map !== 'undefined';

export const Cache = SUPPORT_ES6_MAP ? Map : (() => {
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
