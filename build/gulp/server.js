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
const gutil = require('gulp-util');
const Q = require('q');
const gls = require('gulp-live-server');
const rollup = require('rollup').rollup;
const includePaths = require('rollup-plugin-includepaths');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');

module.exports = options => {
  const bundle = id => {
    const rollupConf = {
      entry: path.join(options.sample, id, 'app.js'),
      plugins: [
        includePaths({
          paths: [
            options.dist
          ]
        }),

        nodeResolve({
          jsnext: true,
          main: true
        }),

        commonjs(),

        babel({
          babelrc: false,
          presets: ['es2015-rollup']
        })
      ]
    };

    const bundleConf = {
      dest: path.join(options.sample, id, '.tmp', 'bundle.js'),
      format: 'iife'
    };

    return rollup(rollupConf)
      .then(bundle => {
        return bundle.write(bundleConf);
      })
      .catch(err => {
        gutil.log(gutil.colors.red(err));
      });
  };

  const bundleAll = () => {
    const promises = ['dom', 'remote', 'mustache'].map(id => bundle(id));
    return Q.all(promises);
  };

  gulp.task('serve', ['build'], () => {
    bundleAll().then(() => {
      const main = path.join(options.sample, 'server.js');
      const server = gls.new(main);

      // Start server.
      server.start();

      const srcFiles = path.join(options.src, '**', '*.js');
      const distFiles = path.join(options.dist, '**', '*.js');
      const sampleFiles = path.join(options.sample, '**', '*.js');
      const bundles = path.join(options.sample, '**', '.tmp', '*.js');
      const htmlFiles = path.join(options.sample, '**', '*.html');
      const cssFiles = path.join(options.sample, '**', '*.css');

      // Rebuild dist file when a source file is updated.
      gulp.watch(srcFiles, () => {
        gutil.log(gutil.colors.gray(`Change detected in source files, rebuild`));
        gulp.start('build');
      });

      // Rebuild sample bundle when dist file is updated.
      gulp.watch(distFiles, () => {
        gutil.log(gutil.colors.gray(`Change detected in dist files, bundle app`));
        bundleAll();
      });

      // Rebuild sample when sample source files are updated.
      gulp.watch([sampleFiles, `!${bundles}`], () => {
        gutil.log(gutil.colors.gray(`Change detected in sample, bundle app`));
        bundleAll();
      });

      // Reload when bundle app is updated.
      gulp.watch([bundles, htmlFiles, cssFiles], () => {
        gutil.log(gutil.colors.green(`Change detected, notify server`));
        server.notify();
      });
    });
  });
};
