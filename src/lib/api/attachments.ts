'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, isSupabaseConfigured } from './base';
import { mockAttachments } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { ContractAttachment } from '@/lib/types';

export async function fetchAttachments(leadId?: string): Promise<ContractAttachment[]> {
  if (leadId) {
    if (!isSupabaseConfigured()) {
      return mockAttachments.filter((a) => a.lead_id === leadId);
    }
    return safeQuery<ContractAttachment[]>(
      () => {
        const sb = supabase as any;
        return sb
          .from('contract_attachments')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
      },
      mockAttachments.filter((a) => a.lead_id === leadId)
    );
  }
  return safeQuery<ContractAttachment[]>(
    () => {
      const sb = supabase as any;
      return sb
        .from('contract_attachments')
        .select('*')
        .order('created_at', { ascending: false });
    },
    mockAttachments
  );
}

export async function addAttachment(
  record: Omit<ContractAttachment, 'id' | 'created_at'>
): Promise<ContractAttachment> {
  const now = new Date().toISOString();
  const newRecord: ContractAttachment = {
    ...record,
    id: generateId(),
    created_at: now,
  };
  return safeInsert<ContractAttachment>(
    'contract_attachments',
    newRecord,
    () => newRecord
  );
}
