# Lighthouse CI

This repo contains a reference server for running Lighthouse using [Headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome) in [Google App Engine Flexible](https://cloud.google.com/appengine/docs/flexible/nodejs/) Node container. Use it to setup Lighthouse against fresh PRs made to your Github repo. #know_your_lighthouse_score

**Note:** If you're interested in using Lighthouse CI out of the box, without running it yourself, ping [@ebidel](https://github.com/ebidel).

## Example - Travis integration 

Lighthouse can be setup as part of your CI. To test the changes in new Github pull requests, do the following:

1. Add the github user [lighthousebot](https://github.com/lighthousebot) as a collaborator on your repo. This gives Lighthouse CI access to update the status of your pull requests. **Note**: the OAuth token used by the Lighthouse CI is very limited in scope. It only has permission for the `repo:status` permission.
2. Update `travis.yaml` by adding an `after_success` section that contains the following:

        after_success:
          # TODO: deploy app with the PR changes to your own staging server.
          - ./deploy.sh
          - export LH_MIN_PASS_SCORE=95
          - export LH_TEST_URL=https://staging.example.com
          - node runLighthouse.js $LH_TEST_URL $LH_MIN_PASS_SCORE

- `LH_MIN_PASS_SCORE` - the minimum score for the PR to be considered passing.
- `LH_TEST_URL` - the URL of your staging server.

As noted, it is up to you to deploy the PR changes to your staging environment.

### Staging server deployment and runLighthouse.js

It's preferable that your deploy the PR to a real staging server instead of running a local server on Travis. A staging environment will more accurately reflect your production setup. For example, Lighthouse performance numbers will be more realistic. 

Example scripts that deploy a PR to a staging server can be found in [/GoogleChrome/chromium-dashboard/tree/master/travis](https://github.com/GoogleChrome/chromium-dashboard/tree/master/travis). It also contains an example `runLighthouse.js` that shows how to run the PR agains the [frontend Lighthouse CI example server](https://github.com/ebidel/lighthouse-ci/blob/master/frontend/server.js).

References: 

- `builder/` - App Engine Flexible VM Container to run Lighthouse using Headless Chrome. Contains a [`Docker`](https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile) file and [scripts for running Chrome, headlessly](https://github.com/ebidel/lighthouse-ci/blob/master/builder/chromeuser-script.sh).
- `frontend/` - [frontend CI server](https://github.com/ebidel/lighthouse-ci/blob/master/frontend/server.js) (what Travis sends the PR to). Choose between running Lighthouse on Headless Chrome or on real device using WebPageTest.
- An example `runLighthouse.js` helper can be found in https://github.com/GoogleChrome/chromium-dashboard/tree/master/travis. Also contains examples of how to install the App Engine SDK and deploy to a staging URL.

### Running on WebPageTest instead of Headless Chrome

In `runLighthouse.js`, changing the runner to `RUNNERS.wpt` will use the WebPageTest API to run Lighthouse. At the end of the run, the PR will link to a nice WebPageTest results link that includes a Lighthouse report.

```javascript
// Run LH if this is a PR.
if (process.env.TRAVIS_EVENT_TYPE === 'pull_request') {
  run(RUNNERS.wpt);
} else {
  console.log('Lighthouse not run for non-PR commits');
}
```

## Development

Initial setup:

1. Lookup the shared oauth2 token.
2. Create `frontend/.oauth_token` and copy in the token value.

Run the dev server:

    yarn start

This will start a web serve with by using the token in `.oauth_token`.

### Deploy

Deploy the webhook (frontend):

    ./deploy.sh 2017-03-22 frontend

Deploy the CI server (builder):

    ./deploy.sh 2017-03-22 builder

#### Generate a new OAuth2 token

If you need to generate a new OAuth token:

1. Sign in to the `lighthousebot` Github account, and visible https://github.com/settings/tokens.
2. Regenerate the token. **Important**: this invalidates the existing token.
3. Update token in `frontend/.oauth_token`.
