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
import {DomTemplateManager} from '../../src/core/dom-template-manager';
import {createTemplate} from '../utils/create-script-template';
import {tick} from '../utils/clock';

describe('DomTemplateManager', () => {
  it('should create template manager', () => {
    const domTemplateManager = new DomTemplateManager();
    expect(domTemplateManager).toBeDefined();
    expect(domTemplateManager._cache).toBeDefined();
    expect(domTemplateManager.selector).toBeDefined();
    expect(domTemplateManager.selector('foo')).toBe('[data-template-id="foo"]');
  });

  it('should create template manager with custom selector factory', () => {
    const domTemplateManager = new DomTemplateManager({
      selector: (id) => `#${id}`,
    });

    expect(domTemplateManager).toBeDefined();
    expect(domTemplateManager.selector).toBeDefined();
    expect(domTemplateManager.selector('foo')).toBe('#foo');
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

    it('should fail to fetch non string template', () => {
      const apply = (val) => {
        return () => {
          domTemplateManager.fetch(val, {
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
          domTemplateManager.fetch(val, {
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

    it('should query a single template', () => {
      // Create template element
      const html = '<div>Hello World</div>';
      const id = 'test-template';
      const template = createTemplate(html, id);
      fixtures.appendChild(template);

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      domTemplateManager.fetch(id, {success, error});

      expect(error).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();

      tick();

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(html);
    });

    it('should use cache on next fetch', () => {
      // Create template element
      const id = 'test-template';
      const html = '<div>Hello World</div>';
      const template = createTemplate(html, id);
      fixtures.appendChild(template);

      const success1 = jasmine.createSpy('success1');
      const error1 = jasmine.createSpy('error1');

      domTemplateManager.fetch(id, {
        success: success1,
        error: error1,
      });

      expect(error1).not.toHaveBeenCalled();
      expect(success1).not.toHaveBeenCalled();

      tick();

      expect(error1).not.toHaveBeenCalled();
      expect(success1).toHaveBeenCalledWith(html);
      expect(domTemplateManager._cache.get(id)).toEqual(html);

      spyOn(Backbone, '$').and.callThrough();

      const success2 = jasmine.createSpy('success2');
      const error2 = jasmine.createSpy('error2');

      domTemplateManager.fetch(id, {
        success: success2,
        error: error2,
      });

      expect(error2).not.toHaveBeenCalled();
      expect(success2).not.toHaveBeenCalled();

      tick();

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

        const template = createTemplate(html[i], ids[i]);
        fixtures.appendChild(template);
      }

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      domTemplateManager.fetch(ids, {
        success: success,
        error: error,
      });

      expect(error).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();

      tick();

      expect(error).not.toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(_.object(ids, html));
    });

    it('should fail if single template does not exist', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');
      const id = 'test-template';

      domTemplateManager.fetch(id, {success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith({
        data: `Cannot find template: ${id}`,
      });
    });

    it('should fail if single template exist with multiple results', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const html = '<div>Hello World</div>';
      const id = 'test-template';
      const tmpl = createTemplate(html, id);

      fixtures.appendChild(tmpl);
      fixtures.appendChild(tmpl.cloneNode(true));

      domTemplateManager.fetch(id, {success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith({
        data: `Found multiple templates for selector: [data-template-id="${id}"]`,
      });
    });

    it('should fail if array of templates does not exist', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const id1 = 'test-template-1';
      const id2 = 'test-template-2';

      domTemplateManager.fetch([id1, id2], {success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith({
        [id1]: {
          data: `Cannot find template: ${id1}`,
        },

        [id2]: {
          data: `Cannot find template: ${id2}`,
        },
      });
    });

    it('should fail if array of templates exist with multiple results', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const html1 = '<div>Hello World</div>';
      const id1 = 'test-template-1';
      const tmpl1 = createTemplate(html1, id1);
      fixtures.appendChild(tmpl1);
      fixtures.appendChild(tmpl1.cloneNode(true));

      const html2 = '<div>Hello World</div>';
      const id2 = 'test-template-2';
      const tmpl2 = createTemplate(html2, id2);
      fixtures.appendChild(tmpl2);
      fixtures.appendChild(tmpl2.cloneNode(true));

      domTemplateManager.fetch([id1, id2], {success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith({
        [id1]: {
          data: `Found multiple templates for selector: [data-template-id="${id1}"]`,
        },

        [id2]: {
          data: `Found multiple templates for selector: [data-template-id="${id2}"]`,
        },
      });
    });

    it('should fail if array of templates has some errors', () => {
      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      const html = '<div>Hello World</div>';
      const id = 'test-template-1';
      const tmpl = createTemplate(html, id);
      fixtures.appendChild(tmpl);

      domTemplateManager.fetch([id, 'test-template-2'], {success, error});

      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      tick();

      expect(success).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith({
        'test-template-2': {
          data: 'Cannot find template: test-template-2',
        },
      });
    });

    it('should clear cache', () => {
      // Create template element
      const id = 'test-template';
      const html = '<div>Hello World</div>';
      const template = createTemplate(html, id);
      fixtures.appendChild(template);

      const success = jasmine.createSpy('success');
      const error = jasmine.createSpy('error');

      domTemplateManager.fetch(id, {success, error});

      tick();

      expect(domTemplateManager._cache).toBeDefined();
      expect(domTemplateManager._cache.get(id)).toEqual(html);

      domTemplateManager.clear();

      expect(domTemplateManager._cache).toBeDefined();
      expect(domTemplateManager._cache.get(id)).toBeUndefined();
    });
  });
});
