<template>
  <el-form :model="form" inline class="filter-bar">
    <el-form-item v-if="showKeyword" label="关键词">
      <el-input
        v-model="form.keyword"
        placeholder="请输入关键词"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
      />
    </el-form-item>
    <el-form-item v-if="statusOptions && statusOptions.length" label="状态">
      <el-select
        v-model="form.statuses"
        multiple
        placeholder="请选择状态"
        clearable
        style="width: 220px"
      >
        <el-option
          v-for="item in statusOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="showDateRange" label="日期范围">
      <el-date-picker
        v-model="form.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />
    </el-form-item>
    <el-form-item v-if="showOwner && userList.length" label="负责人">
      <el-select
        v-model="form.ownerId"
        placeholder="请选择负责人"
        clearable
        style="width: 160px"
      >
        <el-option
          v-for="user in userList"
          :key="user.id"
          :label="user.nickname || user.username"
          :value="user.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  showKeyword: {
    type: Boolean,
    default: true
  },
  showDateRange: {
    type: Boolean,
    default: true
  },
  showOwner: {
    type: Boolean,
    default: true
  },
  statusOptions: {
    type: Array,
    default: () => []
  },
  userList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search', 'reset'])

const form = reactive({
  keyword: '',
  statuses: [],
  dateRange: [],
  ownerId: null
})

const handleSearch = () => {
  const params = { ...form }
  if (form.dateRange && form.dateRange.length === 2) {
    params.startDate = form.dateRange[0]
    params.endDate = form.dateRange[1]
  }
  delete params.dateRange
  emit('search', params)
}

const handleReset = () => {
  form.keyword = ''
  form.statuses = []
  form.dateRange = []
  form.ownerId = null
  emit('reset')
}
</script>

<style lang="scss" scoped>
.filter-bar {
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
