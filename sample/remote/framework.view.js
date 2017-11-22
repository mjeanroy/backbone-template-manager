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

import {TemplateView} from 'backbone-template-manager';

/**
 * Display framework item.
 * @class
 */
export const FrameworkView = TemplateView.extend({
  /**
   * Initialize view.
   * View options must contain the framework item to render.
   *
   * @param {Object} options View options.
   * @return {void}
   * @override
   */
  initialize(options) {
    this.model = options.model;
    this.render();
  },

  /**
   * Get view template.
   * @return {string} View template.
   * @return {void}
   * @override
   */
  templates() {
    return 'framework';
  },

  /**
   * Get view tag name.
   * @return {string} View tag name.
   * @override
   */
  tagName() {
    return 'div';
  },

  /**
   * Get view class name.
   * @return {string} View class name.
   * @override
   */
  className() {
    return 'col-sm-6 col-md-4';
  },
});
