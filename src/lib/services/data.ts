'use server';

import { getSupabaseAdmin } from '@/lib/supabase/server';
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

function db() {
  return isSupabaseConfigured ? getSupabaseAdmin() : null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const client = db();
  if (!client) {
    return mockGetDashboardStats();
  }

  try {
    const [donationsRes, expensesRes, recipientsRes, visitsRes, photosRes, exceptionsRes] =
      await Promise.all([
        client.from('donations').select('amount'),
        client.from('expenses').select('amount'),
        client.from('recipients').select('id', { count: 'exact', head: false }),
        client.from('visits').select('id').eq('status', 'published'),
        client.from('photos').select('id').eq('review_status', 'pending'),
        client.from('exception_records').select('id').neq('status', 'closed'),
      ]);

    const totalRaised = (donationsRes.data || []).reduce((s: number, d: { amount: number }) => s + d.amount, 0);
    const totalExpenses = (expensesRes.data || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);

    const settingRes = await client
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
  const client = db();
  if (!client) {
    return mockGetPublishedVisitsWithPhotos();
  }

  try {
    const { data: visits, error } = await client
      .from('visits')
      .select('*')
      .eq('status', 'published')
      .order('visit_date', { ascending: false });

    if (error || !visits) return [];

    const visitIds = visits.map((v: Visit) => v.id);
    if (visitIds.length === 0) return visits as Visit[];

    const { data: photos } = await client
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
  const client = db();
  if (!client) {
    return mockGetFeedbacksWithRecipients();
  }

  try {
    const { data: feedbacks, error } = await client
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
  const client = db();
  if (!client) {
    return mockGetBudgetWithExpenses();
  }

  try {
    const { data: categories, error } = await client
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
  const client = db();
  if (!client) {
    return mockGetExceptionWithLogs(id) ?? null;
  }

  try {
    const { data: exception, error } = await client
      .from('exception_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !exception) return null;

    const { data: logs } = await client
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
  const client = db();
  if (!client) {
    return mockVisits;
  }

  try {
    const { data, error } = await client
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
  const client = db();
  if (!client) {
    const filtered = status
      ? mockPhotos.filter((p: Photo) => p.review_status === status)
      : mockPhotos;
    return filtered.map((p: Photo) => ({
      ...p,
      visit: mockVisits.find((v: Visit) => v.id === p.visit_id),
    })) as Photo[];
  }

  try {
    let query = client
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
  const client = db();
  if (!client) {
    return mockDonations;
  }

  try {
    const { data, error } = await client
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
  const client = db();
  if (!client) {
    return status
      ? mockExceptions.filter((e: ExceptionRecord) => e.status === status)
      : mockExceptions;
  }

  try {
    let query = client
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
  const client = db();
  if (!client) {
    return mockSiteSettings;
  }

  try {
    const { data, error } = await client
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
  const client = db();
  if (!client) {
    return [...mockAchievementPhotos].sort((a: AchievementPhoto, b: AchievementPhoto) => a.sort_order - b.sort_order);
  }

  try {
    const { data, error } = await client
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
  const client = db();
  if (!client) {
    const setting = mockSiteSettings.find((s: SiteSetting) => s.key === key);
    return setting?.value ?? null;
  }

  try {
    const { data, error } = await client
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
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
      .from('budget_categories')
      .insert(data)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
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
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
      .from('budget_categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
    return record as BudgetCategory;
  } catch {
    const existing = mockBudgetCategories.find((c: BudgetCategory) => c.id === id);
    return { ...(existing || {}), ...data } as BudgetCategory;
  }
}

export async function deleteBudgetCategory(id: string): Promise<void> {
  const client = db();
  try {
    if (!client) return;
    await client.from('budget_categories').delete().eq('id', id);
  } catch {}
}

export async function createVisit(
  data: Pick<Visit, 'created_by' | 'visit_date' | 'location' | 'content'> & { status?: Visit['status'] },
): Promise<Visit> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
      .from('visits')
      .insert(data)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
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

export async function updateVisit(
  id: string,
  data: Partial<Pick<Visit, 'visit_date' | 'location' | 'content' | 'status'>>,
): Promise<Visit> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const update: any = { ...data };
    update.updated_at = new Date().toISOString();

    const { data: record, error } = await client
      .from('visits')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
    return record as Visit;
  } catch {
    const existing = mockVisits.find((v: Visit) => v.id === id);
    return { ...(existing || {}), ...data, updated_at: new Date().toISOString() } as Visit;
  }
}

export async function deleteVisit(id: string): Promise<void> {
  const client = db();
  try {
    if (!client) return;
    await client.from('visits').delete().eq('id', id);
  } catch {}
}

export async function updateVisitStatus(id: string, status: Visit['status']): Promise<Visit> {
  return updateVisit(id, { status });
}

export async function reviewPhoto(
  id: string,
  review_status: Photo['review_status'],
  review_notes?: string,
): Promise<Photo> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const update: Partial<Photo> = { review_status };
    if (review_notes !== undefined) {
      update.review_notes = review_notes;
    }

    const { data: record, error } = await client
      .from('photos')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
    return record as Photo;
  } catch {
    const existing = mockPhotos.find((p: Photo) => p.id === id);
    return { ...(existing || {}), review_status, review_notes: review_notes ?? null } as Photo;
  }
}

export async function batchReviewPhotos(status: Photo['review_status']): Promise<void> {
  const client = db();
  try {
    if (!client) return;
    await client
      .from('photos')
      .update({ review_status: status })
      .eq('review_status', 'pending');
  } catch {}
}

export async function createDonation(data: Omit<Donation, 'id' | 'created_at'>): Promise<Donation> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
      .from('donations')
      .insert(data)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
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
  data: Pick<ExceptionRecord, 'type' | 'title' | 'impact_scope'> &
    { handling_path?: string; review_notes?: string; description?: string },
): Promise<ExceptionRecord> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const insert: any = {
      type: data.type,
      title: data.title,
      impact_scope: data.impact_scope,
      status: 'pending',
      handling_path: data.handling_path ?? null,
      review_notes: data.review_notes ?? null,
    };

    const { data: record, error } = await client
      .from('exception_records')
      .insert(insert)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');

    if (data.description && data.description.trim()) {
      await addExceptionLog(record.id, 'note', data.description);
    }

    return record as ExceptionRecord;
  } catch {
    const id = crypto.randomUUID();
    const result = {
      id,
      type: data.type,
      title: data.title,
      status: 'pending',
      impact_scope: data.impact_scope,
      handling_path: data.handling_path ?? null,
      review_notes: data.review_notes ?? null,
      close_reason: null,
      parent_exception_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ExceptionRecord;

    if (data.description && data.description.trim()) {
      mockExceptions.unshift({
        ...result,
        logs: [
          {
            id: crypto.randomUUID(),
            exception_id: id,
            action_type: 'note',
            content: data.description,
            created_by: null,
            created_at: new Date().toISOString(),
          },
        ],
      });
    } else {
      mockExceptions.unshift(result);
    }

    return result;
  }
}

export async function updateException(
  id: string,
  data: Partial<Pick<ExceptionRecord, 'handling_path' | 'review_notes'>>,
): Promise<ExceptionRecord> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const update: any = { ...data, updated_at: new Date().toISOString() };

    const { data: record, error } = await client
      .from('exception_records')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
    return record as ExceptionRecord;
  } catch {
    const existing = mockExceptions.find((e: ExceptionRecord) => e.id === id);
    return { ...(existing || {}), ...data, updated_at: new Date().toISOString() } as ExceptionRecord;
  }
}

export async function updateExceptionStatus(
  id: string,
  status: ExceptionRecord['status'],
): Promise<ExceptionRecord> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
      .from('exception_records')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
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
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const insert: Partial<ExceptionLog> = {
      exception_id,
      action_type,
      content,
      created_by: created_by ?? null,
    };

    const { data: record, error } = await client
      .from('exception_logs')
      .insert(insert)
      .select('*, handler:profiles(*)')
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
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
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
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

    throw new Error(error?.message || 'no record');
  } catch {
    const existing = mockExceptions.find((e: ExceptionRecord) => e.id === id);
    const result = {
      ...(existing || {}),
      status: 'closed',
      close_reason,
      updated_at: new Date().toISOString(),
    } as ExceptionRecord;

    if (existing) {
      const idx = mockExceptions.indexOf(existing);
      mockExceptions[idx] = result;
      if (!existing.logs) existing.logs = [];
      existing.logs.push({
        id: crypto.randomUUID(),
        exception_id: id,
        action_type: 'status_change',
        content: `关闭异常：${close_reason}`,
        created_by: created_by ?? null,
        created_at: new Date().toISOString(),
      });
    }
    return result;
  }
}

export async function updateSiteSetting(
  key: string,
  value: any,
  updated_by?: string,
): Promise<SiteSetting> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
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

    if (error || !record) throw new Error(error?.message || 'no record');
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
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
      .from('achievement_photos')
      .insert(data)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
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
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: record, error } = await client
      .from('achievement_photos')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
    return record as AchievementPhoto;
  } catch {
    const existing = mockAchievementPhotos.find((p: AchievementPhoto) => p.id === id);
    return { ...(existing || {}), ...data } as AchievementPhoto;
  }
}

export async function deleteAchievementPhoto(id: string): Promise<void> {
  const client = db();
  try {
    if (!client) return;
    await client.from('achievement_photos').delete().eq('id', id);
  } catch {}
}

export async function toggleAchievementPhoto(id: string): Promise<AchievementPhoto> {
  const client = db();
  try {
    if (!client) throw new Error('no client');
    const { data: current } = await client
      .from('achievement_photos')
      .select('is_active')
      .eq('id', id)
      .single();

    const newActive = !(current?.is_active ?? true);

    const { data: record, error } = await client
      .from('achievement_photos')
      .update({ is_active: newActive })
      .eq('id', id)
      .select()
      .single();

    if (error || !record) throw new Error(error?.message || 'no record');
    return record as AchievementPhoto;
  } catch {
    const existing = mockAchievementPhotos.find((p: AchievementPhoto) => p.id === id);
    return { ...(existing || {}), is_active: !existing?.is_active } as AchievementPhoto;
  }
}
