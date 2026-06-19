'use client';

import { create } from 'zustand';
import {
  mockUsers,
  mockVehicles,
  mockParts,
  mockPartTurnovers,
  mockWorkOrders,
  mockProductionNodes,
  mockTeamSchedules,
  mockQualityInspections,
  mockOrderChanges,
  mockCallbacks,
} from './mock-data';
import type {
  UserProfile,
  Vehicle,
  Part,
  PartTurnover,
  WorkOrder,
  ProductionNode,
  TeamSchedule,
  QualityInspection,
  OrderChange,
  CallbackRecord,
  CompensationRecord,
} from './types';
import { uid } from './utils';

interface AppState {
  currentUser: UserProfile | null;
  users: UserProfile[];
  vehicles: Vehicle[];
  parts: Part[];
  partTurnovers: PartTurnover[];
  workOrders: WorkOrder[];
  productionNodes: ProductionNode[];
  teamSchedules: TeamSchedule[];
  qualityInspections: QualityInspection[];
  orderChanges: OrderChange[];
  callbacks: CallbackRecord[];

  login: (email: string) => boolean;
  logout: () => void;

  addVehicle: (data: Omit<Vehicle, 'id' | 'created_at' | 'created_by'>) => Vehicle;
  addPart: (data: Omit<Part, 'id' | 'created_at'>) => Part;
  addPartTurnover: (
    data: Omit<PartTurnover, 'id' | 'created_at' | 'operator_id' | 'operator_name'>,
  ) => PartTurnover;
  addWorkOrder: (
    data: Omit<WorkOrder, 'id' | 'created_at' | 'status'> & Partial<Pick<WorkOrder, 'status'>>,
  ) => WorkOrder;
  updateWorkOrderStatus: (id: string, status: WorkOrder['status']) => void;
  addProductionNodes: (nodes: Omit<ProductionNode, 'id'>[]) => void;
  updateProductionNode: (id: string, patch: Partial<ProductionNode>) => void;
  addTeamSchedule: (
    data: Omit<TeamSchedule, 'id' | 'created_at'>,
  ) => TeamSchedule;
  addQualityInspection: (
    data: Omit<QualityInspection, 'id' | 'created_at'>,
  ) => QualityInspection;
  addOrderChange: (
    data: Omit<OrderChange, 'id' | 'created_at' | 'created_by'>,
  ) => OrderChange;
  closeOrderChange: (id: string, close_note: string) => void;
  retryCallback: (id: string, success: boolean) => void;
  addCompensation: (
    callbackId: string,
    data: Omit<CompensationRecord, 'id' | 'callback_record_id' | 'executed_at'>,
  ) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: mockUsers,
  vehicles: mockVehicles,
  parts: mockParts,
  partTurnovers: mockPartTurnovers,
  workOrders: mockWorkOrders,
  productionNodes: mockProductionNodes,
  teamSchedules: mockTeamSchedules,
  qualityInspections: mockQualityInspections,
  orderChanges: mockOrderChanges,
  callbacks: mockCallbacks,

  login: (email) => {
    const user = get().users.find((u) => u.email === email && u.is_active);
    if (user) {
      set({ currentUser: user });
      try {
        localStorage.setItem('auth_user_id', user.id);
      } catch {
        /* empty */
      }
      return true;
    }
    return false;
  },
  logout: () => {
    set({ currentUser: null });
    try {
      localStorage.removeItem('auth_user_id');
      document.cookie.split(';').forEach((c) => {
        const name = c.trim().split('=')[0];
        if (name.startsWith('demo_')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    } catch {
      /* empty */
    }
  },

  addVehicle: (data) => {
    const user = get().currentUser;
    const v: Vehicle = {
      ...data,
      id: uid('vh'),
      created_by: user?.id ?? '',
      created_at: new Date().toISOString(),
    };
    set((s) => ({ vehicles: [v, ...s.vehicles] }));
    return v;
  },

  addPart: (data) => {
    const p: Part = {
      ...data,
      id: uid('pt'),
      created_at: new Date().toISOString(),
    };
    set((s) => ({ parts: [p, ...s.parts] }));
    return p;
  },

  addPartTurnover: (data) => {
    const user = get().currentUser;
    const part = get().parts.find((p) => p.id === data.part_id);
    const workorder = data.workorder_id
      ? get().workOrders.find((w) => w.id === data.workorder_id)
      : undefined;
    const t: PartTurnover = {
      ...data,
      id: uid('to'),
      part_name: part?.name,
      workorder_title: workorder?.title,
      operator_id: user?.id ?? '',
      operator_name: user?.full_name,
      created_at: new Date().toISOString(),
    };
    set((s) => {
      const delta =
        t.type === 'in' ? t.quantity : t.type === 'out' ? -t.quantity : 0;
      const newParts = s.parts.map((p) =>
        p.id === t.part_id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
      );
      return { partTurnovers: [t, ...s.partTurnovers], parts: newParts };
    });
    return t;
  },

  addWorkOrder: (data) => {
    const vehicle = get().vehicles.find((v) => v.id === data.vehicle_id);
    const team = data.team_id ? get().users.find((u) => u.id === data.team_id) : undefined;
    const assignee = data.assignee_id
      ? get().users.find((u) => u.id === data.assignee_id)
      : undefined;
    const w: WorkOrder = {
      ...data,
      id: uid('wo'),
      status: data.status ?? 'pending',
      vehicle_plate: vehicle?.plate_number,
      vehicle_brand: vehicle?.brand,
      vehicle_model: vehicle?.model,
      team_name: team?.full_name,
      assignee_name: assignee?.full_name,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ workOrders: [w, ...s.workOrders] }));
    return w;
  },

  updateWorkOrderStatus: (id, status) => {
    set((s) => ({
      workOrders: s.workOrders.map((w) =>
        w.id === id
          ? {
              ...w,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : w.completed_at,
            }
          : w,
      ),
    }));
  },

  addProductionNodes: (nodes) => {
    set((s) => ({
      productionNodes: [
        ...nodes.map((n, idx) => ({
          ...n,
          id: uid('pn'),
          workorder_title: s.workOrders.find((w) => w.id === n.workorder_id)?.title,
          sequence: n.sequence ?? idx + 1,
          status: n.status ?? 'pending',
        })),
        ...s.productionNodes,
      ],
    }));
  },

  updateProductionNode: (id, patch) => {
    set((s) => ({
      productionNodes: s.productionNodes.map((n) =>
        n.id === id ? { ...n, ...patch } : n,
      ),
    }));
  },

  addTeamSchedule: (data) => {
    const team = get().users.find((u) => u.id === data.team_id);
    const workorder = get().workOrders.find((w) => w.id === data.workorder_id);
    const sc: TeamSchedule = {
      ...data,
      id: uid('sc'),
      team_name: team?.full_name,
      workorder_title: workorder?.title,
      assignee_names: data.assignee_ids
        .map((id) => get().users.find((u) => u.id === id)?.full_name)
        .filter(Boolean) as string[],
      created_at: new Date().toISOString(),
    };
    set((s) => ({ teamSchedules: [sc, ...s.teamSchedules] }));
    return sc;
  },

  addQualityInspection: (data) => {
    const workorder = get().workOrders.find((w) => w.id === data.workorder_id);
    const inspector = get().users.find((u) => u.id === data.inspector_id);
    const q: QualityInspection = {
      ...data,
      id: uid('qi'),
      workorder_title: workorder?.title,
      inspector_name: inspector?.full_name,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ qualityInspections: [q, ...s.qualityInspections] }));
    if (q.overall_result === 'pass') {
      get().updateWorkOrderStatus(q.workorder_id, 'completed');
    } else if (q.overall_result === 'fail' || q.overall_result === 'rework') {
      get().updateWorkOrderStatus(q.workorder_id, 'in_progress');
    }
    return q;
  },

  addOrderChange: (data) => {
    const user = get().currentUser;
    const responsible = get().users.find((u) => u.id === data.responsible_id);
    const workorder = data.workorder_id
      ? get().workOrders.find((w) => w.id === data.workorder_id)
      : undefined;
    const oc: OrderChange = {
      ...data,
      id: uid('oc'),
      status: data.status ?? 'open',
      responsible_name: responsible?.full_name,
      workorder_title: workorder?.title,
      created_by: user?.id ?? '',
      created_by_name: user?.full_name,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ orderChanges: [oc, ...s.orderChanges] }));
    return oc;
  },

  closeOrderChange: (id, close_note) => {
    set((s) => ({
      orderChanges: s.orderChanges.map((oc) =>
        oc.id === id
          ? { ...oc, status: 'closed', close_note, closed_at: new Date().toISOString() }
          : oc,
      ),
    }));
  },

  retryCallback: (id, success) => {
    set((s) => ({
      callbacks: s.callbacks.map((c) =>
        c.id === id
          ? {
              ...c,
              status: success ? 'success' : 'failed',
              retry_count: c.retry_count + 1,
              processed_at: success ? new Date().toISOString() : c.processed_at,
              failure_reason: success ? undefined : c.failure_reason ?? '重试仍然失败',
            }
          : c,
      ),
    }));
  },

  addCompensation: (callbackId, data) => {
    const comp: CompensationRecord = {
      ...data,
      id: uid('comp'),
      callback_record_id: callbackId,
      executed_at: new Date().toISOString(),
    };
    set((s) => ({
      callbacks: s.callbacks.map((c) =>
        c.id === callbackId
          ? { ...c, compensation_records: [comp, ...c.compensation_records] }
          : c,
      ),
    }));
  },
}));
