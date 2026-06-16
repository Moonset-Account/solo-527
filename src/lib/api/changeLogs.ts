'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, isSupabaseConfigured } from './base';
import { mockChangeLogs } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { ChangeLog } from '@/lib/types';

export async function fetchChangeLogs(leadId?: string): Promise<ChangeLog[]> {
  if (leadId) {
    if (!isSupabaseConfigured()) {
      return mockChangeLogs.filter((c) => c.lead_id === leadId);
    }
    return safeQuery<ChangeLog[]>(
      () =>
        supabase
          .from('change_logs' as any)
          .select('*')
          .eq('lead_id', leadId)
          .order('changed_at', { ascending: false }) as unknown as Promise<{
          data: ChangeLog[] | null;
          error: any;
        }>,
      mockChangeLogs.filter((c) => c.lead_id === leadId)
    );
  }
  return safeQuery<ChangeLog[]>(
    () =>
      supabase
        .from('change_logs' as any)
        .select('*')
        .order('changed_at', { ascending: false }) as unknown as Promise<{
        data: ChangeLog[] | null;
        error: any;
      }>,
    mockChangeLogs
  );
}

export async function addChangeLog(
  record: Omit<ChangeLog, 'id'>
): Promise<ChangeLog> {
  const now = new Date().toISOString();
  const newRecord: ChangeLog = {
    ...record,
    id: generateId(),
    changed_at: record.changed_at || now,
  };
  return safeInsert<ChangeLog>(
    'change_logs',
    newRecord,
    () => newRecord
  );
}
