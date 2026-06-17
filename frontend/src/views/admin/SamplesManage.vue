<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">样本管理</h2>
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增样本
      </el-button>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-input v-model="filter.keyword" placeholder="搜索样本编号/名称" clearable style="width: 220px" />
        <el-select v-model="filter.status" placeholder="状态" clearable style="width: 140px">
          <el-option
            v-for="(label, key) in SampleStatusLabel"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-switch v-model="filter.unknownOnly" active-text="去向不明" />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sampleCode" label="样本编号" width="160" />
        <el-table-column prop="name" label="样本名称" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="source" label="来源" width="140" />
        <el-table-column label="数量">
          <template #default="{ row }">{{ row.quantity || '-' }} {{ row.unit || '' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'unknown' ? 'danger' : row.status === 'in_use' ? 'warning' : 'success'" size="small">
              {{ SampleStatusLabel[row.status as keyof typeof SampleStatusLabel] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storageLocation" label="存放位置" width="140" />
        <el-table-column label="当前持有人" width="120">
          <template #default="{ row }">{{ row.currentHolderName || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleStatus(row)">更新状态</el-button>
            <el-button
              v-if="row.status !== 'unknown'"
              link
              type="danger"
              @click="markUnknown(row)"
            >标记去向不明</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 16px"
        background
        @current-change="loadData"
      />
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑样本' : '新增样本'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="样本编号" prop="sampleCode">
              <el-input v-model="form.sampleCode" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="样本名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型">
              <el-input v-model="form.type" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-input v-model="form.source" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数量">
              <el-input-number v-model="form.quantity" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option
                  v-for="(label, key) in SampleStatusLabel"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置">
              <el-input v-model="form.storageLocation" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="持有人">
              <el-select v-model="form.currentHolderId" filterable clearable style="width: 100%">
                <el-option v-for="u in users" :key="u._id" :label="u.realName" :value="u._id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remarks" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showStatusDialog" title="更新样本状态" width="480px">
      <el-form label-width="100px">
        <el-form-item label="目标状态">
          <el-select v-model="statusForm.status" style="width: 100%">
            <el-option
              v-for="(label, key) in SampleStatusLabel"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="statusForm.location" />
        </el-form-item>
        <el-form-item label="持有人">
          <el-select v-model="statusForm.holderId" filterable clearable style="width: 100%">
            <el-option v-for="u in users" :key="u._id" :label="u.realName" :value="u._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="statusForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitStatus">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { sampleApi, userApi } from '@/api'
import { SampleStatusLabel, type Sample, type User } from '@/types'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<Sample[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const users = ref<User[]>([])

const showDialog = ref(false)
const showStatusDialog = ref(false)
const isEdit = ref(false)
const editId = ref('')
const statusTargetId = ref('')

const filter = reactive({
  keyword: '',
  status: '',
  unknownOnly: false,
})

const formRef = ref<FormInstance>()
const form = reactive<any>({
  sampleCode: '', name: '', type: '', source: '', quantity: 0, unit: '',
  status: 'storage', storageLocation: '', currentHolderId: '', remarks: '',
})

const statusForm = reactive({
  status: '', location: '', holderId: '', remark: '',
})

const rules: FormRules = {
  sampleCode: [{ required: true, message: '请输入编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await sampleApi.list({ ...filter, page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    sampleCode: '', name: '', type: '', source: '', quantity: 0, unit: '',
    status: 'storage', storageLocation: '', currentHolderId: '', remarks: '',
  })
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        ElMessage.success('更新成功')
      } else {
        await sampleApi.create(form)
        ElMessage.success('创建成功')
      }
      showDialog.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

function handleStatus(row: Sample) {
  statusTargetId.value = row._id
  statusForm.status = row.status
  statusForm.location = row.storageLocation || ''
  statusForm.holderId = row.currentHolderId || ''
  statusForm.remark = ''
  showStatusDialog.value = true
}

async function submitStatus() {
  submitting.value = true
  try {
    await sampleApi.updateStatus(statusTargetId.value, statusForm)
    ElMessage.success('更新成功')
    showStatusDialog.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function markUnknown(row: Sample) {
  try {
    await ElMessageBox.confirm(`确定将样本 ${row.sampleCode} 标记为去向不明？这将触发试剂管理员通知。`, '提示', { type: 'warning' })
    await sampleApi.updateStatus(row._id, { status: 'unknown' as any, remark: '管理员标记去向不明' })
    ElMessage.success('已标记，已通知试剂管理员')
    loadData()
  } catch {}
}

onMounted(async () => {
  loadData()
  try {
    const res = await userApi.list({ pageSize: 1000, page: 1 })
    users.value = res.list
  } catch {}
})
</script>
