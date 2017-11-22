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

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const Q = require('q');
const mkdirp = require('mkdirp');
const gls = require('gulp-live-server');

const rollup = require('rollup');
const alias = require('rollup-plugin-alias');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

const babel = require('babel-core');
const babelConf = require('../babel.conf');

// Temporary directory name.
const TMP = '.tmp';

module.exports = (options) => {
  const bundle = (id) => {
    gutil.log(gutil.colors.gray(`[${id}] Running rollup...`));
    const rollupConf = {
      input: path.join(options.sample, id, 'app.js'),
      format: 'iife',
      name: 'SampleApp',
      plugins: [
        alias({
          'backbone-template-manager': path.join(options.dist, 'backbone-template-manager.js'),
        }),

        nodeResolve({
          jsnext: true,
          main: true,
        }),

        commonjs(),
      ],
    };

    return rollup.rollup(rollupConf)
      .then((bundle) => {
        gutil.log(gutil.colors.gray(`[${id}] Generating ES6 bundle`));
        return bundle.generate(rollupConf).then((result) => {
          gutil.log(gutil.colors.gray(`[${id}] Creating temporary directory`));
          const deferred = Q.defer();
          const dir = path.join(options.sample, id, TMP);
          mkdirp(dir, (err) => err ? deferred.reject(err) : deferred.resolve({dir, result}));
          return deferred.promise;
        })
        .then(({dir, result}) => {
          gutil.log(gutil.colors.gray(`[${id}] Creating ES5 bundle`));
          const dest = path.join(dir, 'bundle.js');
          const es5 = babel.transform(result.code, babelConf);
          return {dest, es5};
        })
        .then(({dest, es5}) => {
          gutil.log(gutil.colors.gray(`[${id}] Writing ES5 bundle to: ${dest}`));
          const deferred = Q.defer();
          fs.writeFile(dest, es5.code, 'utf-8', (err) => err ? deferred.reject(err) : deferred.resolve());
          return deferred.promise;
        });
      })
      .catch((err) => {
        gutil.log(gutil.colors.red(err));
      });
  };

  const bundleAll = () => {
    const promises = ['dom', 'remote', 'mustache'].map((id) => bundle(id));
    return Q.all(promises);
  };

  gulp.task('serve', ['build'], () => {
    return bundleAll().then(() => {
      const main = path.join(options.sample, 'server.js');
      const server = gls.new(main);

      // Start server.
      server.start();

      const srcFiles = path.join(options.src, '**', '*.js');
      const distFiles = path.join(options.dist, '**', '*.js');
      const sampleFiles = path.join(options.sample, '**', '*.js');
      const bundles = path.join(options.sample, '**', TMP, '*.js');
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

      gutil.log(gutil.colors.black('Sample bundles are ready...'));
    });
  });
};
