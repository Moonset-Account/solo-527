'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, isSupabaseConfigured } from './base';
import { mockFollowUps } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { FollowUpRecord } from '@/lib/types';

export async function fetchFollowUps(leadId?: string): Promise<FollowUpRecord[]> {
  if (leadId) {
    if (!isSupabaseConfigured()) {
      return mockFollowUps.filter((f) => f.lead_id === leadId);
    }
    return safeQuery<FollowUpRecord[]>(
      () => {
        const sb = supabase as any;
        return sb
          .from('follow_up_records')
          .select('*')
          .eq('lead_id', leadId)
          .order('follow_up_time', { ascending: false });
      },
      mockFollowUps.filter((f) => f.lead_id === leadId)
    );
  }
  return safeQuery<FollowUpRecord[]>(
    () => {
      const sb = supabase as any;
      return sb
        .from('follow_up_records')
        .select('*')
        .order('follow_up_time', { ascending: false });
    },
    mockFollowUps
  );
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
  return safeInsert<FollowUpRecord>(
    'follow_up_records',
    newRecord,
    () => newRecord
  );
}
