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

import Backbone from 'backbone';
import {TemplateViewMixin} from './template-view-mixin';

/**
 * Implementation of `Backbone.View` that use a template manager to fetch templates
 * and render the view.
 * View data are retrieved using `toJSON` method: by default, this method return the
 * result of `model.toJSON({view: true})` and/or `collection.toJSON({view: true}) method as
 * an object such as:
 * ```
 *   {
 *     model: view.model.toJSON({view: true}),           // not set if view.model does not exist
 *     collection: view.collection.toJSON({view: true}), // not set if view.collection does not exist
 *   }
 * ```
 *
 * @class
 */
export const TemplateView = Backbone.View.extend(TemplateViewMixin).extend({
  /**
   * Default render function:
   *
   *  1. Get view template manager.
   *  2. Fetch templates.
   *  3. Compile templates.
   *  4. Produce data model (calling `toJSON`).
   *  5. Render view with templates.
   *  6. Trigger events and callbacks (success or error).
   *
   * @return {TemplateView} Current view (for chaining).
   */
  render() {
    this.renderTemplates();
    return this;
  },
});
