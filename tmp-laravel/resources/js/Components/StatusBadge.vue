<template>
    <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="statusClass"
    >
        {{ label }}
    </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    status: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'gap'
    }
})

const statusLabels = {
    gap: {
        open: '待处理',
        in_progress: '处理中',
        pending_review: '待审核',
        resolved: '已解决',
        closed: '已关闭'
    },
    record: {
        draft: '草稿',
        submitted: '已提交',
        reviewed: '已审核',
        closed: '已关闭'
    },
    reminder: {
        pending: '待发送',
        sent: '已发送',
        failed: '发送失败',
        read: '已读'
    }
}

const statusClasses = {
    gap: {
        open: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
        pending_review: 'bg-purple-100 text-purple-800',
        resolved: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800'
    },
    record: {
        draft: 'bg-gray-100 text-gray-800',
        submitted: 'bg-blue-100 text-blue-800',
        reviewed: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800'
    },
    reminder: {
        pending: 'bg-yellow-100 text-yellow-800',
        sent: 'bg-blue-100 text-blue-800',
        failed: 'bg-red-100 text-red-800',
        read: 'bg-gray-100 text-gray-800'
    }
}

const label = computed(() => {
    return statusLabels[props.type]?.[props.status] || props.status
})

const statusClass = computed(() => {
    return statusClasses[props.type]?.[props.status] || 'bg-gray-100 text-gray-800'
})
</script>
