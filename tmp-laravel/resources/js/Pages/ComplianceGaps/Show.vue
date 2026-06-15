<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('compliance-gaps.index')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ gap.gap_no }}</h1>
                    <p class="text-sm text-gray-500">{{ gap.title }}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <StatusBadge :status="gap.status" type="gap" />
                <SeverityBadge :severity="gap.severity" />
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">基本信息</h3>
                        <button @click="showEdit = true" class="text-sm text-indigo-600 hover:text-indigo-800">
                            编辑
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">缺口编号：</span>
                            <span class="font-medium">{{ gap.gap_no }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">状态：</span>
                            <StatusBadge :status="gap.status" type="gap" />
                        </div>
                        <div>
                            <span class="text-gray-500">严重程度：</span>
                            <SeverityBadge :severity="gap.severity" />
                        </div>
                        <div>
                            <span class="text-gray-500">分类：</span>
                            <span class="font-medium">{{ gap.category || '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">责任人：</span>
                            <span class="font-medium">{{ gap.responsible_user?.name || '未指派' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">创建人：</span>
                            <span class="font-medium">{{ gap.created_by?.name || '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">发现日期：</span>
                            <span class="font-medium">{{ gap.discovered_date }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">整改期限：</span>
                            <span class="font-medium" :class="{ 'text-red-600': isOverdue }">
                                {{ gap.due_date || '-' }}
                                <span v-if="isOverdue" class="text-xs">(逾期 {{ daysOverdue }} 天)</span>
                            </span>
                        </div>
                        <div v-if="gap.closed_date">
                            <span class="text-gray-500">关闭日期：</span>
                            <span class="font-medium">{{ gap.closed_date }}</span>
                        </div>
                        <div v-if="gap.closed_by">
                            <span class="text-gray-500">关闭人：</span>
                            <span class="font-medium">{{ gap.closed_by?.name }}</span>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">问题描述</h4>
                        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ gap.description || '暂无描述' }}</p>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">根本原因</h4>
                        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ gap.root_cause || '暂无' }}</p>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">整改措施</h4>
                        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ gap.corrective_action || '暂无' }}</p>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">预防措施</h4>
                        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ gap.preventive_action || '暂无' }}</p>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">状态流转</h3>
                        <div class="flex items-center space-x-2">
                            <select
                                v-model="newStatus"
                                class="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">选择目标状态</option>
                                <option v-for="(label, value) in statuses" :key="value" :value="value">
                                    {{ label }}
                                </option>
                            </select>
                            <button
                                @click="updateStatus"
                                :disabled="!newStatus"
                                class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                更新状态
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2 mb-4">
                        <div class="flex-1 h-2 bg-gray-200 rounded-full relative">
                            <div
                                class="absolute top-0 left-0 h-2 bg-green-500 rounded-full"
                                :style="{ width: statusProgress + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">处理过程记录</h3>
                    <div class="space-y-4">
                        <div v-for="log in gap.handling_logs" :key="log.id" class="flex items-start space-x-3">
                            <div class="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span class="text-indigo-600 font-medium text-sm">{{ log.user?.name?.charAt(0) }}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <p class="text-sm">
                                        <span class="font-medium text-gray-900">{{ log.user?.name }}</span>
                                        <span class="text-gray-500">执行了</span>
                                        <span class="font-medium text-indigo-600">{{ getActionLabel(log.action_type) }}</span>
                                    </p>
                                    <span class="text-xs text-gray-500">{{ formatDateTime(log.created_at) }}</span>
                                </div>
                                <p v-if="log.comment" class="text-sm text-gray-600 mt-1">{{ log.comment }}</p>
                                <div v-if="log.old_value || log.new_value" class="mt-1 text-xs text-gray-500">
                                    <span v-if="log.old_value">原值: {{ log.old_value }}</span>
                                    <span v-if="log.old_value && log.new_value"> → </span>
                                    <span v-if="log.new_value">新值: {{ log.new_value }}</span>
                                </div>
                            </div>
                        </div>
                        <p v-if="!gap.handling_logs?.length" class="text-sm text-gray-500 text-center py-4">
                            暂无处理记录
                        </p>
                    </div>

                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">添加评论</h4>
                        <div class="flex space-x-2">
                            <input
                                v-model="newComment"
                                type="text"
                                placeholder="输入评论内容..."
                                class="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                @keyup.enter="addComment"
                            />
                            <button
                                @click="addComment"
                                :disabled="!newComment.trim()"
                                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                发送
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">证据材料</h3>
                        <button @click="showEvidenceUpload = !showEvidenceUpload" class="text-sm text-indigo-600 hover:text-indigo-800">
                            上传
                        </button>
                    </div>

                    <div v-if="showEvidenceUpload" class="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div class="space-y-3">
                            <input type="file" ref="evidenceFile" class="w-full text-sm" />
                            <input
                                v-model="evidenceDescription"
                                type="text"
                                placeholder="文件描述（可选）"
                                class="w-full border-gray-300 rounded-md shadow-sm text-sm"
                            />
                            <button
                                @click="uploadEvidence"
                                class="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                            >
                                上传
                            </button>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div
                            v-for="evidence in gap.evidences"
                            :key="evidence.id"
                            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div class="flex items-center space-x-3 flex-1 min-w-0">
                                <svg class="w-8 h-8 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">{{ evidence.file_name }}</p>
                                    <p class="text-xs text-gray-500">{{ evidence.evidence_type || '证据材料' }}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1">
                                <a :href="getEvidenceUrl(evidence)" target="_blank" class="text-indigo-600 hover:text-indigo-800 p-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                </a>
                                <button @click="deleteEvidence(evidence.id)" class="text-red-600 hover:text-red-800 p-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p v-if="!gap.evidences?.length" class="text-sm text-gray-500 text-center py-4">
                            暂无证据材料
                        </p>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">相关信息</h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">关联检查记录</span>
                            <Link
                                v-if="gap.checklist_record"
                                :href="route('checklist-records.show', gap.checklist_record.id)"
                                class="text-indigo-600 hover:text-indigo-800"
                            >
                                查看
                            </Link>
                            <span v-else class="text-gray-400">无</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">审阅时长</span>
                            <span class="font-medium">{{ gap.review_duration_hours }} 小时</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">处理时长</span>
                            <span class="font-medium">{{ gap.handling_duration_hours }} 小时</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">处理记录数</span>
                            <span class="font-medium">{{ gap.handling_logs?.length || 0 }} 条</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">证据材料数</span>
                            <span class="font-medium">{{ gap.evidences?.length || 0 }} 份</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showEdit" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">编辑合规缺口</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                        <input
                            v-model="editForm.title"
                            type="text"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                            <select
                                v-model="editForm.severity"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option v-for="(label, value) in severities" :key="value" :value="value">{{ label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">责任人</label>
                            <select
                                v-model="editForm.responsible_user_id"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">请选择</option>
                                <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">发现日期</label>
                            <input
                                v-model="editForm.discovered_date"
                                type="date"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">整改期限</label>
                            <input
                                v-model="editForm.due_date"
                                type="date"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
                        <textarea
                            v-model="editForm.description"
                            rows="3"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">根本原因</label>
                        <textarea
                            v-model="editForm.root_cause"
                            rows="2"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">整改措施</label>
                        <textarea
                            v-model="editForm.corrective_action"
                            rows="2"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">预防措施</label>
                        <textarea
                            v-model="editForm.preventive_action"
                            rows="2"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        @click="showEdit = false"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        取消
                    </button>
                    <button
                        @click="saveEdit"
                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import StatusBadge from '@/Components/StatusBadge.vue'
import SeverityBadge from '@/Components/SeverityBadge.vue'

const props = defineProps({
    gap: Object,
    users: Array,
    statuses: Object,
    severities: Object,
})

const showEdit = ref(false)
const showEvidenceUpload = ref(false)
const newStatus = ref('')
const newComment = ref('')
const evidenceFile = ref(null)
const evidenceDescription = ref('')

const editForm = reactive({
    title: '',
    severity: '',
    category: '',
    responsible_user_id: '',
    discovered_date: '',
    due_date: '',
    description: '',
    root_cause: '',
    corrective_action: '',
    preventive_action: '',
})

const isOverdue = computed(() => {
    if (!props.gap.due_date || isClosed.value) return false
    return new Date(props.gap.due_date) < new Date()
})

const isClosed = computed(() => {
    return ['resolved', 'closed'].includes(props.gap.status)
})

const daysOverdue = computed(() => {
    if (!isOverdue.value) return 0
    const due = new Date(props.gap.due_date)
    const now = new Date()
    return Math.floor((now - due) / (1000 * 60 * 60 * 24))
})

const statusProgress = computed(() => {
    const order = ['open', 'in_progress', 'pending_review', 'resolved', 'closed']
    const currentIndex = order.indexOf(props.gap.status)
    if (currentIndex < 0) return 0
    return (currentIndex / (order.length - 1)) * 100
})

function openEdit() {
    editForm.title = props.gap.title
    editForm.severity = props.gap.severity
    editForm.category = props.gap.category || ''
    editForm.responsible_user_id = props.gap.responsible_user_id || ''
    editForm.discovered_date = props.gap.discovered_date
    editForm.due_date = props.gap.due_date || ''
    editForm.description = props.gap.description || ''
    editForm.root_cause = props.gap.root_cause || ''
    editForm.corrective_action = props.gap.corrective_action || ''
    editForm.preventive_action = props.gap.preventive_action || ''
    showEdit.value = true
}

function saveEdit() {
    router.put(route('compliance-gaps.update', props.gap.id), { ...editForm }, {
        onSuccess: () => {
            showEdit.value = false
        }
    })
}

function updateStatus() {
    if (!newStatus.value) return
    router.post(route('compliance-gaps.status', props.gap.id), {
        status: newStatus.value,
        comment: ''
    }, {
        onSuccess: () => {
            newStatus.value = ''
        }
    })
}

function addComment() {
    if (!newComment.value.trim()) return
    router.post(route('compliance-gaps.comments.store', props.gap.id), {
        comment: newComment.value
    }, {
        onSuccess: () => {
            newComment.value = ''
        }
    })
}

function uploadEvidence() {
    const file = evidenceFile.value?.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', evidenceDescription.value)

    router.post(route('compliance-gaps.evidences.store', props.gap.id), formData, {
        onSuccess: () => {
            showEvidenceUpload.value = false
            evidenceDescription.value = ''
            if (evidenceFile.value) {
                evidenceFile.value.value = ''
            }
        }
    })
}

function deleteEvidence(evidenceId) {
    if (!confirm('确定要删除这个证据吗？')) return
    router.delete(route('compliance-gaps.evidences.destroy', evidenceId), {
        onSuccess: () => {}
    })
}

function getEvidenceUrl(evidence) {
    return '/storage/' + evidence.file_path
}

function getActionLabel(actionType) {
    const labels = {
        'created': '创建',
        'status_changed': '状态变更',
        'comment': '评论',
        'evidence_added': '添加证据',
        'assignee_changed': '责任人变更',
        'due_date_changed': '期限变更',
        'severity_changed': '严重程度变更',
        'submitted': '提交',
        'reviewed': '审核'
    }
    return labels[actionType] || actionType
}

function formatDateTime(date) {
    if (!date) return ''
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>
