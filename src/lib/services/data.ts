'use server';

import { supabaseAdmin } from '@/lib/supabase/server';
import type {
  BudgetCategory,
  Visit,
  Photo,
  Donation,
  ExceptionRecord,
  ExceptionLog,
  SiteSetting,
  AchievementPhoto,
  Feedback,
  DashboardStats,
} from '@/lib/types';
import {
  mockVisits,
  mockPhotos,
  mockBudgetCategories,
  mockDonations,
  mockExceptions,
  mockSiteSettings,
  mockAchievementPhotos,
  getDashboardStats as mockGetDashboardStats,
  getPublishedVisitsWithPhotos as mockGetPublishedVisitsWithPhotos,
  getFeedbacksWithRecipients as mockGetFeedbacksWithRecipients,
  getBudgetWithExpenses as mockGetBudgetWithExpenses,
  getExceptionWithLogs as mockGetExceptionWithLogs,
} from '@/lib/mock/data';

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('your-');

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured) {
    return mockGetDashboardStats();
  }

  try {
    const [donationsRes, expensesRes, recipientsRes, visitsRes, photosRes, exceptionsRes] =
      await Promise.all([
        supabaseAdmin.from('donations').select('amount'),
        supabaseAdmin.from('expenses').select('amount'),
        supabaseAdmin.from('recipients').select('id', { count: 'exact', head: false }),
        supabaseAdmin.from('visits').select('id').eq('status', 'published'),
        supabaseAdmin.from('photos').select('id').eq('review_status', 'pending'),
        supabaseAdmin.from('exception_records').select('id').neq('status', 'closed'),
      ]);

    const totalRaised = (donationsRes.data || []).reduce((s: number, d: { amount: number }) => s + d.amount, 0);
    const totalExpenses = (expensesRes.data || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);

    const settingRes = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'service_hours')
      .single();

    const serviceHours = settingRes.data?.value ?? 0;

    return {
      totalRaised,
      totalExpenses,
      beneficiaryCount: recipientsRes.count ?? 0,
      serviceHours: Number(serviceHours),
      visitCount: visitsRes.data?.length ?? 0,
      donationCount: donationsRes.data?.length ?? 0,
      pendingPhotos: photosRes.data?.length ?? 0,
      openExceptions: exceptionsRes.data?.length ?? 0,
    };
  } catch {
    return mockGetDashboardStats();
  }
}

export async function getPublishedVisitsWithPhotos(): Promise<Visit[]> {
  if (!isSupabaseConfigured) {
    return mockGetPublishedVisitsWithPhotos();
  }

  try {
    const { data: visits, error } = await supabaseAdmin
      .from('visits')
      .select('*')
      .eq('status', 'published')
      .order('visit_date', { ascending: false });

    if (error || !visits) return [];

    const visitIds = visits.map((v: Visit) => v.id);
    if (visitIds.length === 0) return visits as Visit[];

    const { data: photos } = await supabaseAdmin
      .from('photos')
      .select('*')
      .in('visit_id', visitIds)
      .eq('review_status', 'approved');

    const photoMap = new Map<string, Photo[]>();
    (photos || []).forEach((p: Photo) => {
      const list = photoMap.get(p.visit_id) || [];
      list.push(p);
      photoMap.set(p.visit_id, list);
    });

    return (visits as Visit[]).map((v: Visit) => ({
      ...v,
      photos: photoMap.get(v.id) || [],
    }));
  } catch {
    return mockGetPublishedVisitsWithPhotos();
  }
}

export async function getFeedbacksWithRecipients(): Promise<Feedback[]> {
  if (!isSupabaseConfigured) {
    return mockGetFeedbacksWithRecipients();
  }

  try {
    const { data: feedbacks, error } = await supabaseAdmin
      .from('feedbacks')
      .select('*, recipient:recipients(*)')
      .order('created_at', { ascending: false });

    if (error || !feedbacks) return [];
    return feedbacks as Feedback[];
  } catch {
    return mockGetFeedbacksWithRecipients();
  }
}

export async function getBudgetWithExpenses(): Promise<BudgetCategory[]> {
  if (!isSupabaseConfigured) {
    return mockGetBudgetWithExpenses();
  }

  try {
    const { data: categories, error } = await supabaseAdmin
      .from('budget_categories')
      .select('*, expenses(*)')
      .order('created_at', { ascending: true });

    if (error || !categories) return [];
    return categories as BudgetCategory[];
  } catch {
    return mockGetBudgetWithExpenses();
  }
}

export async function getExceptionWithLogs(id: string): Promise<ExceptionRecord | null> {
  if (!isSupabaseConfigured) {
    return mockGetExceptionWithLogs(id) ?? null;
  }

  try {
    const { data: exception, error } = await supabaseAdmin
      .from('exception_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !exception) return null;

    const { data: logs } = await supabaseAdmin
      .from('exception_logs')
      .select('*, handler:profiles(*)')
      .eq('exception_id', id)
      .order('created_at', { ascending: true });

    return {
      ...exception,
      logs: (logs || []) as ExceptionLog[],
    };
  } catch {
    return mockGetExceptionWithLogs(id) ?? null;
  }
}

export async function getAllVisits(): Promise<Visit[]> {
  if (!isSupabaseConfigured) {
    return mockVisits;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Visit[];
  } catch {
    return mockVisits;
  }
}

export async function getAllPhotos(status?: string): Promise<Photo[]> {
  if (!isSupabaseConfigured) {
    const filtered = status
      ? mockPhotos.filter((p: Photo) => p.review_status === status)
      : mockPhotos;
    return filtered.map((p: Photo) => ({
      ...p,
      visit: mockVisits.find((v: Visit) => v.id === p.visit_id),
    })) as Photo[];
  }

  try {
    let query = supabaseAdmin
      .from('photos')
      .select('*, visit:visits(id, location, visit_date)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('review_status', status);
    }

    const { data, error } = await query;

    if (error || !data) return [];
    return data as Photo[];
  } catch {
    return mockPhotos;
  }
}

export async function getAllDonations(): Promise<Donation[]> {
  if (!isSupabaseConfigured) {
    return mockDonations;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Donation[];
  } catch {
    return mockDonations;
  }
}

export async function getAllExceptions(status?: string): Promise<ExceptionRecord[]> {
  if (!isSupabaseConfigured) {
    return status
      ? mockExceptions.filter((e: ExceptionRecord) => e.status === status)
      : mockExceptions;
  }

  try {
    let query = supabaseAdmin
      .from('exception_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error || !data) return [];
    return data as ExceptionRecord[];
  } catch {
    return mockExceptions;
  }
}

export async function getSiteSettings(): Promise<SiteSetting[]> {
  if (!isSupabaseConfigured) {
    return mockSiteSettings;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error || !data) return [];
    return data as SiteSetting[];
  } catch {
    return mockSiteSettings;
  }
}

export async function getAchievementPhotos(): Promise<AchievementPhoto[]> {
  if (!isSupabaseConfigured) {
    return [...mockAchievementPhotos].sort((a: AchievementPhoto, b: AchievementPhoto) => a.sort_order - b.sort_order);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('achievement_photos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data) return [];
    return data as AchievementPhoto[];
  } catch {
    return [...mockAchievementPhotos].sort((a: AchievementPhoto, b: AchievementPhoto) => a.sort_order - b.sort_order);
  }
}

export async function getSettingByKey(key: string): Promise<any> {
  if (!isSupabaseConfigured) {
    const setting = mockSiteSettings.find((s: SiteSetting) => s.key === key);
    return setting?.value ?? null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data.value;
  } catch {
    const setting = mockSiteSettings.find((s: SiteSetting) => s.key === key);
    return setting?.value ?? null;
  }
}

export async function createBudgetCategory(
  data: Pick<BudgetCategory, 'name' | 'allocated_amount'> & { description?: string },
): Promise<BudgetCategory> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('budget_categories')
      .insert(data)
      .select()
      .single();

    if (error || !record) {
      return {
        id: crypto.randomUUID(),
        ...data,
        description: data.description ?? null,
        created_at: new Date().toISOString(),
      };
    }
    return record as BudgetCategory;
  } catch {
    return {
      id: crypto.randomUUID(),
      ...data,
      description: data.description ?? null,
      created_at: new Date().toISOString(),
    };
  }
}

export async function updateBudgetCategory(
  id: string,
  data: Partial<Pick<BudgetCategory, 'name' | 'allocated_amount' | 'description'>>,
): Promise<BudgetCategory> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('budget_categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) {
      const existing = mockBudgetCategories.find((c: BudgetCategory) => c.id === id);
      return { ...(existing || {}), ...data } as BudgetCategory;
    }
    return record as BudgetCategory;
  } catch {
    const existing = mockBudgetCategories.find((c: BudgetCategory) => c.id === id);
    return { ...(existing || {}), ...data } as BudgetCategory;
  }
}

export async function deleteBudgetCategory(id: string): Promise<void> {
  try {
    await supabaseAdmin.from('budget_categories').delete().eq('id', id);
  } catch {}
}

export async function createVisit(
  data: Pick<Visit, 'created_by' | 'visit_date' | 'location' | 'content'> & { status?: Visit['status'] },
): Promise<Visit> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('visits')
      .insert(data)
      .select()
      .single();

    if (error || !record) {
      return {
        id: crypto.randomUUID(),
        ...data,
        status: data.status ?? 'draft',
        created_at: new Date().toISOString(),
      };
    }
    return record as Visit;
  } catch {
    return {
      id: crypto.randomUUID(),
      ...data,
      status: data.status ?? 'draft',
      created_at: new Date().toISOString(),
    };
  }
}

export async function updateVisitStatus(id: string, status: Visit['status']): Promise<Visit> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('visits')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !record) {
      const existing = mockVisits.find((v: Visit) => v.id === id);
      return { ...(existing || {}), status } as Visit;
    }
    return record as Visit;
  } catch {
    const existing = mockVisits.find((v: Visit) => v.id === id);
    return { ...(existing || {}), status } as Visit;
  }
}

export async function reviewPhoto(
  id: string,
  review_status: Photo['review_status'],
  review_notes?: string,
): Promise<Photo> {
  try {
    const update: Partial<Photo> = { review_status };
    if (review_notes !== undefined) {
      update.review_notes = review_notes;
    }

    const { data: record, error } = await supabaseAdmin
      .from('photos')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) {
      const existing = mockPhotos.find((p: Photo) => p.id === id);
      return { ...(existing || {}), review_status, review_notes: review_notes ?? null } as Photo;
    }
    return record as Photo;
  } catch {
    const existing = mockPhotos.find((p: Photo) => p.id === id);
    return { ...(existing || {}), review_status, review_notes: review_notes ?? null } as Photo;
  }
}

export async function batchReviewPhotos(status: Photo['review_status']): Promise<void> {
  try {
    await supabaseAdmin
      .from('photos')
      .update({ review_status: status })
      .eq('review_status', 'pending');
  } catch {}
}

export async function createDonation(data: Omit<Donation, 'id' | 'created_at'>): Promise<Donation> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('donations')
      .insert(data)
      .select()
      .single();

    if (error || !record) {
      return {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString(),
      };
    }
    return record as Donation;
  } catch {
    return {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date().toISOString(),
    };
  }
}

export async function createException(
  data: Pick<ExceptionRecord, 'type' | 'title' | 'impact_scope'> & { handling_path?: string },
): Promise<ExceptionRecord> {
  try {
    const insert = {
      ...data,
      status: 'pending' as const,
      handling_path: data.handling_path ?? null,
    };

    const { data: record, error } = await supabaseAdmin
      .from('exception_records')
      .insert(insert)
      .select()
      .single();

    if (error || !record) {
      return {
        id: crypto.randomUUID(),
        ...insert,
        review_notes: null,
        close_reason: null,
        parent_exception_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return record as ExceptionRecord;
  } catch {
    return {
      id: crypto.randomUUID(),
      type: data.type,
      title: data.title,
      status: 'pending',
      impact_scope: data.impact_scope,
      handling_path: data.handling_path ?? null,
      review_notes: null,
      close_reason: null,
      parent_exception_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updateExceptionStatus(
  id: string,
  status: ExceptionRecord['status'],
): Promise<ExceptionRecord> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('exception_records')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !record) {
      const existing = mockExceptions.find((e: ExceptionRecord) => e.id === id);
      return { ...(existing || {}), status } as ExceptionRecord;
    }
    return record as ExceptionRecord;
  } catch {
    const existing = mockExceptions.find((e: ExceptionRecord) => e.id === id);
    return { ...(existing || {}), status } as ExceptionRecord;
  }
}

export async function addExceptionLog(
  exception_id: string,
  action_type: ExceptionLog['action_type'],
  content: string,
  created_by?: string,
): Promise<ExceptionLog> {
  try {
    const insert: Partial<ExceptionLog> = {
      exception_id,
      action_type,
      content,
      created_by: created_by ?? null,
    };

    const { data: record, error } = await supabaseAdmin
      .from('exception_logs')
      .insert(insert)
      .select('*, handler:profiles(*)')
      .single();

    if (error || !record) {
      return {
        id: crypto.randomUUID(),
        exception_id,
        action_type,
        content,
        created_by: created_by ?? null,
        created_at: new Date().toISOString(),
      };
    }
    return record as ExceptionLog;
  } catch {
    return {
      id: crypto.randomUUID(),
      exception_id,
      action_type,
      content,
      created_by: created_by ?? null,
      created_at: new Date().toISOString(),
    };
  }
}

export async function closeException(
  id: string,
  close_reason: string,
  created_by?: string,
): Promise<ExceptionRecord> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('exception_records')
      .update({
        status: 'closed',
        close_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (!error && record) {
      await addExceptionLog(id, 'status_change', `关闭异常：${close_reason}`, created_by);
      return record as ExceptionRecord;
    }

    const existing = mockExceptions.find((e: ExceptionRecord) => e.id === id);
    return {
      ...(existing || {}),
      status: 'closed',
      close_reason,
      updated_at: new Date().toISOString(),
    } as ExceptionRecord;
  } catch {
    const existing = mockExceptions.find((e: ExceptionRecord) => e.id === id);
    return {
      ...(existing || {}),
      status: 'closed',
      close_reason,
      updated_at: new Date().toISOString(),
    } as ExceptionRecord;
  }
}

export async function updateSiteSetting(
  key: string,
  value: any,
  updated_by?: string,
): Promise<SiteSetting> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        {
          key,
          value,
          updated_by: updated_by ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )
      .select()
      .single();

    if (error || !record) {
      const existing = mockSiteSettings.find((s: SiteSetting) => s.key === key);
      return {
        id: existing?.id ?? crypto.randomUUID(),
        key,
        value,
        updated_by: updated_by ?? null,
        updated_at: new Date().toISOString(),
      };
    }
    return record as SiteSetting;
  } catch {
    const existing = mockSiteSettings.find((s: SiteSetting) => s.key === key);
    return {
      id: existing?.id ?? crypto.randomUUID(),
      key,
      value,
      updated_by: updated_by ?? null,
      updated_at: new Date().toISOString(),
    };
  }
}

export async function createAchievementPhoto(
  data: Omit<AchievementPhoto, 'id' | 'created_at'>,
): Promise<AchievementPhoto> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('achievement_photos')
      .insert(data)
      .select()
      .single();

    if (error || !record) {
      return {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString(),
      };
    }
    return record as AchievementPhoto;
  } catch {
    return {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date().toISOString(),
    };
  }
}

export async function updateAchievementPhoto(
  id: string,
  data: Partial<Omit<AchievementPhoto, 'id' | 'created_at'>>,
): Promise<AchievementPhoto> {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('achievement_photos')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) {
      const existing = mockAchievementPhotos.find((p: AchievementPhoto) => p.id === id);
      return { ...(existing || {}), ...data } as AchievementPhoto;
    }
    return record as AchievementPhoto;
  } catch {
    const existing = mockAchievementPhotos.find((p: AchievementPhoto) => p.id === id);
    return { ...(existing || {}), ...data } as AchievementPhoto;
  }
}

export async function deleteAchievementPhoto(id: string): Promise<void> {
  try {
    await supabaseAdmin.from('achievement_photos').delete().eq('id', id);
  } catch {}
}

export async function toggleAchievementPhoto(id: string): Promise<AchievementPhoto> {
  try {
    const { data: current } = await supabaseAdmin
      .from('achievement_photos')
      .select('is_active')
      .eq('id', id)
      .single();

    const newActive = !(current?.is_active ?? true);

    const { data: record, error } = await supabaseAdmin
      .from('achievement_photos')
      .update({ is_active: newActive })
      .eq('id', id)
      .select()
      .single();

    if (error || !record) {
      const existing = mockAchievementPhotos.find((p: AchievementPhoto) => p.id === id);
      return { ...(existing || {}), is_active: newActive } as AchievementPhoto;
    }
    return record as AchievementPhoto;
  } catch {
    const existing = mockAchievementPhotos.find((p: AchievementPhoto) => p.id === id);
    return { ...(existing || {}), is_active: !existing?.is_active } as AchievementPhoto;
  }
}
