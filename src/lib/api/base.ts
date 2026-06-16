'use client';

import { supabase } from '@/lib/supabase/client';
import { generateId } from '@/lib/utils';
import type {
  User,
  LeadStage,
  LeadTag,
  Lead,
  FollowUpRecord,
  SurveyRecord,
  ContractAttachment,
  ChangeLog,
  RevisitRecord,
} from '@/lib/types';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    key !== 'your-anon-key'
  );
}

export function requireSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then run the SQL migration scripts in supabase/migrations/'
    );
  }
}

type SupabaseResult<T> = { data: T | null; error: any };

export async function safeQuery<T>(
  queryFn: () => any,
  fallback?: T
): Promise<T> {
  requireSupabaseConfigured();
  const query = queryFn() as any;
  const result = (await query) as SupabaseResult<T>;
  const { data, error } = result;
  if (error) {
    console.error('Supabase query failed:', error);
    throw error;
  }
  if (data === null && fallback !== undefined) {
    return fallback;
  }
  return data as T;
}

export async function safeInsert<T>(
  table: string,
  record: any,
  fallback?: () => T
): Promise<T> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb
    .from(table)
    .insert(record)
    .select()
    .single();
  const result = (await query) as SupabaseResult<T>;
  const { data, error } = result;
  if (error) {
    console.error(`Supabase insert to ${table} failed:`, error);
    if (fallback) return fallback();
    throw error;
  }
  return (data as T) ?? (fallback ? fallback() : ({} as T));
}

export async function safeUpdate<T>(
  table: string,
  id: string,
  updates: any,
  fallback?: () => T
): Promise<T> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb
    .from(table)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  const result = (await query) as SupabaseResult<T>;
  const { data, error } = result;
  if (error) {
    console.error(`Supabase update to ${table} failed:`, error);
    if (fallback) return fallback();
    throw error;
  }
  return (data as T) ?? (fallback ? fallback() : ({} as T));
}

export async function safeDelete(
  table: string,
  id: string,
  fallback?: () => void
): Promise<void> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const result = (await sb.from(table).delete().eq('id', id)) as { error: any };
  const { error } = result;
  if (error) {
    console.error(`Supabase delete from ${table} failed:`, error);
    if (fallback) return fallback();
    throw error;
  }
}

export async function safeBatchInsert<T>(
  table: string,
  records: any[],
  fallback?: () => T[]
): Promise<T[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from(table).insert(records).select();
  const result = (await query) as { data: T[] | null; error: any };
  const { data, error } = result;
  if (error) {
    console.error(`Supabase batch insert to ${table} failed:`, error);
    if (fallback) return fallback();
    throw error;
  }
  return (data as T[]) ?? (fallback ? fallback() : []);
}

export async function ensureSeedUsers(): Promise<User[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('users').select('*').order('created_at', { ascending: true });
  const result = (await query) as { data: User[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch users from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedStages(): Promise<LeadStage[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('lead_stages').select('*').order('order', { ascending: true });
  const result = (await query) as { data: LeadStage[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch stages from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedTags(): Promise<LeadTag[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('lead_tags').select('*').order('name', { ascending: true });
  const result = (await query) as { data: LeadTag[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch tags from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedLeads(): Promise<Lead[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('leads').select('*').order('created_at', { ascending: false });
  const result = (await query) as { data: Lead[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch leads from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedFollowUps(): Promise<FollowUpRecord[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('follow_up_records').select('*').order('created_at', { ascending: false });
  const result = (await query) as { data: FollowUpRecord[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch follow-ups from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedSurveys(): Promise<SurveyRecord[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('survey_records').select('*').order('created_at', { ascending: false });
  const result = (await query) as { data: SurveyRecord[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch surveys from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedAttachments(): Promise<ContractAttachment[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('contract_attachments').select('*').order('created_at', { ascending: false });
  const result = (await query) as { data: ContractAttachment[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch attachments from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedChangeLogs(): Promise<ChangeLog[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('change_logs').select('*').order('changed_at', { ascending: false });
  const result = (await query) as { data: ChangeLog[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch change logs from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}

export async function ensureSeedRevisitRecords(): Promise<RevisitRecord[]> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const query = sb.from('revisit_records').select('*').order('revisit_date', { ascending: false });
  const result = (await query) as { data: RevisitRecord[] | null; error: any };
  if (result.error) {
    console.error('Failed to fetch revisit records from Supabase:', result.error);
    throw result.error;
  }
  return result.data ?? [];
}
