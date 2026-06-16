'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, requireSupabaseConfigured } from './base';
import { generateId } from '@/lib/utils';
import type { SurveyRecord } from '@/lib/types';

export async function fetchSurveys(leadId?: string): Promise<SurveyRecord[]> {
  requireSupabaseConfigured();
  if (leadId) {
    return safeQuery<SurveyRecord[]>(() => {
      const sb = supabase as any;
      return sb
        .from('survey_records')
        .select('*')
        .eq('lead_id', leadId)
        .order('survey_time', { ascending: false });
    });
  }
  return safeQuery<SurveyRecord[]>(() => {
    const sb = supabase as any;
    return sb
      .from('survey_records')
      .select('*')
      .order('survey_time', { ascending: false });
  });
}

export async function addSurvey(
  record: Omit<SurveyRecord, 'id' | 'created_at'>
): Promise<SurveyRecord> {
  const now = new Date().toISOString();
  const newRecord: SurveyRecord = {
    ...record,
    id: generateId(),
    created_at: now,
    survey_time: record.survey_time || now,
  };
  return safeInsert<SurveyRecord>('survey_records', newRecord);
}
