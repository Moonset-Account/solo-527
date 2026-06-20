import { isSupabaseConfigured as _isConfigured } from './in-memory';
import * as mem from './in-memory';
import * as sb from './supabase';

export const isSupabaseConfigured = _isConfigured;

function pick<T extends (...args: any[]) => any>(memFn: T, sbFn: T): T {
  return function (this: any, ...args: any[]): any {
    const fn = _isConfigured() ? sbFn : memFn;
    return fn.apply(this, args);
  } as T;
}

export const listUsers = pick(mem.listUsers, sb.listUsers);
export const getUserById = pick(mem.getUserById, sb.getUserById);

export const listVehicles = pick(mem.listVehicles, sb.listVehicles);
export const getVehicleById = pick(mem.getVehicleById, sb.getVehicleById);
export const createVehicle = pick(mem.createVehicle, sb.createVehicle);

export const listParts = pick(mem.listParts, sb.listParts);
export const getPartById = pick(mem.getPartById, sb.getPartById);
export const createPart = pick(mem.createPart, sb.createPart);

export const listPartTurnovers = pick(mem.listPartTurnovers, sb.listPartTurnovers);
export const createPartTurnover = pick(mem.createPartTurnover, sb.createPartTurnover);

export const listWorkOrders = pick(mem.listWorkOrders, sb.listWorkOrders);
export const getWorkOrderById = pick(mem.getWorkOrderById, sb.getWorkOrderById);
export const createWorkOrder = pick(mem.createWorkOrder, sb.createWorkOrder);
export const updateWorkOrderStatus = pick(mem.updateWorkOrderStatus, sb.updateWorkOrderStatus);

export const listProductionNodes = pick(mem.listProductionNodes, sb.listProductionNodes);
export const createProductionNodes = pick(mem.createProductionNodes, sb.createProductionNodes);
export const updateProductionNode = pick(mem.updateProductionNode, sb.updateProductionNode);
export const bulkUpdateProductionNodes = pick(mem.bulkUpdateProductionNodes, sb.bulkUpdateProductionNodes);

export const listTeamSchedules = pick(mem.listTeamSchedules, sb.listTeamSchedules);
export const createTeamSchedule = pick(mem.createTeamSchedule, sb.createTeamSchedule);

export const listQualityInspections = pick(mem.listQualityInspections, sb.listQualityInspections);
export const createQualityInspection = pick(mem.createQualityInspection, sb.createQualityInspection);

export const listOrderChanges = pick(mem.listOrderChanges, sb.listOrderChanges);
export const createOrderChange = pick(mem.createOrderChange, sb.createOrderChange);
export const updateOrderChangeStatus = pick(mem.updateOrderChangeStatus, sb.updateOrderChangeStatus);

export const listCallbacks = pick(mem.listCallbacks, sb.listCallbacks);
export const retryCallback = pick(mem.retryCallback, sb.retryCallback);
export const addCompensation = pick(mem.addCompensation, sb.addCompensation);
