<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">报表导出中心</h2>
    </div>

    <n-grid :cols="4" :x-gap="16" style="margin-bottom: 20px">
      <n-gi v-for="rpt in reportTypes" :key="rpt.type">
        <n-card :title="rpt.label" hoverable clickable @click="openGenerate(rpt)">
          <div style="color: #86909c; font-size: 13px; min-height: 40px">{{ rpt.desc }}</div>
          <template #header-extra>
            <n-button size="small" type="primary">导出</n-button>
          </template>
        </n-card>
      </n-gi>
    </n-grid>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="报表类型">
          <n-select v-model:value="filters.report_type" :options="reportTypeOptions" clearable placeholder="全部" style="width: 160px" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable placeholder="全部" style="width: 140px" />
        </n-form-item>
        <n-form-item><n-button type="primary" @click="loadData">查询</n-button></n-form-item>
      </n-form>
    </div>

    <div class="content-area">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        @update:page="p => { pagination.page = p; loadData() }"
        @update:page-size="s => { pagination.pageSize = s; pagination.page = 1; loadData() }"
        bordered striped
      >
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</n-tag>
        </template>
        <template #file_size="{ row }">
          <span v-if="row.file_size">{{ formatSize(row.file_size) }}</span>
          <span v-else>-</span>
        </template>
        <template #action="{ row }">
          <n-space>
            <n-button
              size="small"
              type="primary"
              :disabled="row.status !== 'completed'"
              @click="download(row)"
            >
              下载
            </n-button>
            <n-button size="small" quaternary type="primary" @click="viewDetail(row)" v-if="row.status === 'failed'">
              失败原因
            </n-button>
          </n-space>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="genModal.show" preset="card" :title="`生成报表：${genModal.type?.label}`" style="width: 520px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="报表名称">
          <n-input v-model:value="genModal.name" />
        </n-form-item>
        <n-form-item label="说明">
          <span style="color: #86909c; font-size: 13px">{{ genModal.type?.desc }}</span>
        </n-form-item>
        <n-form-item label="日期范围" v-if="genModal.type?.needDate">
          <n-date-picker v-model:value="genModal.dateRange" type="daterange" clearable style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="genModal.show = false">取消</n-button>
          <n-button type="primary" :loading="generating" @click="confirmGenerate">生成</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NSpace, NButton, NForm, NFormItem, NInput, NSelect, NDataTable, NModal,
  NTag, NCard, NGrid, NGi, NDatePicker, useMessage, useDialog
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false); const generating = ref(false)

const reportTypes = [
  { type: 'stock_summary', label: '库存汇总报表', desc: '包含所有在库批次、数量、库位、效期信息', needDate: false },
  { type: 'batch_flow', label: '批次流转报表', desc: '完整的出入库、调拨、退货等流向明细', needDate: true },
  { type: 'near_expiry', label: '近效期提醒报表', desc: '含处理状态、处理人、办理时长等完整信息', needDate: false },
  { type: 'abnormal_record', label: '批次异常记录报表', desc: '批次异常完整信息，含办理时长和负责人', needDate: false },
  { type: 'replenish', label: '补货建议报表', desc: '智能补货建议汇总，含原因和优先级', needDate: false },
  { type: 'sign_difference', label: '签收差异报表', desc: '实收差异详情，含处理人、时长和解决方案', needDate: false }
]
const reportTypeOptions = reportTypes.map(r => ({ label: r.label, value: r.type }))
const statusOptions = [
  { label: '生成中', value: 'generating' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' }
]

const filters = reactive({ report_type: null as any, status: null as any })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '报表名称', key: 'report_name', width: 200 },
  { title: '报表类型', key: 'report_type', width: 140, render: (r: any) => reportTypes.find(x => x.type === r.report_type)?.label || r.report_type },
  { title: '记录数', key: 'total_records', width: 90 },
  { title: '文件大小', key: 'file_size', width: 110 },
  { title: '状态', key: 'status', width: 90 },
  { title: '生成人', key: ['generator', 'full_name'], width: 110, render: (r: any) => r.generator?.full_name || '-' },
  { title: '生成时间', key: 'generated_at', width: 160, render: (r: any) => r.generated_at?.slice(0, 16).replace('T', ' ') || '-' },
  { title: '错误信息', key: 'error_message', width: 180, ellipsis: { tooltip: true }, render: (r: any) => r.error_message || '-' },
  { title: '操作', key: 'action', width: 160, fixed: 'right' }
]

function statusTagType(s: string) {
  const m: Record<string, any> = { generating: 'warning', completed: 'success', failed: 'error' }
  return m[s] || 'default'
}
function statusText(s: string) {
  const m: Record<string, string> = { generating: '生成中', completed: '已完成', failed: '失败' }
  return m[s] || s
}
function formatSize(b: number) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

const genModal = reactive({ show: false, type: null as any, name: '', dateRange: null as any })
function openGenerate(type: any) {
  genModal.type = type
  genModal.name = `${type.label} - ${new Date().toLocaleDateString()}`
  genModal.dateRange = null
  genModal.show = true
}
async function confirmGenerate() {
  try {
    generating.value = true
    const filterObj: any = {}
    if (genModal.dateRange) {
      filterObj.start_date = genModal.dateRange[0]
      filterObj.end_date = genModal.dateRange[1]
    }
    await apiClient.post<any>('/reports', {
      report_type: genModal.type.type,
      report_name: genModal.name,
      filters: filterObj
    })
    message.success('报表生成任务已提交，稍后可在此处查看结果')
    genModal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '提交失败') }
  finally { generating.value = false }
}
async function download(row: any) {
  try {
    const token = localStorage.getItem('token')
    const base = '/api/v1'
    const url = `${base}/reports/${row.id}/download`
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) throw new Error('下载失败')
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = row.report_name + '_' + row.id + '.xlsx'
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e: any) { message.error(e.message || '下载失败') }
}
function viewDetail(row: any) {
  dialog.error({ title: '生成失败', content: row.error_message || '未知错误', positiveText: '关闭' })
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/reports', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadData() })
definePageMeta({ layout: 'default' })
</script>
