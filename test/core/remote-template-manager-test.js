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
import {RemoteTemplateManager} from '../../src/core/remote-template-manager';
import {deleteProp} from '../utils/delete';
import {mostRecentXhr, respond, respondHtml, xhrAt} from '../utils/xhr';
import {tick} from '../utils/clock';

describe('RemoteTemplateManager', () => {
  afterEach(() => {
    deleteProp(window, 'JST');
  });

  it('should create template manager with default options', () => {
    const templateManager = new RemoteTemplateManager();
    expect(templateManager._cache).toBeDefined();
    expect(templateManager._prefix).toEqual('/templates/');
    expect(templateManager._suffix).toEqual('.template.html');
    expect(templateManager._method).toEqual('GET');
  });

  it('should create template manager with custom options', () => {
    const prefix = '';
    const suffix = '.html';
    const method = 'JSONP';
    const templateManager = new RemoteTemplateManager({prefix, suffix, method});

    expect(templateManager._cache).toBeDefined();
    expect(templateManager._prefix).toEqual(prefix);
    expect(templateManager._suffix).toEqual(suffix);
    expect(templateManager._method).toEqual(method);
  });

  it('should create template manager without prefix', () => {
    const prefix = null;
    const templateManager = new RemoteTemplateManager({prefix});
    expect(templateManager._prefix).toEqual(null);
  });

  it('should create template manager without suffix', () => {
    const suffix = null;
    const templateManager = new RemoteTemplateManager({suffix});
    expect(templateManager._suffix).toEqual(null);
  });

  it('should create template manager with pre-filled cache with JST variables', () => {
    const JST = true;

    const id = 'foo';
    const template = '<div>Hello <%= name %></div>';
    const templates = {
      [id]: template,
    };

    window.JST = templates;

    const templateManager = new RemoteTemplateManager({JST});

    expect(templateManager._cache).not.toBe(templates);
    expect(templateManager._cache.get(id)).toEqual(template);
  });

  it('should create template manager with pre-filled cache with custom JST variable', () => {
    const JST = '__JST__';
    const id = 'foo';
    const template = '<div>Hello <%= name %></div>';
    const templates = {
      [id]: template,
    };

    window.__JST__ = templates;

    const templateManager = new RemoteTemplateManager({JST});

    expect(templateManager._cache).not.toBe(templates);
    expect(templateManager._cache.get(id)).toEqual(template);
  });

  it('should create template manager with pre-filled cache with custom JST object', () => {
    const id = 'foo';
    const template = '<div>Hello <%= name %></div>';
    const JST = {
      [id]: template,
    };

    const templateManager = new RemoteTemplateManager({JST});

    expect(templateManager._cache).not.toBe(JST);
    expect(templateManager._cache.get(id)).toEqual(template);
  });

  it('should fail if JST object is not a string, nor a boolean, nor an object', () => {
    const JST = [{
      foo: '<div>Hello <%= name %></div>',
    }];

    const apply = () => {
      return new RemoteTemplateManager({JST});
    };

    expect(apply).toThrow(new Error(`Cannot infer JST variables from: [{"foo":"<div>Hello <%= name %></div>"}]`));
  });

  describe('once initialized', () => {
    let templateManager;

    beforeEach(() => {
      spyOn(Backbone, 'ajax').and.callThrough();
      templateManager = new RemoteTemplateManager();
    });

    it('should fail to fetch non string template', () => {
      const apply = (val) => {
        return () => {
          templateManager.fetch(val, {
            success: jasmine.createSpy('success'),
            error: jasmine.createSpy('error'),
          });
        };
      };

      expect(apply({})).toThrow(
        new Error('Templates must be a string or an array of string, found: {}')
      );

      expect(apply(1)).toThrow(
        new Error('Templates must be a string or an array of string, found: 1')
      );

      expect(apply(true)).toThrow(
        new Error('Templates must be a string or an array of string, found: true')
      );

      expect(apply(null)).toThrow(
        new Error('Templates must be a string or an array of string, found: null')
      );

      expect(apply(undefined)).toThrow(
        new Error('Templates must be a string or an array of string, found: undefined')
      );
    });

    it('should fail to fetch non string array of template', () => {
      const apply = (val) => {
        return () => {
          templateManager.fetch(val, {
            success: jasmine.createSpy('success'),
            error: jasmine.createSpy('error'),
          });
        };
      };

      expect(apply([])).toThrow(
        new Error('Templates must be a string or an array of string, found: []')
      );

      expect(apply([{}])).toThrow(
        new Error('Templates must be a string or an array of string, found: [{}]')
      );

      expect(apply(['foo', 'bar', true])).toThrow(
        new Error('Templates must be a string or an array of string, found: ["foo","bar",true]')
      );

      expect(apply(['foo', 'bar', 1])).toThrow(
        new Error('Templates must be a string or an array of string, found: ["foo","bar",1]')
      );

      expect(apply(['foo', 'bar', null])).toThrow(
        new Error('Templates must be a string or an array of string, found: ["foo","bar",null]')
      );
    });

    it('should fetch a single template', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      templateManager.fetch('foo', {
        success: success,
        error: error,
      });

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const expectedUrl = '/templates/foo.template.html';
      const expectedMethod = 'GET';
      expect(Backbone.ajax).toHaveBeenCalledWith({
        method: expectedMethod,
        url: expectedUrl,
      });

      const request = mostRecentXhr();
      expect(request).toBeDefined();
      expect(request.method).toBe(expectedMethod);
      expect(request.url).toBe(expectedUrl);

      const template = '<div>Hello World</div>';
      respondHtml(request, template);

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(template);
    });

    it('should fetch template and use JST cache', () => {
      const template = '<div>Hello World</div>';
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const jstTmplMngr = new RemoteTemplateManager({
        JST: {
          foo: template,
        },
      });

      jstTmplMngr.fetch('foo', {
        success: success,
        error: error,
      });

      const request = mostRecentXhr();
      expect(request).not.toBeDefined();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      tick();

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(template);
    });

    it('should fetch a single template and do not prefix with double slash', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      // Override prefix.
      templateManager._prefix = '/templates/';

      templateManager.fetch('/foo', {
        success: success,
        error: error,
      });

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const expectedUrl = '/templates/foo.template.html';
      const expectedMethod = 'GET';
      expect(Backbone.ajax).toHaveBeenCalledWith({
        method: expectedMethod,
        url: expectedUrl,
      });

      const request = mostRecentXhr();
      expect(request).toBeDefined();
      expect(request.method).toBe(expectedMethod);
      expect(request.url).toBe(expectedUrl);

      const template = '<div>Hello World</div>';
      respondHtml(request, template);

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(template);
    });

    it('should fetch a single template and do not suffix with double slash', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      // Override prefix.
      templateManager._suffix = '/index.html';

      templateManager.fetch('foo/', {
        success: success,
        error: error,
      });

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const expectedUrl = '/templates/foo/index.html';
      const expectedMethod = 'GET';
      expect(Backbone.ajax).toHaveBeenCalledWith({
        method: expectedMethod,
        url: expectedUrl,
      });

      const request = mostRecentXhr();
      expect(request).toBeDefined();
      expect(request.method).toBe(expectedMethod);
      expect(request.url).toBe(expectedUrl);

      const template = '<div>Hello World</div>';
      respondHtml(request, template);

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(template);
    });

    it('should fetch template and use cache on pending call', () => {
      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');
      templateManager.fetch('foo', {
        success: success1,
        error: error1,
      });

      expect(Backbone.ajax).toHaveBeenCalled();
      expect(Backbone.ajax.calls.count()).toBe(1);
      expect(success1).not.toHaveBeenCalled();
      expect(error1).not.toHaveBeenCalled();

      const success2 = jasmine.createSpy('success2');
      const error2 = jasmine.createSpy('error2');
      templateManager.fetch('foo', {
        success: success2,
        error: error2,
      });

      expect(Backbone.ajax.calls.count()).toBe(1);
      expect(success2).not.toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();

      const request = mostRecentXhr();
      expect(request).toBeDefined();
      expect(request.method).toBe('GET');
      expect(request.url).toBe('/templates/foo.template.html');

      const template = '<div>Hello World</div>';
      respondHtml(request, template);

      expect(error1).not.toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();
      expect(success1).toHaveBeenCalledWith(template);
      expect(success2).toHaveBeenCalledWith(template);
    });

    it('should fetch template and use cache on next call', () => {
      const template = '<div>Hello World</div>';
      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');
      templateManager.fetch('foo', {
        success: success1,
        error: error1,
      });

      expect(success1).not.toHaveBeenCalled();
      expect(error1).not.toHaveBeenCalled();

      const r1 = mostRecentXhr();
      expect(r1).toBeDefined();
      expect(r1.method).toBe('GET');
      expect(r1.url).toBe('/templates/foo.template.html');

      respondHtml(r1, template);

      expect(error1).not.toHaveBeenCalled();
      expect(success1).toHaveBeenCalledWith(template);

      const success2 = jasmine.createSpy('success2');
      const error2 = jasmine.createSpy('error2');

      templateManager.fetch('foo', {
        success: success2,
        error: error2,
      });

      const r2 = mostRecentXhr();
      expect(r2).toBeDefined();
      expect(r2).toBe(r1);

      tick();

      expect(error2).not.toHaveBeenCalled();
      expect(success2).toHaveBeenCalledWith(template);
    });

    it('should fetch array of templates', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const ids = ['foo', 'bar'];

      templateManager.fetch(ids, {
        success: success,
        error: error,
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request1 = xhrAt(0);
      expect(request1).toBeDefined();
      expect(request1.method).toBe('GET');
      expect(request1.url).toBe('/templates/foo.template.html');

      const request2 = xhrAt(1);
      expect(request2).toBeDefined();
      expect(request2.method).toBe('GET');
      expect(request2.url).toBe('/templates/bar.template.html');

      const template1 = '<div>Hello World 1</div>';
      respondHtml(request1, template1);

      expect(error).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();

      const template2 = '<div>Hello World 2</div>';
      respondHtml(request2, template2);

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith({
        foo: template1,
        bar: template2,
      });
    });

    it('should fetch a single template and trigger error with a failure', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      templateManager.fetch('foo', {
        success: success,
        error: error,
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request = mostRecentXhr();
      expect(request).toBeDefined();
      expect(request.method).toBe('GET');
      expect(request.url).toBe('/templates/foo.template.html');

      const message = 'Template does not exist';
      const status = 404;
      respond(request, status, message);

      expect(error).toHaveBeenCalledWith({status, message});
      expect(success).not.toHaveBeenCalledWith();
    });

    it('should fetch array of templates and trigger errors with failures', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const ids = ['foo', 'bar'];

      templateManager.fetch(ids, {
        success: success,
        error: error,
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request1 = xhrAt(0);
      const request2 = xhrAt(1);

      const message = 'Template does not exist';
      const status = 404;

      respond(request1, status, message);

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      respond(request2, status, message);

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        foo: {status, message},
        bar: {status, message},
      });
    });

    it('should fetch array of templates and trigger error with at least one failure', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const ids = ['foo', 'bar'];

      templateManager.fetch(ids, {
        success: success,
        error: error,
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request1 = xhrAt(0);
      const request2 = xhrAt(1);

      const message = 'Template does not exist';
      const status = 404;

      respond(request1, status, message);

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      respondHtml(request2, '<div>Hello World</div>');

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        foo: {status, message},
      });
    });

    it('should remove template from cache with an error', () => {
      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');
      templateManager.fetch('foo', {
        success: success1,
        error: error1,
      });

      expect(success1).not.toHaveBeenCalled();
      expect(error1).not.toHaveBeenCalled();
      expect(Backbone.ajax).toHaveBeenCalled();
      expect(Backbone.ajax.calls.count()).toBe(1);

      const request1 = xhrAt(0);
      const message = 'Template does not exist';
      const status = 404;
      respond(request1, status, message);

      expect(success1).not.toHaveBeenCalled();
      expect(error1).toHaveBeenCalled();

      // Retry
      const success2 = jasmine.createSpy('success2');
      const error2 = jasmine.createSpy('error2');
      templateManager.fetch('foo', {
        success: success2,
        error: error2,
      });

      expect(success2).not.toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();
      expect(Backbone.ajax).toHaveBeenCalled();
      expect(Backbone.ajax.calls.count()).toBe(2);

      const request2 = xhrAt(1);
      const template = '<div>Hello World</div>';
      respondHtml(request2, template);

      expect(success2).toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();
    });

    it('should clear cache', () => {
      const id = 'foo';
      const template = '<div>Hello World</div>';

      templateManager.fetch(id);

      const request = mostRecentXhr();
      respondHtml(request, template);

      expect(templateManager._cache).toBeDefined();
      expect(templateManager._cache.get(id)).toEqual(template);

      templateManager.clear();

      expect(templateManager._cache).toBeDefined();
      expect(templateManager._cache.get(id)).toBeUndefined();
    });
  });
});
