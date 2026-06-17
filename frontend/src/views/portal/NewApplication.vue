<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">新建领用申请</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div class="card-shadow">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用途" prop="purpose">
              <el-input v-model="form.purpose" type="textarea" :rows="2" placeholder="请输入领用用途" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联课题">
              <el-select v-model="form.projectId" placeholder="选择课题（可选）" clearable filterable style="width: 100%">
                <el-option v-for="p in projects" :key="p._id" :label="`${p.projectNo} - ${p.name}`" :value="p._id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计领用日期">
              <el-date-picker v-model="form.expectedPickDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="detail-section">
          <div class="section-title">试剂清单</div>
          <el-table :data="form.items" border>
            <el-table-column label="试剂" width="300">
              <template #default="{ row }">
                <el-select
                  v-model="row.reagentId"
                  filterable
                  remote
                  placeholder="搜索试剂"
                  :remote-method="searchReagents"
                  :loading="searching"
                  style="width: 100%"
                  @change="onReagentChange(row)"
                >
                  <el-option v-for="r in reagentOptions" :key="r._id" :label="`${r.name} (${r.batchNo || '无批号'})`" :value="r._id">
                    <span style="float: left">{{ r.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">
                      库存: {{ r.availableQuantity }}{{ r.unit }}
                    </span>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="规格型号">
              <template #default="{ row }">
                <el-input v-model="row.specification" placeholder="规格/批号" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="0.001" :precision="3" style="width: 120px" />
                <span style="margin-left: 8px">{{ row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column label="备注" width="200">
              <template #default="{ row }">
                <el-input v-model="row.remarks" placeholder="可选" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button style="margin-top: 12px" @click="addItem">
            <el-icon><Plus /></el-icon>添加试剂
          </el-button>
        </div>

        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">提交申请</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { applicationApi, projectApi, reagentApi } from '@/api'
import type { Reagent, Project } from '@/types'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const searching = ref(false)

const reagentOptions = ref<Reagent[]>([])
const projects = ref<Project[]>([])

const form = reactive({
  purpose: '',
  projectId: '',
  expectedPickDate: '',
  contactPhone: '',
  items: [
    { reagentId: '', reagentName: '', reagentBatchNo: '', specification: '', quantity: 1, unit: '', remarks: '' },
  ] as any[],
})

const rules: FormRules = {
  purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }],
}

function addItem() {
  form.items.push({ reagentId: '', reagentName: '', reagentBatchNo: '', specification: '', quantity: 1, unit: '', remarks: '' })
}

function removeItem(index: number) {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一项试剂')
  }
}

async function searchReagents(keyword: string) {
  if (!keyword) return
  searching.value = true
  try {
    const res = await reagentApi.list({ keyword, pageSize: 20, page: 1 })
    reagentOptions.value = res.list
  } finally {
    searching.value = false
  }
}

function onReagentChange(row: any) {
  const reagent = reagentOptions.value.find((r) => r._id === row.reagentId)
  if (reagent) {
    row.reagentName = reagent.name
    row.reagentBatchNo = reagent.batchNo || ''
    row.unit = reagent.unit
    if (!row.specification) row.specification = reagent.specification || ''
  }
}

function validateItems() {
  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i]
    if (!item.reagentId) {
      ElMessage.error(`第 ${i + 1} 项请选择试剂`)
      return false
    }
    if (!item.quantity || item.quantity <= 0) {
      ElMessage.error(`第 ${i + 1} 项数量必须大于0`)
      return false
    }
  }
  return true
}

async function saveDraft() {
  if (!validateItems()) return
  try {
    await applicationApi.create(form)
    ElMessage.success('已保存为草稿')
    router.push('/portal/applications')
  } catch {}
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (!validateItems()) return
    submitting.value = true
    try {
      const created = await applicationApi.create(form)
      await applicationApi.submit(created._id)
      ElMessage.success('申请已提交')
      router.push('/portal/applications')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  try {
    const res = await projectApi.list({ pageSize: 100, page: 1 })
    projects.value = res.list
  } catch {}
})
</script>
