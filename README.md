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

Private app access variables:

```bash
HVAC_GROWTH_OS_AUTH_SECRET=use-a-long-random-secret
HVAC_GROWTH_OS_USERS='[
  {
    "email": "admin@talltwin.com",
    "name": "TallTwin Admin",
    "role": "Admin",
    "passwordHash": "sha256-password-hash",
    "clientIds": []
  },
  {
    "email": "client@example.com",
    "name": "Client User",
    "role": "Client",
    "passwordHash": "sha256-password-hash",
    "clientIds": ["comfort-guardians"]
  }
]'
```

Supported roles are `Admin`, `TallTwin Team`, `Client`, and `Viewer`. Public signup is disabled; approved users are added manually through `HVAC_GROWTH_OS_USERS`.

Google login variables:

```bash
GOOGLE_LOGIN_CLIENT_ID=...
GOOGLE_LOGIN_CLIENT_SECRET=...
GOOGLE_LOGIN_REDIRECT_URI=https://your-render-domain.onrender.com/api/auth/google/callback
```

Google login only grants access to emails already listed in `HVAC_GROWTH_OS_USERS`. Password fields are optional for Google-only users; keep `passwordHash` only when you want password fallback.

Google Ads read-only Connected Apps variables:

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_ADS_LOGIN_CUSTOMER_ID=optional-manager-account-id
GOOGLE_OAUTH_REDIRECT_URI=https://your-render-domain.onrender.com/api/google-ads/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=use-a-long-random-secret
GOOGLE_ADS_API_VERSION=v19
GOOGLE_ADS_TOKEN_STORE_PATH=/tmp/hvac-growth-os-google-ads-store.json
```

For production, move the encrypted Google token store into a persistent database or secret-backed storage service. The current file store is the first read-only foundation and is safe for local or single-service testing, but Render's filesystem is ephemeral.

Google Business Profile read-only Connected Apps variables:

```bash
GBP_GOOGLE_CLIENT_ID=...
GBP_GOOGLE_CLIENT_SECRET=...
GBP_GOOGLE_OAUTH_REDIRECT_URI=https://your-render-domain.onrender.com/api/google-business-profile/callback
GBP_TOKEN_ENCRYPTION_KEY=use-a-long-random-secret
GBP_TOKEN_STORE_PATH=/tmp/hvac-growth-os-google-business-profile-store.json
```

The Google Business Profile connector uses the `https://www.googleapis.com/auth/business.manage` OAuth scope. In Google Cloud, enable the Business Profile Account Management API and Business Profile Business Information API for the OAuth project. The connector is read-only in this phase: it reads accounts, locations, reviews, and posts where Google grants access, but it does not publish posts, update services, or reply to reviews.

HighLevel read-only Connected Apps variables:

```bash
HIGHLEVEL_CLIENT_ID=...
HIGHLEVEL_CLIENT_SECRET=...
HIGHLEVEL_REDIRECT_URI=https://your-render-domain.onrender.com/api/highlevel/callback
HIGHLEVEL_API_KEY=optional-read-only-fallback
HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN=optional-read-only-fallback-alias
HIGHLEVEL_LOCATION_ID=required-with-api-key-fallback
HIGHLEVEL_TOKEN_ENCRYPTION_KEY=use-a-long-random-secret
HIGHLEVEL_OAUTH_SCOPES="locations.readonly contacts.readonly opportunities.readonly conversations.readonly calendars.readonly forms.readonly tags.readonly workflows.readonly custom-fields.readonly"
HIGHLEVEL_API_VERSION=2021-07-28
HIGHLEVEL_TOKEN_STORE_PATH=/tmp/hvac-growth-os-highlevel-store.json
```

OAuth is preferred. If OAuth is not available for the account yet, configure `HIGHLEVEL_API_KEY` and `HIGHLEVEL_LOCATION_ID` as the read-only fallback path.

HighLevel can also be configured inside HVAC Growth OS without changing Render environment variables. In `Connected Apps -> HighLevel Setup`, enter the Comfort Guardians location ID and private integration token, then click `Save & Connect HighLevel`. HVAC Growth OS stores the private token encrypted in the connector store and immediately attempts a read-only sync.

The HighLevel connector is read-only in this phase. It syncs locations, contacts, opportunities, pipelines, opportunity stages, conversations, calls, calendars, forms, tags, workflows, and custom fields, then feeds Revenue Engine and AI CMO with funnel metrics: CRM leads, phone calls, estimates, won jobs, pipeline value, lead sources, opportunity stages, campaign attribution, estimated revenue, and ROI planning signals.

Each sync stores a compact historical snapshot with contacts, open opportunities, closed won, phone calls, pipeline value, won jobs, and estimated revenue so future recommendations can compare CRM movement over time.

Future HighLevel write operations, such as creating workflows, pipelines, automations, or forms, should route through Deploy Center approval and create drafts only until a human approves deployment.

For production, move the encrypted HighLevel token store into a persistent database or secret-backed storage service. The current file store is the first read-only foundation and is safe for local or single-service testing, but Render's filesystem is ephemeral.

## Render deployment

This repo includes `render.yaml` for a Render Blueprint web service.

Render settings:

- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Required secret env vars: `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `HVAC_GROWTH_OS_AUTH_SECRET`, `HVAC_GROWTH_OS_USERS`
- Optional env vars: `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`
- Google Ads read-only connector env vars: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, optional `GOOGLE_ADS_API_VERSION`
- HighLevel read-only connector env vars: OAuth path: `HIGHLEVEL_CLIENT_ID`, `HIGHLEVEL_CLIENT_SECRET`, `HIGHLEVEL_REDIRECT_URI`, `HIGHLEVEL_TOKEN_ENCRYPTION_KEY`; API key fallback path: `HIGHLEVEL_API_KEY` or `HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN`, `HIGHLEVEL_LOCATION_ID`, `HIGHLEVEL_TOKEN_ENCRYPTION_KEY`; optional `HIGHLEVEL_OAUTH_SCOPES`, optional `HIGHLEVEL_API_VERSION`

Deploy flow:

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Render, create a new Blueprint from that repository.
3. Add the secret values for `OPENAI_API_KEY` and `FIRECRAWL_API_KEY`.
4. Apply the Blueprint and wait for the service deploy to finish.
