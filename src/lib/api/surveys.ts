'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, isSupabaseConfigured } from './base';
import { mockSurveys } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { SurveyRecord } from '@/lib/types';

export async function fetchSurveys(leadId?: string): Promise<SurveyRecord[]> {
  if (leadId) {
    if (!isSupabaseConfigured()) {
      return mockSurveys.filter((s) => s.lead_id === leadId);
    }
    return safeQuery<SurveyRecord[]>(
      () =>
        supabase
          .from('survey_records' as any)
          .select('*')
          .eq('lead_id', leadId)
          .order('survey_time', { ascending: false }) as unknown as Promise<{
          data: SurveyRecord[] | null;
          error: any;
        }>,
      mockSurveys.filter((s) => s.lead_id === leadId)
    );
  }
  return safeQuery<SurveyRecord[]>(
    () =>
      supabase
        .from('survey_records' as any)
        .select('*')
        .order('survey_time', { ascending: false }) as unknown as Promise<{
        data: SurveyRecord[] | null;
        error: any;
      }>,
    mockSurveys
  );
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
  return safeInsert<SurveyRecord>(
    'survey_records',
    newRecord,
    () => newRecord
  );
}
