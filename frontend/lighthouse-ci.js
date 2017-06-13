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

const fetch = require('node-fetch'); // polyfill
const Github = require('github');
const URL = require('url').URL;
const URLSearchParams = require('url').URLSearchParams;

class LighthouseCI {

  /**
   * @param {!string} token Github OAuth token that has repo:status access.
   */
  constructor(token) {
    this.github = new Github({debug: false, Promise: Promise});
    this.github.authenticate({type: 'oauth', token});
  }

  handleError(err, prInfo) {
    console.error(err);
    this.updateGithubStatus(Object.assign({
      state: 'error',
      description: `Error. ${err.message}`
    }, prInfo));
  }

  testOnHeadlessChrome(body, headers) {
    headers = Object.assign(headers, {
      'Content-Type': 'application/json'
    });

    // POST https://builder-dot-lighthouse-ci.appspot.com/ci
    // '{"format": "json", "url": <testUrl>}"'
    return fetch('https://builder-dot-lighthouse-ci.appspot.com/ci', {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    })
    .then(resp => resp.json())
    .catch(err => {
      throw err;
    });
  }

  /**
   * Uses WebPageTest's Rest API to run Lighthouse and score a URL.
   * See https://sites.google.com/a/webpagetest.org/docs/advanced-features/webpagetest-restful-apis
   * @param {!string} apiKey
   * @param {!string} testUrl URL to audit.
   * @param {!string} pingback URL for WPT to ping when result is ready.
   * @return {!Promise} json response from starting a WPT run.
   */
  startOnWebpageTest(apiKey, testUrl, pingback) {
    const params = new URLSearchParams();
    params.set('k', apiKey);
    params.set('f', 'json');
    params.set('pingback', pingback); // The pingback is passed an "id" parameter of the test.
    // TODO: match emulation to LH settings.
    params.set('location', 'Dulles_Nexus5:Nexus 5 - Chrome Beta.3G_EM');
    // For native: Dulles_Linux:Chrome.Native
    // params.set('location', 'Dulles_MotoG4:Moto G4 - Chrome Beta.3GFast');
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
    return lhResults.score;
  }

  /**
   * Updates associated PR status.
   * @param {!Object=} opts Options to set the status with.
   * @return {!Promise<Object>} Status object from Github API.
   */
  updateGithubStatus(opts={}) {
    const statusObj = Object.assign({context: 'Lighthouse'}, opts);

    return this.github.repos.createStatus(statusObj).then(status => {
      console.log(status.data.description);
      return status;
    });
  }

  /**
   * Updates pass/fail state of PR.
   * @param {!Object} lhResults Lighthouse results object.
   * @param {!{minPassScore: number}} config
   * @param {!Object} opts Options to set the status with.
   * @return {!Promise<number>} Overall lighthouse score.
   */
  assignPassFailToPR(lhResults, config, opts) {
    const score = Math.round(LighthouseCI.getOverallScore(lhResults));
    const passing = config.minPassScore <= score;

    let description = `Failed. This PR drops your score to ${score}/100 ` +
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

  /**
   * Posts a comment to the PR with the latest Lighthouse scores.
   * @param {!{owner: string, repo: string, number: number}} prInfo
   * @param {!Object} lhResults Lighthouse results object.
   * @return {!Promise<number>} Lighthouse score.
   */
  postLighthouseComment(prInfo, lhResults) {
    let rows = '';
    lhResults.reportCategories.forEach(cat => {
      rows += `| ${cat.name} | ${Math.round(cat.score)} |\n`;
    });

    const body = `
Updated [Lighthouse](https://developers.google.com/web/tools/lighthouse/) report for the changes in this PR:

| Category  | Score |
| ------------- | ------------- |
${rows}

_Tested with Lighthouse version: ${lhResults.lighthouseVersion}_`;

    const score = LighthouseCI.getOverallScore(lhResults);

    // eslint-disable-next-line no-unused-vars
    return this.github.issues.createComment(Object.assign({body}, prInfo)).then(status => score);
  }
}

module.exports = LighthouseCI;
