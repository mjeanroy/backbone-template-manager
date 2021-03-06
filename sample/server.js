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

/* eslint-env node */
/* eslint-disable no-console */

const path = require('path');
const express = require('express');
const connectLivereload = require('connect-livereload');
const conf = require('../scripts/conf');

const port = 8080;
const app = express();

app.use(connectLivereload());

// Static directories
app.use('/vendors', express.static(path.join(conf.root, 'node_modules')));
app.use('/dist', express.static(path.join(conf.sample, '.tmp')));
app.use('/dist', express.static(conf.dist));
app.use('/', express.static(conf.sample));

const frameworks = require('./techs.json');

app.get('/api/frameworks', (req, res) => (
  res.json(frameworks)
));

app.listen(port, () => {
  console.log(`Server listening on : http://localhost:${port}`);
});
