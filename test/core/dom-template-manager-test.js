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

import _ from 'underscore';
import Backbone from 'backbone';
import {DomTemplateManager} from 'core/dom-template-manager';

describe('DomTemplateManager', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('should create template manager', () => {
    const domTemplateManager = new DomTemplateManager();
    expect(domTemplateManager).toBeDefined();
    expect(domTemplateManager._cache).toBeDefined();
    expect(domTemplateManager._cache).toEqual({});
  });

  describe('once initialized', () => {
    let fixtures;
    let domTemplateManager;

    beforeEach(() => {
      domTemplateManager = new DomTemplateManager();

      fixtures = document.createElement('div');
      document.body.appendChild(fixtures);
    });

    afterEach(() => {
      document.body.removeChild(fixtures);
    });

    it('should query a single template', () => {
      // Create template element
      const html = '<div>Hello World</div>';
      const template = document.createElement('script');
      template.setAttribute('type', 'text/template');
      template.setAttribute('id', 'test-template');
      template.innerHTML = html;
      fixtures.appendChild(template);

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      domTemplateManager.fetch('#test-template', {
        success: success,
        error: error
      });

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(html);
    });

    it('should query a single template and return promise', done => {
      // Create template element
      const html = '<div>Hello World</div>';
      const template = document.createElement('script');
      template.setAttribute('type', 'text/template');
      template.setAttribute('id', 'test-template');
      template.innerHTML = html;
      fixtures.appendChild(template);

      const success = jasmine.createSpy('success').and.callFake(data => {
        expect(data).toEqual(html);
        done();
      });

      const error = jasmine.createSpy('error').and.callFake(() => {
        jasmine.fail('Error callback should not be called');
        done();
      });

      const promise = domTemplateManager.fetch('#test-template');
      promise.then(success, error);
      jasmine.clock().tick();
    });

    it('should use cache on next fetch', () => {
      // Create template element
      const id = 'test-template';
      const html = '<div>Hello World</div>';
      const template = document.createElement('script');
      template.setAttribute('type', 'text/template');
      template.setAttribute('id', 'test-template');
      template.innerHTML = html;
      fixtures.appendChild(template);

      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');

      domTemplateManager.fetch(`#${id}`, {
        success: success1,
        error: error1
      });

      expect(error1).not.toHaveBeenCalled();
      expect(success1).toHaveBeenCalledWith(html);
      expect(domTemplateManager._cache).toEqual({
        [`#${id}`]: html
      });

      spyOn(Backbone, '$').and.callThrough();

      const success2 = jasmine.createSpy('success2');
      const error2 = jasmine.createSpy('error2');

      domTemplateManager.fetch(`#${id}`, {
        success: success2,
        error: error2
      });

      expect(error2).not.toHaveBeenCalled();
      expect(success2).toHaveBeenCalledWith(html);
      expect(Backbone.$).not.toHaveBeenCalled();
    });

    it('should query array of templates', () => {
      // Create template element
      const html = [];
      const ids = [];

      for (let i = 0; i < 4; ++i) {
        html[i] = `<div>Hello World #${i}</div>`;
        ids[i] = `test-template-${i}`;

        const template = document.createElement('script');
        template.setAttribute('type', 'text/template');
        template.setAttribute('id', ids[i]);
        template.innerHTML = html[i];
        fixtures.appendChild(template);
      }

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const selectors = _.map(ids, id => `#${id}`);

      domTemplateManager.fetch(selectors, {
        success: success,
        error: error
      });

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(_.object(selectors, html));
    });

    it('should query array of templates and return promise of results', done => {
      // Create template element
      const html = [];
      const ids = [];

      for (let i = 0; i < 4; ++i) {
        html[i] = `<div>Hello World #${i}</div>`;
        ids[i] = `test-template-${i}`;

        const template = document.createElement('script');
        template.setAttribute('type', 'text/template');
        template.setAttribute('id', ids[i]);
        template.innerHTML = html[i];
        fixtures.appendChild(template);
      }

      const selectors = _.map(ids, id => `#${id}`);

      const error = jasmine.createSpy('error').and.callFake(() => {
        jasmine.fail('Error callback should not be called');
        done();
      });

      const success = jasmine.createSpy('success').and.callFake(data => {
        expect(data).toEqual(_.object(selectors, html));
        expect(error).not.toHaveBeenCalled();
        done();
      });

      const promise = domTemplateManager.fetch(selectors);
      promise.then(success, error);
      jasmine.clock().tick();
    });

    it('should fail if single template does not exist', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      domTemplateManager.fetch('#test-template', {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        data: 'Cannot find template: #test-template'
      });
    });

    it('should trigger promise error if single template does not exist', done => {
      const success = jasmine.createSpy('success').and.callFake(() => {
        jasmine.fail('Success callback should not be called');
        done();
      });

      const error = jasmine.createSpy('error').and.callFake(data => {
        expect(success).not.toHaveBeenCalled();
        expect(data).toEqual({
          data: 'Cannot find template: #test-template'
        });

        done();
      });

      const promise = domTemplateManager.fetch('#test-template');
      promise.then(success, error);
      jasmine.clock().tick();
    });

    it('should fail if single template exist with multiple results', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const tmpl = document.createElement('script');
      tmpl.setAttribute('type', 'text/template');
      tmpl.setAttribute('data-template', 'test-template');
      tmpl.innerHTML = '<div>Hello World</div>';

      fixtures.appendChild(tmpl);
      fixtures.appendChild(tmpl.cloneNode(true));

      domTemplateManager.fetch('[data-template="test-template"]', {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        data: 'Found multiple templates for selector: [data-template="test-template"]'
      });
    });

    it('should trigger promise error if single template exist with multiple results', done => {
      const tmpl = document.createElement('script');
      tmpl.setAttribute('type', 'text/template');
      tmpl.setAttribute('data-template', 'test-template');
      tmpl.innerHTML = '<div>Hello World</div>';

      fixtures.appendChild(tmpl);
      fixtures.appendChild(tmpl.cloneNode(true));

      const success = jasmine.createSpy('success').and.callFake(() => {
        jasmine.fail('Success callback should not be called');
        done();
      });

      const error = jasmine.createSpy('error').and.callFake(data => {
        expect(success).not.toHaveBeenCalled();
        expect(data).toEqual({
          data: 'Found multiple templates for selector: [data-template="test-template"]'
        });

        done();
      });

      const promise = domTemplateManager.fetch('[data-template="test-template"]');
      promise.then(success, error);
      jasmine.clock().tick();
    });

    it('should fail if array of templates does not exist', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      domTemplateManager.fetch(['#test-template-1', '#test-template-2'], {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        '#test-template-1': {
          data: 'Cannot find template: #test-template-1'
        },

        '#test-template-2': {
          data: 'Cannot find template: #test-template-2'
        }
      });
    });

    it('should fail if array of templates exist with multiple results', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const tmpl1 = document.createElement('script');
      tmpl1.setAttribute('type', 'text/template');
      tmpl1.setAttribute('data-template', 'test-template-1');
      tmpl1.innerHTML = '<div>Hello World</div>';
      fixtures.appendChild(tmpl1);
      fixtures.appendChild(tmpl1.cloneNode(true));

      const tmpl2 = document.createElement('script');
      tmpl2.setAttribute('type', 'text/template');
      tmpl2.setAttribute('data-template', 'test-template-2');
      tmpl2.innerHTML = '<div>Hello World</div>';
      fixtures.appendChild(tmpl2);
      fixtures.appendChild(tmpl2.cloneNode(true));

      const selectors = [
        '[data-template="test-template-1"]',
        '[data-template="test-template-2"]'
      ];

      domTemplateManager.fetch(selectors, {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        '[data-template="test-template-1"]': {
          data: 'Found multiple templates for selector: [data-template="test-template-1"]'
        },

        '[data-template="test-template-2"]': {
          data: 'Found multiple templates for selector: [data-template="test-template-2"]'
        }
      });
    });

    it('should fail if array of templates has some errors', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const tmpl = document.createElement('script');
      tmpl.setAttribute('type', 'text/template');
      tmpl.setAttribute('id', 'test-template-1');
      tmpl.innerHTML = '<div>Hello World</div>';
      fixtures.appendChild(tmpl);

      domTemplateManager.fetch(['#test-template-1', '#test-template-2'], {
        success: success,
        error: error
      });

      expect(success).not.toHaveBeenCalledWith();
      expect(error).toHaveBeenCalledWith({
        '#test-template-2': {
          data: 'Cannot find template: #test-template-2'
        }
      });
    });

    it('should clear cache', () => {
      // Create template element
      const id = 'test-template';
      const html = '<div>Hello World</div>';
      const template = document.createElement('script');
      template.setAttribute('type', 'text/template');
      template.setAttribute('id', 'test-template');
      template.innerHTML = html;
      fixtures.appendChild(template);

      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');

      domTemplateManager.fetch(`#${id}`, {
        success: success1,
        error: error1
      });

      expect(domTemplateManager._cache).toBeDefined();
      expect(domTemplateManager._cache).toEqual({
        [`#${id}`]: html
      });

      domTemplateManager.clear();

      expect(domTemplateManager._cache).toBeDefined();
      expect(domTemplateManager._cache).toEqual({});
    });
  });
});
