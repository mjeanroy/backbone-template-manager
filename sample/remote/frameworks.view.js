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
import {Frameworks} from '../commons/frameworks.collection';
import {FrameworkView} from './framework.view';

/**
 * Display list of frameworks.
 * @class
 */
export const FrameworksView = TemplateView.extend({
  /**
   * Initialize callback.
   * @return {void}
   * @override
   */
  initialize() {
    this.collection = new Frameworks();
    this.listenTo(this.collection, 'sync', this.render);
    this.listenTo(this, 'render:success', this.renderCollection);
    this.collection.fetch();
  },

  /**
   * Render collection into sub-views.
   * @return {void}
   */
  renderCollection() {
    const $container = this.$('.js-frameworks');
    this.collection.forEach((model) => {
      $container.append(new FrameworkView({model}).$el);
    });
  },

  /**
   * Get the view template.
   * @return {string} View template.
   * @override
   */
  templates() {
    return 'frameworks';
  },
});
