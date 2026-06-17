<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">审计追踪 / 复盘查询</h2>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-select v-model="filter.module" placeholder="模块" clearable style="width: 160px">
          <el-option label="用户" value="users" />
          <el-option label="试剂" value="reagent" />
          <el-option label="申请" value="application" />
          <el-option label="仪器预约" value="instrument_booking" />
          <el-option label="样本" value="sample" />
          <el-option label="危化品" value="hazardous" />
          <el-option label="课题" value="project" />
          <el-option label="字典" value="dictionary" />
          <el-option label="原始单据" value="original_document" />
        </el-select>
        <el-input v-model="filter.targetId" placeholder="目标ID（单据/申请单ID）" clearable style="width: 260px" />
        <el-input v-model="filter.operatorId" placeholder="操作人ID" clearable style="width: 160px" />
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </div>

      <el-alert
        title="复盘说明：选择模块并输入目标ID，可查看该记录的完整操作轨迹（操作人、时间、变更内容）"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="actionTime" label="时间" width="180">
          <template #default="{ row }">{{ formatDate(row.actionTime || row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">{{ moduleLabel(row.module) }}</template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="actionType(row.action)" size="small">{{ actionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetName" label="目标" width="200" />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="details" label="变更详情">
          <template #default="{ row }">
            <span v-if="typeof row.details === 'string'">{{ row.details }}</span>
            <span v-else-if="row.details">
              <el-popover
                placement="top-start"
                :width="400"
                trigger="click"
                :content="JSON.stringify(row.details, null, 2)"
              >
                <template #reference>
                  <el-button link type="primary">查看详情</el-button>
                </template>
              </el-popover>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px"
        background
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { auditApi } from '@/api'
import type { AuditLog } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref<AuditLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<string[]>([])

const filter = reactive({
  module: '',
  targetId: '',
  operatorId: '',
})

function formatDate(d: string) {
  return d ? dayjs(d).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function moduleLabel(m: string) {
  const map: Record<string, string> = {
    users: '用户',
    reagent: '试剂',
    application: '领用申请',
    instrument_booking: '仪器预约',
    sample: '样本',
    hazardous: '危化品',
    project: '课题',
    dictionary: '字典',
    notification_config: '通知配置',
    original_document: '原始单据',
    auth: '认证',
  }
  return map[m] || m
}

function actionLabel(a: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    approve: '通过',
    reject: '驳回',
    submit: '提交',
    cancel: '取消',
    pick: '领取',
    return: '归还',
    confirm: '确认',
    login: '登录',
    logout: '登出',
  }
  return map[a] || a
}

function actionType(a: string) {
  const map: Record<string, string> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    approve: 'success',
    reject: 'danger',
    submit: 'primary',
    cancel: 'info',
    pick: 'primary',
  }
  return map[a] || ''
}

function resetFilter() {
  filter.module = ''
  filter.targetId = ''
  filter.operatorId = ''
  dateRange.value = []
  page.value = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (filter.module) params.module = filter.module
    if (filter.targetId) params.targetId = filter.targetId
    if (filter.operatorId) params.operatorId = filter.operatorId
    if (dateRange.value?.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await auditApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
