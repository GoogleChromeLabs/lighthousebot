# Lighthouse CI

This repo contains the frontend and backend for the Lighthouse CI server.

## Testing a Github PR

It's easy to setup Lighthouse as part of your CI on Travis. As new pull requests come in, the Lighthouse CI can test the changes and report back the new score.

To setup Lighthouse for your pull requests, do the following:
1. Add [lighthousebot](https://github.com/lighthousebot) as a collaborator on your repo.
    This is so the Lighthouse CI can update the status of your PRs. Don't worry. It's OAuth token is very limited in scope and only has permission for `repo:status`.
2. Add an `after_success` section to `travis.yaml`:

        after_success:
          - ./deploy.sh # TODO(you): deploy the PR changes to your staging server.
          - export LH_MIN_PASS_SCORE=95
          - export LH_TEST_URL=https://staging.example.com
          - node runLighthouse.js $LH_TEST_URL $LH_MIN_PASS_SCORE

    | ENV variable  | Description |
    | ------------- | ------------- |
    | `LH_MIN_PASS_SCORE`  | Specifies the minimum Lighthouse score     for the PR to be considered "passing".  |
    | `LH_TEST_URL`  | Specifies the URL of your staging server.  |

### Explanation

#### 1: Deploy the PR changes
The first thing in `after_success` is to deploy the PR changes to a staging server. Since this is different for every hosting environment, it's left to the reader to figure out the details on doing that.

> **Tip:** if you're using Google App Engine, check out [`deploy_pr_gae.sh`](https://github.com/GoogleChrome/chromium-dashboard/blob/master/travis/deploy_pr_gae.sh), which shows how to install the GAE SDK and deploy PR changes programmatically.

**Why a staging server? Can I use localhost?**
Yes, but we recommend that you deploy the PR to a real staging server instead of running a local server on Travis. The reason is that a staging environment will be more accurate and reflect your production setup. As an example, Lighthouse performance numbers will be more realistic.

#### 2: Call runLighthouse.js

The last step in `after_success` is to call [`runLighthouse.js`](https://github.com/GoogleChrome/chromium-dashboard/blob/master/travis/runLighthouse.js). Copy this file  to your repo. When you call it in `travis.yml`, pass the minimum Lighthouse score you expect and a URL to test:

    node runLighthouse.js 95 https://staging.example.com

## Source  details

This repo contains several different pieces for the Lighthouse CI: a backend, frontend, and frontend UI.

#### Frontend
> Quick way to try Lighthouse: https://lighthouse-ci.appspot.com/try

Relevant source:
`frontend/public/` - Frontend UI for https://lighthouse-ci.appspot.com/try.

#### CI server
> Server that responds to requests from Travis.

Handlers:
`https://lighthouse-ci.appspot.com/run_on_chrome`
`https://lighthouse-ci.appspot.com/run_on_wpt`

**Example** - raw endpoint usage
Note: this is what `runLighthouse.js` does for you.
```
POST https://lighthouse-ci.appspot.com/run_on_chrome
Content-Type: application/json

{
  testUrl: "https://staging.example.com",
  minPassScore: 95,
  repo: {
    owner: "<REPO_OWNER>",
    name: "<REPO_NAME>"
  },
  pr: {
    number: <PR_NUMBER>,
    sha: "<PR_SHA>"
  }
}
```

Relevant source:
[`frontend/server.js`](https://github.com/ebidel/lighthouse-ci/blob/master/frontend/server.js) - server which accepts Github pull requests and updates the status of your PR. Contains endpoints for running Lighthouse directly on Chrome (`/run_on_chrome`) or using the WebPageTest integration (`/run_on_wpt`).

##### Running on WebPageTest instead of Chrome

By default, `runLighthouse.js` will use the CI builder to run Ligthhouse using Chrome. As an alternative, you can test PRs on readl devices using the WebPageTest integration.

At the bottom of `runLighthouse.js`, change the runner to use `RUNNERS.wpt` instead of `RUNNERS.chrome`:

```javascript
// Only run LH if this is a PR.
if (process.env.TRAVIS_EVENT_TYPE === 'pull_request') {
  run(RUNNERS.wpt);
} else {
  console.log('Lighthouse is not run for non-PR commits');
}
```
At the end of testing, your PR will be updated with a link to the WebPageTest results containing the Lighthouse report!

#### CI builder
> Server that runs Lighthouse against a URL, using Chrome.

Handlers:
`https://lighthouse-ci.appspot.com/ci`

Contains example Dockerfiles for running Lighthouse using [Headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome) and full Chrome. Both setups us [Google App Engine Flexible containers](https://cloud.google.com/appengine/docs/flexible/nodejs/) (Node).

Relevant source:
[`builder/Dockerfile.nonheadless`](https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile.nonheadless) - Dockerfile for running full Chrome.
[`builder/Dockerfile.headless`](https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile.headless) - Dockerfile for running headless Chrome.
`builder/server.js` - The `/ci` endpoint that runs Lighthouse.

**Example** - raw usage of endpoint
Note: this is what `runLighthouse.js` does for you.
```sh
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"format": "json", "url": "https://staging.example.com"}' \
  https://builder-dot-lighthouse-ci.appspot.com/ci
```

## Development

Initial setup:
1. Ask an existing dev for the oauth2 token. If you need to regenerate one, see below.
- Create `frontend/.oauth_token` and copy in the token value.

Run the dev server:

    yarn start

This will start a web serve and use the token in `.oauth_token`. The token is used to update PR status in Github.

Follow the steps in [Testing a Github PR](#testing-a-github-pr) for setting up
your repo.

Notes:
- If you want to make changes to the builder, you'll need [Docker](https://www.docker.com/) and the [GAE Node SDK](https://cloud.google.com/appengine/docs/flexible/nodejs/download).
- To make changes to the CI server, you'll probably want to run [ngrok](https://ngrok.com/) so you can test against a local server instead of deploying for each change.

##### Generating a new OAuth2 token

If you need to generate a new OAuth token:

1. Sign in to the `[lighthousebot](https://github.com/lighthousebot) Github account. The credentials are in the usual v password tool.
2. Visit personal access tokens: https://github.com/settings/tokens.
3. Regenerate the token. **Important**: this invalidates the existing token so other developers will need to be informed.
4. Update token in `frontend/.oauth_token`.

#### Deploy

Deploy the frontend:

    ./deploy.sh YYYY-MM-DD frontend

Deploy the CI builder backend:

    ./deploy.sh YYYY-MM-DD builder

