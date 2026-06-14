<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">品牌合作管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新建合作
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent="loadData">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="品牌名称/合作编号" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item label="合作阶段">
          <el-select v-model="filters.stage" placeholder="全部" clearable style="width: 140px;">
            <el-option v-for="s in dictStore.getDict('partnership_stage')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px;">
            <el-option v-for="s in dictStore.getDict('partnership_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filters.priority" placeholder="全部" clearable style="width: 100px;">
            <el-option v-for="p in dictStore.getDict('priority')" :key="p.key" :label="p.label" :value="p.key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 查询</el-button>
          <el-button @click="resetFilters"><el-icon><Refresh /></el-icon> 重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="code" label="合作编号" width="130" />
        <el-table-column label="品牌信息" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="font-medium">{{ row.brandName }}</div>
              <div class="text-muted text-sm">{{ row.brandIndustry || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" width="180">
          <template #default="{ row }">
            <div>
              <div>{{ row.contactName || '-' }}</div>
              <div class="text-muted text-sm">{{ row.contactPhone || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="合同金额" width="140">
          <template #default="{ row }">
            <span class="font-medium">¥{{ formatMoney(row.contractAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row }">
            <el-tag :color="dictStore.getDictColor('partnership_stage', row.currentStage)" effect="dark">
              {{ dictStore.getDictLabel('partnership_stage', row.currentStage) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'paused' ? 'warning' : 'info'" size="small">
              {{ dictStore.getDictLabel('partnership_status', row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'normal' ? 'warning' : 'info'" size="small">
              {{ dictStore.getDictLabel('priority', row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="110">
          <template #default="{ row }">
            {{ row.responsibleUser?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row.id)">详情</el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="perPage"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑合作' : '新建合作'" width="640px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="品牌名称" prop="brandName">
              <el-input v-model="form.brandName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属行业" prop="brandIndustry">
              <el-input v-model="form.brandIndustry" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="form.contactName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.contactPhone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱">
              <el-input v-model="form.contactEmail" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同金额">
              <el-input-number v-model="form.contractAmount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前阶段">
              <el-select v-model="form.currentStage" style="width: 100%;">
                <el-option v-for="s in dictStore.getDict('partnership_stage')" :key="s.key" :label="s.label" :value="s.key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="form.priority" style="width: 100%;">
                <el-option v-for="p in dictStore.getDict('priority')" :key="p.key" :label="p.label" :value="p.key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option v-for="s in dictStore.getDict('partnership_status')" :key="s.key" :label="s.label" :value="s.key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计签约日期">
              <el-date-picker v-model="form.expectedSignDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注说明">
              <el-input v-model="form.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { partnershipApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'
import { formatMoney, formatDateTime } from '@/utils'

const router = useRouter()
const dictStore = useDictStore()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const filters = reactive({ keyword: '', stage: '', status: '', priority: '' })

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const form = reactive<any>({
  brandName: '', brandIndustry: '', contactName: '', contactPhone: '', contactEmail: '',
  contractAmount: null, currentStage: 'lead', priority: 'normal', status: 'active',
  expectedSignDate: '', description: ''
})

const rules: FormRules = {
  brandName: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await partnershipApi.list({ page: page.value, perPage: perPage.value, ...filters })
    list.value = res.data || res.data || []
    total.value = res.meta?.total || res.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, { keyword: '', stage: '', status: '', priority: '' })
  page.value = 1
  loadData()
}

const viewDetail = (id: number) => {
  router.push(`/partnerships/${id}`)
}

const openCreateDialog = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    brandName: '', brandIndustry: '', contactName: '', contactPhone: '', contactEmail: '',
    contractAmount: null, currentStage: 'lead', priority: 'normal', status: 'active',
    expectedSignDate: '', description: ''
  })
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value && editId.value) {
        await partnershipApi.update(editId.value, form)
        ElMessage.success('更新成功')
      } else {
        await partnershipApi.create(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadData)
</script>
