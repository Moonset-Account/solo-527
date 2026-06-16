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

export async function safeQuery<T>(
  query: () => PromiseLike<{ data: T | null; error: any }>,
  fallback: T
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return fallback;
  }
  try {
    const { data, error } = await query();
    if (error) {
      console.warn('Supabase query failed, using fallback:', error);
      return fallback;
    }
    return (data as T) || fallback;
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
    const q = supabase
      .from(table as any)
      .insert(record as any)
      .select()
      .single() as unknown as Promise<{ data: T | null; error: any }>;
    const { data, error } = await q;
    if (error) {
      console.warn(`Supabase insert to ${table} failed, using fallback:`, error);
      return fallback();
    }
    return (data as T) || fallback();
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
    const q = supabase
      .from(table as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single() as unknown as Promise<{ data: T | null; error: any }>;
    const { data, error } = await q;
    if (error) {
      console.warn(`Supabase update to ${table} failed, using fallback:`, error);
      return fallback();
    }
    return (data as T) || fallback();
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
    const { error } = await supabase.from(table as any).delete().eq('id', id);
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
    const q = supabase
      .from(table as any)
      .insert(records as any)
      .select() as unknown as Promise<{ data: T[] | null; error: any }>;
    const { data, error } = await q;
    if (error) {
      console.warn(`Supabase batch insert to ${table} failed, using fallback:`, error);
      return fallback();
    }
    return (data as T[]) || fallback();
  } catch (e) {
    console.warn(`Supabase batch insert to ${table} exception, using fallback:`, e);
    return fallback();
  }
}
