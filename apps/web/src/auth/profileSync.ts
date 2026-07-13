import type { AppProfile } from '../config/appProfile';
import { getSupabaseClient } from './supabaseClient';

export type SupabaseProfileRow = {
  display_name: string | null;
  phone_number: string | null;
  local_app_user_id: string | null;
  referral_code: string | null;
};

export async function fetchProfileFromSupabase(userId: string): Promise<SupabaseProfileRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, phone_number, local_app_user_id, referral_code')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[auth] profile fetch failed', error.message);
    return null;
  }

  return data;
}

export async function syncProfileToSupabase(
  userId: string,
  profile: AppProfile,
  options?: { phoneNumber?: string | null },
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const displayName = profile.displayName.trim() || 'New User';
  const payload: Record<string, string | null> = {
    id: userId,
    display_name: displayName,
    local_app_user_id: profile.userId || null,
    referral_code: profile.referralCode || null,
    updated_at: new Date().toISOString(),
  };

  if (options && 'phoneNumber' in options) {
    payload.phone_number = options.phoneNumber?.trim() || null;
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

  if (error) {
    console.warn('[auth] profile sync failed', error.message);
  }
}

export async function syncPhoneNumberToSupabase(userId: string, phoneNumber: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const normalized = phoneNumber.trim();
  const { error } = await supabase
    .from('profiles')
    .update({
      phone_number: normalized || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.warn('[auth] phone sync failed', error.message);
    return false;
  }

  return true;
}

export function displayNameFromAuthUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata ?? {};
  const candidates = [meta.display_name, meta.full_name, meta.name];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const email = String(user.email || '').trim();
  if (email.includes('@')) {
    return email.split('@')[0];
  }
  return 'New User';
}
