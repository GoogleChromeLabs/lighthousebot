'use strict';
const {isInvokedFromPr, getPrInfo, getRepoInfo} = require('./envHelpers');

describe('envHelpers', () => {
  beforeEach(() => {
    delete process.env.TRAVIS_EVENT_TYPE;
    delete process.env.TRAVIS_PULL_REQUEST;
    delete process.env.TRAVIS_PULL_REQUEST_SHA;
    delete process.env.TRAVIS_PULL_REQUEST_SLUG;

    delete process.env.CIRCLE_PULL_REQUEST;
    delete process.env.CIRCLE_SHA1;
    delete process.env.CIRCLE_PROJECT_USERNAME;
    delete process.env.CIRCLE_PROJECT_REPONAME;
  });

  describe('isInvokedFromPr', () => {
    test('should return false when not invoked from Travis or CircleCI pr', () => {
      expect(isInvokedFromPr()).toBe(false);

      process.env.TRAVIS_EVENT_TYPE = 'non_pr_event';
      expect(isInvokedFromPr()).toBe(false);
    });

    test('should return true when invoked from Travis pr', () => {
      process.env.TRAVIS_EVENT_TYPE = 'pull_request';
      expect(isInvokedFromPr()).toBe(true);
    });

    test('should return true when invoked from CircleCI pr', () => {
      process.env.CIRCLE_PULL_REQUEST = 'https://github.com/owner_name/repo_name/pull/10';
      expect(isInvokedFromPr()).toBe(true);
    });
  });

  describe('getPrInfo', () => {
    test('should return an empty object when not invoked from Travis or CircleCI', () => {
      expect(getPrInfo()).toEqual({});
    });

    test('should return pr information when invoked from Travis', () => {
      process.env.TRAVIS_PULL_REQUEST = '15';
      process.env.TRAVIS_PULL_REQUEST_SHA = '00000000';

      expect(getPrInfo()).toEqual({
        number: 15,
        sha: '00000000'
      });
    });

    test('should return pr information when invoked from CircleCI pr', () => {
      process.env.CIRCLE_PULL_REQUEST = 'https://github.com/owner_name/repo_name/pull/30';
      process.env.CIRCLE_SHA1 = '33333333';

      expect(getPrInfo()).toEqual({
        number: 30,
        sha: '33333333'
      });
    });
  });

  describe('getRepoInfo', () => {
    test('should return an null when not invoked from Travis or CircleCI', () => {
      expect(getRepoInfo()).toBeNull();
    });

    test('should return repo information when invoked from Travis', () => {
      process.env.TRAVIS_PULL_REQUEST_SLUG = 'owner_name/repo_name';

      expect(getRepoInfo()).toEqual({
        owner: 'owner_name',
        name: 'repo_name'
      });
    });

    test('should return pr information when invoked from CircleCI', () => {
      process.env.CIRCLE_PULL_REQUEST = 'https://github.com/username/reponame/pull/30';
      process.env.CIRCLE_SHA1 = '33333333';

      expect(getPrInfo()).toEqual({
        number: 30,
        sha: '33333333'
      });
    });
  });
});
