<script setup>
import { Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'

const props = defineProps({
    events: Array,
    selectedEvent: Object,
    stats: Object,
    conversionFunnel: Array,
    attendanceTrend: Array,
    qualityDistribution: Array,
    sourceChannelStats: Array,
    sessionStats: Array,
    duplicatePendingCount: Number,
    refundPendingCount: Number,
    recentRegistrations: Array,
    canManage: Boolean,
    canOperateTicket: Boolean,
})

const selectedEventId = ref(props.selectedEvent?.id || props.events?.[0]?.id)

const switchEvent = (eid) => {
    selectedEventId.value = eid
    window.location.href = `${window.route('dashboard')}?event_id=${eid}`
}

const fmtPercent = (v) => `${(v * 100).toFixed(1)}%`
const fmtNum = (n) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return n.toString()
}
const fmtAmount = (a) => `¥${Number(a || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`

const funnelPercent = computed(() => {
    if (!props.conversionFunnel?.length) return []
    const max = Math.max(...props.conversionFunnel.map(x => x.count || 0), 1)
    return props.conversionFunnel.map(x => ({
        ...x,
        percent: (x.count / max * 100).toFixed(1),
        rate: max > 0 && x.count > 0 ? (x.count / props.conversionFunnel[0].count * 100).toFixed(1) : 0,
    }))
})

const qualityTotal = computed(() => props.qualityDistribution.reduce((s, x) => s + (x.count || 0), 0))

const maxTrend = computed(() => {
    if (!props.attendanceTrend?.length) return 1
    return Math.max(...props.attendanceTrend.flatMap(x => [x.registrations, x.arrivals]), 1)
})

const maxSource = computed(() => {
    if (!props.sourceChannelStats?.length) return 1
    return Math.max(...props.sourceChannelStats.map(x => x.count), 1)
})
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">复盘看板</h1>
                <p v-if="selectedEvent" class="text-sm text-gray-500 mt-1">
                    {{ selectedEvent.name }} · {{ selectedEvent.theme }}
                </p>
            </div>
            <div class="flex items-center gap-3">
                <select v-if="events?.length" :value="selectedEventId" @change="switchEvent($event.target.value)" class="select-field w-72">
                    <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                </select>
                <Link v-if="canOperateTicket" :href="route('ticket.registrations.create', selectedEvent ? { event_id: selectedEvent.id } : {})" class="btn-primary">
                    <i class="fas fa-plus mr-2"></i>提交报名
                </Link>
                <button v-if="canManage" class="btn-secondary">
                    <i class="fas fa-rotate mr-2"></i>刷新汇总
                </button>
            </div>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
            <Link
                v-if="duplicatePendingCount > 0"
                :href="route('admin.duplicate-seats.index', selectedEvent ? { event_id: selectedEvent.id } : {})"
                class="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm hover:bg-amber-100 transition"
            >
                <i class="fas fa-triangle-exclamation"></i>
                重复占座待处理：<span class="font-semibold">{{ duplicatePendingCount }}</span>
            </Link>
            <Link
                v-if="refundPendingCount > 0"
                :href="route('admin.config.refunds', selectedEvent ? { event_id: selectedEvent.id, status: 'pending' } : {})"
                class="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg text-sm hover:bg-sky-100 transition"
            >
                <i class="fas fa-money-bill-transfer"></i>
                退款待处理：<span class="font-semibold">{{ refundPendingCount }}</span>
            </Link>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div class="stat-card">
                <div class="stat-label flex items-center gap-1">
                    <i class="fas fa-user-plus text-indigo-500"></i> 累计报名
                </div>
                <div class="stat-value">{{ fmtNum(stats.registered || 0) }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label flex items-center gap-1">
                    <i class="fas fa-check-circle text-emerald-500"></i> 确认人数
                </div>
                <div class="stat-value">{{ fmtNum(stats.confirmed || 0) }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label flex items-center gap-1">
                    <i class="fas fa-credit-card text-violet-500"></i> 已支付
                </div>
                <div class="stat-value text-violet-700">{{ fmtNum(stats.paid || 0) }}</div>
                <div class="stat-change text-violet-600">
                    <i class="fas fa-coins"></i> {{ fmtAmount(stats.paid_amount) }}
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label flex items-center gap-1">
                    <i class="fas fa-door-open text-sky-500"></i> 实到场
                </div>
                <div class="stat-value">{{ fmtNum(stats.arrived || 0) }}</div>
                <div class="stat-change text-sky-600">
                    <i class="fas fa-bullseye"></i> 到场率 {{ fmtPercent(stats.attendance_rate) }}
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label flex items-center gap-1">
                    <i class="fas fa-award text-amber-500"></i> 平均质量分
                </div>
                <div class="stat-value text-amber-700">{{ stats.avg_quality_score || 0 }}</div>
                <div class="stat-change text-amber-600">
                    <i class="fas fa-user-tie"></i> 重点客户 {{ fmtNum(stats.key_customers) }}
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label flex items-center gap-1">
                    <i class="fas fa-chair text-rose-500"></i> 上座率
                </div>
                <div class="stat-value text-rose-700">{{ fmtPercent(stats.arrival_rate) }}</div>
                <div class="stat-change text-rose-600">
                    <i class="fas fa-building-columns"></i> 座位 {{ fmtNum(stats.seat_capacity) }}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 card">
                <div class="card-header">
                    <span>转化漏斗</span>
                    <span class="text-sm text-gray-500">转化率: {{ fmtPercent(stats.conversion_rate) }}</span>
                </div>
                <div class="card-body">
                    <div v-if="!funnelPercent.length" class="text-center py-12 text-gray-400">
                        <i class="fas fa-filter text-4xl mb-3 opacity-30"></i>
                        <div>暂无转化数据</div>
                    </div>
                    <div v-else class="space-y-3">
                        <div v-for="(step, idx) in funnelPercent" :key="step.stage" class="relative">
                            <div class="flex items-center justify-between mb-1 text-xs">
                                <span class="font-medium text-gray-700">{{ step.label }}</span>
                                <span class="text-gray-500">
                                    <span class="font-semibold text-gray-900">{{ step.count }}</span>
                                    <span class="mx-1">·</span>
                                    <span>{{ step.rate }}%</span>
                                </span>
                            </div>
                            <div class="h-10 bg-gray-50 rounded-lg overflow-hidden relative flex items-center px-4">
                                <div
                                    class="absolute left-0 top-0 bottom-0 rounded-lg transition-all"
                                    :style="{
                                        width: Math.max(step.percent, 8) + '%',
                                        background: `linear-gradient(90deg, rgba(79,70,229,${0.9 - idx * 0.1}), rgba(168,85,247,${0.9 - idx * 0.1}))`
                                    }"
                                ></div>
                                <div class="relative z-10 flex items-center justify-between w-full text-xs">
                                    <span class="font-medium text-gray-900 mix-blend-difference text-white">{{ step.label }}</span>
                                    <span class="font-bold mix-blend-difference text-white">{{ step.count }} 人</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span>质量分布</span>
                    <span class="text-sm text-gray-500">共 {{ qualityTotal }} 份评分</span>
                </div>
                <div class="card-body">
                    <div v-if="!qualityDistribution?.length" class="text-center py-12 text-gray-400">
                        <i class="fas fa-chart-pie text-4xl mb-3 opacity-30"></i>
                        <div>暂无评分数据</div>
                    </div>
                    <div v-else class="space-y-4">
                        <div v-for="q in qualityDistribution" :key="q.level" class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                                :style="{ background: q.color }"
                            >{{ q.level }}</div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-1 text-sm">
                                    <span class="font-medium">{{ q.label }}</span>
                                    <span class="text-gray-500">{{ q.count }} 人 · {{ qualityTotal > 0 ? ((q.count / qualityTotal) * 100).toFixed(1) : 0 }}%</span>
                                </div>
                                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all"
                                        :style="{ width: qualityTotal > 0 ? (q.count / qualityTotal * 100) + '%' : '0%', background: q.color }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 card">
                <div class="card-header">
                    <span>报名&到场趋势</span>
                    <div class="flex items-center gap-4 text-xs">
                        <span class="flex items-center gap-1 text-indigo-600"><i class="fas fa-circle text-[6px]"></i>新增报名</span>
                        <span class="flex items-center gap-1 text-emerald-600"><i class="fas fa-circle text-[6px]"></i>到场数</span>
                    </div>
                </div>
                <div class="card-body">
                    <div v-if="!attendanceTrend?.length" class="text-center py-12 text-gray-400">暂无趋势数据</div>
                    <div v-else class="relative h-64">
                        <svg class="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="rgba(79,70,229,0.4)"></stop>
                                    <stop offset="100%" stop-color="rgba(79,70,229,0.02)"></stop>
                                </linearGradient>
                                <linearGradient id="arrGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="rgba(16,185,129,0.3)"></stop>
                                    <stop offset="100%" stop-color="rgba(16,185,129,0.02)"></stop>
                                </linearGradient>
                            </defs>
                            <g stroke="#f1f5f9" stroke-width="1">
                                <line x1="0" y1="60" x2="800" y2="60"></line>
                                <line x1="0" y1="120" x2="800" y2="120"></line>
                                <line x1="0" y1="180" x2="800" y2="180"></line>
                            </g>
                            <template v-if="attendanceTrend.length">
                                <path
                                    :d="'M' + attendanceTrend.map((p, i) => {
                                        const x = (i / Math.max(attendanceTrend.length - 1, 1)) * 800
                                        const y = 220 - (p.registrations / maxTrend) * 200
                                        return `${x},${y}`
                                    }).join(' L') + ' L800,220 L0,220 Z'"
                                    fill="url(#regGrad)"
                                    stroke="rgba(79,70,229,0.8)"
                                    stroke-width="2"
                                ></path>
                                <path
                                    :d="'M' + attendanceTrend.map((p, i) => {
                                        const x = (i / Math.max(attendanceTrend.length - 1, 1)) * 800
                                        const y = 220 - (p.arrivals / maxTrend) * 200
                                        return `${x},${y}`
                                    }).join(' L') + ' L800,220 L0,220 Z'"
                                    fill="url(#arrGrad)"
                                    stroke="rgba(16,185,129,0.8)"
                                    stroke-width="2"
                                ></path>
                            </template>
                        </svg>
                        <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 px-1">
                            <span v-for="(p, i) in attendanceTrend" :key="i" v-show="i % Math.max(1, Math.floor(attendanceTrend.length/6)) === 0">
                                {{ p.date?.slice(5) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span>来源渠道TOP</span>
                </div>
                <div class="card-body">
                    <div v-if="!sourceChannelStats?.length" class="text-center py-12 text-gray-400">暂无数据</div>
                    <div v-else class="space-y-3">
                        <div v-for="(s, idx) in sourceChannelStats.slice(0, 8)" :key="idx" class="flex items-center gap-3">
                            <div class="w-6 text-xs font-bold text-gray-400">{{ idx + 1 }}</div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between text-sm mb-1">
                                    <span class="truncate text-gray-700">{{ s.channel }}</span>
                                    <span class="text-gray-500">{{ s.count }}</span>
                                </div>
                                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                        :style="{ width: (s.count / maxSource * 100) + '%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card">
                <div class="card-header">
                    <span>场次上座率</span>
                    <Link v-if="canManage" :href="route('admin.attendance-rate.index')" class="text-xs text-indigo-600 hover:underline">查看详情 →</Link>
                </div>
                <div class="card-body">
                    <div v-if="!sessionStats?.length" class="text-center py-8 text-gray-400">暂无场次数据</div>
                    <div v-else class="space-y-4">
                        <div v-for="s in sessionStats" :key="s.id" class="border border-gray-100 rounded-lg p-4 hover:border-indigo-100 transition">
                            <div class="flex items-center justify-between mb-3">
                                <div>
                                    <div class="font-medium text-gray-900">{{ s.name }}</div>
                                    <div class="text-xs text-gray-500 mt-0.5">{{ s.start_time }}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold text-emerald-600">{{ (s.arrival_rate * 100).toFixed(1) }}%</div>
                                    <div class="text-xs text-gray-500">上座率</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 text-xs text-gray-500">
                                <span><i class="fas fa-chair mr-1 text-rose-500"></i>座位{{ s.capacity }}</span>
                                <span><i class="fas fa-user-plus mr-1 text-indigo-500"></i>报名{{ s.registered }}</span>
                                <span><i class="fas fa-check-double mr-1 text-emerald-500"></i>实到{{ s.arrived }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span>最近报名</span>
                    <Link v-if="canOperateTicket" :href="route('ticket.registrations.index')" class="text-xs text-indigo-600 hover:underline">查看全部 →</Link>
                </div>
                <div class="overflow-hidden">
                    <div v-if="!recentRegistrations?.length" class="text-center py-8 text-gray-400">暂无报名数据</div>
                    <table v-else class="table">
                        <thead class="bg-gray-50/50">
                            <tr>
                                <th class="table-th w-1"></th>
                                <th class="table-th">报名信息</th>
                                <th class="table-th">阶段</th>
                                <th class="table-th">质量</th>
                                <th class="table-th w-1"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="r in recentRegistrations" :key="r.id" class="hover:bg-gray-50/50">
                                <td class="table-td px-4">
                                    <div
                                        class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                        :style="{ background: r.quality_color || '#94a3b8' }"
                                    >{{ r.name?.[0] || 'U' }}</div>
                                </td>
                                <td class="table-td">
                                    <Link :href="route('ticket.registrations.show', r.id)" class="font-medium text-gray-900 hover:text-indigo-600">{{ r.name }}</Link>
                                    <div class="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{{ r.company }} · {{ r.position }}</div>
                                    <div class="text-xs text-gray-400 mt-0.5">{{ r.registration_no }}</div>
                                </td>
                                <td class="table-td">
                                    <span :class="['badge', r.conversion_stage?.includes('paid') ? 'badge-success' : r.conversion_stage === 'lost' ? 'badge-danger' : r.conversion_stage === 'confirmed' ? 'badge-info' : 'badge-gray']">
                                        {{ r.conversion_stage }}
                                    </span>
                                    <div class="text-xs mt-1" :class="['text-gray-500', r.attendance_status === '已到场' && 'text-emerald-600']">{{ r.attendance_status }}</div>
                                </td>
                                <td class="table-td">
                                    <div v-if="r.total_score !== undefined" class="flex items-center gap-2">
                                        <span
                                            class="text-xs font-bold px-2 py-0.5 rounded"
                                            :style="{ background: r.quality_color + '20', color: r.quality_color }"
                                        >{{ r.quality_level }}</span>
                                        <span class="text-sm text-gray-600">{{ r.total_score }}</span>
                                    </div>
                                    <span v-else class="text-xs text-gray-400">未评分</span>
                                </td>
                                <td class="table-td text-right">
                                    <Link :href="route('ticket.registrations.show', r.id)" class="text-indigo-600 hover:text-indigo-700 text-xs">详情</Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>
