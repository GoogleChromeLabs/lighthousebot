# Lighthouse CI

The Lighthouse CI is a web hook that can be setup to run against fresh PRs made
to your site's Github repo.

## How to integrate with your repo

- 1. Add the github user [lighthousebot](https://github.com/lighthousebot) as a collaborator on your repo.
-  Add the webhook to repo.

## Development

Generate a new OAuth2 token

1. Sign in to the `lighthousebot` Github account, and visible https://github.com/settings/tokens.
- Regenerate the token. **Important**: Doing this will invalidate the previous token and require you to redeploy the server so it uses the new credentials.
- Create `frontend/.oauth_token` and copy in the token value.

Running the server:

    yarn start
