<script setup>
import { ref } from 'vue'
import { Link, useForm } from '@inertiajs/vue3'
import Layout from '@/Components/Layout.vue'

const props = defineProps({
    alert: Object,
    comments: Array,
})

const commentForm = useForm({
    content: '',
    type: 'comment',
})

const getLevelColor = (level) => {
    const colors = {
        critical: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
        debug: 'bg-gray-500',
    }
    return colors[level] || 'bg-gray-500'
}

const getLevelText = (level) => {
    const texts = {
        critical: '严重',
        warning: '警告',
        info: '信息',
        debug: '调试',
    }
    return texts[level] || level
}

const getStatusBadgeClass = (status) => {
    const classes = {
        open: 'bg-red-100 text-red-800',
        acknowledged: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800',
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const texts = {
        open: '待处理',
        acknowledged: '已确认',
        processing: '处理中',
        resolved: '已解决',
        closed: '已关闭',
    }
    return texts[status] || status
}

const getCommentTypeText = (type) => {
    const texts = {
        comment: '评论',
        status_change: '状态变更',
        escalation: '升级通知',
        resolution: '解决方案',
    }
    return texts[type] || type
}

const addComment = () => {
    commentForm.post(route('alerts.comments.store', props.alert.id), {
        onSuccess: () => commentForm.reset(),
    })
}
</script>

<template>
    <Layout :title="'告警详情 - ' + alert.title">
        <div class="mb-4">
            <Link :href="route('alerts.index')" class="text-sm text-gray-500 hover:text-gray-700">
                ← 返回告警列表
            </Link>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <div class="flex items-center space-x-3 mb-2">
                                <span :class="getLevelColor(alert.level)" class="w-3 h-3 rounded-full"></span>
                                <span class="text-sm text-gray-500">{{ getLevelText(alert.level) }}</span>
                                <span :class="getStatusBadgeClass(alert.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                                    {{ getStatusText(alert.status) }}
                                </span>
                                <span v-if="alert.is_inspected" class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    已巡检
                                </span>
                                <span v-else class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    未巡检
                                </span>
                            </div>
                            <h1 class="text-xl font-bold text-gray-900">{{ alert.title }}</h1>
                        </div>
                        <div class="flex space-x-2">
                            <Link
                                v-if="alert.status === 'open'"
                                :href="route('alerts.acknowledge', alert.id)"
                                as="button"
                                method="post"
                                class="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                            >
                                确认告警
                            </Link>
                            <Link
                                v-if="alert.status === 'acknowledged'"
                                :href="route('alerts.process', alert.id)"
                                as="button"
                                method="post"
                                class="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                            >
                                开始处理
                            </Link>
                            <Link
                                v-if="alert.status === 'processing'"
                                :href="route('alerts.resolve', alert.id)"
                                as="button"
                                method="post"
                                class="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                            >
                                标记解决
                            </Link>
                            <Link
                                v-if="alert.status === 'resolved'"
                                :href="route('alerts.close', alert.id)"
                                as="button"
                                method="post"
                                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                关闭告警
                            </Link>
                            <Link
                                v-if="!alert.is_inspected"
                                :href="route('alerts.inspect', alert.id)"
                                as="button"
                                method="post"
                                class="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
                            >
                                标记巡检
                            </Link>
                            <Link
                                :href="route('alerts.escalate', alert.id)"
                                as="button"
                                method="post"
                                class="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                            >
                                升级
                            </Link>
                        </div>
                    </div>

                    <div class="prose max-w-none">
                        <p class="text-gray-700 whitespace-pre-wrap">{{ alert.description }}</p>
                    </div>

                    <div v-if="alert.resolution" class="mt-6 pt-6 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-700 mb-2">解决方案</h3>
                        <p class="text-gray-600 bg-green-50 p-4 rounded-md">{{ alert.resolution }}</p>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">处理记录</h3>

                    <form @submit.prevent="addComment" class="mb-6">
                        <div class="mb-3">
                            <label class="block text-sm font-medium text-gray-700 mb-1">添加处理记录</label>
                            <select
                                v-model="commentForm.type"
                                class="w-40 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 mb-2"
                            >
                                <option value="comment">评论</option>
                                <option value="resolution">解决方案</option>
                                <option value="escalation">升级说明</option>
                            </select>
                            <textarea
                                v-model="commentForm.content"
                                required
                                rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="输入处理说明..."
                            />
                        </div>
                        <div class="flex justify-end">
                            <button
                                type="submit"
                                :disabled="commentForm.processing"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                提交
                            </button>
                        </div>
                    </form>

                    <div v-if="comments.length === 0" class="text-center text-gray-500 py-8">
                        暂无处理记录
                    </div>
                    <div v-else class="space-y-4">
                        <div v-for="comment in comments" :key="comment.id" class="border-l-4 border-gray-200 pl-4 py-2">
                            <div class="flex items-center justify-between mb-1">
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm font-medium text-gray-900">{{ comment.user?.name }}</span>
                                    <span class="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                                        {{ getCommentTypeText(comment.type) }}
                                    </span>
                                </div>
                                <span class="text-xs text-gray-400">{{ comment.created_at }}</span>
                            </div>
                            <p class="text-gray-700 text-sm whitespace-pre-wrap">{{ comment.content }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-sm font-medium text-gray-700 mb-4">告警信息</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-500">服务器IP</span>
                            <span class="text-sm font-medium text-gray-900">{{ alert.server_ip }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-500">服务</span>
                            <span class="text-sm font-medium text-gray-900">{{ alert.service }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-500">升级级别</span>
                            <span class="text-sm font-medium text-gray-900">{{ alert.escalation_level }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-500">创建时间</span>
                            <span class="text-sm text-gray-900">{{ alert.created_at }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-500">更新时间</span>
                            <span class="text-sm text-gray-900">{{ alert.updated_at }}</span>
                        </div>
                        <div v-if="alert.acknowledged_by" class="flex justify-between">
                            <span class="text-sm text-gray-500">确认人</span>
                            <span class="text-sm text-gray-900">{{ alert.acknowledged_user?.name }}</span>
                        </div>
                        <div v-if="alert.acknowledged_at" class="flex justify-between">
                            <span class="text-sm text-gray-500">确认时间</span>
                            <span class="text-sm text-gray-900">{{ alert.acknowledged_at }}</span>
                        </div>
                        <div v-if="alert.resolved_by" class="flex justify-between">
                            <span class="text-sm text-gray-500">解决人</span>
                            <span class="text-sm text-gray-900">{{ alert.resolved_user?.name }}</span>
                        </div>
                        <div v-if="alert.resolved_at" class="flex justify-between">
                            <span class="text-sm text-gray-500">解决时间</span>
                            <span class="text-sm text-gray-900">{{ alert.resolved_at }}</span>
                        </div>
                        <div v-if="alert.inspected_by" class="flex justify-between">
                            <span class="text-sm text-gray-500">巡检人</span>
                            <span class="text-sm text-gray-900">{{ alert.inspected_user?.name }}</span>
                        </div>
                        <div v-if="alert.inspected_at" class="flex justify-between">
                            <span class="text-sm text-gray-500">巡检时间</span>
                            <span class="text-sm text-gray-900">{{ alert.inspected_at }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="alert.custom_fields && Object.keys(alert.custom_fields).length > 0" class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-sm font-medium text-gray-700 mb-4">扩展字段</h3>
                    <div class="space-y-2">
                        <div v-for="(value, key) in alert.custom_fields" :key="key" class="flex justify-between">
                            <span class="text-sm text-gray-500">{{ key }}</span>
                            <span class="text-sm text-gray-900">{{ value }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
</template>
