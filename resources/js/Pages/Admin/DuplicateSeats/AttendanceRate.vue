<template>
  <Layout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">上座率仪表盘</h1>
          <p class="mt-1 text-sm text-gray-500">到场率 · 上座率 · 座位使用率 · 区域分布 · 签到时段分布</p>
        </div>
        <select @change="selectEvent($event.target.value)" class="input-base w-72">
          <option v-for="e in events" :key="e.id" :value="e.id" :selected="selectedEvent && selectedEvent.id === e.id">{{ e.name }}</option>
        </select>
      </div>

      <div v-if="selectedEvent" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div class="stat-card">
          <div class="text-sm text-gray-500">总座位数</div>
          <div class="mt-2 text-2xl font-bold">{{ format(overall_stats.total_capacity) }}</div>
        </div>
        <div class="stat-card border-l-4 border-blue-500">
          <div class="text-sm text-gray-500">已报名</div>
          <div class="mt-2 text-2xl font-bold text-blue-600">{{ format(overall_stats.total_registered) }}</div>
        </div>
        <div class="stat-card border-l-4 border-green-500">
          <div class="text-sm text-gray-500">已到场</div>
          <div class="mt-2 text-2xl font-bold text-green-600">{{ format(overall_stats.total_arrived) }}</div>
        </div>
        <div class="stat-card border-l-4 border-red-400">
          <div class="text-sm text-gray-500">到场率</div>
          <div class="mt-2 text-2xl font-bold" :class="colorText(overall_stats.attendance_rate)">{{ pct(overall_stats.attendance_rate) }}%</div>
        </div>
        <div class="stat-card border-l-4 border-purple-500">
          <div class="text-sm text-gray-500">整体上座率</div>
          <div class="mt-2 text-2xl font-bold text-purple-600">{{ pct(overall_stats.arrival_rate) }}%</div>
        </div>
        <div class="stat-card bg-gradient-to-br from-slate-50 to-gray-100">
          <div class="text-sm text-slate-700">空位数</div>
          <div class="mt-2 text-2xl font-bold text-slate-700">{{ format(overall_stats.seat_vacancies) }}</div>
        </div>
      </div>

      <div v-if="selectedEvent" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-4">关键指标对比</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div class="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
              <div class="text-xs text-indigo-600 font-medium">座位使用率</div>
              <div class="mt-1 text-2xl font-bold text-indigo-700">{{ pct(overall_stats.seat_utilization) }}%</div>
              <div class="mt-2 h-2 bg-white rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" :style="{width: pct(overall_stats.seat_utilization) + '%'}"></div>
              </div>
            </div>
            <div class="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div class="text-xs text-green-600 font-medium">实际到场率</div>
              <div class="mt-1 text-2xl font-bold text-green-700">{{ pct(overall_stats.attendance_rate) }}%</div>
              <div class="mt-2 h-2 bg-white rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" :style="{width: pct(overall_stats.attendance_rate) + '%'}"></div>
              </div>
            </div>
            <div class="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
              <div class="text-xs text-red-600 font-medium">缺席率(No-Show)</div>
              <div class="mt-1 text-2xl font-bold text-red-700">{{ pct(overall_stats.no_show_rate) }}%</div>
              <div class="mt-2 h-2 bg-white rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" :style="{width: pct(overall_stats.no_show_rate) + '%'}"></div>
              </div>
            </div>
            <div class="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
              <div class="text-xs text-gray-600 font-medium">座位空置率</div>
              <div class="mt-1 text-2xl font-bold text-gray-700">{{ pct(overall_stats.registered_total_loss_rate) }}%</div>
              <div class="mt-2 h-2 bg-white rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-gray-500 to-slate-500 rounded-full" :style="{width: pct(overall_stats.registered_total_loss_rate) + '%'}"></div>
              </div>
            </div>
          </div>

          <h4 class="font-medium text-gray-800 mb-3">分场次详情</h4>
          <div class="overflow-x-auto">
            <table class="table-base">
              <thead>
                <tr>
                  <th>场次</th>
                  <th class="text-center">容量</th>
                  <th class="text-center">已报名</th>
                  <th class="text-center">已到场</th>
                  <th class="text-center">缺席</th>
                  <th class="text-center">到场率</th>
                  <th class="text-center">上座率</th>
                  <th class="text-center">使用率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in session_details" :key="s.id">
                  <td>
                    <div class="font-medium">{{ s.name }}</div>
                    <div class="text-xs text-gray-500">{{ s.venue }} · {{ formatTime(s.start_time) }}</div>
                  </td>
                  <td class="text-center">{{ s.capacity }}</td>
                  <td class="text-center"><span class="badge badge-blue">{{ s.registered }}</span></td>
                  <td class="text-center"><span class="badge badge-green">{{ s.arrived }}</span></td>
                  <td class="text-center"><span class="badge badge-red">{{ s.no_show }}</span></td>
                  <td class="text-center font-semibold" :class="colorText(s.attendance_rate)">{{ pct(s.attendance_rate) }}%</td>
                  <td class="text-center font-semibold" :class="colorText(s.arrival_rate)">{{ pct(s.arrival_rate) }}%</td>
                  <td class="text-center font-semibold" :class="colorText(s.seat_utilization)">{{ pct(s.seat_utilization) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card">
            <h3 class="font-semibold text-gray-900 mb-4">区域座位分布</h3>
            <div class="space-y-3">
              <div v-for="z in zone_stats" :key="z.zone">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium">{{ z.zone }}</span>
                  <span class="text-gray-600">{{ z.sold_seats }} / {{ z.total_seats }}</span>
                </div>
                <div class="h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                  <div class="absolute left-0 top-0 bottom-0 rounded-lg transition-all" :style="{width: pct(z.occupancy_rate) + '%', background: 'linear-gradient(90deg, rgb(16,185,129), rgb(34,197,94))'}"></div>
                  <span class="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-gray-800">{{ pct(z.occupancy_rate) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="font-semibold text-gray-900 mb-4">签到时段分布 (07:00-20:00)</h3>
            <div class="flex items-end gap-1 h-40">
              <div v-for="h in hourly_distribution" :key="h.hour" class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all" :style="{height: Math.max(4, (h.count / maxHourCount) * 100) + '%'}" :title="h.hour + ': ' + h.count + '人'"></div>
                <div class="text-[10px] text-gray-500 -rotate-45 origin-left translate-x-2 whitespace-nowrap">{{ h.hour.replace(':00','') }}</div>
              </div>
            </div>
            <div class="text-center mt-6 text-sm font-medium text-gray-700">总计：<span class="text-indigo-600 font-bold">{{ totalHourly }}</span> 人签到</div>
          </div>
        </div>
      </div>

      <div v-if="selectedEvent" class="card">
        <h3 class="font-semibold text-gray-900 mb-4">趋势 (近14天)</h3>
        <div class="relative h-64">
          <svg class="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgb(99,102,241)" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="rgb(99,102,241)" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="grad2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgb(16,185,129)" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="rgb(16,185,129)" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <g stroke="#e5e7eb" stroke-width="1">
              <line x1="40" y1="40" x2="780" y2="40"/>
              <line x1="40" y1="100" x2="780" y2="100"/>
              <line x1="40" y1="160" x2="780" y2="160"/>
              <line x1="40" y1="200" x2="780" y2="200"/>
            </g>
            <g font-size="10" fill="#94a3b8">
              <text x="5" y="44">{{ maxTrend }}</text>
              <text x="5" y="104">{{ Math.round(maxTrend/2) }}</text>
              <text x="5" y="164">0</text>
            </g>
            <path :d="areaPath(trendPointsArrived)" fill="url(#grad2)"/>
            <path :d="areaPath(trendPointsRegistered)" fill="url(#grad1)"/>
            <polyline :points="linePath(trendPointsRegistered)" fill="none" stroke="rgb(99,102,241)" stroke-width="2"/>
            <polyline :points="linePath(trendPointsArrived)" fill="none" stroke="rgb(16,185,129)" stroke-width="2"/>
            <g v-for="(p,i) in trend_data" :key="i">
              <circle :cx="trendX(i)" :cy="trendY(p.registered)" r="3" fill="rgb(99,102,241)"/>
              <circle :cx="trendX(i)" :cy="trendY(p.arrived)" r="3" fill="rgb(16,185,129)"/>
              <text :x="trendX(i)" y="220" font-size="9" fill="#9ca3af" text-anchor="middle">{{ p.date.slice(5) }}</text>
            </g>
          </svg>
        </div>
        <div class="flex justify-center gap-6 mt-2 text-sm">
          <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:rgb(99,102,241)"></span> 已报名</span>
          <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:rgb(16,185,129)"></span> 已到场</span>
        </div>
      </div>

      <div v-if="!selectedEvent" class="card text-center py-20 text-gray-500">
        <i class="fas fa-chart-bar text-6xl text-gray-200"></i>
        <div class="mt-4">请选择活动查看上座率数据</div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/Components/Layout.vue';
import { router } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps(['events', 'selectedEvent', 'overall_stats', 'session_details', 'trend_data', 'zone_stats', 'hourly_distribution']);

function selectEvent(eventId) {
  router.visit(route('admin.attendance-rate.index', { event_id: eventId }));
}

function pct(v) { return Math.round((v || 0) * 10000) / 100; }
function format(v) { return (v || 0).toLocaleString(); }
function formatTime(t) { return t ? t.slice(5, 16).replace('T', ' ') : ''; }

function colorText(v) {
  const p = (v || 0) * 100;
  if (p >= 80) return 'text-green-600';
  if (p >= 60) return 'text-blue-600';
  if (p >= 40) return 'text-amber-600';
  return 'text-red-600';
}

const maxHourCount = computed(() => Math.max(1, ...(props.hourly_distribution?.map(h => h.count) || [1])));
const totalHourly = computed(() => props.hourly_distribution?.reduce((s, h) => s + h.count, 0) || 0);
const maxTrend = computed(() => Math.max(1, ...(props.trend_data?.reduce((m, t) => Math.max(m, t.registered, t.arrived), 0) || [1])));

function trendX(i) { return 40 + (i / Math.max(1, (props.trend_data?.length || 1) - 1)) * 740; }
function trendY(v) { return 160 - ((v || 0) / maxTrend.value) * 120; }

const trendPointsRegistered = computed(() => props.trend_data?.map((t, i) => [trendX(i), trendY(t.registered)]) || []);
const trendPointsArrived = computed(() => props.trend_data?.map((t, i) => [trendX(i), trendY(t.arrived)]) || []);

function linePath(pts) { return pts.map(p => p.join(',')).join(' '); }
function areaPath(pts) {
  if (!pts || pts.length === 0) return '';
  const last = pts[pts.length - 1];
  const first = pts[0];
  return 'M' + first[0] + ',200 L' + pts.map(p => p.join(',')).join(' L') + ' L' + last[0] + ',200 Z';
}
</script>
