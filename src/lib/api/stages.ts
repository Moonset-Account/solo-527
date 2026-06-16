'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, safeUpdate, safeDelete } from './base';
import { generateId } from '@/lib/utils';
import type { LeadStage } from '@/lib/types';

export async function fetchStages(): Promise<LeadStage[]> {
  return safeQuery<LeadStage[]>(() => {
    const sb = supabase as any;
    return sb
      .from('lead_stages')
      .select('*')
      .order('order', { ascending: true });
  });
}

export async function createStage(
  stage: Omit<LeadStage, 'id' | 'updated_at' | 'created_at'>
): Promise<LeadStage> {
  const now = new Date().toISOString();
  return safeInsert<LeadStage>('lead_stages', { ...stage, created_at: now, updated_at: now });
}

export async function updateStage(
  stageId: string,
  updates: Partial<LeadStage>
): Promise<LeadStage> {
  return safeUpdate<LeadStage>('lead_stages', stageId, updates);
}

export async function deleteStage(stageId: string): Promise<void> {
  return safeDelete('lead_stages', stageId);
}
