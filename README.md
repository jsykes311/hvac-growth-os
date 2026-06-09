# HVAC Growth OS

Next.js prototype for analyzing HVAC contractor websites with Firecrawl and OpenAI, then generating campaign assets from the analyzed business profile.

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
```

## Render deployment

This repo includes `render.yaml` for a Render Blueprint web service.

Render settings:

- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Required secret env vars: `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`
- Optional env var: `OPENAI_MODEL`

Deploy flow:

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Render, create a new Blueprint from that repository.
3. Add the secret values for `OPENAI_API_KEY` and `FIRECRAWL_API_KEY`.
4. Apply the Blueprint and wait for the service deploy to finish.
