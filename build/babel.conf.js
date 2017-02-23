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

/* eslint no-multi-spaces:0 */

const conf = require('./app.conf');
const moduleName = conf.moduleName;
const globals = conf.globals;
const loose = conf.loose;

module.exports = {
  moduleId: moduleName,
  plugins: [
    ['transform-es2015-arrow-functions',        {loose}],
    ['transform-es2015-block-scoped-functions', {loose}],
    ['transform-es2015-block-scoping',          {loose}],
    ['transform-es2015-classes',                {loose}],
    ['transform-es2015-computed-properties',    {loose}],
    ['check-es2015-constants',                  {loose}],
    ['transform-es2015-destructuring',          {loose}],
    ['transform-es2015-duplicate-keys',         {loose}],
    ['transform-es2015-for-of',                 {loose}],
    ['transform-es2015-function-name',          {loose}],
    ['transform-es2015-literals',               {loose}],
    ['transform-es2015-object-super',           {loose}],
    ['transform-es2015-parameters',             {loose}],
    ['transform-es2015-shorthand-properties',   {loose}],
    ['transform-es2015-spread',                 {loose}],
    ['transform-es2015-sticky-regex',           {loose}],
    ['transform-es2015-template-literals',      {loose}],
    ['transform-es2015-typeof-symbol',          {loose}],
    ['transform-es2015-unicode-regex',          {loose}],
    ['transform-es2015-modules-umd',            {loose, globals}],
  ],
};
