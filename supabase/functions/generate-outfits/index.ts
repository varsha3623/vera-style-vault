// VÉRA — AI outfit recommendation engine via Google Generative Language API (Gemini 2.5 Flash)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const UNAVAILABLE_MSG = "VÉRA is currently unable to generate AI recommendations. Please try again.";

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
    const { occasion = "everyday", mood, weather, count = 4, persist = true } = body;

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [{ data: items }, { data: prefs }, { data: todayOutfits }, { data: wornRecent }] = await Promise.all([
      supabase.from("wardrobe_items").select("*").eq("user_id", userId),
      supabase.from("preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("outfits").select("id,item_ids").eq("user_id", userId).gte("created_at", startOfDay.toISOString()),
      supabase.from("outfits").select("item_ids,worn_at").eq("user_id", userId).eq("worn", true).gte("worn_at", sevenDaysAgo.toISOString()),
    ]);

    if (!items || items.length < 2) {
      return json({ error: "Add at least 2 wardrobe items first.", outfits: [] }, 200);
    }

    const requested = Math.max(1, Math.min(count, 10));

    const wornItemIds = new Set<string>();
    (wornRecent ?? []).forEach((o: any) => (o.item_ids ?? []).forEach((id: string) => wornItemIds.add(id)));

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
      worn_recently: wornItemIds.has(i.id),
    }));

    const system = `You are VÉRA, a luxury personal stylist. Compose ${requested} distinct outfit recommendations using ONLY items in the provided wardrobe. STRICT RULES: (1) Do NOT use any item marked "worn_recently": true — those pieces were worn in the last 7 days and need rest. (2) Prioritize least-worn pieces, color harmony, and the occasion/mood/weather. (3) Each outfit must be unique. Return STRICT JSON: { "outfits": [{ "title": string, "reasoning": string (2-3 sentences, stylist voice), "item_ids": string[] (subset of wardrobe ids, 2-5 items), "occasion": string, "confidence": number 0-1, "color_harmony": short explanation, "suggested_accessories": string[] (0-3 ideas not in wardrobe) }] }`;

    const userMsg = JSON.stringify({
      occasion, mood, weather,
      preferences: prefs ?? null,
      wardrobe,
      avoid_item_ids: Array.from(wornItemIds),
    });

    const saveOutfits = async (cleaned: any[]) => {
      if (!persist || !cleaned.length) return cleaned;
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
      const { data: inserted, error: insertError } = await supabase.from("outfits").insert(rows).select();
      if (insertError) {
        console.error("Outfit insert failed", insertError);
        return cleaned;
      }
      return inserted ?? cleaned;
    };

    console.log("[generate-outfits] calling Gemini", { userId, requested, occasion, mood, wardrobe_size: items.length });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: userMsg }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
        }),
      },
    );

    console.log("[generate-outfits] Gemini HTTP status", r.status);

    if (!r.ok) {
      const errText = await r.text();
      console.error("[generate-outfits] Gemini error response", { status: r.status, body: errText });
      if (r.status === 429) console.error("[generate-outfits] QUOTA/RATE LIMIT hit (429)");
      if (r.status === 402 || r.status === 403) console.error("[generate-outfits] BILLING/AUTH issue", r.status);
      if (r.status === 503) console.error("[generate-outfits] Gemini overloaded (503)");
      return json({ error: UNAVAILABLE_MSG }, 503);
    }

    const data = await r.json();
    console.log("[generate-outfits] Gemini response", {
      finishReason: data?.candidates?.[0]?.finishReason,
      safetyRatings: data?.candidates?.[0]?.safetyRatings,
      usageMetadata: data?.usageMetadata,
      promptFeedback: data?.promptFeedback,
    });

    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.error("[generate-outfits] non-STOP finish reason", finishReason, JSON.stringify(data).slice(0, 2000));
      return json({ error: UNAVAILABLE_MSG }, 502);
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!raw) {
      console.error("[generate-outfits] empty response text", JSON.stringify(data).slice(0, 2000));
      return json({ error: UNAVAILABLE_MSG }, 502);
    }

    let parsed: { outfits?: any[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("[generate-outfits] JSON parse error", parseErr, "raw:", raw.slice(0, 2000));
      return json({ error: UNAVAILABLE_MSG }, 502);
    }

    const outfits = (parsed.outfits ?? []).filter((o) => Array.isArray(o.item_ids) && o.item_ids.length >= 2);

    const validIds = new Set(items.map((i) => i.id));
    const sig = (ids: string[]) => [...ids].sort().join("|");
    const seen = new Set<string>((todayOutfits ?? []).map((o: any) => sig(o.item_ids ?? [])));
    const cleaned: any[] = [];
    for (const o of outfits) {
      const itemIds = o.item_ids.filter((id: string) => validIds.has(id));
      if (itemIds.length < 2) continue;
      if (itemIds.some((id: string) => wornItemIds.has(id))) continue;
      const s = sig(itemIds);
      if (seen.has(s)) continue;
      seen.add(s);
      cleaned.push({ ...o, item_ids: itemIds });
      if (cleaned.length >= requested) break;
    }

    if (!cleaned.length) {
      console.error("[generate-outfits] Gemini returned no usable outfits", { rawOutfitCount: outfits.length });
      return json({ error: UNAVAILABLE_MSG }, 502);
    }

    const saved = await saveOutfits(cleaned);
    return json({ outfits: saved });
  } catch (e) {
    console.error("[generate-outfits] unhandled error", e);
    return json({ error: UNAVAILABLE_MSG }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
