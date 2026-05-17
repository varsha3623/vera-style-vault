# Issue: Secrets / keys present in repository

Summary

A `.env` file in the repository contains `VITE_SUPABASE_*` values. While these are publishable keys, ensure no service keys (e.g., `SUPABASE_SERVICE_ROLE_KEY` or `LOVABLE_API_KEY`) are committed.

Affected files
- `.env` at repository root

Risk
- Exposure of sensitive keys could lead to data leaks or unauthorized writes to Supabase.

Recommended fix
- Remove `.env` from repository; add it to `.gitignore`.
- Rotate any exposed keys.
- Add `.env.example` (done).

Priority: P0
