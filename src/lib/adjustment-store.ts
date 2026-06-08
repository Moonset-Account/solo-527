import { WorkOrder, PriorityAdjustment } from './types';
import { workOrders as initialOrders } from './mock-data';

type Listener = () => void;

class AdjustmentStore {
  private orders: WorkOrder[];
  private listeners: Set<Listener> = new Set();

  constructor(initial: WorkOrder[]) {
    this.orders = structuredClone(initial);
  }

  getOrders(): WorkOrder[] {
    return this.orders;
  }

  getOrderById(id: string): WorkOrder | undefined {
    return this.orders.find((wo) => wo.id === id);
  }

  addAdjustment(woId: string, adjustment: PriorityAdjustment): void {
    const idx = this.orders.findIndex((wo) => wo.id === woId);
    if (idx === -1) return;
    this.orders[idx] = {
      ...this.orders[idx],
      priority: adjustment.newPriority,
      priorityAdjustments: [...this.orders[idx].priorityAdjustments, adjustment],
    };
    this.notify();
  }

  updateOrders(orders: WorkOrder[]): void {
    this.orders = orders;
    this.notify();
  }

  getAllAdjustments(): Array<PriorityAdjustment & { orderNo: string; customer: string; product: string }> {
    return this.orders.flatMap((wo) =>
      wo.priorityAdjustments.map((adj) => ({
        ...adj,
        orderNo: wo.orderNo,
        customer: wo.customer,
        product: wo.product,
      }))
    );
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const adjustmentStore = new AdjustmentStore(initialOrders);
