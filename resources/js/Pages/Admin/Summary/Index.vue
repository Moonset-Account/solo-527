<script setup>
import { Link, useForm, router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'

const props = defineProps({
    events: Array,
    selectedEvent: Object,
    filters: Object,
    conversion_summaries: Array,
    attendance_summaries: Array,
    session_attendance: Array,
    conversion_totals: Object,
    attendance_totals: Object,
})

const selectedEventId = ref(props.selectedEvent?.id || props.events?.[0]?.id)
const switchEvent = (eid) => {
    selectedEventId.value = eid
    router.get(route('admin.summary.index'), { ...props.filters, event_id: eid, page: 1 }, { preserveState: true })
}

const batchForm = useForm({
    event_id: selectedEventId.value,
    attendance_data: [],
})

const fmt = (n) => n >= 10000 ? (n/10000).toFixed(1) + 'w' : n.toString()
const fmtPct = (n) => (n * 100).toFixed(1) + '%'
const fmtAmt = (n) => '¥' + Number(n || 0).toLocaleString()

const maxReg = computed(() => Math.max(1, ...(props.conversion_summaries?.map(s => s.total_registered_count) || [1])))
const maxTrend = computed(() => {
    const maxA = Math.max(1, ...(props.attendance_summaries?.map(s => s.arrived_count) || [1]))
    const maxR = Math.max(1, ...(props.attendance_summaries?.map(s => s.registered_count) || [1]))
    return Math.max(maxA, maxR)
})
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">转化 & 到场汇总</h1>
                <p class="text-sm text-gray-500 mt-1">后台维护转化漏斗与到场数据，自动更新统计</p>
            </div>
            <div class="flex items-center gap-3">
                <select v-if="events?.length" :value="selectedEventId" @change="switchEvent($event.target.value)" class="select-field w-72">
                    <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                </select>
                <Link :href="route('admin.export.summary', filters)" class="btn-secondary">
                    <i class="fas fa-file-export mr-2"></i>导出报表
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="stat-card bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                <div class="stat-label text-indigo-600">周期新增报名</div>
                <div class="stat-value text-indigo-700">{{ fmt(conversion_totals.new_registered || 0) }}</div>
                <div class="text-xs text-gray-500 mt-2">新增咨询 {{ fmt(conversion_totals.new_inquiry) }}</div>
            </div>
            <div class="stat-card bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                <div class="stat-label text-emerald-600">周期新增支付</div>
                <div class="stat-value text-emerald-700">{{ fmt(conversion_totals.new_paid || 0) }}</div>
                <div class="text-xs text-gray-500 mt-2">新增确认 {{ fmt(conversion_totals.new_confirmed) }}</div>
            </div>
            <div class="stat-card bg-gradient-to-br from-violet-50 to-white border-violet-100">
                <div class="stat-label text-violet-600">累计收款金额</div>
                <div class="stat-value text-violet-700">{{ fmtAmt(conversion_totals.total_paid_amount) }}</div>
                <div class="text-xs text-gray-500 mt-2">流失 {{ fmt(conversion_totals.new_lost) }} 人</div>
            </div>
            <div class="stat-card bg-gradient-to-br from-rose-50 to-white border-rose-100">
                <div class="stat-label text-rose-600">整体到场率</div>
                <div class="stat-value text-rose-700">{{ fmtPct(attendance_totals.attendance_rate) }}</div>
                <div class="text-xs text-gray-500 mt-2">上座率 {{ fmtPct(attendance_totals.arrival_rate) }}</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card">
                <div class="card-header"><span>转化累计趋势</span><span class="text-xs text-gray-500">最近60天</span></div>
                <div class="card-body">
                    <div v-if="!conversion_summaries?.length" class="py-16 text-center text-gray-400">
                        <i class="fas fa-chart-line text-4xl mb-3 opacity-30"></i>
                        <div>暂无转化数据</div>
                    </div>
                    <div v-else class="relative h-64">
                        <svg class="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="csGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="rgba(99,102,241,0.5)"></stop>
                                    <stop offset="100%" stop-color="rgba(99,102,241,0)"></stop>
                                </linearGradient>
                                <linearGradient id="cpGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="rgba(16,185,129,0.45)"></stop>
                                    <stop offset="100%" stop-color="rgba(16,185,129,0)"></stop>
                                </linearGradient>
                            </defs>
                            <path
                                :d="'M' + conversion_summaries.map((s, i) => {
                                    const x = (i / Math.max(conversion_summaries.length - 1, 1)) * 800
                                    const y = 220 - (s.total_registered_count / maxReg) * 200
                                    return `${x},${y}`
                                }).join(' L') + ' L800,220 L0,220 Z'"
                                fill="url(#csGrad)" stroke="rgba(99,102,241,0.9)" stroke-width="2"
                            ></path>
                            <path
                                :d="'M' + conversion_summaries.map((s, i) => {
                                    const x = (i / Math.max(conversion_summaries.length - 1, 1)) * 800
                                    const y = 220 - (s.total_paid_count / maxReg) * 200
                                    return `${x},${y}`
                                }).join(' L') + ' L800,220 L0,220 Z'"
                                fill="url(#cpGrad)" stroke="rgba(16,185,129,0.9)" stroke-width="2"
                            ></path>
                        </svg>
                        <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 px-2">
                            <span v-for="(s, i) in conversion_summaries" :key="i" v-show="i % Math.max(1, Math.floor(conversion_summaries.length / 5)) === 0">
                                {{ s.summary_date?.slice(5) }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center gap-6 text-xs mt-4">
                        <span class="flex items-center gap-2 text-indigo-600"><i class="fas fa-circle text-[6px]"></i>累计报名</span>
                        <span class="flex items-center gap-2 text-emerald-600"><i class="fas fa-circle text-[6px]"></i>累计支付</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><span>到场趋势</span><span class="text-xs text-gray-500">到场率 {{ fmtPct(attendance_totals.attendance_rate) }}</span></div>
                <div class="card-body">
                    <div v-if="!attendance_summaries?.length" class="py-16 text-center text-gray-400">暂无到场数据</div>
                    <div v-else class="relative h-64">
                        <svg class="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="atGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="rgba(244,63,94,0.5)"></stop>
                                    <stop offset="100%" stop-color="rgba(244,63,94,0)"></stop>
                                </linearGradient>
                            </defs>
                            <path
                                :d="'M' + attendance_summaries.map((s, i) => {
                                    const x = (i / Math.max(attendance_summaries.length - 1, 1)) * 800
                                    const y = 220 - (s.registered_count / maxTrend) * 200
                                    return `${x},${y}`
                                }).join(' L') + ' L800,220 L0,220 Z'"
                                fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.7)" stroke-width="2" stroke-dasharray="4 2"
                            ></path>
                            <path
                                :d="'M' + attendance_summaries.map((s, i) => {
                                    const x = (i / Math.max(attendance_summaries.length - 1, 1)) * 800
                                    const y = 220 - (s.arrived_count / maxTrend) * 200
                                    return `${x},${y}`
                                }).join(' L') + ' L800,220 L0,220 Z'"
                                fill="url(#atGrad)" stroke="rgba(244,63,94,0.9)" stroke-width="2"
                            ></path>
                        </svg>
                    </div>
                    <div class="grid grid-cols-4 gap-4 mt-4 text-center text-xs">
                        <div>
                            <div class="text-gray-500">报名</div>
                            <div class="font-bold text-gray-900 mt-1">{{ fmt(attendance_totals.registered) }}</div>
                        </div>
                        <div>
                            <div class="text-gray-500">确认</div>
                            <div class="font-bold text-gray-900 mt-1">{{ fmt(attendance_totals.confirmed) }}</div>
                        </div>
                        <div>
                            <div class="text-gray-500">实到</div>
                            <div class="font-bold text-rose-600 mt-1">{{ fmt(attendance_totals.arrived) }}</div>
                        </div>
                        <div>
                            <div class="text-gray-500">爽约</div>
                            <div class="font-bold text-gray-900 mt-1">{{ fmt(attendance_totals.no_show) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <span><i class="fas fa-table mr-2 text-indigo-500"></i>日转化明细</span>
                <span class="text-xs text-gray-500">展示最近记录</span>
            </div>
            <div class="overflow-hidden">
                <div v-if="!conversion_summaries?.length" class="py-12 text-center text-gray-400">暂无数据</div>
                <table v-else class="table">
                    <thead>
                        <tr>
                            <th class="table-th">日期</th>
                            <th class="table-th text-center">新增咨询</th>
                            <th class="table-th text-center">新增报名</th>
                            <th class="table-th text-center">新增确认</th>
                            <th class="table-th text-center">新增支付</th>
                            <th class="table-th text-center">新增流失</th>
                            <th class="table-th text-right">累计支付</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-for="s in [...conversion_summaries].reverse().slice(0, 30)" :key="s.summary_date" class="hover:bg-gray-50/70">
                            <td class="table-td font-medium text-gray-900">{{ s.summary_date }}</td>
                            <td class="table-td text-center text-gray-600">{{ s.new_inquiry_count }}</td>
                            <td class="table-td text-center text-indigo-600 font-semibold">{{ s.new_registered_count }}</td>
                            <td class="table-td text-center text-sky-600 font-semibold">{{ s.new_confirmed_count }}</td>
                            <td class="table-td text-center text-emerald-600 font-semibold">{{ s.new_paid_count }}</td>
                            <td class="table-td text-center text-rose-500">{{ s.new_lost_count }}</td>
                            <td class="table-td text-right font-semibold text-gray-900">{{ fmtAmt(s.total_paid_amount) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="selectedEvent?.sessions?.length" class="card">
            <div class="card-header"><span><i class="fas fa-door-open mr-2 text-emerald-500"></i>分场次统计</span></div>
            <div class="card-body grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="(s, idx) in selectedEvent.sessions" :key="s.id" class="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <div class="font-semibold text-gray-900">{{ s.name }}</div>
                            <div class="text-xs text-gray-500 mt-0.5">{{ idx + 1 }}号会场</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xl font-bold text-emerald-600">{{ fmtPct(attendance_summaries?.[idx]?.arrival_rate || 0) }}</div>
                            <div class="text-[10px] text-gray-500">上座率</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                        <div class="bg-gray-50 rounded-lg p-2 text-center">
                            <div class="text-gray-500">座位</div>
                            <div class="font-bold text-gray-900 mt-0.5">{{ s.seat_count || s.capacity || '-' }}</div>
                        </div>
                        <div class="bg-indigo-50 rounded-lg p-2 text-center">
                            <div class="text-indigo-600">已售</div>
                            <div class="font-bold text-indigo-700 mt-0.5">{{ attendance_summaries?.[idx]?.seat_sold || 0 }}</div>
                        </div>
                        <div class="bg-emerald-50 rounded-lg p-2 text-center">
                            <div class="text-emerald-600">实到</div>
                            <div class="font-bold text-emerald-700 mt-0.5">{{ attendance_summaries?.[idx]?.arrived_count || 0 }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
