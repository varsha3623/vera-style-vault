// VÉRA — AI outfit recommendation engine (Gemini 2.5 Flash, structured output)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { occasion = "everyday", mood, weather, count = 5, persist = true } = body;

    const [{ data: items }, { data: prefs }, { data: recentOutfits }] = await Promise.all([
      supabase.from("wardrobe_items").select("*").eq("user_id", userId),
      supabase.from("preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("outfits").select("item_ids,title").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);

    if (!items || items.length < 2) {
      return json({ error: "Add at least 2 wardrobe items first.", outfits: [] }, 200);
    }

    // Compact wardrobe representation for the model
    const wardrobe = items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      colors: i.colors,
      style: i.style,
      aesthetic: i.aesthetic,
      seasons: i.seasons,
      occasions: i.occasions,
      worn: i.worn_count,
    }));

    const recent = (recentOutfits ?? []).map((o) => o.item_ids);

    const system = `You are VÉRA, a luxury personal stylist. Compose ${count} distinct outfit recommendations using ONLY items in the provided wardrobe. Prioritize least-worn pieces, color harmony, and the occasion/mood/weather. Avoid combinations matching any of the recent_outfits item_id sets. Return STRICT JSON: { "outfits": [{ "title": string, "reasoning": string (2-3 sentences, stylist voice), "item_ids": string[] (subset of wardrobe ids, 2-5 items), "occasion": string, "confidence": number 0-1, "color_harmony": short explanation, "suggested_accessories": string[] (0-3 ideas not in wardrobe) }] }`;

    const userMsg = JSON.stringify({
      occasion, mood, weather,
      preferences: prefs ?? null,
      wardrobe,
      recent_outfits: recent,
    });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return json({ error: "Rate limit, try again shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!r.ok) {
      console.error("Gateway error", r.status, await r.text());
      return json({ error: "AI generation failed" }, 500);
    }
    const data = await r.json();
    let parsed: { outfits?: any[] } = {};
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}"); } catch { parsed = {}; }
    const outfits = (parsed.outfits ?? []).filter((o) => Array.isArray(o.item_ids) && o.item_ids.length >= 2);

    // Validate ids against wardrobe
    const validIds = new Set(items.map((i) => i.id));
    const cleaned = outfits.map((o) => ({
      ...o,
      item_ids: o.item_ids.filter((id: string) => validIds.has(id)),
    })).filter((o) => o.item_ids.length >= 2);

    let saved: any[] = cleaned;
    if (persist && cleaned.length) {
      const rows = cleaned.map((o) => ({
        user_id: userId,
        title: o.title ?? "Untitled look",
        reasoning: o.reasoning ?? null,
        occasion: o.occasion ?? occasion,
        mood: mood ?? null,
        weather: weather ?? null,
        confidence: o.confidence ?? null,
        color_harmony: o.color_harmony ?? null,
        suggested_accessories: o.suggested_accessories ?? [],
        item_ids: o.item_ids,
      }));
      const { data: inserted } = await supabase.from("outfits").insert(rows).select();
      saved = inserted ?? cleaned;
    }
    return json({ outfits: saved });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
