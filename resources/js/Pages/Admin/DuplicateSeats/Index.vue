<script setup>
import { Link, useForm, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'

const props = defineProps({
    events: Array,
    selectedEvent: Object,
    filters: Object,
    records: Object,
    users: Array,
    stats: Object,
    statuses: Object,
    conflict_types: Object,
})

const selectedEventId = ref(props.selectedEvent?.id || props.events?.[0]?.id)
const switchEvent = (eid) => {
    selectedEventId.value = eid
    router.get(route('admin.duplicate-seats.index'), { ...props.filters, event_id: eid }, { preserveState: true })
}

const resolveForm = useForm({
    action: '',
    resolution_note: '',
    final_registration_id: null,
    assigned_to: null,
    cancel_other: true,
})

const activeRecord = ref(null)
const openResolve = (record) => {
    activeRecord.value = record
    resolveForm.reset()
    resolveForm.final_registration_id = record.conflict_registration_ids?.[0]
}

const submitResolve = () => {
    if (!activeRecord.value) return
    resolveForm.post(route('admin.duplicate-seats.resolve', activeRecord.value.id), {
        onSuccess: () => { activeRecord.value = null },
    })
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">重复占座待办</h1>
                <p class="text-sm text-gray-500 mt-1">系统自动检测冲突并生成待办，处理完成保留最终有效数据</p>
            </div>
            <div class="flex items-center gap-3">
                <Link :href="route('admin.attendance-rate.index', selectedEventId ? { event_id: selectedEventId } : {})" class="btn-secondary">
                    <i class="fas fa-chair mr-2"></i>查看上座率
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div class="stat-card !p-4">
                <div class="stat-label">冲突总数</div>
                <div class="stat-value text-2xl">{{ stats.total }}</div>
            </div>
            <div class="stat-card !p-4 bg-gradient-to-br from-amber-50 border-amber-200">
                <div class="stat-label text-amber-600">待处理</div>
                <div class="stat-value text-2xl text-amber-700">{{ stats.pending }}</div>
            </div>
            <div class="stat-card !p-4 bg-gradient-to-br from-sky-50 border-sky-200">
                <div class="stat-label text-sky-600">处理中</div>
                <div class="stat-value text-2xl text-sky-700">{{ stats.processing }}</div>
            </div>
            <div class="stat-card !p-4 bg-gradient-to-br from-emerald-50 border-emerald-200">
                <div class="stat-label text-emerald-600">已解决</div>
                <div class="stat-value text-2xl text-emerald-700">{{ stats.resolved }}</div>
            </div>
            <div class="stat-card !p-4">
                <div class="stat-label">手机号重复</div>
                <div class="stat-value text-2xl text-indigo-600">{{ stats.phone_conflicts }}</div>
            </div>
            <div class="stat-card !p-4">
                <div class="stat-label">人员重复</div>
                <div class="stat-value text-2xl text-violet-600">{{ stats.person_conflicts }}</div>
            </div>
            <div class="stat-card !p-4">
                <div class="stat-label">座位冲突</div>
                <div class="stat-value text-2xl text-rose-600">{{ stats.seat_conflicts }}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">活动</label>
                        <select :value="selectedEventId" @change="switchEvent($event.target.value)" class="select-field">
                            <option value="">全部</option>
                            <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">处理状态</label>
                        <select v-model="filters.status" @change="router.get(route('admin.duplicate-seats.index'), { ...filters, status: $event.target.value })" class="select-field">
                            <option value="pending">待处理/处理中</option>
                            <option value="resolved">已解决/关闭</option>
                            <option value="">全部状态</option>
                            <option v-for="(label, key) in statuses" :key="key" :value="key">{{ label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">冲突类型</label>
                        <select v-model="filters.conflict_type" @change="router.get(route('admin.duplicate-seats.index'), { ...filters, conflict_type: $event.target.value })" class="select-field">
                            <option value="">全部类型</option>
                            <option v-for="(label, key) in conflict_types" :key="key" :value="key">{{ label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">指派处理人</label>
                        <select v-model="filters.assigned_to" @change="router.get(route('admin.duplicate-seats.index'), { ...filters, assigned_to: $event.target.value })" class="select-field">
                            <option value="">全部</option>
                            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} · {{ u.department || '-' }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div v-if="!records.data?.length" class="card py-20 text-center text-gray-400">
                <i class="fas fa-check-double text-6xl mb-4 text-emerald-200"></i>
                <div class="text-lg mb-1">暂无待办</div>
                <div class="text-sm">所有冲突已处理完成</div>
            </div>

            <div v-for="rec in records.data" :key="rec.id" class="card overflow-hidden">
                <div class="border-l-4 bg-white" :class="[
                    rec.status === 'pending' ? 'border-amber-400' : rec.status === 'processing' ? 'border-sky-400' : 'border-emerald-400'
                ]">
                    <div class="flex items-start justify-between p-5 gap-6">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap mb-2">
                                <span :class="[
                                    'badge',
                                    rec.conflict_type === 'phone' ? 'badge-info' :
                                    rec.conflict_type === 'person' ? 'badge-warning' :
                                    rec.conflict_type === 'seat' ? 'badge-danger' : 'badge-gray'
                                ]">
                                    <i class="fas fa-circle-exclamation mr-1"></i>{{ rec.conflict_type_text }}
                                </span>
                                <span :class="[
                                    'badge',
                                    rec.is_pending ? 'badge-warning' : rec.is_processing ? 'badge-info' : 'badge-success'
                                ]">
                                    {{ rec.status_text }}
                                </span>
                                <span v-if="rec.assignee_name" class="badge badge-gray">
                                    <i class="fas fa-user-check mr-1"></i>{{ rec.assignee_name }}
                                </span>
                                <span v-if="rec.phone" class="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{{ rec.phone }}</span>
                                <span v-if="rec.company" class="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{{ rec.company }}</span>
                                <span v-if="rec.seat_display" class="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                    <i class="fas fa-chair mr-1"></i>{{ rec.seat_display }}
                                </span>
                            </div>
                            <div class="text-sm text-gray-700 mb-1">{{ rec.conflict_reason }}</div>
                            <div class="flex items-center gap-4 text-xs text-gray-500">
                                <span><i class="fas fa-folder-tree mr-1"></i>冲突 {{ rec.conflict_count }} 条报名</span>
                                <span v-if="rec.event_name">{{ rec.event_name }}</span>
                                <span>{{ rec.created_at?.slice(5, 16) }}</span>
                                <span v-if="rec.is_resolved && rec.resolver_name">
                                    <i class="fas fa-user-check mr-1"></i>{{ rec.resolver_name }} 处理于 {{ rec.resolved_at?.slice(5, 16) }}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <button
                                v-if="!rec.is_resolved"
                                @click="openResolve(rec)"
                                class="btn-primary !py-1.5 !px-3 text-xs"
                            >
                                <i class="fas fa-wrench mr-1"></i>处理
                            </button>
                            <Link
                                :href="rec.final_registration_id ? route('ticket.registrations.show', rec.final_registration_id) : '#'"
                                v-if="rec.is_resolved && rec.final_registration_id"
                                class="btn-secondary !py-1.5 !px-3 text-xs"
                            >
                                查看保留
                            </Link>
                        </div>
                    </div>

                    <div class="bg-gray-50/60 border-t border-gray-100 px-5 py-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div
                                v-for="cr in rec.conflict_registrations"
                                :key="cr.id"
                                class="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition"
                                :class="{
                                    'ring-2 ring-emerald-500 border-emerald-500': rec.is_resolved && rec.final_registration_id === cr.id,
                                    'opacity-60': rec.is_resolved && rec.final_registration_id && rec.final_registration_id !== cr.id,
                                }"
                            >
                                <div class="flex items-start justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                            {{ cr.name?.[0] }}
                                        </div>
                                        <div>
                                            <div class="text-sm font-semibold text-gray-900">{{ cr.name }}</div>
                                            <div class="text-[10px] font-mono text-gray-500">{{ cr.registration_no }}</div>
                                        </div>
                                    </div>
                                    <span v-if="rec.is_resolved && rec.final_registration_id === cr.id" class="badge badge-success !text-[10px]">
                                        已保留
                                    </span>
                                    <Link
                                        :href="route('ticket.registrations.show', cr.id)"
                                        target="_blank"
                                        class="text-xs text-indigo-600 hover:underline"
                                    >详情</Link>
                                </div>
                                <div class="text-xs text-gray-600 truncate">{{ cr.company }} · {{ cr.position || '-' }}</div>
                                <div class="text-xs text-gray-500 mt-1">
                                    <span class="font-mono">{{ cr.phone }}</span>
                                </div>
                                <div class="flex items-center gap-2 mt-2 text-[11px]">
                                    <span :class="['badge !text-[10px] !px-1.5', cr.conversion_stage.includes('paid') ? 'badge-success' : 'badge-info']">{{ cr.conversion_stage }}</span>
                                    <span class="text-gray-500">{{ cr.created_at?.slice(5, 16) }}</span>
                                    <span v-if="cr.paid_amount > 0" class="text-emerald-600 font-semibold">¥{{ Number(cr.paid_amount).toLocaleString() }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="rec.resolution_note" class="mt-3 pt-3 border-t border-gray-200 text-xs">
                            <span class="text-gray-500">处理备注：</span>
                            <span class="text-gray-800">{{ rec.resolution_note }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="records.links?.length" class="flex items-center justify-between">
            <div class="text-sm text-gray-500">第 {{ records.current_page }} / {{ records.last_page }} 页</div>
            <div class="flex items-center gap-1">
                <template v-for="link in records.links" :key="link.label">
                    <Link v-if="link.url" :href="link.url"
                        :class="[
                            'min-w-[36px] h-9 px-3 inline-flex items-center justify-center rounded-md text-sm border border-gray-200',
                            link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'
                        ]" v-html="link.label"></Link>
                </template>
            </div>
        </div>

        <div v-if="activeRecord" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="activeRecord = null">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                    <div>
                        <div class="text-lg font-bold text-gray-900">处理冲突待办</div>
                        <div class="text-xs text-gray-500 mt-0.5">{{ activeRecord.conflict_reason }}</div>
                    </div>
                    <button @click="activeRecord = null" class="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="p-6 space-y-6">
                    <div>
                        <div class="text-sm font-medium text-gray-700 mb-3">快捷操作</div>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <button @click="resolveForm.action = 'processing'; submitResolve()" class="btn-secondary justify-center">
                                <i class="fas fa-play mr-2 text-sky-500"></i>标记处理中
                            </button>
                            <button @click="resolveForm.action = 'resolved_cancel_all'; submitResolve()" class="btn-danger justify-center !bg-red-50 !text-red-700 !border-red-200 hover:!bg-red-100">
                                <i class="fas fa-ban mr-2"></i>全部取消
                            </button>
                            <button @click="resolveForm.action = 'close'; submitResolve()" class="btn-secondary justify-center text-gray-600">
                                <i class="fas fa-xmark mr-2"></i>关闭待办
                            </button>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-100">
                        <div class="text-sm font-medium text-gray-700 mb-3">指派处理人（可选）</div>
                        <select v-model="resolveForm.assigned_to" class="select-field">
                            <option :value="null">不指派</option>
                            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} · {{ u.department || '未分配部门' }}</option>
                        </select>
                        <button
                            v-if="resolveForm.assigned_to"
                            @click="resolveForm.action = 'assign'; submitResolve()"
                            class="btn-primary mt-3"
                        >
                            <i class="fas fa-user-plus mr-2"></i>立即指派
                        </button>
                    </div>

                    <div class="pt-4 border-t border-gray-100">
                        <div class="text-sm font-medium text-gray-700 mb-3">选择保留的报名（冲突合并）</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <label
                                v-for="cr in activeRecord.conflict_registrations"
                                :key="cr.id"
                                :class="[
                                    'block p-3 rounded-lg border-2 cursor-pointer transition',
                                    resolveForm.final_registration_id == cr.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                                ]"
                            >
                                <div class="flex items-start gap-3">
                                    <input type="radio" :value="cr.id" v-model="resolveForm.final_registration_id" class="mt-1">
                                    <div class="flex-1 min-w-0">
                                        <div class="font-semibold text-gray-900">{{ cr.name }}</div>
                                        <div class="text-xs text-gray-500">{{ cr.company }} · {{ cr.position || '-' }}</div>
                                        <div class="text-xs font-mono text-gray-400 mt-0.5">{{ cr.registration_no }}</div>
                                        <div class="flex items-center gap-2 mt-2 text-[11px]">
                                            <span class="badge !text-[10px]">{{ cr.conversion_stage }}</span>
                                            <span v-if="cr.paid_amount > 0" class="text-emerald-600 font-semibold">¥{{ Number(cr.paid_amount).toLocaleString() }}</span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                        <div class="flex items-center gap-3 mb-4">
                            <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" v-model="resolveForm.cancel_other" class="rounded border-gray-300 text-indigo-600">
                                同时取消（失效）其他冲突的报名
                            </label>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <button @click="resolveForm.action = 'resolved_keep_first'; submitResolve()" class="btn-secondary justify-center text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                <i class="fas fa-hourglass-start mr-1"></i>保留最早
                            </button>
                            <button @click="resolveForm.action = 'resolved_keep_last'; submitResolve()" class="btn-secondary justify-center text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                <i class="fas fa-hourglass-end mr-1"></i>保留最晚
                            </button>
                            <button
                                :disabled="!resolveForm.final_registration_id"
                                @click="resolveForm.action = 'resolved_merge'; submitResolve()"
                                class="btn-primary justify-center"
                            >
                                <i class="fas fa-code-merge mr-1"></i>确认保留选中
                            </button>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-100">
                        <div class="text-sm font-medium text-gray-700 mb-2">处理备注（建议填写）</div>
                        <textarea v-model="resolveForm.resolution_note" rows="3" placeholder="说明处理原因和细节..." class="input-field resize-none"></textarea>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
