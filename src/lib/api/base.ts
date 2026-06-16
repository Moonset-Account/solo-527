'use client';

import { supabase } from '@/lib/supabase/client';
import {
  mockUsers,
  mockStages,
  mockTags,
  mockLeads,
  mockFollowUps,
  mockSurveys,
  mockAttachments,
  mockChangeLogs,
  mockRevisitRecords,
} from '@/lib/mock-data';
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

type SupabaseResult<T> = { data: T | null; error: any };

export async function safeQuery<T>(
  queryFn: () => any,
  fallback: T
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return fallback;
  }
  try {
    const query = queryFn() as any;
    const result = (await query) as SupabaseResult<T>;
    const { data, error } = result;
    if (error) {
      console.warn('Supabase query failed, using fallback:', error);
      return fallback;
    }
    return (data as T) ?? fallback;
  } catch (e) {
    console.warn('Supabase query exception, using fallback:', e);
    return fallback;
  }
}

export async function safeInsert<T>(
  table: string,
  record: any,
  fallback: () => T
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return fallback();
  }
  try {
    const sb = supabase as any;
    const query = sb
      .from(table)
      .insert(record)
      .select()
      .single();
    const result = (await query) as SupabaseResult<T>;
    const { data, error } = result;
    if (error) {
      console.warn(`Supabase insert to ${table} failed, using fallback:`, error);
      return fallback();
    }
    return (data as T) ?? fallback();
  } catch (e) {
    console.warn(`Supabase insert to ${table} exception, using fallback:`, e);
    return fallback();
  }
}

export async function safeUpdate<T>(
  table: string,
  id: string,
  updates: any,
  fallback: () => T
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return fallback();
  }
  try {
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
      console.warn(`Supabase update to ${table} failed, using fallback:`, error);
      return fallback();
    }
    return (data as T) ?? fallback();
  } catch (e) {
    console.warn(`Supabase update to ${table} exception, using fallback:`, e);
    return fallback();
  }
}

export async function safeDelete(
  table: string,
  id: string,
  fallback: () => void
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return fallback();
  }
  try {
    const sb = supabase as any;
    const result = (await sb.from(table).delete().eq('id', id)) as { error: any };
    const { error } = result;
    if (error) {
      console.warn(`Supabase delete from ${table} failed, using fallback:`, error);
      return fallback();
    }
  } catch (e) {
    console.warn(`Supabase delete from ${table} exception, using fallback:`, e);
    return fallback();
  }
}

export async function safeBatchInsert<T>(
  table: string,
  records: any[],
  fallback: () => T[]
): Promise<T[]> {
  if (!isSupabaseConfigured()) {
    return fallback();
  }
  try {
    const sb = supabase as any;
    const query = sb.from(table).insert(records).select();
    const result = (await query) as { data: T[] | null; error: any };
    const { data, error } = result;
    if (error) {
      console.warn(`Supabase batch insert to ${table} failed, using fallback:`, error);
      return fallback();
    }
    return (data as T[]) ?? fallback();
  } catch (e) {
    console.warn(`Supabase batch insert to ${table} exception, using fallback:`, e);
    return fallback();
  }
}

export function ensureSeedUsers(): User[] {
  return mockUsers;
}

export function ensureSeedStages(): LeadStage[] {
  return mockStages;
}

export function ensureSeedTags(): LeadTag[] {
  return mockTags;
}

export function ensureSeedLeads(): Lead[] {
  return mockLeads;
}

export function ensureSeedFollowUps(): FollowUpRecord[] {
  return mockFollowUps;
}

export function ensureSeedSurveys(): SurveyRecord[] {
  return mockSurveys;
}

export function ensureSeedAttachments(): ContractAttachment[] {
  return mockAttachments;
}

export function ensureSeedChangeLogs(): ChangeLog[] {
  return mockChangeLogs;
}

export function ensureSeedRevisitRecords(): RevisitRecord[] {
  return mockRevisitRecords;
}
