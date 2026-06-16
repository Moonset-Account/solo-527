'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, safeUpdate, safeDelete, isSupabaseConfigured } from './base';
import { mockStages } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { LeadStage } from '@/lib/types';

export async function fetchStages(): Promise<LeadStage[]> {
  return safeQuery<LeadStage[]>(
    () =>
      supabase
        .from('lead_stages' as any)
        .select('*')
        .order('order', { ascending: true }) as unknown as Promise<{
        data: LeadStage[] | null;
        error: any;
      }>,
    mockStages
  );
}

export async function createStage(
  stage: Omit<LeadStage, 'id' | 'updated_at' | 'created_at'>
): Promise<LeadStage> {
  const now = new Date().toISOString();
  return safeInsert<LeadStage>(
    'lead_stages',
    { ...stage, created_at: now, updated_at: now },
    () => ({ ...stage, id: generateId(), created_at: now, updated_at: now })
  );
}

export async function updateStage(
  stageId: string,
  updates: Partial<LeadStage>
): Promise<LeadStage> {
  return safeUpdate<LeadStage>(
    'lead_stages',
    stageId,
    updates,
    () => ({ ...mockStages.find((s) => s.id === stageId)!, ...updates } as LeadStage)
  );
}

export async function deleteStage(stageId: string): Promise<void> {
  return safeDelete(
    'lead_stages',
    stageId,
    () => {}
  );
}
