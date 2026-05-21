// VÉRA — Vision analysis of a wardrobe item via Lovable AI Gateway (Gemini 2.5 Flash)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
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

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this clothing item. Return JSON only." },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) {
      await markAnalysisFallback(supabase, item_id, claims.claims.sub);
      return json({ error: "Rate limit, try again shortly.", fallback: true }, 200);
    }
    if (r.status === 402) {
      await markAnalysisFallback(supabase, item_id, claims.claims.sub);
      return json({ error: "AI credits exhausted. Add credits in Settings.", fallback: true }, 200);
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("Gateway error", r.status, t);
      await markAnalysisFallback(supabase, item_id, claims.claims.sub);
      return json({ error: "AI analysis failed", fallback: true }, 200);
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
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
