#!/usr/bin/env node

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
const minimist = require('minimist');

const CI_HOST = process.env.LIGHTHOUSE_CI_HOST || 'https://lighthouse-ci.appspot.com';
const API_KEY = process.env.LIGHTHOUSE_API_KEY || process.env.API_KEY;
const RUNNERS = {chrome: 'chrome', wpt: 'wpt'};

if (process.env.API_KEY) {
  console.log(`Warning: The environment variable API_KEY is deprecated.
    Please use LIGHTHOUSE_API_KEY instead.`);
}

function printUsageAndExit() {
  const usage = `Usage:
runlighthouse.js [--perf,pwa,seo,a11y,bp=<score>] [--no-comment] [--runner=${Object.keys(RUNNERS)}] <url>

Options:
  Minimum score values can be pased per category as a way to fail the PR if
  the thresholds are not met. If you don't provide thresholds, the PR will
  be mergeable no matter what the scores.

  --pwa        Minimum PWA score for the PR to be considered "passing". [Number]
  --perf       Minimum performance score for the PR to be considered "passing". [Number]
  --seo        Minimum seo score for the PR to be considered "passing". [Number]
  --a11y       Minimum accessibility score for the PR to be considered "passing". [Number]
  --bp         Minimum best practices score for the PR to be considered "passing". [Number]

  --no-comment Doesn't post a comment to the PR issue summarizing the Lighthouse results. [Boolean]

  --runner     Selects Lighthouse running on Chrome or WebPageTest. [--runner=${Object.keys(RUNNERS)}]

  --help       Prints help.

Examples:

  Runs Lighthouse and posts a summary of the results.
    runlighthouse.js https://example.com

  Fails the PR if the performance score drops below 93. Posts the summary comment.
    runlighthouse.js --perf=93 https://example.com

  Fails the PR if perf score drops below 93 or the PWA score drops below 100. Posts the summary comment.
    runlighthouse.js --perf=93 --pwa=100 https://example.com

  Runs Lighthouse on WebPageTest. Fails the PR if the perf score drops below 93.
    runlighthouse.js --perf=93 --runner=wpt --no-comment https://example.com`;

  console.log(usage);
  process.exit(1);
}

/**
 * Collects command lines flags and creates settings to run LH CI.
 * @return {!Object} Settings object.
 */
function getConfig() {
  const args = process.argv.slice(2);
  const argv = minimist(args, {
    boolean: ['comment', 'help'],
    default: {comment: true},
    alias: {help: 'h'}
  });
  const config = {};

  if (argv.help) {
    printUsageAndExit();
  }

  config.testUrl = argv._[0];
  if (!config.testUrl) {
    console.log('Please provide a url to test.');
    printUsageAndExit();
  }

  config.addComment = argv.comment;
  config.thresholds = {};
  if ('perf' in argv) {
    config.thresholds.performance = Number(argv.perf);
  }
  if ('pwa' in argv) {
    config.thresholds.pwa = Number(argv.pwa);
  }
  if ('seo' in argv) {
    config.thresholds.seo = Number(argv.seo);
  }
  if ('a11y' in argv) {
    config.thresholds.accessibility = Number(argv.a11y);
  }
  if ('bp' in argv) {
    config.thresholds['best-practices'] = Number(argv.bp);
  }

  if (!config.addComment && !Object.keys(config.thresholds).length) {
    console.log(`Please provide a threshold score for at least one category
      (pwa,perf,seo,a11y) when using --no-comment.]\n`);
    printUsageAndExit();
  }

  config.runner = argv.runner || RUNNERS.chrome;
  const possibleRunners = Object.keys(RUNNERS);
  if (!possibleRunners.includes(config.runner)) {
    console.log(
      `Unknown runner "${config.runner}". Options: ${possibleRunners}`);
    printUsageAndExit();
  }
  console.log(`Using runner: ${config.runner}`);

  config.pr = {
    number: parseInt(process.env.TRAVIS_PULL_REQUEST, 10),
    sha: process.env.TRAVIS_PULL_REQUEST_SHA
  };

  const repoSlug = process.env.TRAVIS_PULL_REQUEST_SLUG;
  if (!repoSlug) {
    throw new Error('This script can only be run on Travis PR requests.');
  }

  config.repo = {
    owner: repoSlug.split('/')[0],
    name: repoSlug.split('/')[1]
  };

  return config;
}

/**
 * @param {!Object} config Settings to run the Lighthouse CI.
 */
function run(config) {
  let endpoint;
  let body = JSON.stringify(config);

  switch (config.runner) {
    case RUNNERS.wpt:
      endpoint = `${CI_HOST}/run_on_wpt`;
      break;
    case RUNNERS.chrome: // same as default
    default:
      endpoint = `${CI_HOST}/run_on_chrome`;
      body = JSON.stringify(Object.assign({output: 'json'}, config));
  }

  fetch(endpoint, {method: 'POST', body, headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': API_KEY
  }})
    .then(resp => resp.json())
    .then(json => {
      if (config.runner === RUNNERS.wpt) {
        console.log(
          `Started Lighthouse run on WebPageTest: ${json.data.target_url}`);
        return;
      }
      console.log('New Lighthouse scores:');
      console.log(JSON.stringify(json));
    })
    .catch(err => {
      console.log('Lighthouse CI failed', err);
      process.exit(1);
    });
}

// Run LH if this is a PR.
const config = getConfig();
if (process.env.TRAVIS_EVENT_TYPE === 'pull_request') {
  run(config);
} else {
  console.log('Lighthouse is not run for non-PR commits.');
}
