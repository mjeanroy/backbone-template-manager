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
import {promise} from 'core/promise';

describe('promise', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  beforeEach(() => {
    spyOn(Backbone.$, 'Deferred').and.callThrough();
  });

  if (typeof Promise !== 'undefined') {
    describe('es6', () => {
      it('should use native promise by default if available and trigger success', done => {
        const success = jasmine.createSpy('success');
        const error = jasmine.createSpy('error');
        const notify = jasmine.createSpy('notify');
        const fn = jasmine.createSpy('fn').and.callFake((resolve, reject, notify) => {
          resolve('foo');
        });

        const assertSpy = () => {
          expect(success).toHaveBeenCalledWith('foo');
          expect(error).not.toHaveBeenCalled();
          expect(notify).not.toHaveBeenCalled();
        };

        promise(fn)
          .then(success, error, notify)
          .then(assertSpy, assertSpy)
          .then(done, done);
      });

      it('should use native promise by default if available and trigger error', done => {
        const success = jasmine.createSpy('success');
        const error = jasmine.createSpy('error');
        const notify = jasmine.createSpy('notify');
        const fn = jasmine.createSpy('fn').and.callFake((resolve, reject, notify) => {
          reject('foo');
        });

        const assertSpy = () => {
          expect(success).not.toHaveBeenCalled();
          expect(error).toHaveBeenCalledWith('foo');
          expect(notify).not.toHaveBeenCalled();
        };

        promise(fn)
          .then(success, error, notify)
          .then(assertSpy, assertSpy)
          .then(done, done);
      });
    });
  }

  describe('Backbone.$.Deferred', () => {
    let Promise;

    beforeEach(() => {
      Promise = window.Promise;
      window.Promise = undefined;
    });

    afterEach(() => {
      window.Promise = Promise;
    });

    it('should fallback to Backbone.$.Deferred and trigger success', done => {
      const fn = jasmine.createSpy('fn').and.callFake((resolve, reject, notify) => {
        resolve('foo');
      });

      const notify = jasmine.createSpy('notify');

      const error = jasmine.createSpy('error').and.callFake(() => {
        jasmine.fail('Error callback should not be called');
        done();
      });

      const success = jasmine.createSpy('success').and.callFake(data => {
        expect(data).toBe('foo');
        expect(error).not.toHaveBeenCalled();
        expect(notify).not.toHaveBeenCalled();
        done();
      });

      promise(fn).then(success, error, notify);

      jasmine.clock().tick();
    });

    it('should fallback to Backbone.$.Deferred and trigger error', done => {
      const fn = jasmine.createSpy('fn').and.callFake((resolve, reject, notify) => {
        reject('foo');
      });

      const notify = jasmine.createSpy('notify');

      const success = jasmine.createSpy('error').and.callFake(() => {
        jasmine.fail('Success callback should not be called');
        done();
      });

      const error = jasmine.createSpy('success').and.callFake(data => {
        expect(data).toBe('foo');
        expect(notify).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        done();
      });

      promise(fn).then(success, error, notify);

      jasmine.clock().tick();
    });
  });

  describe('fallback', () => {
    let Promise;
    let Deferred;

    beforeEach(() => {
      Promise = window.Promise;
      Deferred = Backbone.$.Deferred;

      window.Promise = undefined;
      Backbone.$.Deferred = undefined;
    });

    afterEach(() => {
      window.Promise = Promise;
      Backbone.$.Deferred = Deferred;
    });

    it('should fallback to noop', () => {
      const fn = jasmine.createSpy('fn');

      promise(fn);

      expect(fn).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.any(Function),
        jasmine.any(Function)
      );
    });
  });
});
