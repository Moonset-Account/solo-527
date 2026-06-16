'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, requireSupabaseConfigured } from './base';
import type { RevisitRecord } from '@/lib/types';

export async function fetchRevisitRecords(leadId?: string): Promise<RevisitRecord[]> {
  requireSupabaseConfigured();
  if (leadId) {
    return safeQuery<RevisitRecord[]>(() => {
      const sb = supabase as any;
      return sb
        .from('revisit_records')
        .select('*')
        .eq('lead_id', leadId)
        .order('revisit_date', { ascending: false });
    });
  }
  return safeQuery<RevisitRecord[]>(() => {
    const sb = supabase as any;
    return sb
      .from('revisit_records')
      .select('*')
      .order('revisit_date', { ascending: false });
  });
}

export async function addRevisitRecord(
  record: Omit<RevisitRecord, 'id'>
): Promise<RevisitRecord> {
  const { safeInsert } = await import('./base');
  const { generateId } = await import('@/lib/utils');
  const now = new Date().toISOString();
  const newRecord: RevisitRecord = {
    ...record,
    id: generateId(),
  };
  return safeInsert<RevisitRecord>('revisit_records', newRecord);
}
