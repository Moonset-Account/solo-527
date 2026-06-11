<template>
  <div class="config-list">
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" :inline="true" label-width="80px">
        <el-form-item label="Key">
          <el-input
            v-model="searchForm.key"
            placeholder="Key 模糊搜索"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 180px">
            <el-option label="业务规则" value="business_rule" />
            <el-option label="展示配置" value="display" />
            <el-option label="系统配置" value="system" />
            <el-option label="全部" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select v-model="searchForm.enabledStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" value="all" />
            <el-option label="启用" value="true" />
            <el-option label="禁用" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column label="Key" width="220" fixed="left" prop="key" show-overflow-tooltip />
        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" effect="light">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Value" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="formatValueTooltip(row.value)" placement="top" :show-after="200">
              <span class="value-cell">{{ formatValueDisplay(row.value) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="是否启用" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              @change="(val: boolean) => handleEnabledChange(row, val)"
              active-text="是"
              inactive-text="否"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" width="160" prop="remark" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.remark">{{ row.remark }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="修改人" width="110" prop="modifiedBy">
          <template #default="{ row }">
            <span v-if="row.modifiedBy">{{ row.modifiedBy }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="版本号" width="90" align="center" prop="version" />
        <el-table-column label="最后修改时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="openChangeLogDrawer(row)">变更日志</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="editDialogVisible"
      :title="isEditMode ? '编辑配置' : '新增配置'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="90px"
      >
        <el-form-item label="Key" prop="key">
          <el-input v-model="editForm.key" :disabled="isEditMode" placeholder="请输入配置 Key" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="editForm.type" :disabled="isEditMode" placeholder="请选择类型" style="width: 100%">
            <el-option label="业务规则" value="business_rule" />
            <el-option label="展示配置" value="display" />
            <el-option label="系统配置" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="Value" prop="value">
          <div v-if="editForm.type === 'number'">
            <el-input-number v-model="editForm.value" :controls="true" style="width: 100%" />
          </div>
          <div v-else-if="editForm.type === 'json'">
            <el-input
              v-model="editForm.value"
              type="textarea"
              :rows="6"
              placeholder='请输入 JSON，如 {"key": "value"}'
            />
          </div>
          <div v-else-if="editForm.type === 'boolean'">
            <el-switch
              v-model="editForm.value"
              active-text="true"
              inactive-text="false"
            />
          </div>
          <div v-else>
            <el-input v-model="editForm.value" type="textarea" :rows="3" placeholder="请输入 Value" />
          </div>
        </el-form-item>
        <el-form-item label="是否启用" prop="enabled">
          <el-switch v-model="editForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="请输入备注（变更说明）" />
        </el-form-item>
        <el-form-item label="修改人" prop="modifiedBy">
          <el-input v-model="editForm.modifiedBy" placeholder="请输入修改人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmEdit">提交</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="changeLogDrawerVisible"
      title="配置变更日志"
      direction="rtl"
      size="520px"
    >
      <div v-if="currentConfig" class="change-log-drawer">
        <el-descriptions :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="Key">{{ currentConfig.key }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTypeLabel(currentConfig.type) }}</el-descriptions-item>
          <el-descriptions-item label="当前版本">v{{ currentConfig.version }}</el-descriptions-item>
          <el-descriptions-item label="当前修改人">{{ currentConfig.modifiedBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前备注" :span="2">
            <span v-if="currentConfig.remark">{{ currentConfig.remark }}</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title">历史变更记录</div>
        <el-timeline v-if="changeLogs.length > 0">
          <el-timeline-item
            v-for="(log, idx) in changeLogs"
            :key="idx"
            :timestamp="formatDateTime(log.modifiedAt || log.timestamp)"
            placement="top"
            :color="idx === 0 ? '#409EFF' : '#E4E7ED'"
          >
            <el-card shadow="never" class="timeline-card">
              <div class="log-header">
                <el-tag type="primary" effect="light" size="small">{{ log.modifiedBy || '系统' }}</el-tag>
                <span class="log-version">v{{ changeLogs.length - idx }}</span>
              </div>
              <div class="log-content">
                <div class="diff-row">
                  <span class="diff-label">旧值：</span>
                  <code class="diff-old">{{ formatValueDisplay(log.oldValue) }}</code>
                </div>
                <div class="diff-row">
                  <span class="diff-label">新值：</span>
                  <code class="diff-new">{{ formatValueDisplay(log.newValue) }}</code>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无变更记录" />
      </div>
    </el-drawer>

    <el-dialog v-model="enabledRemarkDialogVisible" title="操作确认" width="450px" :close-on-click-modal="false">
      <el-alert
        :title="`确认${enabledChangeTargetValue ? '启用' : '禁用'}配置「${enabledChangeConfig?.key}」吗？`"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form :model="enabledRemarkForm" label-width="80px" class="mt-16">
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="enabledRemarkForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入变更说明（必填）"
          />
        </el-form-item>
        <el-form-item label="修改人" prop="modifiedBy">
          <el-input v-model="enabledRemarkForm.modifiedBy" placeholder="请输入修改人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelEnabledChange">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmEnabledChange">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
} from '@element-plus/icons-vue'
import {
  getConfigList,
  getConfigChangeLog,
  updateConfig,
  enableConfig,
  disableConfig,
  createConfig,
  type ConfigItem,
} from '@/api/config'

const loading = ref(false)
const actionLoading = ref(false)
const tableData = ref<ConfigItem[]>([])

const searchForm = reactive({
  key: '',
  type: '',
  enabledStatus: '' as '' | 'all' | 'true' | 'false',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const editDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const isEditMode = ref(false)
const currentConfig = ref<ConfigItem | null>(null)

const editForm = reactive({
  key: '',
  type: '',
  value: '' as any,
  enabled: true,
  remark: '',
  modifiedBy: '管理员',
})

const editFormRules: FormRules = {
  key: [{ required: true, message: '请输入 Key', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入 Value', trigger: 'blur' }],
  modifiedBy: [{ required: true, message: '请输入修改人', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入备注/变更说明', trigger: 'blur' }],
}

const changeLogDrawerVisible = ref(false)
const changeLogs = ref<any[]>([])

const enabledRemarkDialogVisible = ref(false)
const enabledChangeConfig = ref<ConfigItem | null>(null)
const enabledChangeTargetValue = ref(false)
const enabledRemarkForm = reactive({
  remark: '',
  modifiedBy: '管理员',
})

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    business_rule: '业务规则',
    display: '展示配置',
    system: '系统配置',
  }
  return map[type] || type
}

function getTypeTagType(type: string) {
  const map: Record<string, string> = {
    business_rule: 'danger',
    display: 'success',
    system: 'warning',
  }
  return map[type] || ''
}

function formatValueDisplay(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value)
      return str.length > 50 ? str.slice(0, 50) + '...' : str
    } catch {
      return String(value)
    }
  }
  const str = String(value)
  return str.length > 50 ? str.slice(0, 50) + '...' : str
}

function formatValueTooltip(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function formatDateTime(str: string) {
  if (!str) return '-'
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.key = ''
  searchForm.type = ''
  searchForm.enabledStatus = ''
  pagination.page = 1
  loadData()
}

function generateMockConfigs(): ConfigItem[] {
  const configs: Array<Partial<ConfigItem> & { key: string; type: string; value: any }> = [
    { key: 'order.auto_dispatch', type: 'business_rule', value: true, remark: '新订单自动派单开关' },
    { key: 'order.dispatch_timeout_minutes', type: 'business_rule', value: 30, remark: '派单超时时间（分钟）' },
    { key: 'order.cancel_hours_before', type: 'business_rule', value: 2, remark: '预约前几小时可免费取消' },
    { key: 'display.home_banner', type: 'display', value: JSON.stringify({ images: ['banner1.jpg', 'banner2.jpg'], autoPlay: true, interval: 3000 }), remark: '首页轮播图配置' },
    { key: 'display.service_card_style', type: 'display', value: 'modern', remark: '服务卡片展示样式' },
    { key: 'display.rating_stars', type: 'display', value: 5, remark: '评分星级数' },
    { key: 'system.cache_ttl_seconds', type: 'system', value: 3600, remark: '缓存过期时间（秒）' },
    { key: 'system.max_page_size', type: 'system', value: 1000, remark: '分页最大条数' },
    { key: 'system.log_level', type: 'system', value: 'info', remark: '日志级别：debug/info/warn/error' },
    { key: 'business.worker_rating_threshold', type: 'business_rule', value: 3.5, remark: '师傅最低评分阈值' },
    { key: 'business.follow_up_days', type: 'business_rule', value: 7, remark: '服务完成后几天内回访' },
    { key: 'display.tag_colors', type: 'display', value: JSON.stringify({ 好评: '#67C23A', 差评: '#F56C6C', 建议: '#E6A23C' }), remark: '标签颜色映射' },
  ]

  const now = new Date()
  return configs.map((c, i) => {
    const createdAt = new Date(now.getTime() - (configs.length - i) * 86400000 * 2)
    const updatedAt = new Date(now.getTime() - i * 86400000)
    const changeLog = Array.from({ length: 3 }, (_, j) => ({
      oldValue: typeof c.value === 'boolean' ? !c.value : (typeof c.value === 'number' ? c.value - j - 1 : `旧值${j + 1}`),
      newValue: typeof c.value === 'boolean' ? c.value : c.value,
      modifiedBy: ['张三', '李四', '王五'][j % 3],
      modifiedAt: new Date(updatedAt.getTime() - (2 - j) * 3600000 * 24).toISOString(),
    }))
    return {
      _id: `cfg_${i + 1}`,
      key: c.key,
      value: c.value,
      type: c.type,
      enabled: i % 5 !== 4,
      remark: c.remark,
      modifiedBy: ['张三', '李四', '王五', '赵六', '管理员'][i % 5],
      version: 3,
      changeLog,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    } as ConfigItem
  })
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.key) params.key = searchForm.key
    if (searchForm.type && searchForm.type !== 'all') params.type = searchForm.type
    if (searchForm.enabledStatus === 'true') params.enabled = true
    if (searchForm.enabledStatus === 'false') params.enabled = false

    const res = await getConfigList(params)
    const payload = res.data as any
    const list = payload?.data ?? payload?.list
    if (Array.isArray(list)) {
      tableData.value = list
      pagination.total = payload?.total ?? list.length
    } else {
      throw new Error('no data')
    }
  } catch {
    let all = generateMockConfigs()
    if (searchForm.key) {
      const kw = searchForm.key.toLowerCase()
      all = all.filter((c) => c.key.toLowerCase().includes(kw))
    }
    if (searchForm.type && searchForm.type !== 'all') {
      all = all.filter((c) => c.type === searchForm.type)
    }
    if (searchForm.enabledStatus === 'true') {
      all = all.filter((c) => c.enabled)
    } else if (searchForm.enabledStatus === 'false') {
      all = all.filter((c) => !c.enabled)
    }
    const start = (pagination.page - 1) * pagination.pageSize
    tableData.value = all.slice(start, start + pagination.pageSize)
    pagination.total = all.length
  } finally {
    loading.value = false
  }
}

function handleEnabledChange(row: ConfigItem, val: boolean) {
  enabledChangeConfig.value = row
  enabledChangeTargetValue.value = val
  enabledRemarkForm.remark = ''
  enabledRemarkForm.modifiedBy = '管理员'
  enabledRemarkDialogVisible.value = true
}

function cancelEnabledChange() {
  enabledRemarkDialogVisible.value = false
  enabledChangeConfig.value = null
}

async function confirmEnabledChange() {
  if (!enabledRemarkForm.remark.trim()) {
    ElMessage.warning('请输入变更说明')
    return
  }
  if (!enabledRemarkForm.modifiedBy.trim()) {
    ElMessage.warning('请输入修改人')
    return
  }
  actionLoading.value = true
  try {
    const row = enabledChangeConfig.value!
    const targetVal = enabledChangeTargetValue.value
    if (targetVal) {
      await enableConfig(row._id, enabledRemarkForm.modifiedBy, enabledRemarkForm.remark)
    } else {
      await disableConfig(row._id, enabledRemarkForm.modifiedBy, enabledRemarkForm.remark)
    }
    ElMessage.success(`${targetVal ? '启用' : '禁用'}成功`)
    enabledRemarkDialogVisible.value = false
    enabledChangeConfig.value = null
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || `${enabledChangeTargetValue.value ? '启用' : '禁用'}失败`)
    enabledRemarkDialogVisible.value = false
    enabledChangeConfig.value = null
    loadData()
  } finally {
    actionLoading.value = false
  }
}

function openEditDialog(row: ConfigItem) {
  isEditMode.value = true
  currentConfig.value = row
  editForm.key = row.key
  editForm.type = row.type
  editForm.value = row.value
  editForm.enabled = row.enabled
  editForm.remark = ''
  editForm.modifiedBy = '管理员'
  editDialogVisible.value = true
}

async function confirmEdit() {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    actionLoading.value = true
    try {
      if (isEditMode.value) {
        await updateConfig(currentConfig.value!._id, {
          value: editForm.value,
          enabled: editForm.enabled,
          remark: editForm.remark,
          modifiedBy: editForm.modifiedBy,
        })
        ElMessage.success('更新成功')
      } else {
        await createConfig({
          key: editForm.key,
          value: editForm.value,
          type: editForm.type,
          enabled: editForm.enabled,
          remark: editForm.remark,
          modifiedBy: editForm.modifiedBy,
        })
        ElMessage.success('创建成功')
      }
      editDialogVisible.value = false
      loadData()
    } catch (e: any) {
      ElMessage.error(e?.message || `${isEditMode.value ? '更新' : '创建'}失败`)
      editDialogVisible.value = false
      loadData()
    } finally {
      actionLoading.value = false
    }
  })
}

async function openChangeLogDrawer(row: ConfigItem) {
  currentConfig.value = row
  changeLogDrawerVisible.value = true
  try {
    const res = await getConfigChangeLog(row._id)
    const payload = res.data as any
    changeLogs.value = Array.isArray(payload) ? payload : (payload?.data ?? payload ?? [])
  } catch {
    changeLogs.value = row.changeLog || []
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.config-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card :deep(.el-form-item) {
  margin-bottom: 16px;
}

.value-cell {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  color: #606266;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.change-log-drawer {
  padding: 0 8px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-16 {
  margin-top: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.timeline-card {
  border: 1px solid #ebeef5;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.log-version {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diff-row {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.6;
}

.diff-label {
  flex-shrink: 0;
  width: 48px;
  color: #909399;
}

.diff-old,
.diff-new {
  flex: 1;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
  white-space: pre-wrap;
}

.diff-old {
  background-color: #fef0f0;
  color: #f56c6c;
  text-decoration: line-through;
}

.diff-new {
  background-color: #f0f9eb;
  color: #67c23a;
}
</style>
