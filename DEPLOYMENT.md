# Deployment Guide — VÉRA

This document describes secure deployment steps for VÉRA (frontend + Supabase Edge Functions).

## Overview

- Frontend: Vite React app — build produces static assets to serve from a CDN or static hosting.
- Backend: Supabase (managed Postgres, Auth, Storage) + Edge Functions (Deno) for AI orchestration.

## Prerequisites

- A Supabase project with the required tables and storage buckets (`wardrobe_items` storage, `collages` bucket).
- A Lovable AI Gateway account and API key (LOVABLE_API_KEY).
- A secrets manager for storing the `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` (e.g., Vercel/Netlify/Azure/GCP secret envs, GitHub Actions secrets, or cloud KMS).

## Environment variables

Use an `.env` locally (never commit). Use `.env.example` in repository. Required variables:

- `VITE_SUPABASE_URL` — Supabase project URL (client)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/publishable key (client)
- `VITE_SUPABASE_PROJECT_ID` — Supabase project id
- `SUPABASE_URL` — Supabase project URL (server functions)
- `SUPABASE_ANON_KEY` — Supabase anon key (functions)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server, secret)
- `LOVABLE_API_KEY` — Lovable gateway API key (server, secret)

## Frontend deployment (recommended: Vercel / Netlify / Cloudflare Pages)

1. Build locally to verify:

```bash
npm run build
# serve the `dist` folder to verify
npx serve dist
```

2. On your hosting provider (Vercel/Netlify):
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` in the project environment variables.
- Configure build command: `npm run build` and publish directory `dist`.
- Add preview and production environments as needed.

## Supabase Edge Functions deployment

1. Install Supabase CLI and authenticate.
2. From `supabase/functions/`, deploy each function:

```bash
supabase functions deploy analyze-wardrobe-item --project-ref <project-ref>
supabase functions deploy generate-outfits --project-ref <project-ref>
supabase functions deploy generate-collage --project-ref <project-ref>
```

3. Configure function environment variables through Supabase dashboard or CLI. Ensure `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` are set as **secrets** (service role must be kept private).

4. Set appropriate CORS policies and function permissions.

## Security best practices

- Never commit `SUPABASE_SERVICE_ROLE_KEY` or `LOVABLE_API_KEY` to VCS.
- Use short-lived credentials or rotate keys regularly.
- Harden storage bucket policies: prefer signed URLs or role-based access — avoid making `collages` fully public unless necessary.
- Limit Edge Function IAM/service-role usage to only the necessary endpoints.

## Observability & Monitoring

- Add logging and error reporting to functions (e.g., Sentry, Datadog).
- Track AI gateway failures and rate limits — alert on high error rates.
- Monitor Supabase errors, quotas, and storage usage.

## Operational guidance

- Collage generation can be costly; add rate limiting and/or a request queue to throttle user requests.
- Implement retry logic for transient network/AI gateway errors.

## Rollback & Testing

- Test functions in a staging Supabase project with a separate Lovable test key.
- Create database backups (export) before large migrations.

## CI/CD Example (GitHub Actions outline)

- Workflow steps:
  - Checkout
  - Install deps
  - Run linters/tests
  - Build frontend
  - Deploy to hosting provider
  - Deploy Supabase functions via Supabase CLI (with secrets from GH Actions)

## Notes

- Keep `.env.example` updated when adding new env vars.
- Maintain cost/runbook for AI gateway usage and outages.
