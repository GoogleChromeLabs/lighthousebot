/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const express = require('express');
const fetch = require('node-fetch');

const app = express();
const testUrl = 'https://www.chromestatus.com/features';

function getOverallScore(results) {
  const scoredAggregations = results.aggregations.filter(a => a.scored);
  const total = scoredAggregations.reduce((sum, aggregation) => {
    return sum + aggregation.total;
  }, 0);
  return (total / scoredAggregations.length) * 100;
}

app.get('/', (req, res) => {
  const url = `https://builder-dot-lighthouse-ci.appspot.com/ci?format=json&url=${testUrl}`;

  fetch(url)
    .then(resp => resp.json())
    .then(json => {
      res.status(200).send('Lighthouse score: ' + getOverallScore(json));
    }).catch(err => {
      res.status(500).send('ERRO: ' + err.message);
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
