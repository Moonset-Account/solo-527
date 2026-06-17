"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Activity,
  Registration,
  CheckInRecord,
  Message,
  RepairRequest,
  SecondHandItem,
  IdentityVerification,
  SeatViolation,
} from "@/lib/types";

function getClient() {
  return createClient();
}

export function useActivities(filters?: { status?: string; search?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = getClient();
    let query = sb
      .from("activities")
      .select("*, clubs(name)")
      .order("created_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

    const { data: result } = await query;
    setData(
      (result || []).map((a: any) => ({ ...a, club_name: a.clubs?.name }))
    );
    setLoading(false);
  }, [filters?.status, filters?.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useRegistrations(filters?: {
  activity_id?: string;
  status?: string;
  search?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = getClient();
    let query = sb
      .from("registrations")
      .select("*, activities(title, id), user_profiles(name, student_id, department, phone)")
      .order("registered_at", { ascending: false });

    if (filters?.activity_id) query = query.eq("activity_id", filters.activity_id);
    if (filters?.status) query = query.eq("status", filters.status);

    const { data: result } = await query;
    setData(
      (result || []).map((r: any) => ({
        ...r,
        activity_title: r.activities?.title,
        user_name: r.user_profiles?.name,
        student_id: r.user_profiles?.student_id,
        department: r.user_profiles?.department,
        phone: r.user_profiles?.phone,
      }))
    );
    setLoading(false);
  }, [filters?.activity_id, filters?.status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useCheckIns(activity_id?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = getClient();
    let query = sb
      .from("check_in_records")
      .select("*, activities(title), user_profiles(name, student_id)")
      .order("check_in_time", { ascending: false });

    if (activity_id) query = query.eq("activity_id", activity_id);

    const { data: result } = await query;
    setData(
      (result || []).map((r: any) => ({
        ...r,
        activity_title: r.activities?.title,
        user_name: r.user_profiles?.name,
        student_id: r.user_profiles?.student_id,
      }))
    );
    setLoading(false);
  }, [activity_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useMessages(filters?: {
  type?: string;
  is_read?: boolean;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = getClient();
    let query = sb.from("messages").select("*").order("created_at", { ascending: false });

    if (filters?.type) query = query.eq("type", filters.type);
    if (filters?.is_read !== undefined) query = query.eq("is_read", filters.is_read);

    const { data: result } = await query;
    setData(result || []);
    setLoading(false);
  }, [filters?.type, filters?.is_read]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useRepairRequests(filters?: { status?: string; category?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = getClient();
    let query = sb
      .from("repair_requests")
      .select("*, user_profiles!repair_requests_reporter_id_fkey(name), activities(title)")
      .order("created_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.category) query = query.eq("category", filters.category);

    const { data: result } = await query;
    setData(
      (result || []).map((r: any) => ({
        ...r,
        reporter_name: r.user_profiles?.name,
        related_activity_title: r.activities?.title,
      }))
    );
    setLoading(false);
  }, [filters?.status, filters?.category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useSecondHandItems(filters?: { status?: string; category?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = getClient();
    let query = sb
      .from("second_hand_items")
      .select("*, user_profiles!second_hand_items_seller_id_fkey(name, phone), activities(title)")
      .order("created_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.category) query = query.eq("category", filters.category);

    const { data: result } = await query;
    setData(
      (result || []).map((i: any) => ({
        ...i,
        seller_name: i.user_profiles?.name,
        seller_phone: i.user_profiles?.phone,
        related_activity_title: i.activities?.title,
      }))
    );
    setLoading(false);
  }, [filters?.status, filters?.category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useIdentityVerifications(filters?: { status?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = getClient();
    let query = sb
      .from("identity_verifications")
      .select("*, user_profiles(name, email, student_id)")
      .order("submitted_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);

    const { data: result } = await query;
    setData(
      (result || []).map((v: any) => ({
        ...v,
        user_name: v.user_profiles?.name,
        email: v.user_profiles?.email,
      }))
    );
    setLoading(false);
  }, [filters?.status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useActivityReview(activity_id: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!activity_id) return;
    setLoading(true);
    const supabaseClient = createClient();

    const [activityRes, registrationsRes] = await Promise.all([
      supabaseClient
        .from("activities")
        .select("*, clubs(name, department)")
        .eq("id", activity_id)
        .single(),
      supabaseClient
        .from("registrations")
        .select("*, user_profiles(name, student_id, department, phone)")
        .eq("activity_id", activity_id),
    ]);

    const registrationUserIds = (registrationsRes.data || []).map((r: any) => r.user_id);

    const [
      checkInsRes,
      messagesRes,
      repairsRes,
      tradesRes,
      violationsRes,
      auditLogsRes,
      verificationsRes,
    ] = await Promise.all([
      supabaseClient
        .from("check_in_records")
        .select("*, user_profiles(name, student_id)")
        .eq("activity_id", activity_id),
      supabaseClient
        .from("messages")
        .select("*")
        .eq("related_type", "activity")
        .eq("related_id", activity_id),
      supabaseClient
        .from("repair_requests")
        .select("*, user_profiles!repair_requests_reporter_id_fkey(name)")
        .eq("related_activity_id", activity_id),
      supabaseClient
        .from("second_hand_items")
        .select("*, user_profiles!second_hand_items_seller_id_fkey(name)")
        .eq("related_activity_id", activity_id),
      supabaseClient
        .from("seat_violations")
        .select("*, user_profiles(name, student_id)")
        .eq("activity_id", activity_id),
      supabaseClient
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "activity")
        .eq("entity_id", activity_id),
      registrationUserIds.length > 0
        ? supabaseClient
            .from("identity_verifications")
            .select("*, user_profiles(name, email, student_id)")
            .in("user_id", registrationUserIds)
        : { data: [] },
    ]);

    setData({
      activity: activityRes.data
        ? {
            ...activityRes.data,
            club_name: activityRes.data.clubs?.name,
            club_department: activityRes.data.clubs?.department,
          }
        : null,
      registrations: (registrationsRes.data || []).map((r: any) => ({
        ...r,
        user_name: r.user_profiles?.name,
        student_id: r.user_profiles?.student_id,
        department: r.user_profiles?.department,
        phone: r.user_profiles?.phone,
      })),
      checkIns: (checkInsRes.data || []).map((c: any) => ({
        ...c,
        user_name: c.user_profiles?.name,
        student_id: c.user_profiles?.student_id,
      })),
      messages: messagesRes.data || [],
      repairs: (repairsRes.data || []).map((r: any) => ({
        ...r,
        reporter_name: r.user_profiles?.name,
      })),
      trades: (tradesRes.data || []).map((t: any) => ({
        ...t,
        seller_name: t.user_profiles?.name,
      })),
      violations: (violationsRes.data || []).map((v: any) => ({
        ...v,
        user_name: v.user_profiles?.name,
        student_id: v.user_profiles?.student_id,
      })),
      auditLogs: auditLogsRes.data || [],
      verifications: (verificationsRes.data || []).map((v: any) => ({
        ...v,
        user_name: v.user_profiles?.name,
        email: v.user_profiles?.email,
        student_id: v.user_profiles?.student_id,
      })),
    });
    setLoading(false);
  }, [activity_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export async function submitRegistrationClient(activity_id: string, user_id: string) {
  const supabaseClient = createClient();

  const { data: activity } = await supabaseClient
    .from("activities")
    .select("max_participants, current_participants")
    .eq("id", activity_id)
    .single();

  if (!activity) return { error: "活动不存在" };

  const isWaitlisted = activity.current_participants >= activity.max_participants;

  const { data, error } = await supabaseClient
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
    await supabaseClient
      .from("activities")
      .update({
        current_participants: activity.current_participants + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activity_id);
  }

  return { data };
}

export async function checkInUserClient(
  activity_id: string,
  user_id_or_student_id: string,
  method: "qrcode" | "manual" | "gps" = "manual",
  location?: string
) {
  const supabaseClient = createClient();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let actual_user_id: string | null = null;
  let user_profile: any = null;

  const { data: profileByStudentId } = await supabaseClient
    .from("user_profiles")
    .select("id, name, student_id")
    .eq("student_id", user_id_or_student_id)
    .maybeSingle();

  if (profileByStudentId) {
    actual_user_id = profileByStudentId.id;
    user_profile = profileByStudentId;
  } else if (uuidRegex.test(user_id_or_student_id)) {
    const { data: profileById } = await supabaseClient
      .from("user_profiles")
      .select("id, name, student_id")
      .eq("id", user_id_or_student_id)
      .maybeSingle();

    if (profileById) {
      actual_user_id = profileById.id;
      user_profile = profileById;
    }
  }

  if (!actual_user_id) {
    return { error: "用户不存在，请检查学号是否正确" };
  }

  const { data: existing } = await supabaseClient
    .from("check_in_records")
    .select("id")
    .eq("activity_id", activity_id)
    .eq("user_id", actual_user_id)
    .single();

  if (existing) return { error: "该用户已签到" };

  const { data, error } = await supabaseClient
    .from("check_in_records")
    .insert({ activity_id, user_id: actual_user_id, check_in_method: method, location })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabaseClient
    .from("registrations")
    .update({ status: "checked_in", check_in_time: new Date().toISOString() })
    .eq("activity_id", activity_id)
    .eq("user_id", actual_user_id);

  return {
    data,
    user_name: user_profile?.name,
    student_id: user_profile?.student_id,
  };
}

export async function sendRemindersClient(
  activity_id: string,
  title: string,
  content: string
) {
  const supabaseClient = createClient();

  const { data: registrations } = await supabaseClient
    .from("registrations")
    .select("user_id, id")
    .eq("activity_id", activity_id)
    .in("status", ["registered", "waitlisted"]);

  if (!registrations || registrations.length === 0) return { sent: 0 };

  const messages = registrations.map((r: any) => ({
    user_id: r.user_id,
    title,
    content,
    type: "reminder",
    related_type: "activity",
    related_id: activity_id,
    is_read: false,
  }));

  await supabaseClient.from("messages").insert(messages);

  await supabaseClient
    .from("registrations")
    .update({ reminder_sent: true })
    .in(
      "id",
      registrations.map((r: any) => r.id)
    );

  return { sent: registrations.length };
}
