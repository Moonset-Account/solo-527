'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { adjustmentStore } from '@/lib/adjustment-store';
import { WorkOrder, PriorityAdjustment } from '@/lib/types';

export function useAdjustmentStore() {
  const orders = useSyncExternalStore(
    (callback) => adjustmentStore.subscribe(callback),
    () => adjustmentStore.getOrders()
  );

  const addAdjustment = useCallback((woId: string, adjustment: PriorityAdjustment) => {
    adjustmentStore.addAdjustment(woId, adjustment);
  }, []);

  const updateOrders = useCallback((newOrders: WorkOrder[]) => {
    adjustmentStore.updateOrders(newOrders);
  }, []);

  const getAllAdjustments = useCallback(() => {
    return adjustmentStore.getAllAdjustments();
  }, []);

  return { orders, addAdjustment, updateOrders, getAllAdjustments };
}
