<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">提醒配置</h2>
      <el-alert
        title="配置各种提醒类型的接收人、发送渠道、优先级、模板和重复规则，所有提醒行为统一在此管理。"
        type="info"
        show-icon
        :closable="false"
        style="margin-left: 20px; max-width: 550px"
      />
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增配置
      </el-button>
    </div>

    <div class="card-shadow">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="提醒名称" width="180" />
        <el-table-column label="类型" width="160">
          <template #default="{ row }">
            {{ typeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="priorityType(row.priority)">{{ priorityLabel(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标角色" width="200">
          <template #default="{ row }">
            <el-tag v-for="r in row.targetRoles" :key="r" style="margin-right: 4px">{{ roleLabel(r) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发送渠道" width="180">
          <template #default="{ row }">
            <el-tag v-if="row.channels?.inApp" type="success" style="margin-right: 4px">站内</el-tag>
            <el-tag v-if="row.channels?.email" type="primary" style="margin-right: 4px">邮件</el-tag>
            <el-tag v-if="row.channels?.sms" type="warning" style="margin-right: 4px">短信</el-tag>
            <el-tag v-if="row.channels?.wechat" style="margin-right: 4px">微信</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="重复提醒" width="160">
          <template #default="{ row }">
            {{ row.reminderIntervalMinutes ? `每${row.reminderIntervalMinutes}分钟` : '不重复' }}
            <span v-if="row.maxReminders">, 最多{{ row.maxReminders }}次</span>
          </template>
        </el-table-column>
        <el-table-column label="生效范围" width="120">
          <template #default="{ row }">
            <span v-if="row.scope?.length">{{ row.scope.join(', ') }}</span>
            <span v-else style="color: #909399">全部</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑提醒配置' : '新增提醒配置'" width="680px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="提醒类型" prop="type">
              <el-select v-model="form.type" style="width: 100%" :disabled="isEdit">
                <el-option label="申请提交通知" value="application_submitted" />
                <el-option label="申请通过通知" value="application_approved" />
                <el-option label="申请驳回通知" value="application_rejected" />
                <el-option label="安全合规提醒" value="safety_compliance" />
                <el-option label="样本去向不明" value="sample_unknown" />
                <el-option label="维保提醒" value="maintenance_alert" />
                <el-option label="系统通知" value="system_notice" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提醒名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" style="width: 100%">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否需确认">
              <el-switch v-model="form.needConfirmation" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="接收角色">
              <el-select v-model="form.targetRoles" multiple style="width: 100%">
                <el-option label="超级管理员" value="super_admin" />
                <el-option label="管理员" value="admin" />
                <el-option label="试剂管理员" value="reagent_manager" />
                <el-option label="实验室主管" value="lab_manager" />
                <el-option label="研究员" value="researcher" />
                <el-option label="普通用户" value="user" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="指定用户ID (可选)">
              <el-select v-model="form.targetUserIds" multiple filterable allow-create style="width: 100%" placeholder="按用户ID精确指定，留空则按角色">
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="发送渠道">
              <el-checkbox v-model="form.channels.inApp">站内消息</el-checkbox>
              <el-checkbox v-model="form.channels.email">邮件</el-checkbox>
              <el-checkbox v-model="form.channels.sms">短信</el-checkbox>
              <el-checkbox v-model="form.channels.wechat">微信</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="消息模板">
              <el-input v-model="form.template" type="textarea" :rows="2" placeholder="支持 {name}, {applicationNo} 等占位符" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效范围">
              <el-select v-model="form.scope" multiple style="width: 100%" placeholder="留空全部生效">
                <el-option label="门户端" value="portal" />
                <el-option label="管理台" value="admin" />
                <el-option label="维保看板" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重复间隔(分钟)">
              <el-input-number v-model="form.reminderIntervalMinutes" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大重复次数">
              <el-input-number v-model="form.maxReminders" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { configApi } from '@/api'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<any[]>([])

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref('')

const formRef = ref<FormInstance>()
const form = reactive<any>({
  type: '',
  name: '',
  description: '',
  priority: 'medium',
  targetRoles: [] as string[],
  targetUserIds: [] as string[],
  channels: { inApp: true, email: false, sms: false, wechat: false },
  template: '',
  reminderIntervalMinutes: 0,
  maxReminders: 3,
  scope: [] as string[],
  enabled: true,
  needConfirmation: false,
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
}

function typeLabel(t: string) {
  const map: Record<string, string> = {
    application_submitted: '申请提交',
    application_approved: '申请通过',
    application_rejected: '申请驳回',
    safety_compliance: '安全合规',
    sample_unknown: '样本去向不明',
    maintenance_alert: '维保提醒',
    system_notice: '系统通知',
  }
  return map[t] || t
}
function priorityLabel(p: string) {
  return { low: '低', medium: '中', high: '高', urgent: '紧急' }[p] || p
}
function priorityType(p: string) {
  return { low: 'info', medium: '', high: 'warning', urgent: 'danger' }[p] || ''
}
function roleLabel(r: string) {
  const map: Record<string, string> = {
    super_admin: '超管', admin: '管理员', reagent_manager: '试剂管理员',
    lab_manager: '实验室主管', researcher: '研究员', user: '普通用户',
  }
  return map[r] || r
}

async function loadData() {
  loading.value = true
  try {
    list.value = await configApi.listNotificationConfigs()
  } finally {
    loading.value = false
  }
}

function handleEdit(row: any) {
  isEdit.value = true
  editId.value = row._id
  Object.assign(form, {
    type: row.type,
    name: row.name,
    description: row.description || '',
    priority: row.priority,
    targetRoles: row.targetRoles || [],
    targetUserIds: row.targetUserIds || [],
    channels: {
      inApp: row.channels?.inApp ?? true,
      email: row.channels?.email ?? false,
      sms: row.channels?.sms ?? false,
      wechat: row.channels?.wechat ?? false,
    },
    template: row.template || '',
    reminderIntervalMinutes: row.reminderIntervalMinutes || 0,
    maxReminders: row.maxReminders || 3,
    scope: row.scope || [],
    enabled: row.enabled,
    needConfirmation: row.needConfirmation || false,
  })
  showDialog.value = true
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await configApi.updateNotificationConfig(editId.value, form)
        ElMessage.success('更新成功')
      } else {
        await configApi.createNotificationConfig(form)
        ElMessage.success('创建成功')
      }
      showDialog.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadData)
</script>
