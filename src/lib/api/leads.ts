'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, safeUpdate, requireSupabaseConfigured } from './base';
import { generateId } from '@/lib/utils';
import type { Lead, LeadStage, User } from '@/lib/types';

export async function fetchLeads(): Promise<Lead[]> {
  return safeQuery<Lead[]>(() => {
    const sb = supabase as any;
    return sb
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
  });
}

export async function fetchLeadById(leadId: string): Promise<Lead | null> {
  requireSupabaseConfigured();
  const sb = supabase as any;
  const result = (await sb
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()) as { data: Lead | null; error: any };
  const { data, error } = result;
  if (error) {
    console.error('Failed to fetch lead by id:', error);
    throw error;
  }
  return data as Lead | null;
}

export async function createLead(
  data: Partial<Lead>,
  stages: LeadStage[]
): Promise<Lead> {
  const poolStage = stages.find((s) => s.order === 0);
  const now = new Date().toISOString();
  const newLead: Lead = {
    id: generateId(),
    customer_name: data.customer_name || '',
    phone: data.phone || '',
    community: data.community,
    area: data.area,
    budget_min: data.budget_min,
    budget_max: data.budget_max,
    style: data.style,
    source: data.source,
    stage_id: poolStage?.id || stages[0]?.id || '',
    tags: data.tags || [],
    remark: data.remark,
    is_in_pool: true,
    assignee_id: undefined,
    assignee_name: undefined,
    auto_recycle_at: undefined,
    created_at: now,
    updated_at: now,
  };
  return safeInsert<Lead>('leads', newLead);
}

export async function updateLead(
  leadId: string,
  updates: Partial<Lead>
): Promise<Lead> {
  return safeUpdate<Lead>('leads', leadId, updates);
}

export async function assignLead(
  leadId: string,
  assigneeId: string | null,
  stages: LeadStage[],
  users: User[]
): Promise<Lead> {
  const assignee = assigneeId ? users.find((u) => u.id === assigneeId) : undefined;
  const followStage = stages.find((s) => s.order === 2);

  const updates: Partial<Lead> = {
    assignee_id: assigneeId || undefined,
    assignee_name: assignee?.name,
    is_in_pool: false,
    stage_id: followStage?.id,
    auto_recycle_at: undefined,
  };

  return updateLead(leadId, updates);
}

export async function recycleLeadToPool(
  leadId: string,
  stages: LeadStage[]
): Promise<Lead> {
  const poolStage = stages.find((s) => s.order === 0);

  const updates: Partial<Lead> = {
    is_in_pool: true,
    stage_id: poolStage?.id,
    assignee_id: undefined,
    assignee_name: undefined,
  };

  return updateLead(leadId, updates);
}

export async function updateLeadStage(
  leadId: string,
  stageId: string,
  stages: LeadStage[]
): Promise<Lead> {
  const newStage = stages.find((s) => s.id === stageId);
  const isPoolStage = newStage?.order === 0;

  const updates: Partial<Lead> = {
    stage_id: stageId,
    is_in_pool: isPoolStage,
  };

  if (isPoolStage) {
    updates.assignee_id = undefined;
    updates.assignee_name = undefined;
  }

  return updateLead(leadId, updates);
}

export async function batchAssignFromPool(
  leadIds: string[],
  assigneeId: string,
  stages: LeadStage[],
  users: User[]
): Promise<Lead[]> {
  const results: Lead[] = [];
  for (const id of leadIds) {
    const updated = await assignLead(id, assigneeId, stages, users);
    results.push(updated);
  }
  return results;
}
