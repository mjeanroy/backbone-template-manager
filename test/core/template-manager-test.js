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

import {templateManager, overrideTemplateManager} from '../../src/core/template-manager';
import {RemoteTemplateManager} from '../../src/core/remote-template-manager';

describe('templateManager', () => {
  let defaultTemplateManager;

  beforeEach(() => {
    defaultTemplateManager = templateManager();
  });

  afterEach(() => {
    overrideTemplateManager(defaultTemplateManager);
  });

  it('should have a default template manager', () => {
    const currentTemplateManager = templateManager();
    expect(currentTemplateManager).toBeDefined();
    expect(currentTemplateManager instanceof RemoteTemplateManager).toBeTruthy();
  });

  it('should override template manager', () => {
    const fakeTemplateManager = jasmine.createSpyObj('fakeTemplateManager', ['fetch', 'clear']);
    const currentTemplateManager = templateManager();

    spyOn(currentTemplateManager, 'clear').and.callThrough();

    overrideTemplateManager(fakeTemplateManager);

    expect(templateManager()).toBe(fakeTemplateManager);
    expect(currentTemplateManager.clear).toHaveBeenCalled();
  });
});
