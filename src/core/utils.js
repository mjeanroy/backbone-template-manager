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

import _ from 'underscore';

export const noop = _.noop;
export const has = _.has;
export const keys = _.keys;
export const after = _.after;
export const isNull = _.isNull;
export const isUndefined = _.isUndefined;
export const isString = _.isString;
export const isNumber = _.isNumber;
export const isArray = _.isArray;
export const isObject = _.isObject;
export const isBoolean = _.isBoolean;
export const defaults = _.defaults;
export const isEmpty = _.isEmpty;
export const result = _.result;
export const every = _.every;
export const forEach = _.forEach;
export const clone = _.clone;

export const or = (val, def) => isUndefined(val) ? def : val;

/**
 * Trim a string, using native `String.prototype.trim` if available or a regexp
 * as a fallback.
 * @param {string} val String value to trim.
 * @return {string} Trimmed value.
 */
export const trim = (val) => {
  if (!val || !isString(val)) {
    return val;
  }

  return String.prototype.trim ?
    String.prototype.trim.call(val) :
    val.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
};

export const toString = (val) => {
  if (isNull(val) || isUndefined(val)) {
    return String(val);
  }

  if (isNumber(val) || isString(val) || isBoolean(val)) {
    return val.toString();
  }

  // Object or array: use JSON.stringify
  return JSON.stringify(val);
};
