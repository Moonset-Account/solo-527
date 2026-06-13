"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      full_name: fullName,
      phone: phone || null,
      role: "user",
    });

    if (profileError) {
      return { error: profileError.message };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    ...user,
    profile,
  };
}

export async function createAuditLog(
  action: "create" | "update" | "delete",
  entityType: string,
  entityId: string | null,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    user_name: profile?.full_name ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
  });
}

export async function createSchedule(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return { error: "无权限" };
  }

  const scheduleData = {
    court_id: formData.get("court_id") as string,
    coach_id: (formData.get("coach_id") as string) || null,
    schedule_type: formData.get("schedule_type") as string,
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    title: (formData.get("title") as string) || null,
    max_participants: parseInt(formData.get("max_participants") as string) || 0,
    notes: (formData.get("notes") as string) || null,
    created_by: user.id,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from("schedules")
    .insert(scheduleData)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("create", "schedule", data.id, null, scheduleData);
  revalidatePath("/admin/schedules");
  return { data };
}

export async function updateSchedule(id: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  const updateData = {
    court_id: formData.get("court_id") as string,
    coach_id: (formData.get("coach_id") as string) || null,
    schedule_type: formData.get("schedule_type") as string,
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    title: (formData.get("title") as string) || null,
    max_participants: parseInt(formData.get("max_participants") as string) || 0,
    notes: (formData.get("notes") as string) || null,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from("schedules")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("update", "schedule", id, oldData as unknown as Record<string, unknown>, updateData);
  revalidatePath("/admin/schedules");
  return { data };
}

export async function deleteSchedule(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) return { error: error.message };

  await createAuditLog("delete", "schedule", id, oldData as unknown as Record<string, unknown>, null);
  revalidatePath("/admin/schedules");
  return { success: true };
}

export async function createPricingRule(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const ruleData = {
    name: formData.get("name") as string,
    day_of_week: formData.get("day_of_week")
      ? parseInt(formData.get("day_of_week") as string)
      : null,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    base_price: parseFloat(formData.get("base_price") as string),
    is_peak: formData.get("is_peak") === "on",
    multiplier: parseFloat(formData.get("multiplier") as string) || 1,
    is_active: true,
    created_by: user.id,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from("pricing_rules")
    .insert(ruleData)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("create", "pricing_rule", data.id, null, ruleData);
  revalidatePath("/admin/pricing");
  return { data };
}

export async function updatePricingRule(id: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("id", id)
    .single();

  const updateData = {
    name: formData.get("name") as string,
    day_of_week: formData.get("day_of_week")
      ? parseInt(formData.get("day_of_week") as string)
      : null,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    base_price: parseFloat(formData.get("base_price") as string),
    is_peak: formData.get("is_peak") === "on",
    multiplier: parseFloat(formData.get("multiplier") as string) || 1,
    is_active: formData.get("is_active") === "on",
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from("pricing_rules")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("update", "pricing_rule", id, oldData as unknown as Record<string, unknown>, updateData);
  revalidatePath("/admin/pricing");
  return { data };
}

export async function createCoach(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const coachData = {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || null,
    level: formData.get("level") as string,
    specialty: (formData.get("specialty") as string) || null,
    hourly_rate: parseFloat(formData.get("hourly_rate") as string),
    bio: (formData.get("bio") as string) || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("coaches")
    .insert(coachData)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("create", "coach", data.id, null, coachData);
  revalidatePath("/admin/coaches");
  return { data };
}

export async function updateCoach(id: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", id)
    .single();

  const updateData = {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || null,
    level: formData.get("level") as string,
    specialty: (formData.get("specialty") as string) || null,
    hourly_rate: parseFloat(formData.get("hourly_rate") as string),
    bio: (formData.get("bio") as string) || null,
    is_active: formData.get("is_active") === "on",
  };

  const { data, error } = await supabase
    .from("coaches")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("update", "coach", id, oldData as unknown as Record<string, unknown>, updateData);
  revalidatePath("/admin/coaches");
  return { data };
}

export async function createBooking(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const rawScheduleId = (formData.get("schedule_id") as string) || "";
  const NULL_UUID = "00000000-0000-0000-0000-000000000000";
  const scheduleId =
    rawScheduleId && rawScheduleId.length === 36 && rawScheduleId !== NULL_UUID
      ? rawScheduleId
      : null;
  const courtId = formData.get("court_id") as string;
  const bookingDate = formData.get("booking_date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const guestsCount = parseInt(formData.get("guests_count") as string) || 1;
  const totalPrice = parseFloat(formData.get("total_price") as string);

  const { count: existingBookings, error: countError } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("court_id", courtId)
    .eq("booking_date", bookingDate)
    .eq("start_time", startTime)
    .eq("end_time", endTime)
    .in("status", ["pending", "confirmed"]);

  if (countError) return { error: countError.message };

  let hasConflict = (existingBookings ?? 0) > 0;

  const bookingData = {
    schedule_id: scheduleId,
    user_id: user.id,
    court_id: courtId,
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    status: hasConflict ? "conflict" : "pending",
    guests_count: guestsCount,
    total_price: totalPrice,
    payment_status: "unpaid",
    has_conflict: hasConflict,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(bookingData)
    .select()
    .single();

  if (error) return { error: error.message };

  if (hasConflict) {
    const { data: existingConflict } = await supabase
      .from("court_conflicts")
      .select("*")
      .eq("court_id", courtId)
      .eq("conflict_date", bookingDate)
      .eq("start_time", startTime)
      .eq("end_time", endTime)
      .in("status", ["open", "in_progress"])
      .maybeSingle();

    if (existingConflict) {
      const mergedBookingIds = Array.from(
        new Set([...(existingConflict.booking_ids ?? []), data.id])
      );
      await supabase
        .from("court_conflicts")
        .update({
          booking_ids: mergedBookingIds,
        })
        .eq("id", existingConflict.id);
    } else {
      await supabase.from("court_conflicts").insert({
        court_id: courtId,
        conflict_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        booking_ids: [data.id],
        description: "预约时间冲突，需要负责人处理",
        status: "open",
      });
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/");
  return { data };
}

export async function processPayment(bookingId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (oldData.user_id !== user.id) {
    return { error: "无权限操作此订单" };
  }

  const now = new Date().toISOString();
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data, error } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      status: "confirmed",
      payment_method: "wechat_pay",
      transaction_id: transactionId,
      paid_at: now,
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return { data };
}

export async function cancelBooking(bookingId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isOwner = oldData.user_id === user.id;
  const isStaff = profile && ["admin", "manager"].includes(profile.role);

  if (!isOwner && !isStaff) {
    return { error: "无权限取消此订单" };
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: oldData.payment_status === "paid" ? "refunded" : oldData.payment_status,
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return { data };
}

export async function resolveConflict(conflictId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const resolution = formData.get("resolution") as string;
  const status = formData.get("status") as "in_progress" | "resolved" | "closed";

  const updateData: Record<string, unknown> = {
    status,
    resolution,
  };

  if (status === "resolved" || status === "closed") {
    updateData.resolved_by = user.id;
    updateData.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("court_conflicts")
    .update(updateData)
    .eq("id", conflictId)
    .select()
    .single();

  if (error) return { error: error.message };

  if (status === "resolved" || status === "closed") {
    const { data: conflictData } = await supabase
      .from("court_conflicts")
      .select("*")
      .eq("id", conflictId)
      .single();

    if (conflictData && !conflictData.synced_to_safety_report) {
      await supabase.from("safety_reports").insert({
        report_date: conflictData.conflict_date,
        court_id: conflictData.court_id,
        conflict_id: conflictData.id,
        conflict_count: conflictData.booking_ids.length,
        resolution_summary: resolution,
        submitted_by: user.id,
        synced_from_conflict: true,
      });

      await supabase
        .from("court_conflicts")
        .update({
          synced_to_safety_report: true,
          synced_at: new Date().toISOString(),
        })
        .eq("id", conflictId);
    }
  }

  revalidatePath("/manager/conflicts");
  revalidatePath("/manager/safety-reports");
  return { data };
}

export async function removeFromWaitingList(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("waiting_lists").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/waiting-list");
  return { success: true };
}

export async function createSafetyReport(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return { error: "无权限" };
  }

  const reportData = {
    report_date: formData.get("report_date") as string,
    court_id: (formData.get("court_id") as string) || null,
    conflict_count: parseInt(formData.get("conflict_count") as string) || 0,
    resolution_summary: (formData.get("resolution_summary") as string) || null,
    equipment_check_notes: (formData.get("equipment_check_notes") as string) || null,
    court_condition: (formData.get("court_condition") as string) || null,
    incident_notes: (formData.get("incident_notes") as string) || null,
    submitted_by: user.id,
    synced_from_conflict: false,
  };

  const { data, error } = await supabase
    .from("safety_reports")
    .insert(reportData)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("create", "safety_report", data.id, null, reportData);
  revalidatePath("/manager/safety-reports");
  return { data };
}

export async function convertWaitingToBooking(waitingId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: waitingEntry } = await supabase
    .from("waiting_lists")
    .select("*")
    .eq("id", waitingId)
    .single();

  if (!waitingEntry) return { error: "候补记录不存在" };

  const totalPrice = parseFloat(formData.get("total_price") as string) || 50;

  const scheduleId = formData.get("schedule_id") as string || waitingEntry.schedule_id;
  const courtId =
    (formData.get("court_id") as string) || waitingEntry.preferred_court_id;

  const { data: schedule } = await supabase
    .from("schedules")
    .select("date, start_time, end_time")
    .eq("id", scheduleId)
    .single();

  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      schedule_id: scheduleId,
      user_id: waitingEntry.user_id,
      court_id: courtId,
      booking_date: schedule?.date ?? waitingEntry.created_at.split("T")[0],
      start_time: schedule?.start_time ?? "09:00:00",
      end_time: schedule?.end_time ?? "10:00:00",
      status: "confirmed",
      guests_count: 1,
      total_price: totalPrice,
      payment_status: "paid",
      payment_method: "waiting_list_conversion",
      transaction_id: `WL_${Date.now()}`,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (bookingError) return { error: bookingError.message };

  await supabase
    .from("waiting_lists")
    .update({
      converted: true,
      converted_booking_id: bookingData.id,
    })
    .eq("id", waitingId);

  await createAuditLog("update", "waiting_list", waitingId, waitingEntry as unknown as Record<string, unknown>, { converted: true, converted_booking_id: bookingData.id });

  revalidatePath("/admin/waiting-list");
  revalidatePath("/bookings");
  return { data: bookingData };
}

export async function createCourt(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "无权限，仅管理员可管理场地" };
  }

  const courtData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: (formData.get("description") as string) || null,
    capacity: parseInt(formData.get("capacity") as string) || 4,
    floor_type: (formData.get("floor_type") as string) || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("courts")
    .insert(courtData)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("create", "court", data.id, null, courtData);
  revalidatePath("/admin/courts");
  revalidatePath("/", "layout");
  return { data };
}

export async function updateCourt(id: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "无权限，仅管理员可管理场地" };
  }

  const { data: oldData } = await supabase
    .from("courts")
    .select("*")
    .eq("id", id)
    .single();

  const updateData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: (formData.get("description") as string) || null,
    capacity: parseInt(formData.get("capacity") as string) || 4,
    floor_type: (formData.get("floor_type") as string) || null,
    is_active: formData.get("is_active") === "on",
  };

  const { data, error } = await supabase
    .from("courts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("update", "court", id, oldData as unknown as Record<string, unknown>, updateData);
  revalidatePath("/admin/courts");
  revalidatePath("/", "layout");
  return { data };
}

export async function deleteCourt(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "无权限，仅管理员可删除场地" };
  }

  const { data: oldData } = await supabase
    .from("courts")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("courts").delete().eq("id", id);

  if (error) return { error: error.message };

  await createAuditLog("delete", "court", id, oldData as unknown as Record<string, unknown>, null);
  revalidatePath("/admin/courts");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function joinWaitingList(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const scheduleId = formData.get("schedule_id") as string;
  const preferredCourtId = (formData.get("preferred_court_id") as string) || null;

  const { count, error: countError } = await supabase
    .from("waiting_lists")
    .select("*", { count: "exact", head: true })
    .eq("schedule_id", scheduleId);

  if (countError) return { error: countError.message };

  const position = (count ?? 0) + 1;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const waitingData = {
    schedule_id: scheduleId,
    user_id: user.id,
    position,
    preferred_court_id: preferredCourtId,
    expires_at: expiresAt.toISOString(),
  };

  const { data, error } = await supabase
    .from("waiting_lists")
    .insert(waitingData)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/waiting-list");
  return { data };
}

export async function notifyWaitingListUser(waitingId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("waiting_lists")
    .select("*")
    .eq("id", waitingId)
    .single();

  const { data, error } = await supabase
    .from("waiting_lists")
    .update({
      notified: true,
      notified_at: new Date().toISOString(),
    })
    .eq("id", waitingId)
    .select()
    .single();

  if (error) return { error: error.message };

  await createAuditLog("update", "waiting_list", waitingId, oldData as unknown as Record<string, unknown>, { notified: true });
  revalidatePath("/admin/waiting-list");
  return { data };
}

export async function deletePricingRule(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: oldData } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("pricing_rules").delete().eq("id", id);

  if (error) return { error: error.message };

  await createAuditLog("delete", "pricing_rule", id, oldData as unknown as Record<string, unknown>, null);
  revalidatePath("/admin/pricing");
  return { success: true };
}

export async function deleteCoach(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "未登录" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "无权限" };
  }

  const { data: oldData } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("coaches").delete().eq("id", id);

  if (error) return { error: error.message };

  await createAuditLog("delete", "coach", id, oldData as unknown as Record<string, unknown>, null);
  revalidatePath("/admin/coaches");
  return { success: true };
}
