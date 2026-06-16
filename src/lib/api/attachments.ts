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
      () =>
        supabase
          .from('contract_attachments' as any)
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false }) as unknown as Promise<{
          data: ContractAttachment[] | null;
          error: any;
        }>,
      mockAttachments.filter((a) => a.lead_id === leadId)
    );
  }
  return safeQuery<ContractAttachment[]>(
    () =>
      supabase
        .from('contract_attachments' as any)
        .select('*')
        .order('created_at', { ascending: false }) as unknown as Promise<{
        data: ContractAttachment[] | null;
        error: any;
      }>,
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
