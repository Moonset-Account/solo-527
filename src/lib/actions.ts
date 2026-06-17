"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  Registration,
  CheckInRecord,
  Message,
  RepairRequest,
  SecondHandItem,
  IdentityVerification,
  SeatViolation,
  AuditLog,
} from "@/lib/types";

export async function getActivities(filters?: {
  status?: string;
  club_id?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from("activities")
    .select("*, clubs(name)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.club_id) query = query.eq("club_id", filters.club_id);
  if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((a: any) => ({
    ...a,
    club_name: a.clubs?.name,
  }));
}

export async function getActivityById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*, clubs(name, department)")
    .eq("id", id)
    .single();
  if (error) return null;
  return { ...data, club_name: data.clubs?.name, club_department: data.clubs?.department };
}

export async function createActivity(input: {
  title: string;
  description: string;
  club_id: string;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  category: string;
  created_by: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .insert({
      ...input,
      status: "pending",
      current_participants: 0,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateActivityStatus(
  id: string,
  status: string,
  reviewed_by: string,
  review_comment?: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("activities")
    .update({ status, reviewed_by, review_comment, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: reviewed_by,
    action: `activity_${status}`,
    entity_type: "activity",
    entity_id: id,
    details: { status, review_comment },
  });

  return { success: true };
}

export async function getRegistrations(filters?: {
  activity_id?: string;
  user_id?: string;
  status?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from("registrations")
    .select("*, activities(title, id), user_profiles(name, student_id, department, phone)")
    .order("registered_at", { ascending: false });

  if (filters?.activity_id) query = query.eq("activity_id", filters.activity_id);
  if (filters?.user_id) query = query.eq("user_id", filters.user_id);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((r: any) => ({
    ...r,
    activity_title: r.activities?.title,
    user_name: r.user_profiles?.name,
    student_id: r.user_profiles?.student_id,
    department: r.user_profiles?.department,
    phone: r.user_profiles?.phone,
  }));
}

export async function submitRegistration(activity_id: string, user_id: string) {
  const supabase = createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("max_participants, current_participants")
    .eq("id", activity_id)
    .single();

  if (!activity) return { error: "活动不存在" };

  const isWaitlisted = activity.current_participants >= activity.max_participants;

  const { data, error } = await supabase
    .from("registrations")
    .insert({
      activity_id,
      user_id,
      status: isWaitlisted ? "waitlisted" : "registered",
      has_reminder: true,
      reminder_sent: false,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (!isWaitlisted) {
    await supabase
      .from("activities")
      .update({
        current_participants: activity.current_participants + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activity_id);
  }

  return { data };
}

export async function cancelRegistration(registration_id: string, activity_id: string) {
  const supabase = createClient();

  const { data: reg } = await supabase
    .from("registrations")
    .select("status")
    .eq("id", registration_id)
    .single();

  if (!reg) return { error: "报名记录不存在" };

  const { error } = await supabase
    .from("registrations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", registration_id);

  if (error) return { error: error.message };

  if (reg.status === "registered") {
    const { data: activity } = await supabase
      .from("activities")
      .select("current_participants")
      .eq("id", activity_id)
      .single();

    if (activity) {
      await supabase
        .from("activities")
        .update({
          current_participants: Math.max(0, activity.current_participants - 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activity_id);
    }

    const { data: waitlisted } = await supabase
      .from("registrations")
      .select("id, user_id")
      .eq("activity_id", activity_id)
      .eq("status", "waitlisted")
      .order("registered_at", { ascending: true })
      .limit(1);

    if (waitlisted && waitlisted.length > 0) {
      await supabase
        .from("registrations")
        .update({ status: "registered" })
        .eq("id", waitlisted[0].id);

      const { data: act } = await supabase
        .from("activities")
        .select("current_participants")
        .eq("id", activity_id)
        .single();

      if (act) {
        await supabase
          .from("activities")
          .update({ current_participants: act.current_participants + 1 })
          .eq("id", activity_id);
      }
    }
  }

  return { success: true };
}

export async function checkInUser(
  activity_id: string,
  user_id: string,
  method: "qrcode" | "manual" | "gps" = "manual",
  location?: string
) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("check_in_records")
    .select("id")
    .eq("activity_id", activity_id)
    .eq("user_id", user_id)
    .single();

  if (existing) return { error: "该用户已签到" };

  const { data, error } = await supabase
    .from("check_in_records")
    .insert({
      activity_id,
      user_id,
      check_in_method: method,
      location,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("registrations")
    .update({
      status: "checked_in",
      check_in_time: new Date().toISOString(),
    })
    .eq("activity_id", activity_id)
    .eq("user_id", user_id);

  return { data };
}

export async function getCheckInRecords(activity_id?: string) {
  const supabase = createClient();
  let query = supabase
    .from("check_in_records")
    .select("*, activities(title), user_profiles(name, student_id)")
    .order("check_in_time", { ascending: false });

  if (activity_id) query = query.eq("activity_id", activity_id);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((r: any) => ({
    ...r,
    activity_title: r.activities?.title,
    user_name: r.user_profiles?.name,
    student_id: r.user_profiles?.student_id,
  }));
}

export async function sendMessage(
  user_id: string,
  title: string,
  content: string,
  type: string,
  related_type?: string,
  related_id?: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ user_id, title, content, type, related_type, related_id, is_read: false })
    .select()
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function sendBulkReminders(
  activity_id: string,
  title: string,
  content: string
) {
  const supabase = createClient();

  const { data: registrations } = await supabase
    .from("registrations")
    .select("user_id, id")
    .eq("activity_id", activity_id)
    .in("status", ["registered", "waitlisted"]);

  if (!registrations || registrations.length === 0)
    return { sent: 0 };

  const messages = registrations.map((r: any) => ({
    user_id: r.user_id,
    title,
    content,
    type: "reminder",
    related_type: "activity",
    related_id: activity_id,
    is_read: false,
  }));

  const { error: msgError } = await supabase.from("messages").insert(messages);
  if (msgError) return { error: msgError.message };

  await supabase
    .from("registrations")
    .update({ reminder_sent: true })
    .in("id", registrations.map((r: any) => r.id));

  return { sent: registrations.length };
}

export async function getMessages(filters?: {
  user_id?: string;
  type?: string;
  is_read?: boolean;
}) {
  const supabase = createClient();
  let query = supabase.from("messages").select("*").order("created_at", { ascending: false });

  if (filters?.user_id) query = query.eq("user_id", filters.user_id);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.is_read !== undefined) query = query.eq("is_read", filters.is_read);

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function markMessageRead(message_id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("messages").update({ is_read: true }).eq("id", message_id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function markAllMessagesRead(user_id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("user_id", user_id)
    .eq("is_read", false);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getRepairRequests(filters?: {
  status?: string;
  related_activity_id?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from("repair_requests")
    .select("*, user_profiles!repair_requests_reporter_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.related_activity_id)
    query = query.eq("related_activity_id", filters.related_activity_id);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((r: any) => ({
    ...r,
    reporter_name: r.user_profiles?.name,
  }));
}

export async function createRepairRequest(input: {
  title: string;
  description: string;
  dormitory: string;
  room_number: string;
  category: string;
  priority: string;
  reporter_id: string;
  related_activity_id?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("repair_requests")
    .insert(input)
    .select()
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function getSecondHandItems(filters?: {
  status?: string;
  related_activity_id?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from("second_hand_items")
    .select("*, user_profiles!second_hand_items_seller_id_fkey(name, phone)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.related_activity_id)
    query = query.eq("related_activity_id", filters.related_activity_id);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((i: any) => ({
    ...i,
    seller_name: i.user_profiles?.name,
    seller_phone: i.user_profiles?.phone,
  }));
}

export async function getIdentityVerifications(filters?: { status?: string }) {
  const supabase = createClient();
  let query = supabase
    .from("identity_verifications")
    .select("*, user_profiles(name, email, student_id)")
    .order("submitted_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((v: any) => ({
    ...v,
    user_name: v.user_profiles?.name,
    email: v.user_profiles?.email,
  }));
}

export async function approveVerification(id: string, reviewed_by: string, comment?: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("identity_verifications")
    .update({
      status: "approved",
      reviewed_by,
      review_comment: comment,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function rejectVerification(id: string, reviewed_by: string, comment: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("identity_verifications")
    .update({
      status: "rejected",
      reviewed_by,
      review_comment: comment,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getSeatViolations(activity_id?: string) {
  const supabase = createClient();
  let query = supabase
    .from("seat_violations")
    .select("*, user_profiles(name, student_id)")
    .order("created_at", { ascending: false });

  if (activity_id) query = query.eq("activity_id", activity_id);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((v: any) => ({
    ...v,
    user_name: v.user_profiles?.name,
    student_id: v.user_profiles?.student_id,
  }));
}

export async function getAuditLogs(entity_type?: string, entity_id?: string) {
  const supabase = createClient();
  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false });

  if (entity_type) query = query.eq("entity_type", entity_type);
  if (entity_id) query = query.eq("entity_id", entity_id);

  const { data, error } = await query.limit(100);
  if (error) return [];
  return data || [];
}

export async function getActivityFullReview(activity_id: string) {
  const supabase = createClient();

  const [activityResult, registrationsResult, checkInsResult, messagesResult, repairsResult, tradesResult, violationsResult, auditLogsResult] =
    await Promise.all([
      supabase
        .from("activities")
        .select("*, clubs(name, department, leader_id)")
        .eq("id", activity_id)
        .single(),
      supabase
        .from("registrations")
        .select("*, user_profiles(name, student_id, department, phone)")
        .eq("activity_id", activity_id),
      supabase
        .from("check_in_records")
        .select("*, user_profiles(name, student_id)")
        .eq("activity_id", activity_id),
      supabase
        .from("messages")
        .select("*")
        .eq("related_type", "activity")
        .eq("related_id", activity_id),
      supabase
        .from("repair_requests")
        .select("*, user_profiles!repair_requests_reporter_id_fkey(name), user_profiles!repair_requests_handler_id_fkey(name)")
        .eq("related_activity_id", activity_id),
      supabase
        .from("second_hand_items")
        .select("*, user_profiles!second_hand_items_seller_id_fkey(name)")
        .eq("related_activity_id", activity_id),
      supabase
        .from("seat_violations")
        .select("*, user_profiles(name, student_id)")
        .eq("activity_id", activity_id),
      supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "activity")
        .eq("entity_id", activity_id),
    ]);

  const mapProfile = (obj: any, prefix: string, fk: string) => {
    if (!obj) return obj;
    const profile = obj[fk];
    if (!profile) return obj;
    const result = { ...obj };
    result[`${prefix}_name`] = profile.name;
    if (profile.student_id) result[`${prefix}_student_id`] = profile.student_id;
    if (profile.phone) result[`${prefix}_phone`] = profile.phone;
    delete result[fk];
    return result;
  };

  return {
    activity: activityResult.data
      ? {
          ...activityResult.data,
          club_name: activityResult.data.clubs?.name,
          club_department: activityResult.data.clubs?.department,
        }
      : null,
    registrations: (registrationsResult.data || []).map((r: any) => ({
      ...r,
      user_name: r.user_profiles?.name,
      student_id: r.user_profiles?.student_id,
      department: r.user_profiles?.department,
      phone: r.user_profiles?.phone,
    })),
    checkIns: (checkInsResult.data || []).map((c: any) => ({
      ...c,
      user_name: c.user_profiles?.name,
      student_id: c.user_profiles?.student_id,
    })),
    messages: messagesResult.data || [],
    repairs: (repairsResult.data || []).map((r: any) => {
      const result: any = { ...r };
      result.reporter_name = r.user_profiles?.name;
      delete result.user_profiles;
      return result;
    }),
    trades: (tradesResult.data || []).map((t: any) => {
      const result: any = { ...t };
      result.seller_name = t.user_profiles?.name;
      delete result.user_profiles;
      return result;
    }),
    violations: (violationsResult.data || []).map((v: any) => ({
      ...v,
      user_name: v.user_profiles?.name,
      student_id: v.user_profiles?.student_id,
    })),
    auditLogs: auditLogsResult.data || [],
  };
}

export async function getDashboardStats() {
  const supabase = createClient();

  const [activitiesRes, registrationsRes, checkInsRes, messagesRes] = await Promise.all([
    supabase.from("activities").select("id, status", { count: "exact" }),
    supabase.from("registrations").select("id, status", { count: "exact" }),
    supabase.from("check_in_records").select("id", { count: "exact" }),
    supabase.from("messages").select("id, is_read").eq("is_read", false),
  ]);

  return {
    totalActivities: activitiesRes.count || 0,
    totalRegistrations: registrationsRes.count || 0,
    totalCheckIns: checkInsRes.count || 0,
    unreadMessages: messagesRes.data?.length || 0,
  };
}

export async function exportActivityData(activity_id: string) {
  const review = await getActivityFullReview(activity_id);
  return review;
}

export async function exportRegistrations(activity_id?: string) {
  const supabase = createClient();
  let query = supabase
    .from("registrations")
    .select("*, activities(title), user_profiles(name, student_id, department, phone)")
    .order("registered_at", { ascending: false });

  if (activity_id) query = query.eq("activity_id", activity_id);

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((r: any) => ({
    id: r.id,
    user_name: r.user_profiles?.name,
    student_id: r.user_profiles?.student_id,
    department: r.user_profiles?.department,
    phone: r.user_profiles?.phone,
    activity_title: r.activities?.title,
    status: r.status,
    registered_at: r.registered_at,
    seat_number: r.seat_number,
    has_reminder: r.has_reminder,
    reminder_sent: r.reminder_sent,
  }));
}
