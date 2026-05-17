// VÉRA — AI flat-lay collage generation (Gemini image preview)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
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

    const { data: items } = await userClient.from("wardrobe_items").select("id,name,category,image_url,primary_color").in("id", outfit.item_ids);
    if (!items?.length) return json({ error: "No items" }, 400);

    const descriptions = items.map((i, idx) => `${idx + 1}. ${i.name ?? i.category ?? "item"} (${i.primary_color ?? "neutral"})`).join("\n");
    const prompt = `Premium editorial flat-lay fashion collage on a soft cream linen background, top-down view, soft natural shadows, magazine-quality styling. Arrange these wardrobe pieces tastefully with gentle overlap and breathing space:\n${descriptions}\n\nStyle: minimal luxury, VÉRA aesthetic — cream, beige, gold accents, no text or logos, square format, photorealistic.`;

    // Build multimodal input with all item images as references
    const userContent: any[] = [{ type: "text", text: prompt }];
    for (const it of items) {
      userContent.push({ type: "image_url", image_url: { url: it.image_url } });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (r.status === 429) return json({ error: "Rate limit, try again shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!r.ok) {
      console.error("Gateway error", r.status, await r.text());
      return json({ error: "Collage generation failed" }, 500);
    }
    const data = await r.json();
    const imgUrl: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imgUrl) return json({ error: "No image returned" }, 500);

    // imgUrl is a data: URI — decode and upload to storage
    const match = imgUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!match) return json({ error: "Invalid image data" }, 500);
    const mime = match[1];
    const ext = mime.split("/")[1] || "png";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const path = `${userId}/${outfit_id}-${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage.from("collages").upload(path, bytes, {
      contentType: mime, upsert: true,
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
