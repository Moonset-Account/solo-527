'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, safeUpdate, safeDelete } from './base';
import { generateId } from '@/lib/utils';
import type { LeadTag } from '@/lib/types';

export async function fetchTags(): Promise<LeadTag[]> {
  return safeQuery<LeadTag[]>(() => {
    const sb = supabase as any;
    return sb
      .from('lead_tags')
      .select('*')
      .order('created_at', { ascending: false });
  });
}

export async function createTag(
  tag: Omit<LeadTag, 'id' | 'created_at' | 'updated_at'>
): Promise<LeadTag> {
  const now = new Date().toISOString();
  return safeInsert<LeadTag>('lead_tags', { ...tag, created_at: now, updated_at: now });
}

export async function updateTag(
  tagId: string,
  updates: Partial<LeadTag>
): Promise<LeadTag> {
  return safeUpdate<LeadTag>('lead_tags', tagId, updates);
}

export async function deleteTag(tagId: string): Promise<void> {
  return safeDelete('lead_tags', tagId);
}
