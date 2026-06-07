<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useFilterStore } from '@/stores/filter';
import { dataAdapter } from '@/api/adapter';
import type { Reservation, Violation } from '@/types';
import { format } from 'date-fns';
import { CalendarCheck, AlertTriangle, Clock, BookOpen } from 'lucide-vue-next';

const authStore = useAuthStore();
const filterStore = useFilterStore();
const reservations = ref<Reservation[]>([]);
const violations = ref<Violation[]>([]);
const activeTab = ref<'reservations' | 'violations'>('reservations');
const loading = ref(false);

const statusLabels: Record<string, { text: string; class: string }> = {
  reserved: { text: '已预约', class: 'bg-blue-100 text-blue-700' },
  checked_in: { text: '已签到', class: 'bg-green-100 text-green-700' },
  cancelled: { text: '已取消', class: 'bg-slate-100 text-slate-600' },
  no_show: { text: '爽约', class: 'bg-red-100 text-red-700' },
  pending: { text: '待处理', class: 'bg-yellow-100 text-yellow-700' },
  processed: { text: '已处理', class: 'bg-green-100 text-green-700' },
  ignored: { text: '已忽略', class: 'bg-slate-100 text-slate-600' },
};

const violationTypeLabels: Record<string, string> = {
  no_show: '爽约',
  late_checkin: '签到迟到',
  early_leave: '提前离开',
  occupancy_timeout: '超时占用',
};

const stats = computed(() => {
  const totalReservations = reservations.value.length;
  const checkedIn = reservations.value.filter(r => r.status === 'checked_in').length;
  const noShow = reservations.value.filter(r => r.status === 'no_show').length;
  const totalViolations = violations.value.length;
  const pendingViolations = violations.value.filter(v => v.status === 'pending').length;
  return { totalReservations, checkedIn, noShow, totalViolations, pendingViolations };
});

async function loadData() {
  if (!authStore.studentId) return;
  loading.value = true;
  try {
    reservations.value = await dataAdapter.getStudentReservations(
      authStore.studentId,
      {
        dateRange: filterStore.dateRange,
      }
    );
    violations.value = await dataAdapter.getViolations(
      {
        dateRange: filterStore.dateRange,
      },
      authStore.studentId
    );
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">我的预约记录</h1>
      <p class="text-slate-500 mt-1">查看个人预约历史和违规记录</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <CalendarCheck class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">总预约</p>
            <p class="text-2xl font-bold text-blue-600">{{ stats.totalReservations }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <BookOpen class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">已签到</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.checkedIn }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">爽约次数</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.noShow }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Clock class="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">待处理违规</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.pendingViolations }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="flex border-b border-slate-200">
        <button
          class="flex-1 px-6 py-4 text-sm font-medium transition-colors"
          :class="activeTab === 'reservations' 
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'"
          @click="activeTab = 'reservations'"
        >
          预约记录
        </button>
        <button
          class="flex-1 px-6 py-4 text-sm font-medium transition-colors"
          :class="activeTab === 'violations' 
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'"
          @click="activeTab = 'violations'"
        >
          违规记录
        </button>
      </div>

      <div v-if="activeTab === 'reservations'" class="p-6">
        <div v-if="loading" class="text-center py-12 text-slate-500">
          加载中...
        </div>
        <div v-else-if="reservations.length === 0" class="text-center py-12 text-slate-500">
          暂无预约记录
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">预约编号</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">座位</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">预约时间</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">时长</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in reservations"
                :key="r.reservationId"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="py-3 px-4 text-sm font-mono text-slate-700">{{ r.reservationId }}</td>
                <td class="py-3 px-4 text-sm text-slate-700">{{ r.seatId }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ format(r.startTime, 'yyyy-MM-dd HH:mm') }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">
                  {{ Math.round((r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)) }} 小时
                </td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="statusLabels[r.status]?.class"
                  >
                    {{ statusLabels[r.status]?.text || r.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'violations'" class="p-6">
        <div v-if="loading" class="text-center py-12 text-slate-500">
          加载中...
        </div>
        <div v-else-if="violations.length === 0" class="text-center py-12 text-slate-500">
          暂无违规记录，继续保持！
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">违规编号</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">违规类型</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">发生时间</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">状态</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">备注</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="v in violations"
                :key="v.violationId"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="py-3 px-4 text-sm font-mono text-slate-700">{{ v.violationId }}</td>
                <td class="py-3 px-4 text-sm text-slate-700">
                  {{ violationTypeLabels[v.violationType] || v.violationType }}
                </td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ format(v.occurTime, 'yyyy-MM-dd HH:mm') }}</td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="statusLabels[v.status]?.class"
                  >
                    {{ statusLabels[v.status]?.text || v.status }}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-slate-500 max-w-[200px] truncate">
                  {{ v.remark || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
