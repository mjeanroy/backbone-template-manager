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

const path = require('path');
const gulp = require('gulp');
const rollup = require('rollup');
const babel = require('gulp-babel');
const babelConf = require('../babel.conf');
const rollupConf = require('../rollup.conf');
const applyRollup = config => (
  rollup.rollup(config.rollup).then(bundle => (
    bundle.write(config.bundle).then(() => config.bundle.dest)
  ))
);

module.exports = options => {
  gulp.task('build', ['clean'], () => {
    return applyRollup(rollupConf(options))
      .then(src => (
        gulp.src(src)
          .pipe(babel(babelConf()))
          .pipe(gulp.dest(path.join(options.dist, 'es5')))
      ));
  });
};
