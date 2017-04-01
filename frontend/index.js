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
const Github = require('github');
const URL = require('url').URL;
const URLSearchParams = require('url').URLSearchParams;

// const CI_FILE = 'lighthouse.ci.json';
const WPT_API_KEY = 'A.04c7244ba25a5d6d717b0343a821aa59';
const WPT_PR_MAP = new Map();

const GITHUB_PENDING_STATUS = {
  state: 'pending',
  description: 'Auditing PR changes...'
};

const github = new Github({debug: false, Promise: Promise});
github.authenticate({type: 'oauth', token: process.env.OAUTH_TOKEN}); // lighthousebot creds

function handleError(err, prInfo) {
  console.error(err);
  LighthouseCI.updateGithubStatus(Object.assign({
    state: 'error',
    description: `Error. ${err.message}`
  }, prInfo));
}

class LighthouseCI {

  static testOnHeadlessChrome(body) {
    // POST https://builder-dot-lighthouse-ci.appspot.com/ci
    // '{"format": "json", "url": <testUrl>}"'
    return fetch('https://builder-dot-lighthouse-ci.appspot.com/ci', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'}
    })
    .then(resp => resp.json())
    .catch(err => {
      throw err;
    });
  }

  /**
   * Uses WebPageTest's Rest API to run Lighthouse and score a URL.
   * See https://sites.google.com/a/webpagetest.org/docs/advanced-features/webpagetest-restful-apis
   * @param {!string} testUrl URL to audit.
   * @param {!string} pingback URL for WPT to ping when result is ready.
   * @return {!Promise} json response from starting a WPT run.
   */
  static testOnWebpageTest(testUrl, pingback) {
    const params = new URLSearchParams();
    params.set('k', WPT_API_KEY);
    params.set('f', 'json');
    params.set('pingback', pingback); // The pingback is passed an "id" parameter of the test.
    // TODO: match emulation to LH settings. Nexus 5 doesn't work atm.
    // params.set('location', 'Dulles_Nexus5:Nexus 5 - Chrome Beta.3G_EM');
    // For native: Dulles_Linux:Chrome.Native
    params.set('location', 'Dulles_MotoG4:Moto G4 - Chrome Beta.3G_EM');
    params.set('mobile', 1); // Emulate mobile (for desktop cases).
    params.set('type', 'lighthouse'); // LH-only run.
    params.set('lighthouse', 1);
    params.set('url', testUrl);

    const wptUrl = new URL('https://www.webpagetest.org/runtest.php');
    wptUrl.search = params;

    return fetch(wptUrl.toString())
      .then(resp => resp.json())
      .catch(err => {
        throw err;
      });
  }

  /**
   * Calculates an overall score across all sub audits.
   * @param {!Object} lhResults Lighthouse results object.
   * @return {!number}
   */
  static getOverallScore(lhResults) {
    const scoredAggregations = lhResults.aggregations.filter(a => a.scored);
    const total = scoredAggregations.reduce((sum, aggregation) => {
      return sum + aggregation.total;
    }, 0);
    return Math.round((total / scoredAggregations.length) * 100);
  }

  // /**
  //  * Calculates an overall score across all sub audits.
  //  * @param {!Object} req Express request.
  //  * @return {!Promise<Object>}
  //  */
  // static fetchLighthouseCIFile(req) {
  //   const fullName = req.body.pull_request.base.repo.full_name;
  //   const branch = req.body.pull_request.base.ref;
  //   const url = `https://raw.githubusercontent.com/${fullName}/${branch}/${CI_FILE}`;

  //   const prInfo = {
  //     repo: req.body.pull_request.head.repo.name,
  //     owner: req.body.pull_request.head.repo.owner.login,
  //     sha: req.body.pull_request.head.sha
  //   };

  //   console.log(`Fetching ${url}`);

  //   return fetch(url).then(resp => {
  //     if (resp.status !== 200) {
  //       throw new Error(`Missing ${url}`);
  //     }
  //     return resp.json();
  //   })
  //   .catch(err => {
  //     return LighthouseCI.updateGithubStatus(Object.assign({
  //       state: 'error',
  //       description: `Error. ${err.message}`
  //     }, prInfo));
  //   });
  // }

  /**
   * Updates associated PR status.
   * @param {!Object=} opts Options to set the status with.
   * @return {!Promise<Object>} Status object from Github API.
   */
  static updateGithubStatus(opts={}) {
    const statusObj = Object.assign({context: 'Lighthouse'}, opts);

    return github.repos.createStatus(statusObj).then(status => {
      console.log(status.data.description);
      return status;
    });
  }

  /**
   * Updates pass/fail state of PR.
   * @param {!Object} lhResults Lighthouse results object.
   * @param {!{minPassScore: number}} config
   * @param {!Object} opts Options to set the status with.
   * @return {!Promise<Object>} Status object from Github API.
   */
  static assignPassFailToPR(lhResults, config, opts) {
    const score = this.getOverallScore(lhResults);
    const passing = config.minPassScore <= score;

    let description = `Failed. This PR drops your Lighthouse score to ${score}/100 ` +
                      `(required ${config.minPassScore}+).`;
    if (passing) {
      description = `Passed. Lighthouse score will be ${score}/100.`;
    }

    const status = Object.assign({
      description,
      state: passing ? 'success' : 'failure'
    }, opts);

    // eslint-disable-next-line no-unused-vars
    return this.updateGithubStatus(status).then(status => score);
  }
}

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send('Nothing to see here');
});

// app.post('/github_webhook', (req, res) => {
//   if (!('x-github-event' in req.headers)) {
//     res.status(400).send('Not a request from Github.');
//     return;
//   }

//   if (req.headers['x-github-event'] === 'pull_request') {
//     if (['opened', 'reopened', 'synchronize'].includes(req.body.action)) {
//       LighthouseCI.fetchLighthouseCIFile(req)
//         .then(config => LighthouseCI.processPullRequest(req, config))
//         .then(result => {
//           res.status(200).send(result);
//         });
//       return;
//     }
//   }

//   res.status(200).send('');
// });

// app.get('/test_wpt', (req, res) => {
//   const pingbackUrl = 'https://14195295.ngrok.io/wpt_ping';
//   const testUrl = 'https://www.chromestatus.com/features';

//   return LighthouseCI.testOnWebpageTest(testUrl, pingbackUrl)
//     .then(json => {
//       // stash wpt id -> github pr sha mapping.
//       WPT_PR_MAP.set(json.data.testId, {prInfo: {}, config: {}});

//       res.status(200).send(json.data.userUrl);
//     })
//     .catch(err => {
//       res.status(500).send(err.message);
//     });
// });

app.get('/wpt_ping', (req, res) => {
  const wptTestId = req.query.id;

  if (!WPT_PR_MAP.has(wptTestId)) {
    res.status(404).send('Unknown WebPageTest id.');
    return;
  }

  const {prInfo, config} = WPT_PR_MAP.get(wptTestId);

  fetch(`https://www.webpagetest.org/jsonResult.php?test=${wptTestId}`)
    .then(resp => resp.json())
    .then(json => {
      if (!json.data || !json.data.lighthouse) {
        throw new Error('Lighthouse results were not found in WebPageTest results.');
      }

      const opts = Object.assign({
        target_url: `https://www.webpagetest.org/lighthouse.php?test=${wptTestId}`
      }, prInfo);

      const lhResults = json.data.lighthouse;

      console.log(lhResults);

      return LighthouseCI.assignPassFailToPR(lhResults, config, opts).then(score => {
        WPT_PR_MAP.delete(wptTestId); // Cleanup
        res.status(200).send({score});
      });
    })
    .catch(err => {
      handleError(err, prInfo);
      res.json(err);
    });
});

app.post('/run_on_wpt', (req, res) => {
  const config = Object.assign({
    pingbackUrl: `${req.protocol}://${req.get('host')}/wpt_ping`
  }, req.body);
  const testUrl = config.testUrl;

  const prInfo = {
    repo: config.repo.name,
    owner: config.repo.owner,
    sha: config.pr.sha
  };

  return LighthouseCI.testOnWebpageTest(testUrl, config.pingbackUrl)
    .then(json => {
      if (!json.data || !json.data.testId) {
        throw new Error('Lighthouse results were not found in WebPageTest results.');
      }

      // stash wpt id -> github pr sha mapping.
      WPT_PR_MAP.set(json.data.testId, {prInfo, config});

      return LighthouseCI.updateGithubStatus(Object.assign({
        target_url: json.data.userUrl
      }, prInfo, GITHUB_PENDING_STATUS));
    })
    .then(result => {
      res.status(200).send(result);
    })
    .catch(err => {
      handleError(err, prInfo);
      res.status(500).send(err.message);
    });
});

app.post('/run_on_chrome', (req, res) => {
  const config = Object.assign({}, req.body);
  const testUrl = config.testUrl;

  const prInfo = {
    repo: config.repo.name,
    owner: config.repo.owner,
    sha: config.pr.sha
  };

  if (!('x-api-key' in req.headers)) {
    const err = new Error(msg);
    const msg = 'API_KEY was missing.';
    handleError(err, prInfo);
    res.status(403).json(err.message);
    return;
  }

  LighthouseCI.updateGithubStatus(Object.assign({}, prInfo, GITHUB_PENDING_STATUS))
     // eslint-disable-next-line no-unused-vars
    .then(status => LighthouseCI.testOnHeadlessChrome({format: config.format, url: testUrl}))
    .then(lhResults => {
      const opts = Object.assign({target_url: testUrl}, prInfo);

      return LighthouseCI.assignPassFailToPR(lhResults, config, opts).then(score => {
        res.status(200).send({score});
      });
    })
    .catch(err => {
      handleError(err, prInfo);
      res.json(err);
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
