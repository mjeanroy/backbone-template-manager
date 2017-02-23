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
const git = require('gulp-git');
const bump = require('gulp-bump');
const gulpFilter = require('gulp-filter');
const tagVersion = require('gulp-tag-version');
const runSequence = require('run-sequence');

module.exports = (options) => {
  const packageJson = path.join(options.root, 'package.json');

  gulp.task('tag', () => {
    // Read version number.
    const pkg = require(packageJson);
    const version = pkg.version;

    const src = [packageJson, options.dist];
    const isDist = (file) => file.path === options.dist;
    const distFilter = gulpFilter(isDist, {restore: true});

    return gulp.src(src)
      .pipe(git.add({args: '-f'}))
      .pipe(git.commit(`release: release version ${version}`))
      .pipe(tagVersion())
      .pipe(distFilter)
      .pipe(git.rm({args: '-r'}))
      .pipe(git.commit('release: prepare new release'));
  });

  ['patch', 'minor', 'major'].forEach((type) => {
    gulp.task(`bump:${type}`, () => {
      return gulp.src(packageJson)
        .pipe(bump({type}))
        .pipe(gulp.dest(options.root));
    });

    // A release run a bump task and a tag task in sequence.
    gulp.task(`release:${type}`, (done) => {
      runSequence('dist', `bump:${type}`, 'tag', done);
    });
  });

  // Default is a minor release.
  gulp.task('release', ['release:minor']);
};
