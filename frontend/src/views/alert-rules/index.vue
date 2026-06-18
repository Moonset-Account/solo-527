<template>
  <div class="alert-rules-page page-container">
    <div class="card-wrapper">
      <div class="card-header">
        <span class="title"><el-icon><Bell /></el-icon> 告警规则配置</span>
        <el-button type="primary" :icon="Plus" @click="showCreate = true">
          新建规则
        </el-button>
      </div>

      <el-form :inline="true" :model="filters" class="filter-form" style="margin-bottom: 16px;">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索规则名称/指标..."
            clearable
            style="width: 220px"
            @change="loadData(1)"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px" @change="loadData(1)">
            <el-option label="运行中" value="enabled" />
            <el-option label="已停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="规则名称" min-width="220">
          <template #default="{ row }">
            <div class="rule-name">
              <span class="name">{{ row.name }}</span>
              <el-tag
                v-if="row.status === 'enabled'"
                type="success"
                size="small"
                effect="dark"
                style="border: none;"
              >
                运行中
              </el-tag>
              <el-tag v-else size="small" effect="plain">已停用</el-tag>
            </div>
            <div class="rule-desc" v-if="row.description">{{ row.description }}</div>
          </template>
        </el-table-column>
        <el-table-column label="监控指标" width="160">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.metricName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发条件" min-width="240">
          <template #default="{ row }">
            <div class="conditions">
              <el-tag
                v-for="(c, i) in row.conditions"
                :key="i"
                size="small"
                type="warning"
                effect="plain"
                style="margin-right: 4px;"
              >
                {{ c.field }} {{ opMap[c.operator] }} {{ c.value }}
              </el-tag>
              <span class="logic" v-if="row.conditions?.length > 1">
                （满足 {{ row.conditionLogic === 'all' ? '全部' : '任一' }}）
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="通知方式" width="160">
          <template #default="{ row }">
            <div class="channels">
              <el-tag v-if="row.notifyChannels?.includes('email')" size="small" type="primary" effect="plain">邮件</el-tag>
              <el-tag v-if="row.notifyChannels?.includes('sms')" size="small" type="success" effect="plain">短信</el-tag>
              <el-tag v-if="row.notifyChannels?.includes('wechat')" size="small" effect="plain">企微</el-tag>
              <el-tag v-if="row.notifyChannels?.includes('webhook')" size="small" type="info" effect="plain">Webhook</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="检测周期" width="110" align="center">
          <template #default="{ row }">{{ row.checkIntervalMinutes }} 分钟</template>
        </el-table-column>
        <el-table-column label="触发次数" width="100" align="center">
          <template #default="{ row }">
            <el-badge :value="row.triggerCount || 0" :hidden="!row.triggerCount" type="danger">
              <span>{{ row.triggerCount || 0 }}</span>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="最后触发" width="160">
          <template #default="{ row }">
            <span v-if="row.lastTriggeredAt">{{ formatDate(row.lastTriggeredAt) }}</span>
            <span v-else style="color: $text-secondary;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">{{ row.createdByName || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 'enabled'"
              @change="toggleRule(row)"
              style="margin-right: 10px;"
            />
            <el-button link type="primary" @click="viewRule(row)">查看</el-button>
            <el-button link type="danger" @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadData(1)"
          @current-change="loadData()"
        />
      </div>
    </div>

    <el-dialog v-model="showCreate" :title="formType === 'create' ? '新建告警规则' : '编辑告警规则'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.name" placeholder="如：日新增用户低于阈值告警" />
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="数据集" required>
          <el-select v-model="form.datasetId" placeholder="请选择关联数据集" filterable style="width: 100%">
            <el-option v-for="d in datasets" :key="d._id" :label="d.name" :value="d._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="监控指标" required>
          <el-input v-model="form.metricName" placeholder="如：daily_new_users" />
        </el-form-item>
        <el-form-item label="触发条件" required>
          <div
            v-for="(c, i) in form.conditions"
            :key="i"
            class="condition-row"
          >
            <el-input v-model="c.field" placeholder="字段名" style="width: 120px;" />
            <el-select v-model="c.operator" style="width: 100px;">
              <el-option label="大于 (>) " value="gt" />
              <el-option label="小于 (<) " value="lt" />
              <el-option label="大于等于 (>=) " value="gte" />
              <el-option label="小于等于 (<=) " value="lte" />
              <el-option label="等于 (=) " value="eq" />
              <el-option label="不等于 (!=) " value="ne" />
            </el-select>
            <el-input-number v-model="c.value" style="width: 140px;" controls-position="right" />
            <el-button
              v-if="form.conditions.length > 1"
              link
              type="danger"
              @click="form.conditions.splice(i, 1)"
            >
              删除
            </el-button>
          </div>
          <el-button type="dashed" size="small" style="margin-top: 8px;" @click="addCondition">
            <el-icon><Plus /></el-icon> 添加条件
          </el-button>
        </el-form-item>
        <el-form-item label="满足逻辑">
          <el-radio-group v-model="form.conditionLogic">
            <el-radio value="all">满足全部条件</el-radio>
            <el-radio value="any">满足任一条件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检测周期">
          <el-input-number v-model="form.checkIntervalMinutes" :min="1" />
          <span style="margin-left: 8px; color: $text-secondary;">分钟</span>
        </el-form-item>
        <el-form-item label="通知方式">
          <el-checkbox-group v-model="form.notifyChannels">
            <el-checkbox value="email">邮件</el-checkbox>
            <el-checkbox value="sms">短信</el-checkbox>
            <el-checkbox value="wechat">企业微信</el-checkbox>
            <el-checkbox value="webhook">Webhook</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">
          {{ formType === 'create' ? '创建规则' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAlertRules, createAlertRule, updateAlertRule, toggleAlertRule, deleteAlertRule
} from '@/api/alert-rules'
import { getDatasets } from '@/api/datasets'
import { formatDate } from '@/utils'
import { Bell, Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = reactive({ keyword: '', status: '' })

const datasets = ref<any[]>([])

const showCreate = ref(false)
const formType = ref<'create' | 'edit'>('create')
const editingId = ref('')
const saving = ref(false)
const form = reactive({
  name: '',
  description: '',
  datasetId: '',
  metricName: '',
  conditions: [{ field: 'value', operator: 'lt' as const, value: 0 }],
  conditionLogic: 'all' as 'all' | 'any',
  notifyChannels: ['email'] as string[],
  checkIntervalMinutes: 60
})

const opMap: Record<string, string> = {
  gt: '>', lt: '<', gte: '>=', lte: '<=', eq: '=', ne: '!='
}

function resetForm() {
  Object.assign(form, {
    name: '', description: '', datasetId: '', metricName: '',
    conditions: [{ field: 'value', operator: 'lt', value: 0 }],
    conditionLogic: 'all', notifyChannels: ['email'], checkIntervalMinutes: 60
  })
}

function addCondition() {
  form.conditions.push({ field: 'value', operator: 'lt' as const, value: 0 })
}

async function loadData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const res = await getAlertRules({
      ...filters,
      page: page.value,
      pageSize: pageSize.value
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  loadData(1)
}

async function submitForm() {
  if (!form.name || !form.datasetId || !form.metricName) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    if (formType.value === 'create') {
      await createAlertRule(form)
      ElMessage.success('规则创建成功')
    } else {
      await updateAlertRule(editingId.value, form)
      ElMessage.success('规则修改成功')
    }
    showCreate.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function toggleRule(row: any) {
  try {
    await toggleAlertRule(row._id)
    ElMessage.success(`已${row.status === 'enabled' ? '停用' : '启用'}规则`)
    loadData()
  } catch (e) {}
}

function viewRule(row: any) {
  formType.value = 'edit'
  editingId.value = row._id
  Object.assign(form, {
    name: row.name,
    description: row.description,
    datasetId: row.datasetId,
    metricName: row.metricName,
    conditions: [...row.conditions],
    conditionLogic: row.conditionLogic,
    notifyChannels: [...row.notifyChannels],
    checkIntervalMinutes: row.checkIntervalMinutes
  })
  showCreate.value = true
}

async function deleteRule(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除规则【${row.name}】？`, '提示', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await deleteAlertRule(row._id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {}
}

async function loadDatasets() {
  try {
    const res = await getDatasets({ pageSize: 200 })
    datasets.value = res.list
  } catch (e) {}
}

onMounted(() => {
  loadData()
  loadDatasets()
})
</script>

<style lang="scss" scoped>
.filter-form {
  padding: 16px;
  background: #fafbfc;
  border-radius: 6px;
  :deep(.el-form-item) {
    margin-bottom: 10px;
    margin-right: 12px;
  }
}

.rule-name {
  display: flex;
  align-items: center;
  gap: 8px;
  .name { font-weight: 500; color: $text-primary; }
}
.rule-desc {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
}

.conditions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  .logic {
    font-size: 12px;
    color: $text-secondary;
  }
}

.channels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
