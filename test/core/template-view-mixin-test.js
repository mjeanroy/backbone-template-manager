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
import {templateManager} from '../../src/core/template-manager';
import {TemplateViewMixin} from '../../src/core/template-view-mixin';

describe('TemplateViewMixin', () => {
  let ViewImpl;

  beforeEach(() => {
    ViewImpl = Backbone.View.extend(TemplateViewMixin);
  });

  afterEach(() => {
    templateManager().clear();
  });

  it('should create view instance', () => {
    const view = new ViewImpl();
    expect(view).toBeDefined();
  });

  describe('once initialized', () => {
    let view;
    let fixtures;
    let defaultTemplateManager;

    beforeEach(() => {
      fixtures = document.createElement('div');
      fixtures.setAttribute('id', 'fixtures');
      document.body.appendChild(fixtures);
    });

    afterEach(() => {
      document.body.removeChild(fixtures);
    });

    beforeEach(() => {
      const el = document.createElement('div');
      el.setAttribute('id', 'el');
      fixtures.appendChild(el);

      defaultTemplateManager = templateManager();
      view = new ViewImpl({
        el: el,
      });

      spyOn(defaultTemplateManager, 'fetch').and.callThrough();
    });

    beforeEach(() => {
      jasmine.Ajax.install();
    });

    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.Ajax.uninstall();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should get empty json', () => {
      expect(view.toJSON()).toEqual({});
    });

    it('should get json with model json entry', () => {
      const model = {
        id: 1,
        name: 'John Doe',
      };

      view.model = new Backbone.Model(model);

      spyOn(view.model, 'toJSON').and.callThrough();

      const json = view.toJSON();

      expect(json).toBeDefined();
      expect(json).toEqual({model});
      expect(view.model.toJSON).toHaveBeenCalledWith({view: true});
    });

    it('should get json with collection json entry', () => {
      const collection = [
        {id: 1, name: 'John Doe'},
      ];

      view.collection = new Backbone.Collection(collection);

      spyOn(view.collection, 'toJSON').and.callThrough();

      const json = view.toJSON();

      expect(json).toBeDefined();
      expect(json).toEqual({collection});
      expect(view.collection.toJSON).toHaveBeenCalledWith({view: true});
    });

    it('should get json with model and collection entries', () => {
      const collection = [
        {id: 1, name: 'John Doe'},
      ];

      const model = {
        id: 2,
        name: 'Jane Doe',
      };

      view.collection = new Backbone.Collection(collection);
      view.model = new Backbone.Model(model);

      spyOn(view.collection, 'toJSON').and.callThrough();
      spyOn(view.model, 'toJSON').and.callThrough();

      const json = view.toJSON();

      expect(json).toBeDefined();
      expect(json).toEqual({model, collection});
      expect(view.model.toJSON).toHaveBeenCalledWith({view: true});
      expect(view.collection.toJSON).toHaveBeenCalledWith({view: true});
    });

    it('should pass options to model/collection toJSON', () => {
      const collection = [
        {id: 1, name: 'John Doe'},
      ];

      const model = {
        id: 2,
        name: 'Jane Doe',
      };

      view.collection = new Backbone.Collection(collection);
      view.model = new Backbone.Model(model);

      spyOn(view.collection, 'toJSON').and.callThrough();
      spyOn(view.model, 'toJSON').and.callThrough();

      const json = view.toJSON({
        foo: 'bar',
      });

      expect(json).toBeDefined();
      expect(json).toEqual({model, collection});
      expect(view.model.toJSON).toHaveBeenCalledWith({foo: 'bar', view: true});
      expect(view.collection.toJSON).toHaveBeenCalledWith({foo: 'bar', view: true});
    });

    it('should use defaults.compile by default', () => {
      const html = '<div><%= model.name %></div>';
      const renderFn = view.compile(html);
      expect(renderFn).toBeDefined();

      const output = renderFn({
        model: {
          name: 'John Doe',
        },
      });

      expect(output).toBe('<div>John Doe</div>');
    });

    it('should use defaults.templateManager by default', () => {
      const viewTemplateManager = view.templateManager();
      expect(viewTemplateManager).toBeDefined();
      expect(viewTemplateManager).toBe(defaultTemplateManager);
    });

    it('should fetch single template', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = jasmine.Ajax.requests.mostRecent();
      const template = '<div>Hello <%= model.name %></div>';
      request.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html',
      });

      jasmine.clock().tick();

      expect(success).toHaveBeenCalledWith(template);
      expect(error).not.toHaveBeenCalled();
    });

    it('should fetch and trigger success without templates', () => {
      view.templates = [];
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(success).toHaveBeenCalledWith(null);
      expect(error).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).not.toHaveBeenCalled();
    });

    it('should fetch array of templates', () => {
      view.templates = ['foo', 'bar'];
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(jasmine.Ajax.requests.count()).toBe(2);
      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith(['foo', 'bar'], {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const template1 = '<div>Hello <%= model.name %></div>';
      const template2 = '<div>Bye <%= model.name %></div>';
      jasmine.Ajax.requests.at(0).respondWith({
        status: 200,
        responseText: template1,
        contentType: 'text/html',
      });

      jasmine.clock().tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      jasmine.Ajax.requests.at(1).respondWith({
        status: 200,
        responseText: template2,
        contentType: 'text/html',
      });

      expect(success).toHaveBeenCalledWith({
        foo: template1,
        bar: template2,
      });

      expect(error).not.toHaveBeenCalled();
    });

    it('should fetch single template and fail', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = jasmine.Ajax.requests.mostRecent();
      const template = '<div>Hello <%= model.name %></div>';
      request.respondWith({
        status: 404,
        responseText: template,
        contentType: 'text/html',
      });

      jasmine.clock().tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalled();
    });

    it('should render a single template', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      spyOn(view, 'trigger').and.callThrough();
      spyOn(view, 'onBeforeRender').and.callThrough();
      spyOn(view, 'onRender').and.callThrough();
      spyOn(view, 'onRenderError').and.callThrough();
      spyOn(view, 'onRendered').and.callThrough();

      view.renderTemplates();

      expect(view.onBeforeRender).toHaveBeenCalled();
      expect(view.onRender).not.toHaveBeenCalled();
      expect(view.onRenderError).not.toHaveBeenCalled();
      expect(view.onRendered).not.toHaveBeenCalled();

      expect(view.trigger).toHaveBeenCalledWith('render:loading');
      expect(view.trigger).not.toHaveBeenCalledWith('render:success');
      expect(view.trigger).not.toHaveBeenCalledWith('render:error');
      expect(view.trigger).not.toHaveBeenCalledWith('render:done');
      expect(view.$el.html()).toBe('');
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = jasmine.Ajax.requests.mostRecent();
      const template = '<div>Hello <%= model.name %></div>';
      request.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html',
      });

      jasmine.clock().tick();

      expect(view.onRender).toHaveBeenCalled();
      expect(view.onRenderError).not.toHaveBeenCalled();
      expect(view.onRendered).toHaveBeenCalled();

      expect(view.trigger).toHaveBeenCalledWith('render:success');
      expect(view.trigger).not.toHaveBeenCalledWith('render:error');
      expect(view.trigger).toHaveBeenCalledWith('render:done', null);

      const children = view.$el.children();
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('DIV');
      expect(children[0].innerHTML).toBe('Hello John Doe');
    });

    it('should not render single template with failure', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, 'trigger').and.callThrough();
      spyOn(view, 'onBeforeRender').and.callThrough();
      spyOn(view, 'onRender').and.callThrough();
      spyOn(view, 'onRenderError').and.callThrough();
      spyOn(view, 'onRendered').and.callThrough();

      view.renderTemplates();

      expect(view.onBeforeRender).toHaveBeenCalled();
      expect(view.onRender).not.toHaveBeenCalled();
      expect(view.onRenderError).not.toHaveBeenCalled();
      expect(view.onRendered).not.toHaveBeenCalled();

      expect(view.trigger).toHaveBeenCalledWith('render:loading');
      expect(view.trigger).not.toHaveBeenCalledWith('render:success');
      expect(view.trigger).not.toHaveBeenCalledWith('render:error');
      expect(view.trigger).not.toHaveBeenCalledWith('render:done');
      expect(view.$el.html()).toBe('');
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = jasmine.Ajax.requests.mostRecent();
      request.respondWith({
        status: 404,
        responseText: 'Cannot find template',
        contentType: 'text/html',
      });

      jasmine.clock().tick();

      expect(view.$el.html()).toEqual('');

      expect(view.onRenderError).toHaveBeenCalled();
      expect(view.onRender).not.toHaveBeenCalled();
      expect(view.onRendered).toHaveBeenCalled();

      expect(view.trigger).toHaveBeenCalledWith('render:error', jasmine.anything());
      expect(view.trigger).toHaveBeenCalledWith('render:done', jasmine.anything());
      expect(view.trigger).not.toHaveBeenCalledWith('render:success');
    });

    it('should render a single template using _triggerBeforeRender method', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      spyOn(view, '_triggerBeforeRender').and.callThrough();

      view.renderTemplates();

      expect(view._triggerBeforeRender).toHaveBeenCalled();
    });

    it('should render a single template using _triggerRenderSuccess method', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      spyOn(view, '_triggerRenderSuccess').and.callThrough();
      spyOn(view, '_triggerRenderError').and.callThrough();

      view.renderTemplates();

      expect(view._triggerRenderSuccess).not.toHaveBeenCalled();
      expect(view._triggerRenderError).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = jasmine.Ajax.requests.mostRecent();
      const template = '<div>Hello <%= model.name %></div>';
      request.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html',
      });

      jasmine.clock().tick();

      expect(view._triggerRenderSuccess).toHaveBeenCalled();
      expect(view._triggerRenderError).not.toHaveBeenCalled();
    });

    it('should render a single template using _triggerRenderError method', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      spyOn(view, '_triggerRenderSuccess').and.callThrough();
      spyOn(view, '_triggerRenderError').and.callThrough();

      view.renderTemplates();

      expect(view._triggerRenderSuccess).not.toHaveBeenCalled();
      expect(view._triggerRenderError).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 404,
      });

      jasmine.clock().tick();

      expect(view._triggerRenderError).toHaveBeenCalled();
      expect(view._triggerRenderSuccess).not.toHaveBeenCalled();
    });

    it('should render a single template in error using _triggerRenderDone method', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      spyOn(view, '_triggerRenderDone').and.callThrough();

      view.renderTemplates();

      expect(view._triggerRenderDone).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 404,
      });

      jasmine.clock().tick();

      expect(view._triggerRenderDone).toHaveBeenCalled();
    });

    it('should render a single template in success using _triggerRenderDone method', () => {
      view.templates = 'foo';
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      spyOn(view, '_triggerRenderDone').and.callThrough();

      view.renderTemplates();

      expect(view._triggerRenderDone).not.toHaveBeenCalled();
      expect(defaultTemplateManager.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = jasmine.Ajax.requests.mostRecent();
      const template = '<div>Hello <%= model.name %></div>';
      request.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html',
      });

      jasmine.clock().tick();

      expect(view._triggerRenderDone).toHaveBeenCalled();
    });
  });
});
