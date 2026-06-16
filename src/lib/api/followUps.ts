'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, requireSupabaseConfigured } from './base';
import { generateId } from '@/lib/utils';
import type { FollowUpRecord } from '@/lib/types';

export async function fetchFollowUps(leadId?: string): Promise<FollowUpRecord[]> {
  requireSupabaseConfigured();
  if (leadId) {
    return safeQuery<FollowUpRecord[]>(() => {
      const sb = supabase as any;
      return sb
        .from('follow_up_records')
        .select('*')
        .eq('lead_id', leadId)
        .order('follow_up_time', { ascending: false });
    });
  }
  return safeQuery<FollowUpRecord[]>(() => {
    const sb = supabase as any;
    return sb
      .from('follow_up_records')
      .select('*')
      .order('follow_up_time', { ascending: false });
  });
}

export async function addFollowUp(
  record: Omit<FollowUpRecord, 'id' | 'created_at'>
): Promise<FollowUpRecord> {
  const now = new Date().toISOString();
  const newRecord: FollowUpRecord = {
    ...record,
    id: generateId(),
    created_at: now,
    follow_up_time: record.follow_up_time || now,
  };
  return safeInsert<FollowUpRecord>('follow_up_records', newRecord);
}
