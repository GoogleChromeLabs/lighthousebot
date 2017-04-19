# Lighthouse CI

The Lighthouse CI is a web hook that can be setup to run against fresh PRs made
to your site's Github repo.

## Travis integration

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
