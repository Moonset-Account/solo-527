<script setup>
import { Link, router } from '@inertiajs/vue3'
import { computed } from 'vue'

const props = defineProps({
    filters: Object,
    registrations: Object,
    events: Array,
    conversion_stages: Object,
    registration_statuses: Object,
    attendance_statuses: Object,
    quality_levels: Object,
    canCreate: Boolean,
})

const filterForm = computed(() => ({
    event_id: props.filters?.event_id || '',
    keyword: props.filters?.keyword || '',
    conversion_stage: props.filters?.conversion_stage || '',
    registration_status: props.filters?.registration_status || '',
    attendance_status: props.filters?.attendance_status || '',
    quality_level: props.filters?.quality_level || '',
}))

const applyFilter = (field, value) => {
    const params = { ...props.filters, [field]: value, page: 1 }
    router.get(route('ticket.registrations.index'), params, { preserveState: true })
}

const clearFilters = () => {
    router.get(route('ticket.registrations.index'), { page: 1 }, { preserveState: true })
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">报名管理</h1>
                <p class="text-sm text-gray-500 mt-1">票务运营提交报名资料、审核与跟踪转化</p>
            </div>
            <div class="flex items-center gap-3">
                <Link v-if="canCreate" :href="route('ticket.registrations.create', filterForm.event_id ? { event_id: filterForm.event_id } : {})" class="btn-primary">
                    <i class="fas fa-plus mr-2"></i>录入报名
                </Link>
                <button @click="window.location.href = route('admin.export.index')" class="btn-secondary">
                    <i class="fas fa-file-export mr-2"></i>导出
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">活动</label>
                        <select v-model="filterForm.event_id" @change="applyFilter('event_id', $event.target.value)" class="select-field">
                            <option value="">全部活动</option>
                            <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                        </select>
                    </div>
                    <div class="xl:col-span-2">
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">关键词搜索</label>
                        <input
                            v-model="filterForm.keyword"
                            @keyup.enter="applyFilter('keyword', filterForm.keyword)"
                            placeholder="姓名 / 手机号 / 公司 / 报名号"
                            class="input-field"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">转化阶段</label>
                        <select v-model="filterForm.conversion_stage" @change="applyFilter('conversion_stage', $event.target.value)" class="select-field">
                            <option value="">全部阶段</option>
                            <option v-for="(label, key) in conversion_stages" :key="key" :value="key">{{ label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">审核状态</label>
                        <select v-model="filterForm.registration_status" @change="applyFilter('registration_status', $event.target.value)" class="select-field">
                            <option value="">全部状态</option>
                            <option v-for="(label, key) in registration_statuses" :key="key" :value="key">{{ label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1.5">质量等级</label>
                        <select v-model="filterForm.quality_level" @change="applyFilter('quality_level', $event.target.value)" class="select-field">
                            <option value="">全部等级</option>
                            <option v-for="(label, key) in quality_levels" :key="key" :value="key">{{ label }}</option>
                        </select>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div class="flex items-center gap-2 text-sm">
                        <button class="badge badge-success hover:bg-emerald-100 cursor-pointer" @click="applyFilter('conversion_stage', 'paid')">
                            已支付 <i class="fas fa-filter ml-1 text-[10px]"></i>
                        </button>
                        <button class="badge badge-warning hover:bg-amber-100 cursor-pointer" @click="applyFilter('registration_status', 'pending')">
                            待审核 <i class="fas fa-filter ml-1 text-[10px]"></i>
                        </button>
                        <button class="badge badge-danger hover:bg-red-100 cursor-pointer" @click="applyFilter('attendance_status', 'no_show')">
                            爽约 <i class="fas fa-filter ml-1 text-[10px]"></i>
                        </button>
                        <button @click="clearFilters" class="text-xs text-gray-500 hover:text-gray-700 ml-2">
                            <i class="fas fa-times-circle mr-1"></i>清除筛选
                        </button>
                    </div>
                    <div class="text-sm text-gray-500">
                        共 <span class="font-semibold text-gray-900">{{ registrations.total }}</span> 条记录
                    </div>
                </div>
            </div>
        </div>

        <div class="card overflow-hidden">
            <div v-if="!registrations.data?.length" class="py-24 text-center text-gray-400">
                <i class="fas fa-users text-5xl mb-4 opacity-30"></i>
                <div class="text-lg mb-1">暂无报名数据</div>
                <div class="text-sm">点击右上角"录入报名"开始提交资料</div>
            </div>
            <table v-else class="table">
                <thead>
                    <tr>
                        <th class="table-th w-1"></th>
                        <th class="table-th">报名信息</th>
                        <th class="table-th">来源</th>
                        <th class="table-th">转化阶段</th>
                        <th class="table-th">审核状态</th>
                        <th class="table-th">到场</th>
                        <th class="table-th">质量等级</th>
                        <th class="table-th">跟进/录入</th>
                        <th class="table-th w-1"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="r in registrations.data" :key="r.id" class="hover:bg-gray-50/70">
                        <td class="table-td pl-6">
                            <Link :href="route('ticket.registrations.show', r.id)">
                                <div
                                    class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                    :style="{ background: r.quality_color || '#64748b' }"
                                >{{ r.name?.[0] || 'U' }}</div>
                            </Link>
                        </td>
                        <td class="table-td">
                            <Link :href="route('ticket.registrations.show', r.id)" class="font-medium text-gray-900 hover:text-indigo-600">
                                {{ r.name }}
                            </Link>
                            <div class="text-xs text-gray-500 mt-0.5">
                                <i class="fas fa-mobile-screen-button mr-1"></i>{{ r.phone }}
                            </div>
                            <div class="text-xs text-gray-500 truncate max-w-[220px] mt-0.5" :title="r.company">
                                {{ r.company }} <span v-if="r.position">· {{ r.position }}</span>
                            </div>
                            <div class="text-xs text-gray-400 mt-0.5 font-mono">{{ r.registration_no }}</div>
                        </td>
                        <td class="table-td text-sm">
                            <span v-if="r.source_channel" class="badge badge-info">{{ r.source_channel }}</span>
                            <span v-else class="text-gray-400">-</span>
                            <div class="text-xs text-gray-400 mt-1">{{ r.created_at?.slice(5, 16) }}</div>
                        </td>
                        <td class="table-td">
                            <span :class="[
                                'badge',
                                r.conversion_stage === 'paid' || r.conversion_stage === 'ticket_sent' ? 'badge-success' :
                                r.conversion_stage === 'confirmed' ? 'badge-info' :
                                r.conversion_stage === 'lost' ? 'badge-danger' :
                                r.conversion_stage === 'inquiry' ? 'badge-gray' : 'badge-warning'
                            ]">{{ r.conversion_stage_text }}</span>
                            <div v-if="r.paid_amount > 0" class="text-xs text-emerald-600 font-semibold mt-1">
                                ¥{{ Number(r.paid_amount).toLocaleString() }}
                            </div>
                        </td>
                        <td class="table-td">
                            <span :class="[
                                'badge',
                                r.registration_status === 'approved' ? 'badge-success' :
                                r.registration_status === 'pending' ? 'badge-warning' :
                                r.registration_status === 'rejected' ? 'badge-danger' :
                                r.registration_status === 'refunded' ? 'badge-gray' : 'badge-info'
                            ]">{{ r.registration_status_text }}</span>
                        </td>
                        <td class="table-td">
                            <span :class="[
                                'badge',
                                r.attendance_status === 'arrived' ? 'badge-success' :
                                r.attendance_status === 'partial' ? 'badge-warning' :
                                r.attendance_status === 'no_show' ? 'badge-danger' : 'badge-gray'
                            ]">{{ r.attendance_status_text }}</span>
                        </td>
                        <td class="table-td">
                            <div v-if="r.total_score !== undefined && r.total_score !== null" class="flex items-center gap-2">
                                <span
                                    class="text-xs font-bold px-2 py-0.5 rounded"
                                    :style="{ background: (r.quality_color || '#64748b') + '25', color: r.quality_color || '#64748b' }"
                                >{{ r.quality_level }}</span>
                                <span class="text-sm font-semibold text-gray-700">{{ r.total_score }}</span>
                            </div>
                            <span v-else class="text-xs text-gray-400">未评</span>
                        </td>
                        <td class="table-td text-xs">
                            <div v-if="r.owner_name" class="text-indigo-600">{{ r.owner_name }}</div>
                            <div class="text-gray-500">录入：{{ r.creator_name }}</div>
                        </td>
                        <td class="table-td pr-6 text-right">
                            <Link
                                :href="route('ticket.registrations.show', r.id)"
                                class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                            >
                                详情 <i class="fas fa-angle-right"></i>
                            </Link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="registrations.links?.length" class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
                第 {{ registrations.current_page }} / {{ registrations.last_page }} 页
            </div>
            <div class="flex items-center gap-1">
                <template v-for="link in registrations.links" :key="link.label">
                    <Link
                        v-if="link.url"
                        :href="link.url"
                        :class="[
                            'min-w-[36px] h-9 px-3 inline-flex items-center justify-center rounded-md text-sm border border-gray-200 transition',
                            link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'
                        ]"
                        v-html="link.label"
                    ></Link>
                    <span v-else class="min-w-[36px] h-9 px-3 inline-flex items-center justify-center rounded-md text-sm text-gray-400" v-html="link.label"></span>
                </template>
            </div>
        </div>
    </div>
</template>
