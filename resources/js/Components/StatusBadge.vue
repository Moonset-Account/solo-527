<script setup>
const props = defineProps({
    status: {
        type: String,
        required: true,
    },
    size: {
        type: String,
        default: 'md',
    },
});

const statusConfig = {
    pending: {
        label: '待处理',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-800',
    },
    processing: {
        label: '处理中',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-800',
    },
    confirmed: {
        label: '已确认',
        bgClass: 'bg-green-100',
        textClass: 'text-green-800',
    },
    rejected: {
        label: '已拒绝',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
    },
    completed: {
        label: '已完成',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-800',
    },
    overdue: {
        label: '已逾期',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
    },
    approved: {
        label: '已审批',
        bgClass: 'bg-green-100',
        textClass: 'text-green-800',
    },
    waiting_approval: {
        label: '待审批',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-800',
    },
    written_off: {
        label: '已冲销',
        bgClass: 'bg-purple-100',
        textClass: 'text-purple-800',
    },
    amount_mismatch: {
        label: '金额不符',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
    },
    date_mismatch: {
        label: '日期不符',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-800',
    },
    missing_record: {
        label: '缺失记录',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-800',
    },
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
};

const config = statusConfig[props.status] || {
    label: props.status,
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-800',
};
</script>

<template>
    <span
        :class="[
            'inline-flex items-center font-medium rounded-full',
            config.bgClass,
            config.textClass,
            sizeClasses[size] || sizeClasses.md,
        ]"
    >
        {{ config.label }}
    </span>
</template>
