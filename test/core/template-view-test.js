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
import Backbone from 'backbone';
import {templateManager} from '../../src/core/template-manager';
import {TemplateView} from '../../src/core/template-view';
import {countXhr, mostRecentXhr, respond404, respondHtml, xhrAt} from '../utils/xhr';

describe('TemplateView', () => {
  afterEach(() => {
    templateManager().clear();
  });

  it('should create view instance', () => {
    const view = new TemplateView();
    expect(view).toBeDefined();
  });

  describe('once initialized', () => {
    let view;
    let fixtures;
    let tmplMngr;

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

      view = new TemplateView({
        el: el,
      });

      // Clear cache before each tests.
      tmplMngr = templateManager();

      spyOn(_, 'template').and.callThrough();
      spyOn(tmplMngr, 'fetch').and.callThrough();
      spyOn(view, 'trigger').and.callThrough();

      _.template.calls.reset();
      tmplMngr.fetch.calls.reset();
      view.trigger.calls.reset();
    });

    it('should get empty json', () => {
      expect(view.toJSON()).toEqual({});
    });

    it('should get json with model json entry', () => {
      const model = {id: 1, name: 'John Doe'};
      view.model = new Backbone.Model(model);

      spyOn(view.model, 'toJSON').and.callThrough();

      const json = view.toJSON();

      expect(json).toBeDefined();
      expect(json).toEqual({model});
      expect(view.model.toJSON).toHaveBeenCalledWith({view: true});
    });

    it('should get json with collection json entry', () => {
      const collection = [{id: 1, name: 'John Doe'}];
      view.collection = new Backbone.Collection(collection);

      spyOn(view.collection, 'toJSON').and.callThrough();

      const json = view.toJSON();

      expect(json).toBeDefined();
      expect(json).toEqual({collection});
      expect(view.collection.toJSON).toHaveBeenCalledWith({view: true});
    });

    it('should get json with model and collection entries', () => {
      const collection = [{id: 1, name: 'John Doe'}];
      const model = {id: 2, name: 'Jane Doe'};
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
      const collection = [{id: 1, name: 'John Doe'}];
      const model = {id: 2, name: 'Jane Doe'};
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
      const html = '<div></div>';
      const renderFn = view.compile(html);

      expect(renderFn).toBeDefined();
      expect(_.template).toHaveBeenCalledWith(html);
    });

    it('should use defaults.templateManager by default', () => {
      const templateManager = view.templateManager();
      expect(templateManager).toBeDefined();
      expect(templateManager).toBe(tmplMngr);
    });

    it('should fetch single template', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = mostRecentXhr();
      const template = '<div>Hello <%= model.name %></div>';

      respondHtml(request, template);

      expect(success).toHaveBeenCalledWith(template);
      expect(error).not.toHaveBeenCalled();
    });

    it('should fetch and trigger success without templates', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = [];

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(success).toHaveBeenCalledWith(null);
      expect(error).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).not.toHaveBeenCalled();
    });

    it('should fetch array of templates', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = [
        'foo',
        'bar',
      ];

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(countXhr()).toBe(2);
      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).toHaveBeenCalledWith(['foo', 'bar'], {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const template1 = '<div>Hello <%= model.name %></div>';
      const template2 = '<div>Bye <%= model.name %></div>';

      respondHtml(xhrAt(0), template1);

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      respondHtml(xhrAt(1), template2);

      expect(success).toHaveBeenCalledWith({
        foo: template1,
        bar: template2,
      });

      expect(error).not.toHaveBeenCalled();
    });

    it('should fetch single template and fail', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      view.fetchTemplates({success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = mostRecentXhr();

      respond404(request);

      expect(success).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalled();
    });

    it('should render a single template', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, 'onBeforeRender').and.callThrough();
      spyOn(view, 'onRender').and.callThrough();
      spyOn(view, 'onRenderError').and.callThrough();
      spyOn(view, 'onRendered').and.callThrough();

      view.render();

      expect(view.onBeforeRender).toHaveBeenCalled();
      expect(view.onRender).not.toHaveBeenCalled();
      expect(view.onRenderError).not.toHaveBeenCalled();
      expect(view.onRendered).not.toHaveBeenCalled();

      expect(view.trigger).toHaveBeenCalledWith('render:loading');
      expect(view.trigger).not.toHaveBeenCalledWith('render:success');
      expect(view.trigger).not.toHaveBeenCalledWith('render:error');
      expect(view.trigger).not.toHaveBeenCalledWith('render:done');
      expect(_.template).not.toHaveBeenCalled();

      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = mostRecentXhr();
      const template = '<div>Hello <%= model.name %></div>';

      respondHtml(request, template);

      expect(view.onRender).toHaveBeenCalled();
      expect(view.onRenderError).not.toHaveBeenCalled();
      expect(view.onRendered).toHaveBeenCalled();

      expect(_.template).toHaveBeenCalledWith(template);
      expect(view.trigger).toHaveBeenCalledWith('render:success');
      expect(view.trigger).not.toHaveBeenCalledWith('render:error');
      expect(view.trigger).toHaveBeenCalledWith('render:done', null);

      const children = view.$el.children();
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('DIV');
      expect(children[0].innerHTML).toBe('Hello John Doe');
    });

    it('should not render single template with failure', () => {
      expect(view.trigger).not.toHaveBeenCalledWith('render:success');

      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, 'onBeforeRender').and.callThrough();
      spyOn(view, 'onRender').and.callThrough();
      spyOn(view, 'onRenderError').and.callThrough();
      spyOn(view, 'onRendered').and.callThrough();

      view.render();

      expect(view.onBeforeRender).toHaveBeenCalled();
      expect(view.onRender).not.toHaveBeenCalled();
      expect(view.onRenderError).not.toHaveBeenCalled();
      expect(view.onRendered).not.toHaveBeenCalled();

      expect(view.trigger).toHaveBeenCalledWith('render:loading');
      expect(view.trigger).not.toHaveBeenCalledWith('render:success');
      expect(view.trigger).not.toHaveBeenCalledWith('render:error');
      expect(view.trigger).not.toHaveBeenCalledWith('render:done');
      expect(_.template).not.toHaveBeenCalled();

      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      respond404(mostRecentXhr());

      expect(_.template).not.toHaveBeenCalled();
      expect(view.$el.html()).toEqual('');

      expect(view.onRenderError).toHaveBeenCalled();
      expect(view.onRender).not.toHaveBeenCalled();
      expect(view.onRendered).toHaveBeenCalled();

      expect(view.trigger).toHaveBeenCalledWith('render:error', jasmine.anything());
      expect(view.trigger).toHaveBeenCalledWith('render:done', jasmine.anything());
      expect(view.trigger).not.toHaveBeenCalledWith('render:success');
    });

    it('should render a single template using _triggerBeforeRender method', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, '_triggerBeforeRender').and.callThrough();

      view.render();

      expect(view._triggerBeforeRender).toHaveBeenCalled();
    });

    it('should render a single template using _triggerRenderSuccess method', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, '_triggerRenderSuccess').and.callThrough();
      spyOn(view, '_triggerRenderError').and.callThrough();

      view.render();

      expect(view._triggerRenderSuccess).not.toHaveBeenCalled();
      expect(view._triggerRenderError).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = mostRecentXhr();
      const template = '<div>Hello <%= model.name %></div>';
      respondHtml(request, template);

      expect(view._triggerRenderSuccess).toHaveBeenCalled();
      expect(view._triggerRenderError).not.toHaveBeenCalled();
    });

    it('should render a single template using _triggerRenderError method', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, '_triggerRenderSuccess').and.callThrough();
      spyOn(view, '_triggerRenderError').and.callThrough();

      view.render();

      expect(view._triggerRenderSuccess).not.toHaveBeenCalled();
      expect(view._triggerRenderError).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      respond404(mostRecentXhr());

      expect(view._triggerRenderError).toHaveBeenCalled();
      expect(view._triggerRenderSuccess).not.toHaveBeenCalled();
    });

    it('should render a single template in error using _triggerRenderDone method', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, '_triggerRenderDone').and.callThrough();

      view.render();

      expect(view._triggerRenderDone).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      respond404(mostRecentXhr());

      expect(view._triggerRenderDone).toHaveBeenCalled();
    });

    it('should render a single template in success using _triggerRenderDone method', () => {
      view.model = new Backbone.Model({id: 1, name: 'John Doe'});
      view.templates = 'foo';

      spyOn(view, '_triggerRenderDone').and.callThrough();

      view.render();

      expect(view._triggerRenderDone).not.toHaveBeenCalled();
      expect(tmplMngr.fetch).toHaveBeenCalledWith('foo', {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const request = mostRecentXhr();
      const template = '<div>Hello <%= model.name %></div>';
      respondHtml(request, template);

      expect(view._triggerRenderDone).toHaveBeenCalled();
    });

    it('should render array of templates', () => {
      view.model = new Backbone.Model({
        id: 1,
        name: 'John Doe',
      });

      view.templates = [
        'foo',
        'bar',
      ];

      view.render();

      expect(view.$el.html()).toBe('');
      expect(countXhr()).toBe(2);
      expect(tmplMngr.fetch).toHaveBeenCalledWith(['foo', 'bar'], {
        success: jasmine.any(Function),
        error: jasmine.any(Function),
      });

      const template1 = '<div>Hello <%= model.name %></div>';
      const template2 = '<div>Bye <%= model.name %></div>';

      respondHtml(xhrAt(0), template1);

      expect(view.$el.html()).toBe('');

      respondHtml(xhrAt(1), template2);

      expect(view.$el.html()).not.toBe('');
    });
  });
});
