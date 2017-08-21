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
import {compile, overrideCompile} from '../../src/core/compile';

describe('compile', () => {
  beforeEach(() => {
    spyOn(_, 'template').and.callThrough();
  });

  afterEach(() => {
    overrideCompile((html) => _.template(html));
  });

  it('should compile HTML using _.template', () => {
    const template = '<div><%= name %></div>';
    const renderFn = compile(template);

    expect(renderFn).toBeDefined();
    expect(_.template).toHaveBeenCalledWith(template);

    const model = {name: 'John Doe'};
    expect(renderFn(model)).toEqual('<div>John Doe</div>');
  });

  it('should override compile function', () => {
    const spy = jasmine.createSpy('compile').and.callFake((html) => {
      return () => html;
    });

    const html = '<div>Hello <%= name %></div>';

    const r1 = compile(html);
    expect(r1).toBeDefined();
    expect(_.template).toHaveBeenCalledWith(html);
    expect(spy).not.toHaveBeenCalled();

    _.template.calls.reset();
    spy.calls.reset();

    overrideCompile(spy);

    const r2 = compile(html);
    expect(r2).toBeDefined();
    expect(_.template).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(html);
  });
});
