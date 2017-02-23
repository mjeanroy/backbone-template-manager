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

/* global Backbone:true */
/* global BackboneTemplateManager:true */
/* eslint-disable no-var */

(function() {
  var Framework = Backbone.Model.extend({
    urlRoot: function() {
      return '/api/frameworks';
    },
  });

  var Frameworks = Backbone.Collection.extend({
    initialize: function() {
      this.model = Framework;
    },

    url: function() {
      return '/api/frameworks';
    },
  });

  var FrameworkView = BackboneTemplateManager.TemplateView.extend({
    initialize: function(options) {
      this.model = options.model;
      this.render();
    },

    templates: function() {
      return 'framework';
    },

    tagName: function() {
      return 'div';
    },

    className: function() {
      return 'col-sm-6 col-md-4';
    },
  });

  var FrameworksView = BackboneTemplateManager.TemplateView.extend({
    initialize: function() {
      this.collection = new Frameworks();
      this.listenTo(this.collection, 'sync', this.render);
      this.listenTo(this, 'render:success', this.renderCollection);
      this.collection.fetch();
    },

    renderCollection: function() {
      var $container = this.$('.js-frameworks');
      this.collection.forEach(function(model) {
        $container.append(new FrameworkView({model}).$el);
      });
    },

    templates: function() {
      return 'frameworks';
    },
  });

  var App = Backbone.View.extend({
    initialize: function() {
      this.$el = Backbone.$('#main');
      this.render();
    },

    render: function() {
      this.$el.html(new FrameworksView().$el);
    },
  });

  // eslint-disable-next-line no-new
  new App();
})();
