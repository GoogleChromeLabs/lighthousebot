# Lighthouse CI

The Lighthouse CI is a web hook that can be setup to run against fresh PRs made
to your site's Github repo.

## Travis integration

Lighthouse can be setup as part of your CI. To test the changes in new Github pull requests, do the following:

1. Add the github user [lighthousebot](https://github.com/lighthousebot) as a collaborator on your repo. This is so the Lighthouse CI can update the status of your pull requests.
2. Update `travis.yaml` by adding an `after_success` section that contains the following:

        after_success:
          - export LH_MIN_PASS_SCORE=93
          - export LH_TEST_URL=https://lighthouse-ci-staging-dot-cr-status.appspot.com
          # deploy your app to the staging server
          - ./travis/deploy_pr_gae.sh

`LH_MIN_PASS_SCORE` - the minimum score for the PR to be considered passing.
`LH_TEST_URL` - the URL of your staging server.

As noted, it is up to you to deploy the PR changes to your staging environment.

## Development

Initial setup:

1. Lookup the shared oauth2 token.
2. Create `frontend/.oauth_token` and copy in the token value.

Run the dev server:

    yarn start

### Deploy

Deploy the webhook (frontend):

    ./deploy.sh 2017-03-22 frontend

Deploy the CI server (builder):

    ./deploy.sh 2017-03-22 builder

#### Generate a new OAuth2 token

If you need to generate a new

1. Sign in to the `lighthousebot` Github account, and visible https://github.com/settings/tokens.
2. Regenerate the token. **Important**: this invalidates the existing token.
3. Update token in `frontend/.oauth_token`.
