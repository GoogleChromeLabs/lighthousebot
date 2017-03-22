# Lighthouse CI

The Lighthouse CI is a web hook that can be setup to run against fresh PRs made
to your site's Github repo.

## How to integrate with your repo

1. Add the github user [lighthousebot](https://github.com/lighthousebot) as a collaborator on your repo.
2. Add the webhook to repo.

## Development

Initial setup:

1. Lookup the shared oauth2 token.
2. Create `frontend/.oauth_token` and copy in the token value.

Run the dev server:

    yarn start

### Generate a new OAuth2 token

If you need to generate a new

1. Sign in to the `lighthousebot` Github account, and visible https://github.com/settings/tokens.
2. Regenerate the token. **Important**: this invalidates the existing token.
3. Update token in `frontend/.oauth_token`.
