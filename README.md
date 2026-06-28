# HVAC Growth OS

Next.js app for analyzing HVAC contractor websites with Firecrawl and OpenAI, reviewing the extracted business profile, finding local search and AI-search gaps, mapping problems to plain-English fixes, and generating campaign copy plus branded hero ad creative.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```bash
OPENAI_API_KEY=...
FIRECRAWL_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

Google Ads read-only Connected Apps variables:

```bash
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://your-render-domain.onrender.com/api/google-ads/callback
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_TOKEN_ENCRYPTION_KEY=use-a-long-random-secret
GOOGLE_ADS_LOGIN_CUSTOMER_ID=optional-manager-account-id
GOOGLE_ADS_API_VERSION=v19
GOOGLE_ADS_TOKEN_STORE_PATH=/tmp/hvac-growth-os-google-ads-store.json
```

For production, move the encrypted Google token store into a persistent database or secret-backed storage service. The current file store is the first read-only foundation and is safe for local or single-service testing, but Render's filesystem is ephemeral.

## Render deployment

This repo includes `render.yaml` for a Render Blueprint web service.

Render settings:

- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Required secret env vars: `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`
- Optional env vars: `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`
- Google Ads read-only connector env vars: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, optional `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, optional `GOOGLE_ADS_API_VERSION`

Deploy flow:

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Render, create a new Blueprint from that repository.
3. Add the secret values for `OPENAI_API_KEY` and `FIRECRAWL_API_KEY`.
4. Apply the Blueprint and wait for the service deploy to finish.
