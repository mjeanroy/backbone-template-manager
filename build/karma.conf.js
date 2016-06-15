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
const includePaths = require('rollup-plugin-includepaths');
const babel = require('rollup-plugin-babel');
const root = path.join(__dirname, '..');

module.exports = config => {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: root,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // Files to load in the browser.
    files: [
      {pattern: 'node_modules/jquery/dist/jquery.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/underscore/underscore.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/backbone/backbone.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/jasmine-ajax/lib/mock-ajax.js', watched: false, included: true, served: true},
      {pattern: 'src/**/*.js', watched: true, included: false, served: true},
      {pattern: 'test/**/*.js', watched: true, included: true, served: true}
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/*.js': ['rollup'],
      'test/**/*.js': ['rollup']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Rollup Configuration
    rollupPreprocessor: {
      rollup: {
        external: ['underscore', 'backbone'],
        plugins: [
          includePaths({
            paths: [path.join(root, 'src')],
            external: ['underscore', 'backbone']
          }),

          babel({
            babelrc: false,
            presets: ['es2015-rollup']
          })
        ]
      },

      bundle: {
        sourceMap: 'inline',
        format: 'iife',
        moduleName: 'Backbone.TemplateManager',
        globals: {
          underscore: '_',
          backbone: 'Backbone'
        }
      }
    }
  });
};
