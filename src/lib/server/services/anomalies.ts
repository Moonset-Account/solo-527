import { mockAnomalies, mockAnomalyNotes } from '$lib/mock/data';
import { generateUUID } from '$utils';
import type { AnomalyRecord, AnomalyNote, PaginatedResult, AnomalyQueryParams } from '$types';

export async function getAnomalies(params: AnomalyQueryParams = {}): Promise<PaginatedResult<AnomalyRecord>> {
  let data = [...mockAnomalies];

  if (params.dateFrom) {
    data = data.filter((d) => d.date >= params.dateFrom!);
  }
  if (params.dateTo) {
    data = data.filter((d) => d.date <= params.dateTo!);
  }
  if (params.severity) {
    data = data.filter((d) => d.severity === params.severity);
  }
  if (params.status) {
    data = data.filter((d) => d.status === params.status);
  }
  if (params.metricKey) {
    data = data.filter((d) => d.metricKey === params.metricKey);
  }

  data.sort((a, b) => b.date.localeCompare(a.date));

  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function getAnomalyById(id: string): Promise<AnomalyRecord | undefined> {
  return mockAnomalies.find((a) => a.id === id);
}

export async function getAnomalyNotes(anomalyId: string): Promise<AnomalyNote[]> {
  return mockAnomalyNotes
    .filter((n) => n.anomalyId === anomalyId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addAnomalyNote(
  anomalyId: string,
  content: string,
  author: string
): Promise<AnomalyNote> {
  const note: AnomalyNote = {
    id: generateUUID(),
    anomalyId,
    content,
    author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockAnomalyNotes.push(note);
  return note;
}

export async function updateAnomalyStatus(
  id: string,
  status: AnomalyRecord['status'],
  resolvedBy?: string
): Promise<AnomalyRecord | undefined> {
  const anomaly = mockAnomalies.find((a) => a.id === id);
  if (anomaly) {
    anomaly.status = status;
    if (status === 'resolved') {
      anomaly.resolvedAt = new Date().toISOString();
      anomaly.resolvedBy = resolvedBy;
    }
  }
  return anomaly;
}

export async function getTodayAnomaliesCount(): Promise<{ total: number; critical: number; high: number }> {
  const today = mockAnomalies.filter((a) => a.date === mockAnomalies[0]?.date);
  return {
    total: today.length,
    critical: today.filter((a) => a.severity === 'critical').length,
    high: today.filter((a) => a.severity === 'high').length
  };
}
