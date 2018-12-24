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
const eslint = require('gulp-eslint');
const log = require('../log');
const conf = require('../conf');

module.exports = function lint() {
  const sources = [
    path.join(conf.src, '**', '*.js'),
    path.join(conf.test, '**', '*.js'),
    path.join(conf.scripts, '**', '*.js'),
    path.join(conf.sample, '*', '*.js'),
    path.join(conf.sample, '*.js'),
  ];

  log.debug('Linting source files: ');

  sources.forEach((src) => (
    log.debug(`  ${src}`)
  ));

  return gulp.src(sources)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
};
