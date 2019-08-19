'use strict';

function isInvokedFromPr() {
  return process.env.TRAVIS_EVENT_TYPE === 'pull_request' || !!process.env.CIRCLE_PULL_REQUEST;
}

function getPrInfo() {
  // Travis
  if (process.env.TRAVIS_PULL_REQUEST) {
    return {
      number: parseInt(process.env.TRAVIS_PULL_REQUEST, 10),
      sha: process.env.TRAVIS_PULL_REQUEST_SHA
    };
  }

  // CircleCI
  if (process.env.CIRCLE_PULL_REQUEST) {
    const pieces = process.env.CIRCLE_PULL_REQUEST.split('/');
    return {
      number: parseInt(pieces[pieces.length-1], 10),
      sha: process.env.CIRCLE_SHA1
    };
  }

  return {};
}

function getRepoInfo() {
  // Travis
  if (process.env.TRAVIS_PULL_REQUEST_SLUG) {
    const repoSlug = process.env.TRAVIS_PULL_REQUEST_SLUG;
    const pieces = repoSlug.split('/');
    return {
      owner: pieces[0],
      name: pieces[1]
    };
  }

  // CircleCI
  if (process.env.CIRCLE_PROJECT_REPONAME) {
    return {
      owner: process.env.CIRCLE_PROJECT_USERNAME,
      name: process.env.CIRCLE_PROJECT_REPONAME
    };
  }

  return null;
}

module.exports = {isInvokedFromPr, getPrInfo, getRepoInfo};
