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

import {defaults, result, isEmpty, isArray, noop} from './utils';
import {compile} from './compile';
import {templateManager} from './template-manager';
import {VIEW_RENDER_LOADING, VIEW_RENDER_SUCCESS, VIEW_RENDER_ERROR, VIEW_RENDER_DONE} from './view-events';

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
export const TemplateViewMixin = {
  /**
   * Template / Array of templates to load to render the view.
   * May return:
   *  - A single string.
   *  - An array of strings.
   *
   * Each entry should be:
   *  - A selector in the DOM if view use an instance of DomTemplateManager.
   *  - A template URL if view use an instance of RemoteTemplateManager.
   *
   * @return {string|array<string>} Templates to load in the browser.
   */
  templates() {
    return null;
  },

  /**
   * Default template manager for the view: by default, delegate
   * to`defaults.templateManager` but sub classes may override this function to
   * provide a template manager for this view particularly.
   *
   * @return {TemplateView} The template manager for this view.
   */
  templateManager() {
    return templateManager();
  },

  /**
   * Compile HTML and produce a render function: by default, delegate
   * to`defaults.compile` but sub classes may override this function to
   * provide a custom compile implementation for this view particularly.
   *
   * @param {string} html HTML input.
   * @return {function} Render function.
   */
  compile(html) {
    return compile(html);
  },

  /**
   * Default implementation.
   *
   * This will create an object such as:
   *  ```
   *    {
   *      model: model.toJSON(options),
   *      collection: collection.toJSON(options),
   *    }
   *  ```
   *
   * Note that if `model` or `collection` are not defined, it will not be
   * added to the result object.
   *
   * @param {object} options Optional options given to the `toJSON` methods of models.
   * @return {object} Data object rendered into the view.
   */
  toJSON(options) {
    // Result object.
    const results = {};

    // Add `view` options to let model knows that `toJSON` is called from a view.
    const opts = defaults(options || {}, {
      view: true,
    });

    // Add model if it exists.
    if (this.model) {
      results.model = this.model.toJSON(opts);
    }

    // Add collection if it exists.
    if (this.collection) {
      results.collection = this.collection.toJSON(opts);
    }

    return results;
  },

  /**
   * Hook triggered when is going to be rendered (template has not been fetched yet).
   * Default is a no-op.
   * @return {void}
   */
  onBeforeRender() {
  },

  /**
   * Hook triggered when view is rendered (template has been fetched and view has
   * been rendered with view-model).
   * Default is a no-op.
   * @return {void}
   */
  onRender() {
  },

  /**
   * Hook triggered when view is rendered (template has been fetched and view has
   * been rendered with view-model).
   * Default is a no-op.
   * @return {void}
   */
  onRenderError() {
  },

  /**
   * Hook triggered when view rendering is done (success or error).
   * Default is a no-op.
   * @param {Object} err The error, if an error occurred during rendering.
   * @return {void}
   */
  onRendered(err) {
  },

  /**
   * Fetch templates.
   * The `success` or `error` callbacks may be given in the `options`
   * parameter.
   *
   * @param {Object} options Options, may contain `success` or `error` callbacks.
   * @return {void}
   */
  fetchTemplates(options) {
    this._doFetchTemplates(options);
  },

  /**
   * Render templates with view model.
   *
   * @return {void}
   */
  renderTemplates() {
    const templates = result(this, 'templates');
    const options = {
      success: (results) => {
        // View may not have any templates to render.
        if (results) {
          this._renderTemplates(templates, results);
        }

        this._triggerRenderSuccess();
      },

      error: (err) => {
        this._triggerRenderError(err);
      },
    };

    this._triggerBeforeRender();
    this._doFetchTemplates(options, templates);
  },

  /**
   * Fetch templates.
   * The `success` or `error` callbacks may be given in the `options`
   * parameter.
   *
   * @param {Object} options Options, may contain `success` or `error` callbacks.
   * @param {*} templates Templates to fetch.
   * @return {void}
   */
  _doFetchTemplates(options = {}, templates = result(this, 'templates')) {
    const success = options.success || noop;
    const error = options.error || noop;

    if (!isEmpty(templates)) {
      // Get view's template manager.
      // Use _.result if template manager is a static variable defined
      // on the class.
      const templateManager = result(this, 'templateManager');

      // Fetch templates and trigger success/error callbacks.
      templateManager.fetch(templates, {success, error});
    } else {
      // View does not have templates to render, trigger success
      // callback.
      success(null);
    }
  },

  /**
   * Trigger events and callbacks that notify of view rendering.
   * @return {void}
   */
  _triggerBeforeRender() {
    this.trigger(VIEW_RENDER_LOADING);
    this.onBeforeRender();
  },

  /**
   * Trigger events and callback that notify of view rendering (in success).
   * @return {void}
   */
  _triggerRenderSuccess() {
    this.trigger(VIEW_RENDER_SUCCESS);
    this.onRender();
    this._triggerRenderDone();
  },

  /**
   * Trigger events and callback that notify of view rendering (in error).
   * @param {Object} err Optional error details.
   * @return {void}
   */
  _triggerRenderError(err = null) {
    this.trigger(VIEW_RENDER_ERROR, err);
    this.onRenderError();
    this._triggerRenderDone(err);
  },

  /**
   * Trigger events and callback that notify that view rendering is done.
   * @param {Object} err Optional data to send in event (when view has not been rendered in success).
   * @return {void}
   */
  _triggerRenderDone(err = null) {
    this.trigger(VIEW_RENDER_DONE, err);
    this.onRendered(err);
  },

  /**
   * Render templates into the view.
   * This function should not be called directly but it can be overridden
   * with custom logic.
   *
   * @param {(string|array<string>)} templates Set of templates sources.
   * @param {(string|object<string, string>)} results Fetched templates.
   * @return {TemplateView} Current view (for chaining).
   */
  _renderTemplates(templates, results) {
    const multiple = isArray(templates);
    const main = multiple ? results[templates[0]] : results;
    const partials = multiple ? results : null;
    const viewPartials = this._buildPartials(partials);
    const output = this._toHTML(main, viewPartials);
    this._setHtml(output);
    return this;
  },

  /**
   * Build partials dictionnary for this view.
   * This method can be overrided to:
   * - Extend default partials definition (such as dynamic view partials).
   * - Change partials definiton for this view only.
   *
   * @param {Object} partials Partials, extracted from view `templates` definition.
   * @return {Object} The partial dictionnary.
   */
  _buildPartials(partials) {
    return partials;
  },

  /**
   * Produce HTML output from main template and optional partials.
   * This function should not be called directly but it can be overridden
   * with custom logic.
   *
   * @param {string} main Main template.
   * @param {?(object<string, string>)} partials Optional partials.
   * @return {string} HTML output.
   */
  _toHTML(main, partials) {
    const html = this.compile(main);
    return html(this.toJSON(), partials);
  },

  /**
   * Update view content with new html output.
   * This function should not be called directly but it can be overridden
   * with custom logic (use sanitization for example).
   *
   * @param {string} output New html content.
   * @return {TemplateView} Current view (for chaining).
   */
  _setHtml(output) {
    this.$el.html(output);
    return this;
  },
};
