<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, MessageSquare, FileText, Send } from 'lucide-vue-next';
import { useDrillDownStore } from '@/stores/drillDown';
import { useAuthStore } from '@/stores/auth';
import { maskStudentId, maskStudentName } from '@/utils/dataMasking';
import { formatDateTime } from '@/utils/dateHelper';
import type { Reservation, Violation } from '@/types';

const drillDownStore = useDrillDownStore();
const authStore = useAuthStore();
const newRemark = ref('');

const isReservation = (item: Reservation | Violation): item is Reservation => {
  return 'seatId' in item;
};

const violationTypeLabels: Record<string, string> = {
  no_show: '爽约',
  late_checkin: '签到迟到',
  early_leave: '提前离开',
  occupancy_timeout: '超时占用',
};

const statusLabels: Record<string, { text: string; class: string }> = {
  pending: { text: '待处理', class: 'bg-yellow-100 text-yellow-700' },
  processed: { text: '已处理', class: 'bg-green-100 text-green-700' },
  ignored: { text: '已忽略', class: 'bg-slate-100 text-slate-600' },
  reserved: { text: '已预约', class: 'bg-blue-100 text-blue-700' },
  checked_in: { text: '已签到', class: 'bg-green-100 text-green-700' },
  cancelled: { text: '已取消', class: 'bg-slate-100 text-slate-600' },
  no_show: { text: '爽约', class: 'bg-red-100 text-red-700' },
};

function submitRemark() {
  if (!newRemark.value.trim()) return;
  drillDownStore.addRemark(newRemark.value.trim(), authStore.userName);
  newRemark.value = '';
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide">
      <div 
        v-if="drillDownStore.isOpen" 
        class="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 class="font-semibold text-slate-800">{{ drillDownStore.title }}</h3>
          <button 
            class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            @click="drillDownStore.close()"
          >
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div class="flex-1 overflow-auto">
          <div v-if="drillDownStore.dataPoint" class="px-5 py-4 bg-slate-50 border-b border-slate-100">
            <h4 class="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <FileText class="w-4 h-4" />
              数据点信息
            </h4>
            <div class="text-sm text-slate-600 space-y-1">
              <p>利用率: {{ (drillDownStore.dataPoint.value * 100).toFixed(1) }}%</p>
              <p>样本量: {{ drillDownStore.dataPoint.sampleSize }}</p>
              <p v-if="drillDownStore.dataPoint.isExamWeek" class="text-orange-600 font-medium">⚠️ 考试周</p>
            </div>
          </div>
          
          <div class="px-5 py-4">
            <h4 class="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <FileText class="w-4 h-4" />
              原始记录 ({{ drillDownStore.rawRecords.length }}条)
            </h4>
            <div class="space-y-2">
              <div 
                v-for="record in drillDownStore.rawRecords" 
                :key="(record as any).reservationId || (record as any).violationId"
                class="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-700">
                      {{ maskStudentId((record as any).studentId, authStore.userRole) }}
                      <span class="text-slate-500 ml-2">{{ maskStudentName((record as any).studentName, authStore.userRole) }}</span>
                    </p>
                    <p class="text-xs text-slate-500 mt-1">
                      {{ isReservation(record) ? '预约时间: ' + formatDateTime(record.startTime) : '发生时间: ' + formatDateTime(record.occurTime) }}
                    </p>
                    <p v-if="!isReservation(record)" class="text-xs text-slate-500">
                      违规类型: {{ violationTypeLabels[(record as Violation).violationType] || (record as Violation).violationType }}
                    </p>
                  </div>
                  <span 
                    class="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                    :class="statusLabels[record.status]?.class"
                  >
                    {{ statusLabels[record.status]?.text || record.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="px-5 py-4 border-t border-slate-100">
            <h4 class="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <MessageSquare class="w-4 h-4" />
              处理备注
            </h4>
            <div class="space-y-3 mb-4">
              <div 
                v-for="remark in drillDownStore.remarks" 
                :key="remark.id"
                class="p-3 bg-blue-50 rounded-lg"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-blue-700">{{ remark.author }}</span>
                  <span class="text-xs text-blue-500">{{ formatDateTime(remark.time) }}</span>
                </div>
                <p class="text-sm text-slate-700">{{ remark.content }}</p>
              </div>
              <p v-if="drillDownStore.remarks.length === 0" class="text-sm text-slate-400 text-center py-4">
                暂无备注
              </p>
            </div>
            <div class="flex gap-2">
              <input 
                v-model="newRemark"
                type="text" 
                placeholder="添加备注..."
                class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                @keyup.enter="submitRemark"
              />
              <button 
                class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                @click="submitRemark"
              >
                <Send class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <Transition name="fade">
      <div 
        v-if="drillDownStore.isOpen" 
        class="fixed inset-0 bg-black/20 z-40"
        @click="drillDownStore.close()"
      ></div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
