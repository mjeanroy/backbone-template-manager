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
const rename = require('gulp-rename');
const rollup = require('rollup');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const headerComment = require('gulp-header-comment');
const stripBanner = require('gulp-strip-banner');

const log = require('../log');
const conf = require('../conf');
const rollupConf = require('./rollup.conf');
const uglifyConf = require('./uglify.conf');

/**
 * Create ESM bundle using rollup.
 *
 * @return {Promise} The done promise.
 */
function createESMBundle() {
  log.debug(`Rollup entry point`);
  return rollup.rollup(rollupConf).then((bundle) => {
    log.debug(`Writing rollup bundle`);
    return bundle.write(rollupConf.output);
  });
}

/**
 * Create ES5 bundle from given ESM bundle.
 *
 * @return {WritableStream} The stream pipeline.
 */
function createES5Bundle() {
  const esmBundle = rollupConf.output.file;
  const es5Directory = conf.es5;

  log.debug(`Creating ES5 bundle to '${es5Directory}' from ESM bundle: '${esmBundle}'`);

  return gulp.src(esmBundle)
      .pipe(stripBanner())
      .pipe(babel())
      .pipe(headerComment({file: conf.license}))
      .pipe(gulp.dest(es5Directory));
}

/**
 * Minify ES5 Bundle.
 *
 * @return {WritableStream} The stream pipeline.
 */
function minifyES5Bundle() {
  const es5Directory = conf.es5;
  const es5Bundle = path.join(es5Directory, conf.bundle);

  log.debug(`Minifying ES5 bundle: ${es5Bundle}`);

  return gulp.src(es5Bundle)
      .pipe(uglify(uglifyConf))
      .pipe(rename({extname: '.min.js'}))
      .pipe(gulp.dest(es5Directory));
}

/**
 * Create ESM bundle only.
 *
 * @param {function} done The `done` callback.
 * @return {void}
 */
function buildESMBundle() {
  return createESMBundle();
}

/**
 * Create ES5 bundle from ESM bundle.
 *
 * @param {function} done The `done` callback.
 * @return {void}
 */
function buildES5Bundle(done) {
  const taskFn = gulp.series(
      createES5Bundle,
      minifyES5Bundle
  );

  taskFn(done);
}

module.exports = function build(done) {
  const taskFn = gulp.series(
      buildESMBundle,
      buildES5Bundle
  );

  taskFn(done);
};
