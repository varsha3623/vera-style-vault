// VÉRA Cloud data layer — Supabase wrapper for wardrobe, outfits, preferences, AI calls.
import { supabase } from '@/integrations/supabase/client';

export interface CloudWardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string | null;
  category: string | null;
  subcategory: string | null;
  colors: string[];
  primary_color: string | null;
  pattern: string | null;
  style: string | null;
  aesthetic: string | null;
  seasons: string[];
  occasions: string[];
  gender: string | null;
  ai_description: string | null;
  ai_analyzed: boolean;
  worn_count: number;
  last_worn_at: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface CloudOutfit {
  id: string;
  user_id: string;
  title: string;
  reasoning: string | null;
  occasion: string | null;
  mood: string | null;
  weather: Record<string, unknown> | null;
  confidence: number | null;
  color_harmony: string | null;
  suggested_accessories: string[];
  item_ids: string[];
  collage_url: string | null;
  saved: boolean;
  worn: boolean;
  worn_at: string | null;
  created_at: string;
}

export interface CloudPreferences {
  user_id: string;
  location: string | null;
  lifestyle: string | null;
  style: string | null;
  sleeveless_allowed: boolean;
  short_outfits_allowed: boolean;
  extra: Record<string, any>;
}

// ---------- Wardrobe ----------
export async function listWardrobe(userId: string): Promise<CloudWardrobeItem[]> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudWardrobeItem[];
}

export async function uploadWardrobeImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('wardrobe-images').upload(path, file, {
    cacheControl: '3600', upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('wardrobe-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function createWardrobeItem(userId: string, imageUrl: string, hint?: { category?: string; name?: string }): Promise<CloudWardrobeItem> {
  const { data, error } = await supabase.from('wardrobe_items').insert({
    user_id: userId,
    image_url: imageUrl,
    category: hint?.category ?? null,
    name: hint?.name ?? null,
  }).select().single();
  if (error) throw error;
  return data as CloudWardrobeItem;
}

export async function deleteWardrobeItem(id: string) {
  const { error } = await supabase.from('wardrobe_items').delete().eq('id', id);
  if (error) throw error;
}

export async function markItemWorn(id: string, currentCount: number) {
  await supabase.from('wardrobe_items')
    .update({ worn_count: currentCount + 1, last_worn_at: new Date().toISOString() })
    .eq('id', id);
}

export async function analyzeItem(itemId: string, imageUrl: string) {
  const { data, error } = await supabase.functions.invoke('analyze-wardrobe-item', {
    body: { item_id: itemId, image_url: imageUrl },
  });
  if (error) throw error;
  return data;
}

// ---------- Preferences ----------
export async function getPreferences(userId: string): Promise<CloudPreferences | null> {
  const { data } = await supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle();
  return data as CloudPreferences | null;
}

export async function savePreferences(userId: string, prefs: Partial<Omit<CloudPreferences, 'user_id' | 'extra'>> & { extra?: any }) {
  const { error } = await supabase.from('preferences').upsert({
    user_id: userId,
    ...prefs,
    updated_at: new Date().toISOString(),
  } as any);
  if (error) throw error;
}

// ---------- Outfits ----------
export async function listOutfits(userId: string, opts?: { savedOnly?: boolean; limit?: number; todayOnly?: boolean }): Promise<CloudOutfit[]> {
  let q = supabase.from('outfits').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (opts?.savedOnly) q = q.eq('saved', true);
  if (opts?.todayOnly) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    q = q.gte('created_at', start.toISOString());
  }
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CloudOutfit[];
}

export async function generateOutfits(input: { occasion?: string; mood?: string; weather?: unknown; count?: number }): Promise<CloudOutfit[]> {
  const { data, error } = await supabase.functions.invoke('generate-outfits', { body: input });
  if (error) {
    // Try to surface the real server-side message (e.g. "AI credits exhausted.")
    let detail = error.message ?? 'Edge function error';
    try {
      const ctx: any = (error as any).context;
      if (ctx?.json) {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      } else if (ctx?.text) {
        const txt = await ctx.text();
        if (txt) detail = txt;
      }
    } catch { /* noop */ }
    if (/402/.test(detail) || /credit/i.test(detail)) {
      throw new Error('AI credits exhausted — please top up in Settings → Workspace → Usage.');
    }
    if (/429/.test(detail) || /rate/i.test(detail)) {
      throw new Error('Rate limit reached — try again in a moment.');
    }
    throw new Error(detail);
  }
  if (data?.error && (!data?.outfits || data.outfits.length === 0)) throw new Error(data.error);
  return (data?.outfits ?? []) as CloudOutfit[];
}

export async function saveOutfit(id: string, saved = true) {
  await supabase.from('outfits').update({ saved }).eq('id', id);
}

export async function markOutfitWorn(id: string) {
  await supabase.from('outfits').update({ worn: true, worn_at: new Date().toISOString() }).eq('id', id);
}

export async function generateCollage(outfitId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-collage', { body: { outfit_id: outfitId } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.collage_url as string;
}

export async function recordFeedback(userId: string, outfitId: string, liked: boolean) {
  await supabase.from('outfit_feedback').upsert({ user_id: userId, outfit_id: outfitId, liked });
}
