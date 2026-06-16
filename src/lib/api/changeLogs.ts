'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, requireSupabaseConfigured } from './base';
import { generateId } from '@/lib/utils';
import type { ChangeLog } from '@/lib/types';

export async function fetchChangeLogs(leadId?: string): Promise<ChangeLog[]> {
  requireSupabaseConfigured();
  if (leadId) {
    return safeQuery<ChangeLog[]>(() => {
      const sb = supabase as any;
      return sb
        .from('change_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('changed_at', { ascending: false });
    });
  }
  return safeQuery<ChangeLog[]>(() => {
    const sb = supabase as any;
    return sb
      .from('change_logs')
      .select('*')
      .order('changed_at', { ascending: false });
  });
}

export async function addChangeLog(
  record: Omit<ChangeLog, 'id' | 'changed_at'>
): Promise<ChangeLog> {
  const now = new Date().toISOString();
  const newRecord: ChangeLog = {
    ...record,
    id: generateId(),
    changed_at: now,
  };
  return safeInsert<ChangeLog>('change_logs', newRecord);
}
