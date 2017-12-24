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

const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const colors = require('ansi-colors');
const Q = require('q');
const karma = require('karma');
const KarmaServer = karma.Server;

module.exports = (options) => {
  const runKarma = (mode) => {
    const configFile = path.join(options.build, `karma.${mode}.conf.js`);
    const deferred = Q.defer();
    const onDone = () => deferred.resolve();
    const config = {configFile};

    log(colors.gray(`Running Karma server with configuration: ${configFile}`));

    const server = new KarmaServer(config, onDone);
    server.start();
    return deferred.promise;
  };

  ['test', 'tdd', 'saucelab'].forEach((mode) => {
    gulp.task(mode, () => {
      return runKarma(mode);
    });
  });

  gulp.task('travis', () => {
    if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
      log(colors.grey('SauceLab environment not set, running classic test suite'));
      return runKarma('test');
    }

    return runKarma('saucelab');
  });
};
