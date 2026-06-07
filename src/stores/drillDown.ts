import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Reservation, Violation } from '@/types';

interface Remark {
  id: string;
  content: string;
  author: string;
  time: Date;
}

export const useDrillDownStore = defineStore('drillDown', () => {
  const isOpen = ref(false);
  const title = ref('');
  const dataPoint = ref<any>(null);
  const rawRecords = ref<(Reservation | Violation)[]>([]);
  const remarks = ref<Remark[]>([]);
  
  function open(titleText: string, point: any, records: (Reservation | Violation)[]) {
    title.value = titleText;
    dataPoint.value = point;
    rawRecords.value = records;
    remarks.value = [
      { id: '1', content: '该时段预约量异常偏高，可能有活动安排', author: '李馆长', time: new Date(2026, 4, 20) },
      { id: '2', content: '已核实，为学院集中复习', author: '张馆员', time: new Date(2026, 4, 21) },
    ];
    isOpen.value = true;
  }
  
  function close() {
    isOpen.value = false;
    dataPoint.value = null;
    rawRecords.value = [];
  }
  
  function addRemark(content: string, author: string) {
    remarks.value.push({
      id: String(remarks.value.length + 1),
      content,
      author,
      time: new Date(),
    });
  }
  
  return {
    isOpen,
    title,
    dataPoint,
    rawRecords,
    remarks,
    open,
    close,
    addRemark,
  };
});
