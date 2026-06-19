<template>
  <el-tag
    :type="tagType"
    :effect="effect"
    :size="size"
    round
  >
    {{ label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: [String, Number],
    required: true
  },
  statusMap: {
    type: Object,
    default: () => ({})
  },
  size: {
    type: String,
    default: 'default'
  },
  effect: {
    type: String,
    default: 'light'
  }
})

const defaultStatusMap = {
  pending: { label: '待处理', type: 'warning' },
  processing: { label: '处理中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
  rejected: { label: '已拒绝', type: 'danger' },
  approved: { label: '已通过', type: 'success' },
  submitted: { label: '已提交', type: 'warning' },
  draft: { label: '草稿', type: 'info' },
  new: { label: '新建', type: 'primary' },
  followed: { label: '已跟进', type: 'success' },
  converted: { label: '已转化', type: 'success' },
  lost: { label: '已流失', type: 'danger' },
  signed: { label: '已签约', type: 'success' },
  unpaid: { label: '未付款', type: 'warning' },
  partial_paid: { label: '部分付款', type: 'primary' },
  paid: { label: '已付款', type: 'success' }
}

const mergedMap = computed(() => ({
  ...defaultStatusMap,
  ...props.statusMap
}))

const label = computed(() => {
  return mergedMap.value[props.status]?.label || props.status
})

const tagType = computed(() => {
  return mergedMap.value[props.status]?.type || 'info'
})
</script>
