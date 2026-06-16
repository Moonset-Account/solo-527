'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, requireSupabaseConfigured } from './base';
import { generateId } from '@/lib/utils';
import type { ContractAttachment } from '@/lib/types';

export async function fetchAttachments(leadId?: string): Promise<ContractAttachment[]> {
  requireSupabaseConfigured();
  if (leadId) {
    return safeQuery<ContractAttachment[]>(() => {
      const sb = supabase as any;
      return sb
        .from('contract_attachments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    });
  }
  return safeQuery<ContractAttachment[]>(() => {
    const sb = supabase as any;
    return sb
      .from('contract_attachments')
      .select('*')
      .order('created_at', { ascending: false });
  });
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
  return safeInsert<ContractAttachment>('contract_attachments', newRecord);
}
