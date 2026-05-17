# Issue: AI output parsing is brittle

Summary

Edge functions (`generate-outfits`, `analyze-wardrobe-item`) expect strict JSON from the Lovable gateway and use `JSON.parse` directly on model content. If the model deviates even slightly, parsing fails and the pipeline returns an error or empty results.

Affected components
- `supabase/functions/generate-outfits/index.ts`
- `supabase/functions/analyze-wardrobe-item/index.ts`

Recommended fix
- Add JSON schema validation and tolerant parsing (e.g., use heuristics to extract JSON block, fallback to safe defaults).
- Add retry and instrumentation for failed parses.

Priority: P1
