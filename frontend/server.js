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

const bodyParser = require('body-parser');
const express = require('express');
const fetch = require('node-fetch'); // polyfill
const LighthouseCI = require('./lighthouse-ci');

const WPT_API_KEY = 'A.04c7244ba25a5d6d717b0343a821aa59';
const WPT_PR_MAP = new Map();

const GITHUB_PENDING_STATUS = {
  state: 'pending',
  description: 'Auditing PR changes...'
};

const CI = new LighthouseCI(process.env.OAUTH_TOKEN);
const API_KEY_HEADER = 'X-API-KEY';

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public', {
  extensions: ['html', 'htm'],
}));

app.get('/', (req, res) => {
  res.redirect('https://github.com/GoogleChrome/lighthouse#readme');
});

// Handler pingback result from webpagetest.
app.get('/wpt_ping', async (req, res) => {
  const wptTestId = req.query.id;

  if (!WPT_PR_MAP.has(wptTestId)) {
    res.status(404).send('Unknown WebPageTest id.');
    return;
  }

  const {prInfo, config} = WPT_PR_MAP.get(wptTestId);

  const resp = await fetch(`https://www.webpagetest.org/jsonResult.php?test=${wptTestId}`);

  try {
    const json = await resp.json();

    if (!json.data || !json.data.lighthouse) {
      console.log(json);
      throw new Error('Lighthouse results were not found in WebPageTest results.');
    }

    const lhResults = json.data.lighthouse;
    const targetUrl = `https://www.webpagetest.org/lighthouse.php?test=${wptTestId}`;

    if (config.minPassScore) {
      await CI.assignPassFailToPR(lhResults, config, Object.assign({
        target_url: targetUrl
      }, prInfo));
    } else {
      await CI.updateGithubStatus(Object.assign({
        description: 'Auditing complete. See scores above.',
        state: 'success',
        target_url: targetUrl
      }, prInfo));
    }

    // Post comment on issue with updated LH scores.
    if (config.addComment) {
      try {
        await CI.postLighthouseComment(prInfo, lhResults);
      } catch (err) {
        res.json('Error posting Lighthouse comment to PR.');
      }
    }

    WPT_PR_MAP.delete(wptTestId); // cleanup

    res.status(200).send({score: LighthouseCI.getOverallScore(lhResults)});
  } catch (err) {
    CI.handleError(err, prInfo);
    res.json(err);
  }
});

// Handler to start Lighthouse run on webpagetest.
app.post('/run_on_wpt', async (req, res) => {
  const config = Object.assign({
    pingbackUrl: `${req.protocol}://${req.get('host')}/wpt_ping`
  }, req.body);

  const prInfo = {
    repo: config.repo.name,
    owner: config.repo.owner,
    number: config.pr.number,
    sha: config.pr.sha
  };

  console.log(`${API_KEY_HEADER}: ${req.get(API_KEY_HEADER)}`);

  try {
    const json = await CI.startOnWebpageTest(WPT_API_KEY, config.testUrl, config.pingbackUrl);

    if (!json.data || !json.data.testId) {
      throw new Error(
          'Lighthouse results were not found in WebPageTest results.');
    }

    // Stash wpt id -> github pr sha mapping.
    WPT_PR_MAP.set(json.data.testId, {prInfo, config});

    const result = await CI.updateGithubStatus(Object.assign({
      target_url: json.data.userUrl
    }, prInfo, GITHUB_PENDING_STATUS));

    res.status(200).send(result);
  } catch (err) {
    CI.handleError(err, prInfo);
    res.status(500).send(err.message);
  }
});

// Handler to start Lighthouse run on Chrome.
app.post('/run_on_chrome', async (req, res) => {
  const config = Object.assign({}, req.body);

  const prInfo = {
    repo: config.repo.name,
    owner: config.repo.owner,
    number: config.pr.number,
    sha: config.pr.sha
  };

  // // Require an API key from users.
  // if (!req.get(API_KEY_HEADER)) {
  //   const msg = `${API_KEY_HEADER} is missing`;
  //   const err = new Error(msg);
  //   CI.handleError(err, prInfo);
  //   res.status(403).json(err.message);
  //   return;
  // }

  // Update GH status: inform user auditing has started.
  try {
    const status = Object.assign({}, prInfo, GITHUB_PENDING_STATUS);
    await CI.updateGithubStatus(status);
  } catch (err) {
    CI.handleError(err, prInfo);
  }

  console.log(`${API_KEY_HEADER}: ${req.get(API_KEY_HEADER)}`);

  // Run Lighthouse CI against the PR changes.
  let lhResults;
  try {
    const headers = {[API_KEY_HEADER]: req.get(API_KEY_HEADER)};
    lhResults = await CI.testOnHeadlessChrome(
        {format: config.format, url: config.testUrl}, headers);
  } catch (err) {
    CI.handleError(err, prInfo);
    res.json(`Error from CI backend. ${err.message}`);
    return; // Treat a LH error as fatal. Do not proceed.
  }

  try {
    // Assign pass/fail to PR if a min score is provided.
    if (config.minPassScore) {
      await CI.assignPassFailToPR(lhResults, config, Object.assign({
        target_url: config.testUrl
      }, prInfo));
    } else {
      await CI.updateGithubStatus(Object.assign({
        description: 'Auditing complete. See scores above.',
        state: 'success'
      }, prInfo));
    }
  } catch (err) {
    CI.handleError(err, prInfo);
  }

  // Post comment on issue with updated LH scores.
  if (config.addComment) {
    try {
      await CI.postLighthouseComment(prInfo, lhResults);
    } catch (err) {
      res.json('Error posting Lighthouse comment to PR.');
    }
  }

  res.status(200).send({score: LighthouseCI.getOverallScore(lhResults)});
});

// app.post('/github_webhook', async (req, res) => {
//   if (!('x-github-event' in req.headers)) {
//     res.status(400).send('Not a request from Github.');
//     return;
//   }

//   // Ignore non-pull request events.
//   if (req.headers['x-github-event'] !== 'pull_request') {
//     res.status(200).send('Not a pull request event.');
//     return;
//   }

//   if (['opened', 'reopened', 'synchronize'].includes(req.body.action)) {
//     const prInfo = {
//       owner: req.body.repository.full_name.split('/')[0],
//       repo: req.body.repository.full_name.split('/')[1],
//       number: req.body.number,
//       sha: req.body.pull_request.head.sha
//     };
//   } else {
//     res.status(200).send('');
//   }
// });

// app.get('/test_wpt', (req, res) => {
//   const pingbackUrl = 'https://68002859.ngrok.io/wpt_ping';
//   const testUrl = 'https://www.chromestatus.com/features';

//   return CI.startOnWebpageTest(testUrl, pingbackUrl)
//     .then(json => {
//       // stash wpt id -> github pr sha mapping.
//       WPT_PR_MAP.set(json.data.testId, {prInfo: {}, config: {}});

//       res.status(200).send(json.data.userUrl);
//     })
//     .catch(err => {
//       res.status(500).send(err.message);
//     });
// });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
