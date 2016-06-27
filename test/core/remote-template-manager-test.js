/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mickael Jeanroy
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
import {RemoteTemplateManager} from 'core/remote-template-manager';

describe('RemoteTemplateManager', () => {
  it('should create template manager with default options', () => {
    const templateManager = new RemoteTemplateManager();
    expect(templateManager._cache).toEqual({});
    expect(templateManager._prefix).toEqual('/templates');
    expect(templateManager._suffix).toEqual('.template.html');
    expect(templateManager._method).toEqual('GET');
  });

  it('should create template manager with custom options', () => {
    const prefix = '';
    const suffix = '.html';
    const method = 'JSONP';
    const templateManager = new RemoteTemplateManager({prefix, suffix, method});

    expect(templateManager._cache).toEqual({});
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

  describe('once initialized', () => {
    let templateManager;

    beforeEach(() => {
      spyOn(Backbone, 'ajax').and.callThrough();
      templateManager = new RemoteTemplateManager();
      templateManager._cache = {};
    });

    beforeEach(() => jasmine.Ajax.install());
    afterEach(() => jasmine.Ajax.uninstall());

    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('should fetch a single template', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      templateManager.fetch('foo', {
        success: success,
        error: error
      });

      jasmine.clock().tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const expectedUrl = '/templates/foo.template.html';
      const expectedMethod = 'GET';
      expect(Backbone.ajax).toHaveBeenCalledWith({
        method: expectedMethod,
        url: expectedUrl
      });

      const request = jasmine.Ajax.requests.mostRecent();
      expect(request).toBeDefined();
      expect(request.method).toBe(expectedMethod);
      expect(request.url).toBe(expectedUrl);

      const template = '<div>Hello World</div>';
      request.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(template);
    });

    it('should fetch template and use cache on next call', () => {
      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');
      templateManager.fetch('foo', {
        success: success1,
        error: error1
      });

      expect(Backbone.ajax).toHaveBeenCalled();
      expect(Backbone.ajax.calls.count()).toBe(1);
      expect(success1).not.toHaveBeenCalled();
      expect(error1).not.toHaveBeenCalled();

      const success2 = jasmine.createSpy('success2');
      const error2 = jasmine.createSpy('error2');
      templateManager.fetch('foo', {
        success: success2,
        error: error2
      });

      expect(Backbone.ajax.calls.count()).toBe(1);
      expect(success2).not.toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();

      const request = jasmine.Ajax.requests.mostRecent();
      expect(request).toBeDefined();
      expect(request.method).toBe('GET');
      expect(request.url).toBe('/templates/foo.template.html');

      const template = '<div>Hello World</div>';
      request.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(error1).not.toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();
      expect(success1).toHaveBeenCalledWith(template);
      expect(success2).toHaveBeenCalledWith(template);
    });

    it('should fetch array of templates', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const ids = ['foo', 'bar'];

      templateManager.fetch(ids, {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request1 = jasmine.Ajax.requests.at(0);
      expect(request1).toBeDefined();
      expect(request1.method).toBe('GET');
      expect(request1.url).toBe('/templates/foo.template.html');

      const request2 = jasmine.Ajax.requests.at(1);
      expect(request2).toBeDefined();
      expect(request2.method).toBe('GET');
      expect(request2.url).toBe('/templates/bar.template.html');

      const template1 = '<div>Hello World 1</div>';
      request1.respondWith({
        status: 200,
        responseText: template1,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(error).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();

      const template2 = '<div>Hello World 2</div>';
      request2.respondWith({
        status: 200,
        responseText: template2,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith({
        foo: template1,
        bar: template2
      });
    });

    it('should fetch a single template and trigger error with a failure', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      templateManager.fetch('foo', {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request = jasmine.Ajax.requests.mostRecent();
      expect(request).toBeDefined();
      expect(request.method).toBe('GET');
      expect(request.url).toBe('/templates/foo.template.html');

      const message = 'Template does not exist';
      const status = 404;
      request.respondWith({
        status: status,
        responseText: message,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(error).toHaveBeenCalledWith({status, message});
      expect(success).not.toHaveBeenCalledWith();
    });

    it('should fetch array of templates and trigger errors with failures', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const ids = ['foo', 'bar'];

      templateManager.fetch(ids, {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request1 = jasmine.Ajax.requests.at(0);
      const request2 = jasmine.Ajax.requests.at(1);

      const message = 'Template does not exist';
      const status = 404;

      request1.respondWith({
        status: status,
        responseText: message,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      request2.respondWith({
        status: status,
        responseText: message,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        foo: {status, message},
        bar: {status, message}
      });
    });

    it('should fetch array of templates and trigger error with at least one failure', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const ids = ['foo', 'bar'];

      templateManager.fetch(ids, {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      const request1 = jasmine.Ajax.requests.at(0);
      const request2 = jasmine.Ajax.requests.at(1);

      const message = 'Template does not exist';
      const status = 404;

      request1.respondWith({
        status: status,
        responseText: message,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      request2.respondWith({
        status: 200,
        responseText: '<div>Hello World</div>',
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        foo: {status, message}
      });
    });

    it('should remove template from cache with an error', () => {
      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');
      templateManager.fetch('foo', {
        success: success1,
        error: error1
      });

      expect(success1).not.toHaveBeenCalled();
      expect(error1).not.toHaveBeenCalled();
      expect(Backbone.ajax).toHaveBeenCalled();
      expect(Backbone.ajax.calls.count()).toBe(1);

      const request1 = jasmine.Ajax.requests.at(0);
      const message = 'Template does not exist';
      const status = 404;
      request1.respondWith({
        status: status,
        responseText: message,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(success1).not.toHaveBeenCalled();
      expect(error1).toHaveBeenCalled();

      // Retry
      const success2 = jasmine.createSpy('success2');
      const error2 = jasmine.createSpy('error2');
      templateManager.fetch('foo', {
        success: success2,
        error: error2
      });

      expect(success2).not.toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();
      expect(Backbone.ajax).toHaveBeenCalled();
      expect(Backbone.ajax.calls.count()).toBe(2);

      const request2 = jasmine.Ajax.requests.at(1);
      const template = '<div>Hello World</div>';
      request2.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(success2).toHaveBeenCalled();
      expect(error2).not.toHaveBeenCalled();
    });

    it('should clear cache', () => {
      templateManager.fetch('foo');

      const request = jasmine.Ajax.requests.mostRecent();
      const template = '<div>Hello World</div>';
      request.respondWith({
        status: 200,
        responseText: template,
        contentType: 'text/html'
      });

      jasmine.clock().tick();

      expect(templateManager._cache).toBeDefined();
      expect(templateManager._cache).toEqual({
        foo: jasmine.anything()
      });

      templateManager.clear();

      expect(templateManager._cache).toBeDefined();
      expect(templateManager._cache).toEqual({});
    });
  });
});
