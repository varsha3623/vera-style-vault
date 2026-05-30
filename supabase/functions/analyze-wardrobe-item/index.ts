// VÉRA — Vision analysis of a wardrobe item via Google Generative Language API (Gemini 2.5 Flash)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You are VÉRA's fashion vision expert. Given a single clothing or accessory image, return STRICT JSON with this exact schema and nothing else:
{
  "category": one of ["tops","jeans","trousers","skirts","dresses","ethnic","footwear","accessories","jackets","handbags","outerwear","activewear","loungewear"],
  "subcategory": string,
  "name": short human label (e.g. "Cream silk blouse"),
  "colors": array of 1-4 color names (lowercase, simple: "ivory","navy","gold"...),
  "primary_color": string,
  "pattern": "solid"|"striped"|"floral"|"checked"|"printed"|"textured"|"other",
  "style": "casual"|"formal"|"smart-casual"|"ethnic"|"streetwear"|"athletic"|"evening"|"resort",
  "aesthetic": "minimal"|"romantic"|"edgy"|"classic"|"bohemian"|"preppy"|"sporty"|"glam",
  "seasons": subset of ["spring","summer","fall","winter"],
  "occasions": 1-4 of ["work","casual","date","party","wedding","travel","gym","loungewear","formal","brunch"],
  "gender": "womens"|"mens"|"unisex",
  "description": one sentence stylist description
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const { image_url, item_id } = await req.json();
    if (!image_url) return json({ error: "image_url required" }, 400);

    // Fetch image and convert to base64 inline data for Gemini
    let inlineData: { mimeType: string; data: string } | null = null;
    try {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) throw new Error(`image fetch ${imgRes.status}`);
      const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
      const buf = new Uint8Array(await imgRes.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      inlineData = { mimeType, data: btoa(bin) };
    } catch (e) {
      console.error("Image fetch failed", e);
      await markAnalysisFallback(supabase, item_id, claims.claims.sub);
      return json({ error: "Could not load image for analysis", fallback: true }, 200);
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                { text: "Analyze this clothing item. Return JSON only." },
                { inlineData },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (r.status === 429) {
      await markAnalysisFallback(supabase, item_id, claims.claims.sub);
      return json({ error: "Rate limit, try again shortly.", fallback: true }, 200);
    }
    if (r.status === 402 || r.status === 403) {
      await markAnalysisFallback(supabase, item_id, claims.claims.sub);
      return json({ error: "AI quota exhausted. Check GEMINI_API_KEY.", fallback: true }, 200);
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("Gemini error", r.status, t);
      await markAnalysisFallback(supabase, item_id, claims.claims.sub);
      return json({ error: "AI analysis failed", fallback: true }, 200);
    }
    const data = await r.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    // Persist to wardrobe row if id provided
    if (item_id) {
      await supabase.from("wardrobe_items").update({
        name: parsed.name ?? null,
        category: parsed.category ?? null,
        subcategory: parsed.subcategory ?? null,
        colors: parsed.colors ?? [],
        primary_color: parsed.primary_color ?? null,
        pattern: parsed.pattern ?? null,
        style: parsed.style ?? null,
        aesthetic: parsed.aesthetic ?? null,
        seasons: parsed.seasons ?? [],
        occasions: parsed.occasions ?? [],
        gender: parsed.gender ?? null,
        ai_description: parsed.description ?? null,
        ai_analyzed: true,
      }).eq("id", item_id).eq("user_id", claims.claims.sub);
    }

    return json({ analysis: parsed });
  } catch (e) {
    console.error(e);
    return json({ error: "AI analysis temporarily unavailable", fallback: true }, 200);
  }
});

async function markAnalysisFallback(supabase: any, itemId: string | undefined, userId: string) {
  if (!itemId) return;
  await supabase.from("wardrobe_items").update({
    ai_analyzed: true,
    ai_description: "Saved without AI analysis. Re-analyze when AI credits are available.",
  }).eq("id", itemId).eq("user_id", userId);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
