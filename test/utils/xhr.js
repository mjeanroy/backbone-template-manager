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

import {tick} from './clock';

/**
 * Trigger XHR response.
 *
 * @param {Object} xhr XHR Object.
 * @param {Object} response XHR Response.
 * @return {void}
 */
function _respond(xhr, response) {
  xhr.respondWith(response);
  tick();
}

/**
 * Get pending requests..
 *
 * @return {Object} The pending requests object.
 */
function _requests() {
  return jasmine.Ajax.requests;
}

/**
 * Trigger HTML response.
 *
 * @param {Object} xhr XHR object.
 * @param {string} html HTML Content.
 * @return {void}
 */
export function respondHtml(xhr, html) {
  _respond(xhr, {
    responseText: html,
    contentType: 'text/html',
    status: 200,
  });
}

/**
 * Response 404 error.
 *
 * @param {Object} xhr XHR Object.
 * @param {string} message Optional message.
 * @return {void}
 */
export function respond404(xhr, message = '') {
  _respond(xhr, {
    status: 404,
    contentType: 'text/html',
    responseText: message,
  });
}

/**
 * Response 404 error.
 *
 * @param {Object} xhr XHR Object.
 * @param {number} status Response status code.
 * @param {string} message Optional message.
 * @return {void}
 */
export function respond(xhr, status, message = '') {
  _respond(xhr, {
    status,
    contentType: 'text/html',
    responseText: message,
  });
}

/**
 * Get pending XHR at given index.
 *
 * @param {number} index The index, must be >= 0.
 * @return {Object} The pending XHR.
 */
export function xhrAt(index) {
  return _requests().at(index);
}

/**
 * Get the most recent pending XHR.
 *
 * @return {Object} The pending XHR.
 */
export function mostRecentXhr() {
  return _requests().mostRecent();
}

/**
 * Count number of pending XHR.
 *
 * @return {number} The number of pending XHR.
 */
export function countXhr() {
  return _requests().count();
}
