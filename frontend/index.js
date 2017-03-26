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

  static get DEFAULT_STATUS_OPTS() {
    return {
      context: 'Lighthouse'
    };
  }

  static testOnHeadlessChrome(testUrl) {
    const builderUrl = 'https://builder-dot-lighthouse-ci.appspot.com/ci' +
                       `?format=json&url=${testUrl}`;
    return fetch(builderUrl)
      .then(resp => resp.json())
      .then(lhResults => {
        return {score: this.getOverallScore(lhResults)};
      }).catch(err => {
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
    // params.set('location', 'Dulles_Nexus5:Nexus 5 - Chrome Beta.3GFast');
    params.set('location', 'Dulles_MotoG4:Moto G4 - Chrome Beta.3GFast');
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
    const statusObj = Object.assign({}, this.DEFAULT_STATUS_OPTS, opts);

    return github.repos.createStatus(statusObj).then(status => {
      console.log(status.data.description);
      return status;
    });
  }

  /**
   * Runs Lighthouse against the changes in a PR.
   * @param {!{Object} config
   * @return {!Promise<Object>}
   */
  static processPullRequest(config) {
    const prInfo = {
      repo: config.repo.name,
      owner: config.repo.owner,
      sha: config.pr.sha
    };

    return LighthouseCI.testOnWebpageTest(config.stagingUrl, config.pingbackUrl)
      .then(json => {
        if (!json.data || !json.data.testId) {
          throw new Error('Lighthouse results were not found in WebPageTest results.');
        }

        const wptTestId = json.data.testId;

        // stash wpt id -> github pr sha mapping.
        WPT_PR_MAP.set(wptTestId, {prInfo, config});

        return LighthouseCI.updateGithubStatus(Object.assign({
          state: 'pending',
          description: 'Auditing PR changes...',
          target_url: json.data.userUrl
        }, prInfo));
      })
      .catch(err => {
        handleError(err, prInfo);
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

    let description = `Failed. New Lighthouse score would be ${score}/100 ` +
                      `(required ${config.minPassScore}+).`;
    if (passing) {
      description = `Passed. New Lighthouse score would be ${score}/100.`;
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

// app.post('/github_hook', (req, res) => {
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

      const baseOpts = Object.assign({
        target_url: `https://www.webpagetest.org/lighthouse.php?test=${wptTestId}`
      }, prInfo);

      const lhResults = json.data.lighthouse;

      return LighthouseCI.assignPassFailToPR(lhResults, config, baseOpts).then(score => {
        WPT_PR_MAP.delete(wptTestId); // Cleanup
        res.status(200).send({score});
      });
    }).catch(err => {
      handleError(err, prInfo);
      res.json(err);
    });
});

app.post('/github_status', (req, res) => {
  const config = Object.assign({
    pingbackUrl: `${req.protocol}://${req.get('host')}/wpt_ping`
  }, req.body);

  LighthouseCI.processPullRequest(config).then(result => {
    res.status(200).send(result);
  }).catch(() => {
    res.status(404).send('Unable to process pull request.');
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
