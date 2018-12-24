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

const fs = require('fs-extra');
const path = require('path');
const gulp = require('gulp');
const gls = require('gulp-live-server');
const babel = require('babel-core');
const rollup = require('rollup');
const alias = require('rollup-plugin-alias');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

const build = require('../build');
const log = require('../log');
const conf = require('../conf');
const babelConf = require('../babel.conf');

// Temporary directory name.
const TMP = '.tmp';

/**
 * Generate ESM bundle "in memory" (i.e this function returns a promise
 * with given result).
 *
 * @param {string} id The sample application name.
 * @param {Object} rollupConf The rollup configuration.
 * @return {Promise<RollupBuild>} The rollup result.
 */
function generateESMBundle(id, rollupConf) {
  log.debug(`[${id}] Generating bundle in memory`);
  return rollup.rollup(rollupConf)
      .then((bundle) => {
        log.debug(`[${id}] Generating ES6 bundle`);
        return bundle.generate(rollupConf);
      });
}

/**
 * Generate ES5 bundle with babel.
 *
 * @param {string} id The sample application name.
 * @param {string} code The ES2015 code.
 * @return {Promise<Void>} The promise result.
 */
function generateES5Bundle(id, code) {
  const dir = path.join(conf.sample, id, '.tmp');
  const dest = path.join(dir, 'bundle.js');

  log.debug(`[${id}] Generating ES5 code`);
  const result = babel.transform(code, babelConf);
  const es5 = result.code;

  log.debug(`[${id}] Writing ES5 bundle to: ${dest}`);
  return fs.outputFile(dest, es5, 'utf-8');
}

/**
 * Create sample application bundle.
 *
 * @param {string} id The sample application name.
 * @return {Promise<Void>} The promise result.
 */
function bundleApp(id) {
  log.debug(`[${id}] Running rollup...`);

  const rollupConf = {
    input: path.join(conf.sample, id, 'app.js'),

    output: {
      format: 'iife',
      name: 'SampleApp',
    },

    plugins: [
      alias({
        'backbone-template-manager': path.join(conf.dist, conf.bundle),
      }),

      nodeResolve({
        jsnext: true,
        main: true,
      }),

      commonjs(),
    ],
  };

  return generateESMBundle(id, rollupConf)
      .then((result) => result.code)
      .then((code) => generateES5Bundle(id, code))
      .catch((err) => log.error(err));
}


/**
 * Create sample applications bundle.
 *
 * @return {Promise<Void>} The promise result.
 */
function bundleApps() {
  return Promise.all(['dom', 'remote', 'mustache'].map((id) => (
    bundleApp(id)
  )));
}

module.exports = function serve() {
  return bundleApps().then(() => {
    const main = path.join(conf.sample, 'server.js');
    const server = gls.new(main);

    // Start server.
    server.start();

    const srcFiles = path.join(conf.src, '**', '*.js');
    const distFiles = path.join(conf.dist, '**', '*.js');
    const sampleFiles = path.join(conf.sample, '**', '*.js');
    const bundles = path.join(conf.sample, '**', TMP, '*.js');
    const htmlFiles = path.join(conf.sample, '**', '*.html');
    const cssFiles = path.join(conf.sample, '**', '*.css');

    /**
     * Rebuild dist file when a source file is updated.
     *
     * @param {*} done The `done` callback.
     * @return {void}
     */
    function onChangeSourceFiles(done) {
      log.debug(`Change detected in source files, rebuild`);
      build(done);
    }

    /**
     * Rebuild sample bundle when dist file is updated.
     *
     * @return {Promise<Void>} The done promise.
     */
    function onChangeDistFiles() {
      log.debug(colors.gray(`Change detected in dist files, bundle app`));
      return bundleApps();
    }

    /**
     * Rebuild sample when sample source files are updated.
     *
     * @return {Promise<Void>} The done promise.
     */
    function onChangeApps() {
      log.debug(`Change detected in sample, bundle app`);
      bundleApps();
    }

    /**
     * Reload sample application when a change is detected.
     *
     * @param {function} done The `done` callback.
     * @return {void}
     */
    function onChangeStaticFiles() {
      log.info(`Change detected, notify server`);
      server.notify();
    }

    gulp.watch(srcFiles, onChangeSourceFiles);
    gulp.watch(distFiles, onChangeDistFiles);
    gulp.watch([sampleFiles, `!${bundles}`], onChangeApps);
    gulp.watch([bundles, htmlFiles, cssFiles], onChangeStaticFiles);

    log.info('Sample bundles are ready...');
  });
};
