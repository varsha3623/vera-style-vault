// VÉRA — AI flat-lay collage generation via Google Generative Language API (Gemini 2.5 Flash Image Preview / "Nano Banana")
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const { outfit_id } = await req.json();
    if (!outfit_id) return json({ error: "outfit_id required" }, 400);

    const { data: outfit } = await userClient.from("outfits").select("*").eq("id", outfit_id).maybeSingle();
    if (!outfit) return json({ error: "Outfit not found" }, 404);

    const { data: items } = await userClient
      .from("wardrobe_items")
      .select("id,name,category,image_url,primary_color")
      .in("id", outfit.item_ids);
    if (!items?.length) return json({ error: "No items" }, 400);

    const descriptions = items
      .map((i, idx) => `${idx + 1}. ${i.name ?? i.category ?? "item"} (${i.primary_color ?? "neutral"})`)
      .join("\n");
    const prompt = `Premium editorial flat-lay fashion collage on a soft cream linen background, top-down view, soft natural shadows, magazine-quality styling. Arrange these wardrobe pieces tastefully with gentle overlap and breathing space:\n${descriptions}\n\nStyle: minimal luxury, VÉRA aesthetic — cream, beige, gold accents, no text or logos, square format, photorealistic.`;

    // Build multimodal parts: prompt text + each wardrobe image as inlineData reference.
    // Gemini's native API does not accept remote URLs, so we fetch + base64-encode each.
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    for (const it of items) {
      try {
        const r = await fetch(it.image_url);
        if (!r.ok) continue;
        const mimeType = r.headers.get("content-type") || "image/jpeg";
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        parts.push({ inlineData: { mimeType, data: btoa(bin) } });
      } catch (e) {
        console.error("ref image fetch failed", it.id, e);
      }
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
    );

    if (r.status === 429) return json({ error: "Gemini rate limit or daily quota reached. Try again later." });
    if (r.status === 402 || r.status === 403) return json({ error: "AI quota exhausted. Check GEMINI_API_KEY billing." });
    if (!r.ok) {
      console.error("Gemini error", r.status, await r.text());
      return json({ error: "Collage generation failed" });
    }
    const data = await r.json();
    const imgPart = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data?: string } }) => p?.inlineData?.data,
    );
    const b64: string | undefined = imgPart?.inlineData?.data;
    const mime: string = imgPart?.inlineData?.mimeType || "image/png";
    if (!b64) {
      console.error("No image in Gemini response", JSON.stringify(data).slice(0, 500));
      return json({ error: "No image returned" }, 500);
    }

    const ext = mime.split("/")[1] || "png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const path = `${userId}/${outfit_id}-${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage.from("collages").upload(path, bytes, {
      contentType: mime,
      upsert: true,
    });
    if (upErr) return json({ error: upErr.message }, 500);
    const { data: pub } = admin.storage.from("collages").getPublicUrl(path);

    await userClient.from("outfits").update({ collage_url: pub.publicUrl }).eq("id", outfit_id);

    return json({ collage_url: pub.publicUrl });
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
