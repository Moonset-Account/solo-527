import type {
  Seat,
  PaginationResult,
  SeatChangeSnapshot,
} from '@seat-platform/shared';
import type { ISeatDocument } from '../models/Seat';
import { SeatModel } from '../models/Seat';
import { createAuditLog } from '../models/AuditLog';
import { generateId, nowISO } from '../utils';

export interface CreateSeatInput {
  seatCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: Seat['status'];
  trialStatus: Seat['trialStatus'];
  trialStartDate?: string;
  trialEndDate?: string;
  quota: number;
  usedQuota?: number;
  usageThreshold: number;
  warningThreshold: number;
  criticalThreshold: number;
  expireDate?: string;
  ownerName?: string;
  ownerEmail?: string;
}

export interface UpdateSeatInput extends Partial<Omit<CreateSeatInput, 'seatCode' | 'usedQuota'>> {}

export interface ListSeatsQuery {
  page: number;
  pageSize: number;
  status?: Seat['status'];
  trialStatus?: Seat['trialStatus'];
  keyword?: string;
  ownerName?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'usedQuota' | 'expireDate';
  sortOrder: 'asc' | 'desc';
}

function toSeat(doc: ISeatDocument): Seat {
  const json = doc.toJSON() as unknown as Seat;
  return json;
}

export async function createSeat(
  input: CreateSeatInput,
  operatorName = 'system'
): Promise<Seat> {
  const seat = new SeatModel({
    _id: generateId('seat_'),
    ...input,
    usedQuota: input.usedQuota ?? 0,
    apiKeys: [],
  });
  await seat.save();

  await createAuditLog({
    entityType: 'seat',
    entityId: seat._id,
    action: 'seat.create',
    newValue: input,
    operatorName,
  });

  return toSeat(seat);
}

export async function getSeatById(id: string): Promise<Seat | null> {
  const doc = await SeatModel.findById(id);
  return doc ? toSeat(doc) : null;
}

export async function getSeatByCode(seatCode: string): Promise<Seat | null> {
  const doc = await SeatModel.findOne({ seatCode });
  return doc ? toSeat(doc) : null;
}

export async function listSeats(
  query: ListSeatsQuery
): Promise<PaginationResult<Seat>> {
  const { page, pageSize, status, trialStatus, keyword, ownerName, sortBy, sortOrder } = query;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (trialStatus) filter.trialStatus = trialStatus;
  if (ownerName) filter.ownerName = ownerName;
  if (keyword) {
    filter.$or = [
      { seatCode: { $regex: keyword, $options: 'i' } },
      { customerName: { $regex: keyword, $options: 'i' } },
      { customerEmail: { $regex: keyword, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * pageSize;

  const [docs, total] = await Promise.all([
    SeatModel.find(filter).sort(sort).skip(skip).limit(pageSize).exec(),
    SeatModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toSeat),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateSeat(
  id: string,
  input: UpdateSeatInput,
  operatorName = 'system'
): Promise<Seat | null> {
  const seat = await SeatModel.findById(id);
  if (!seat) return null;

  const changes: SeatChangeSnapshot = {};
  const fields = [
    'status',
    'trialStatus',
    'quota',
    'usageThreshold',
    'warningThreshold',
    'criticalThreshold',
    'expireDate',
  ] as const;

  for (const field of fields) {
    if (input[field] !== undefined && seat[field] !== input[field]) {
      (changes as Record<string, unknown>)[field] = {
        before: seat[field],
        after: input[field],
      };
    }
  }

  seat.set(input as Partial<ISeatDocument>);
  seat.markModified('updatedAt');
  await seat.save();

  const auditEntries: Promise<unknown>[] = [];
  for (const field of Object.keys(changes)) {
    const change = (changes as Record<string, { before: unknown; after: unknown }>)[field];
    auditEntries.push(
      createAuditLog({
        entityType: 'seat',
        entityId: id,
        action: field === 'status' ? 'seat.status_change' : 'seat.threshold_update',
        fieldName: field,
        oldValue: change.before,
        newValue: change.after,
        operatorName,
      })
    );
  }
  if (auditEntries.length > 0) {
    await Promise.all(auditEntries);
  }

  return toSeat(seat);
}

export async function updateSeatUsedQuota(
  id: string,
  usedQuota: number
): Promise<Seat | null> {
  const seat = await SeatModel.findByIdAndUpdate(
    id,
    { usedQuota },
    { new: true }
  );
  return seat ? toSeat(seat) : null;
}

export async function deleteSeat(id: string, operatorName = 'system'): Promise<boolean> {
  const seat = await SeatModel.findByIdAndDelete(id);
  if (seat) {
    await createAuditLog({
      entityType: 'seat',
      entityId: id,
      action: 'seat.update',
      remark: '删除席位',
      operatorName,
    });
    return true;
  }
  return false;
}
