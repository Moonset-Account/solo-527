<script setup>
import { Link, useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'

const props = defineProps({
    registration: Object,
    conversion_stages: Object,
    registration_statuses: Object,
    attendance_statuses: Object,
    can_edit: Boolean,
})

const showEditStatus = ref(false)
const statusForm = useForm({
    conversion_stage: props.registration.conversion_stage,
    registration_status: props.registration.registration_status,
    attendance_status: props.registration.attendance_status,
    paid_amount: props.registration.paid_amount,
    remark: '',
})

const fmtAmount = (n) => `¥${Number(n || 0).toLocaleString()}`

const saveStatus = () => {
    statusForm.put(route('ticket.registrations.update', props.registration.id), {
        onSuccess: () => { showEditStatus.value = false; location.reload() },
    })
}

const hasDuplicate = computed(() => props.registration.duplicate_records?.some(d => d.status !== 'closed' && !d.status?.startsWith('resolved_')))
</script>

<template>
    <div class="max-w-6xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-gray-900">{{ registration.name }}</h1>
                    <span class="badge badge-info">{{ registration.registration_no }}</span>
                    <span
                        v-if="registration.quality_score"
                        class="text-xs font-bold px-2 py-1 rounded"
                        :style="{ background: (registration.quality_score.level_color || '#64748b') + '25', color: registration.quality_score.level_color || '#64748b' }"
                    >{{ registration.quality_score.quality_level }} · {{ registration.quality_score.total_score }}分</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ registration.company }} · {{ registration.position }} · 所属活动：{{ registration.event_name }}</p>
            </div>
            <div class="flex items-center gap-3">
                <Link :href="route('ticket.registrations.index')" class="btn-secondary">
                    <i class="fas fa-arrow-left mr-2"></i>返回列表
                </Link>
                <Link v-if="can_edit" :href="route('ticket.registrations.edit', registration.id)" class="btn-primary">
                    <i class="fas fa-edit mr-2"></i>编辑资料
                </Link>
            </div>
        </div>

        <div v-if="hasDuplicate" class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <i class="fas fa-triangle-exclamation"></i>
                </div>
                <div class="flex-1">
                    <div class="font-semibold text-amber-800">存在重复报名/占座记录</div>
                    <div class="text-sm text-amber-600 mt-1">请及时处理避免影响统计准确性</div>
                </div>
                <Link :href="route('admin.duplicate-seats.index', { event_id: registration.event_id })" class="btn-secondary btn-sm">
                    查看待办
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div class="lg:col-span-3 space-y-6">
                <div class="card">
                    <div class="card-header flex items-center justify-between">
                        <span><i class="fas fa-circle-info mr-2 text-indigo-500"></i>个人与公司信息</span>
                        <span class="text-xs text-gray-500">录入：{{ registration.creator_name }} · {{ registration.created_at }}</span>
                    </div>
                    <div class="card-body grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                        <template v-for="[label, value, icon] in [
                            ['姓名', registration.name, 'fa-user'],
                            ['性别', registration.gender || '-', 'fa-venus-mars'],
                            ['手机号', registration.phone ? registration.phone : '-', 'fa-mobile-screen-button'],
                            ['邮箱', registration.email || '-', 'fa-envelope'],
                            ['微信号', registration.wechat || '-', 'fa-comment'],
                            ['身份证', registration.id_card || '-', 'fa-id-card'],
                            ['公司', registration.company || '-', 'fa-building'],
                            ['行业', registration.industry || '-', 'fa-industry'],
                            ['部门', registration.department || '-', 'fa-sitemap'],
                            ['职位', registration.position || '-', 'fa-user-tie'],
                            ['工号', registration.employee_no || '-', 'fa-id-badge'],
                            ['归属', registration.owner_name || '未分配', 'fa-user-shield'],
                        ]" :key="label">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 text-xs flex-shrink-0 mt-0.5">
                                    <i :class="['fas', icon]"></i>
                                </div>
                                <div class="min-w-0">
                                    <div class="text-xs text-gray-500 mb-0.5">{{ label }}</div>
                                    <div class="text-sm font-medium text-gray-900 truncate" :title="value">{{ value }}</div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span><i class="fas fa-repeat mr-2 text-emerald-500"></i>转化与审核</span>
                        <button v-if="can_edit" @click="showEditStatus = !showEditStatus" class="text-xs text-indigo-600 hover:underline">
                            <i class="fas fa-pen mr-1"></i>修改状态
                        </button>
                    </div>
                    <div v-if="showEditStatus" class="card-body border-b border-gray-100 bg-gray-50/50">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1.5">转化阶段</label>
                                <select v-model="statusForm.conversion_stage" class="select-field">
                                    <option v-for="(label, key) in conversion_stages" :key="key" :value="key">{{ label }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1.5">审核状态</label>
                                <select v-model="statusForm.registration_status" class="select-field">
                                    <option v-for="(label, key) in registration_statuses" :key="key" :value="key">{{ label }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1.5">到场状态</label>
                                <select v-model="statusForm.attendance_status" class="select-field">
                                    <option v-for="(label, key) in attendance_statuses" :key="key" :value="key">{{ label }}</option>
                                </select>
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-xs font-medium text-gray-500 mb-1.5">实付金额（元）</label>
                                <input v-model.number="statusForm.paid_amount" type="number" step="0.01" class="input-field" />
                            </div>
                            <div class="md:col-span-3 flex items-center justify-end gap-3 pt-2">
                                <button @click="showEditStatus = false" class="btn-secondary">取消</button>
                                <button @click="saveStatus" :disabled="statusForm.processing" class="btn-primary">
                                    <i v-if="statusForm.processing" class="fas fa-spinner fa-spin mr-2"></i>
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <div class="text-xs text-gray-500 mb-1">转化阶段</div>
                            <div :class="['badge', registration.conversion_stage.includes('paid') || registration.conversion_stage === 'ticket_sent' ? 'badge-success' : registration.conversion_stage === 'lost' ? 'badge-danger' : 'badge-warning']">
                                {{ registration.conversion_stage_text }}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500 mb-1">审核状态</div>
                            <div :class="['badge', registration.registration_status === 'approved' ? 'badge-success' : registration.registration_status === 'pending' ? 'badge-warning' : registration.registration_status === 'rejected' ? 'badge-danger' : 'badge-gray']">
                                {{ registration.registration_status_text }}
                            </div>
                            <div v-if="registration.approved_at" class="text-[10px] text-gray-400 mt-1">{{ registration.approver_name }} 于 {{ registration.approved_at }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500 mb-1">到场状态</div>
                            <div :class="['badge', registration.attendance_status === 'arrived' ? 'badge-success' : registration.attendance_status === 'no_show' ? 'badge-danger' : 'badge-gray']">
                                {{ registration.attendance_status_text }}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500 mb-1">支付信息</div>
                            <div class="font-bold text-emerald-600">{{ fmtAmount(registration.paid_amount) }}</div>
                            <div v-if="registration.paid_at" class="text-[10px] text-gray-400 mt-1">支付于 {{ registration.paid_at }}</div>
                        </div>
                        <div class="col-span-2">
                            <div class="text-xs text-gray-500 mb-1">来源渠道</div>
                            <div class="text-sm text-gray-900">{{ registration.source_channel || '未指定' }}
                                <span v-if="registration.source_detail" class="text-gray-500 ml-2">（{{ registration.source_detail }}）</span>
                            </div>
                        </div>
                        <div class="col-span-2">
                            <div class="text-xs text-gray-500 mb-1">票种</div>
                            <div class="text-sm text-gray-900">{{ registration.ticket_type_name || '未指定' }}</div>
                        </div>
                    </div>
                </div>

                <div v-if="registration.sessions?.length || registration.seat_no" class="card">
                    <div class="card-header"><span><i class="fas fa-calendar-day mr-2 text-violet-500"></i>场次与座位</span></div>
                    <div class="card-body divide-y divide-gray-100">
                        <div v-for="s in registration.sessions" :key="s.id" class="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500">
                                    <i class="fas fa-map-location-dot"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">{{ s.session_name }}</div>
                                    <div class="text-xs text-gray-500" :class="['mt-0.5', s.attendance_status === 'arrived' && 'text-emerald-600']">
                                        <span v-if="s.seat_no"><i class="fas fa-chair mr-1"></i>{{ s.seat_no }} · </span>
                                        <span v-if="s.checked_in_at">签到于 {{ s.checked_in_at }}</span>
                                        <span v-else>{{ s.attendance_status || '未签到' }}</span>
                                    </div>
                                </div>
                            </div>
                            <span :class="['badge', s.attendance_status === 'arrived' ? 'badge-success' : 'badge-gray']">
                                {{ s.attendance_status || '未签到' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="registration.remark || registration.dietary_requirement" class="card">
                    <div class="card-header"><span><i class="fas fa-note-sticky mr-2 text-amber-500"></i>备注与需求</span></div>
                    <div class="card-body space-y-3">
                        <div v-if="registration.dietary_requirement">
                            <div class="text-xs text-gray-500 mb-1">饮食要求</div>
                            <div class="text-sm text-gray-900">{{ registration.dietary_requirement }}</div>
                        </div>
                        <div v-if="registration.remark">
                            <div class="text-xs text-gray-500 mb-1">备注</div>
                            <div class="text-sm text-gray-900 whitespace-pre-wrap">{{ registration.remark }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div v-if="registration.quality_score" class="card">
                    <div class="card-header"><span><i class="fas fa-gem mr-2 text-amber-500"></i>质量评分</span></div>
                    <div class="card-body">
                        <div class="text-center mb-5">
                            <div
                                class="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white"
                                :style="{ background: `linear-gradient(135deg, ${registration.quality_score.level_color}, #64748b)` }"
                            >{{ registration.quality_score.total_score }}</div>
                            <div class="mt-2 text-sm font-semibold" :style="{ color: registration.quality_score.level_color }">{{ registration.quality_score.quality_level }}</div>
                        </div>
                        <div class="space-y-3 text-xs">
                            <div v-for="[label, score, icon, color] in [
                                ['信息完整', registration.quality_score.information_completeness, 'fa-file-lines', 'indigo'],
                                ['职位级别', registration.quality_score.position_level_score, 'fa-user-tie', 'violet'],
                                ['公司质量', registration.quality_score.company_quality_score, 'fa-building', 'sky'],
                                ['行业匹配', registration.quality_score.industry_match_score, 'fa-industry', 'emerald'],
                                ['历史行为', registration.quality_score.history_score, 'fa-clock-rotate-left', 'amber'],
                            ]" :key="label">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-gray-600 flex items-center gap-1"><i :class="['fas', icon, `text-${color}-500`]"></i>{{ label }}</span>
                                    <span class="font-semibold text-gray-900">{{ score }}</span>
                                </div>
                                <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div :class="[`h-full bg-${color}-500 rounded-full`]" :style="{ width: score + '%' }"></div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs">
                            <span :class="['badge', registration.quality_score.is_key_customer ? 'badge-warning' : 'badge-gray']">
                                {{ registration.quality_score.is_key_customer ? '重点客户' : '普通客户' }}
                            </span>
                            <span :class="['badge', registration.quality_score.is_vip ? 'badge-danger' : 'badge-gray']">
                                {{ registration.quality_score.is_vip ? 'VIP客户' : '非VIP' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="registration.duplicate_records?.length" class="card">
                    <div class="card-header"><span><i class="fas fa-triangle-exclamation mr-2 text-amber-500"></i>重复记录</span></div>
                    <div class="card-body space-y-3">
                        <div v-for="d in registration.duplicate_records" :key="d.id" class="text-xs border border-amber-100 rounded-lg p-3 bg-amber-50/50">
                            <div class="flex items-center justify-between mb-1">
                                <span :class="['badge', d.status.startsWith('resolved') || d.status === 'closed' ? 'badge-success' : 'badge-warning']">{{ d.status_text }}</span>
                                <span class="text-gray-500">{{ d.created_at }}</span>
                            </div>
                            <div class="text-gray-700">{{ d.conflict_reason }}</div>
                        </div>
                    </div>
                </div>

                <div v-if="registration.refund_requests?.length" class="card">
                    <div class="card-header"><span><i class="fas fa-money-bill-transfer mr-2 text-sky-500"></i>退款申请</span></div>
                    <div class="card-body divide-y divide-gray-100">
                        <Link v-for="r in registration.refund_requests" :key="r.id" :href="route('admin.config.refunds.index', { event_id: registration.event_id })" class="block py-3 first:pt-0 last:pb-0 hover:bg-gray-50/50">
                            <div class="flex items-center justify-between text-xs">
                                <div>
                                    <div class="font-mono text-gray-500">{{ r.refund_no }}</div>
                                    <div class="font-medium text-gray-900 mt-0.5">¥{{ Number(r.requested_amount).toLocaleString() }}</div>
                                </div>
                                <span :class="['badge', r.status === 'completed' ? 'badge-success' : r.status === 'pending' || r.status === 'approved' || r.status === 'processing' ? 'badge-warning' : 'badge-gray']">
                                    {{ r.status_text }}
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>

                <div v-if="registration.feedbacks?.length" class="card">
                    <div class="card-header"><span><i class="fas fa-comments mr-2 text-emerald-500"></i>到场反馈</span></div>
                    <div class="card-body divide-y divide-gray-100">
                        <div v-for="f in registration.feedbacks" :key="f.id" class="py-3 first:pt-0 last:pb-0">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-500">{{ f.created_at }}</span>
                                <div class="flex items-center gap-1 text-amber-500">
                                    <i v-for="n in Math.round(f.average_rating)" :key="n" class="fas fa-star"></i>
                                    <i v-for="n in (5 - Math.round(f.average_rating))" :key="'e'+n" class="far fa-star text-gray-300"></i>
                                    <span class="ml-1 text-gray-900 font-semibold">{{ f.average_rating }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
