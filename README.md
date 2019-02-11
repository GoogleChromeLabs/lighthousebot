# Lighthouse Bot

This repo contains the frontend and backend for running Lighthouse in CI and integration with Github Pull Requests. An example web service is hosted for demo purposes.

**Note**: This repo was previously named "lighthouse-ci". 

## Auditing GitHub Pull Requests

> Please note: This drop in service is considered **Beta**. There are no SLAs or uptime guarantees. If you're interested in running your own CI server in a Docker container, check out [Running your own CI server](#running-your-own-ci-server).

Lighthouse can be setup as part of your CI on **Travis only**. As new pull requests come in, the **Lighthouse Bot tests the changes and reports back the new score**.

<img width="700" alt="Run Lighthouse on Github PRs" src="https://user-images.githubusercontent.com/238208/27059055-70ba6e86-4f89-11e7-8ead-932aab0f2634.png">

To audit pull requests, do the following:

### 1. Initial setup

#### Add the lighthousebot to your repo

First, add [lighthousebot](https://github.com/lighthousebot) as a collaborator on your repo. Lighthouse CI uses an OAuth token scoped to the `repo` permission in order to update the status of your PRs and post comments on the issue as the little Lighthouse icon.

#### Get an API Key

[Request an API Key](https://goo.gl/forms/9BzzhHd1sKzsvyC52). API keys will eventually be
enforced and are necessary so we can contact you when there are changes to the CI system.

Once you have a key, update Travis settings by adding an `LIGHTHOUSE_API_KEY` environment variables with your key:

<img width="875" alt="Travis LIGHTHOUSE_API_KEY env variable " src="https://user-images.githubusercontent.com/2837064/32105842-2635de42-bb2a-11e7-983a-921a802d38b3.jpg">

The `lighthousebot` script will include your key in requests made to the CI server.

### 2. Deploy the PR

We recommend deploying your PR to a real staging server instead of running a local server on Travis.
A staging environment will produce realistic performance numbers that are
more representative of your production setup. The Lighthouse report will be more accurate.

In `.travis.yml`, add an  `after_success` that **deploys the PR's changes to a staging server**.

```bash
after_success:
  - ./deploy.sh # TODO(you): deploy the PR changes to your staging server.
```

 Since every hosting environment has different deployment setups, the implementation of `deploy.sh` is left to the reader.

> **Tip:** Using Google App Engine? Check out [`deploy_pr_gae.sh`](https://github.com/GoogleChrome/chromium-dashboard/blob/master/travis/deploy_pr_gae.sh) which shows how to install the GAE SDK and deploy PR changes programmatically.

### 3. Call lighthousebot

Install the script:

    npm i --save-dev https://github.com/GoogleChromeLabs/lighthousebot

Add an NPM script to your `package.json`:

```js
"scripts": {
  "lh": "lighthousebot"
}
```

Next, in `.travis.yml` call [`npm run lh`][runlighthouse-link] as the last step in `after_success`:

```yml
install:
  - npm install # make sure to install the deps when Travis runs.
after_success:
  - ./deploy.sh # TODO(you): deploy the PR changes to your staging server.
  - npm run lh -- https://staging.example.com
```

When Lighthouse is done auditing the URL, the bot will post a comment to the pull
request containing the updated scores:

<img width="779" alt="Lighthouse Github comment" src="https://user-images.githubusercontent.com/238208/46586553-dfffe600-ca34-11e8-9eea-3846b41a4360.png">

You can also opt-out of the comment by using the `--no-comment` flag.

#### Failing a PR when it drops your Lighthouse score

Lighthouse CI can prevent PRs from being merged when one of the scores falls
below a specified value. Just include one or more of `--pwa`, `--perf`, `--seo`,
`--a11y`, or `--bp`:

```yml
after_success:
  - ./deploy.sh # TODO(you): deploy the PR changes to your staging server.
  - npm run lh -- --perf=96 --pwa=100 https://staging.example.com
```

<img width="779" src="https://user-images.githubusercontent.com/238208/46586467-e93c8300-ca33-11e8-83ac-401b23227eb0.png">

#### Options

```bash
$ lighthouse-ci -h

Usage:
runlighthouse.js [--perf,pwa,seo,a11y,bp=<score>] [--no-comment] [--runner=chrome,wpt] <url>

Options:
  Minimum score values can be passed per category as a way to fail the PR if
  the thresholds are not met. If you don't provide thresholds, the PR will
  be mergeable no matter what the scores.

  --pwa        Minimum PWA score for the PR to be considered "passing". [Number]
  --perf       Minimum performance score for the PR to be considered "passing". [Number]
  --seo        Minimum seo score for the PR to be considered "passing". [Number]
  --a11y       Minimum accessibility score for the PR to be considered "passing". [Number]
  --bp         Minimum best practices score for the PR to be considered "passing". [Number]

  --no-comment Doesn't post a comment to the PR issue summarizing the Lighthouse results. [Boolean]

  --runner     Selects Lighthouse running on Chrome or WebPageTest. [--runner=chrome,wpt]

  --help       Prints help.

Examples:

  Runs Lighthouse and posts a summary of the results.
    runlighthouse.js https://example.com

  Fails the PR if the performance score drops below 93. Posts the summary comment.
    runlighthouse.js --perf=93 https://example.com

  Fails the PR if perf score drops below 93 or the PWA score drops below 100. Posts the summary comment.
    runlighthouse.js --perf=93 --pwa=100 https://example.com

  Runs Lighthouse on WebPageTest. Fails the PR if the perf score drops below 93.
    runlighthouse.js --perf=93 --runner=wpt --no-comment https://example.com
```

## Running on WebPageTest instead of Chrome

By default, `lighthousebot` runs your PRs through Lighthouse hosted in the cloud. As an alternative, you can test on real devices using the WebPageTest integration:

```bash
lighthousebot --perf=96 --runner=wpt https://staging.example.com
```

At the end of testing, your PR will be updated with a link to the WebPageTest results containing the Lighthouse report!

## Running your own CI server

Want to setup your own Lighthouse instance in a Docker container?

The good news is Docker does most of the work for us! The bulk of getting started is in [Development](#development). That will take you through initial setup and show how to run the CI frontend.

For the backend, see [builder/README.md](https://github.com/GoogleChromeLabs/lighthousebot/blob/master/builder/README.md) for building and running the Docker container.

Other changes, to the "Development" section:

- Create a personal OAuth token in https://github.com/settings/tokens. Drop it in `frontend/.oauth_token`.
- Add a `LIGHTHOUSE_CI_HOST` env variable to Travis settings that points to your own URL. The one where you deploy the Docker container.

## Development

Initial setup:

1. Ask an existing dev for the oauth2 token. If you need to regenerate one, see below.
- Create `frontend/.oauth_token` and copy in the token value.

Run the dev server:

    cd frontend
    npm run start

This will start a web server and use the token in `.oauth_token`. The token is used to update PR status in Github.

In your test repo:

- Run `npm i --save-dev https://github.com/GoogleChromeLabs/lighthousebot`
- Follow the steps in [Auditing Github Pull Requests](#auditing-github-pull-requests) for setting up
your repo.

Notes:

- If you want to make changes to the builder, you'll need [Docker](https://www.docker.com/) and the [GAE Node SDK](https://cloud.google.com/appengine/docs/flexible/nodejs/download).
- To make changes to the CI server, you'll probably want to run [ngrok](https://ngrok.com/) so you can test against a local server instead of deploying for each change. In Travis settings,
add a `LIGHTHOUSE_CI_HOST` env variable that points to your ngrok instance.

##### Generating a new OAuth2 token

If you need to generate a new OAuth token:

1. Sign in to the [lighthousebot](https://github.com/lighthousebot) Github account. (Admins: the credentials are in the usual password tool).
2. Visit personal access tokens: https://github.com/settings/tokens.
3. Regenerate the token. **Important**: this invalidates the existing token so other developers will need to be informed.
4. Update token in `frontend/.oauth_token`.

#### Deploy

By default, these scripts deploy to [Google App Engine Flexible containers](https://cloud.google.com/appengine/docs/flexible/nodejs/) (Node). If you're running your own CI server, use your own setup :)

Deploy the frontend:

    npm run deploy YYYY-MM-DD frontend

Deploy the CI builder backend:

    npm run deploy YYYY-MM-DD builder

## Source & Components

This repo contains several different pieces for the Lighthouse Bot: a backend, frontend, and frontend UI.

### UI Frontend
> Quick way to try Lighthouse: https://lighthouse-ci.appspot.com/try

Relevant source:

- `frontend/public/` - UI for https://lighthouse-ci.appspot.com/try.

### Bot CI server (frontend)
> Server that responds to requests from Travis.

REST endpoints:
- `https://lighthouse-ci.appspot.com/run_on_chrome`
- `https://lighthouse-ci.appspot.com/run_on_wpt`

#### Example

**Note:** `lighthousebot` does this for you.

```
POST https://lighthouse-ci.appspot.com/run_on_chrome
Content-Type: application/json
X-API-KEY: <YOUR_LIGHTHOUSE_API_KEY>

{
  testUrl: "https://staging.example.com",
  thresholds: {
    pwa: 100,
    perf: 96,
  },
  addComment: true,
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

- [`frontend/server.js`](https://github.com/GoogleChromeLabs/lighthousebot/blob/master/frontend/server.js) - server which accepts Github pull requests and updates the status of your PR.

### CI backend (builder)
> Server that runs Lighthouse against a URL, using Chrome.

REST endpoints:
- `https://lighthouse-ci.appspot.com/ci`

#### Example

**Note:** `lighthousebot` does this for you.

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <YOUR_LIGHTHOUSE_API_KEY>" \
  --data '{"output": "json", "url": "https://staging.example.com"}' \
  https://builder-dot-lighthouse-ci.appspot.com/ci
```

## FAQ

##### Why not deployment events?

Github's [Deployment API](https://developer.github.com/v3/repos/deployments/) would
be ideal, but it has some downsides:

- Github Deployments happen __after__ a pull is merged. We want to support blocking PR
merges based on a LH score.
- We want to be able to audit changes as they're add to the PR. `pull_request`/`push` events are more appropriate for that.

##### Why not a Github Webhook?

The main downside of a Github webhook is that there's no way to include custom
data in the payload Github sends to the webhook handler. For example, how would
Lighthouse know what url to test? With a webhook, the user also has to setup it
up and configure it properly.

Future work: Lighthouse Bot could define a file that developer includes in their
repo. The bot's endpoint could pull a `.lighthouse_ci` file that includes meta
data `{minLighthouseScore: 96, testUrl: 'https://staging.example.com'}`. However,
this requires work from the developer.

[runlighthouse-link]: https://github.com/GoogleChromeLabs/lighthousebot/blob/master/runlighthouse.js
