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

## Render deployment

This repo includes `render.yaml` for a Render Blueprint web service.

Render settings:

- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Required secret env vars: `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`
- Optional env vars: `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`

Deploy flow:

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Render, create a new Blueprint from that repository.
3. Add the secret values for `OPENAI_API_KEY` and `FIRECRAWL_API_KEY`.
4. Apply the Blueprint and wait for the service deploy to finish.
