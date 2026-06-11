import { createClient } from "@/utils/supabase/server";
import type { ExceptionRecord, ExceptionStatus, ProcessingNote } from "@/types";

export interface ExceptionsQueryParams {
  status?: string;
  type?: string;
  assignee?: string;
  startTime?: Date;
  endTime?: Date;
  page?: number;
  pageSize?: number;
}

export interface ExceptionsResult {
  data: ExceptionRecord[];
  total: number;
}

function dbExceptionToException(dbExc: any): ExceptionRecord {
  const processingNotes: ProcessingNote[] = Array.isArray(dbExc.processing_notes)
    ? dbExc.processing_notes.map((note: any) => ({
        id: note.id,
        content: note.content,
        author: note.author || note.operatorName,
        operatorName: note.operatorName || note.author,
        timestamp: new Date(note.timestamp),
      }))
    : [];

  return {
    id: dbExc.id,
    orderId: dbExc.order_id,
    orderNo: dbExc.order_no,
    type: dbExc.type,
    priority: dbExc.priority || "medium",
    reason: dbExc.reason,
    isDispute: dbExc.is_dispute,
    disputeReason: dbExc.dispute_reason,
    disputeEvidence: dbExc.dispute_evidence || [],
    compensationAmount: dbExc.compensation_amount,
    status: dbExc.status as ExceptionStatus,
    assigneeId: dbExc.assignee_id,
    assigneeName: dbExc.assignee_name,
    processingStartTime: new Date(dbExc.processing_start_time),
    processingEndTime: dbExc.processing_end_time
      ? new Date(dbExc.processing_end_time)
      : undefined,
    processingDuration: dbExc.processing_duration,
    processingNotes,
    resolutionNotes: dbExc.resolution_notes,
    createdAt: new Date(dbExc.created_at),
    updatedAt: new Date(dbExc.updated_at),
  };
}

export async function getExceptions(
  params: ExceptionsQueryParams = {}
): Promise<ExceptionsResult> {
  const supabase = createClient() as any;
  let query = supabase.from("exceptions").select("*", { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.type) {
    query = query.eq("type", params.type);
  }

  if (params.assignee) {
    query = query.ilike("assignee_name", `%${params.assignee}%`);
  }

  if (params.startTime) {
    query = query.gte("created_at", params.startTime.toISOString());
  }

  if (params.endTime) {
    query = query.lte("created_at", params.endTime.toISOString());
  }

  if (params.page && params.pageSize) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching exceptions:", error);
    return { data: [], total: 0 };
  }

  return {
    data: data?.map(dbExceptionToException) || [],
    total: count || 0,
  };
}

export async function getExceptionById(id: string): Promise<ExceptionRecord | null> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("exceptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching exception:", error);
    return null;
  }

  return data ? dbExceptionToException(data) : null;
}

export async function updateExceptionStatus(
  exceptionId: string,
  status: ExceptionStatus
): Promise<boolean> {
  const supabase = createClient() as any;
  const updateData: any = { status };

  if (status === "resolved" || status === "closed") {
    updateData.processing_end_time = new Date().toISOString();
  }

  const { error } = await supabase
    .from("exceptions")
    .update(updateData)
    .eq("id", exceptionId);

  if (error) {
    console.error("Error updating exception status:", error);
    return false;
  }

  return true;
}

export async function addProcessingNote(
  exceptionId: string,
  content: string,
  author: string
): Promise<boolean> {
  const supabase = createClient() as any;

  const { data: existing, error: fetchError } = await supabase
    .from("exceptions")
    .select("processing_notes")
    .eq("id", exceptionId)
    .single();

  if (fetchError) {
    console.error("Error fetching exception for note:", fetchError);
    return false;
  }

  const currentNotes = existing?.processing_notes || [];
  const newNote = {
    id: `note_${Date.now()}`,
    content,
    author,
    operatorName: author,
    timestamp: new Date().toISOString(),
  };

  const updatedNotes = [...currentNotes, newNote];

  const { error: updateError } = await supabase
    .from("exceptions")
    .update({ processing_notes: updatedNotes })
    .eq("id", exceptionId);

  if (updateError) {
    console.error("Error adding processing note:", updateError);
    return false;
  }

  return true;
}
