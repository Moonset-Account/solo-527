<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">原始单据管理</h2>
      <el-alert
        title="采购单、入库单、送检单、检测报告等原始凭证，与试剂、申请、样本、课题建立关联，作为审计追溯依据。"
        type="info"
        show-icon
        :closable="false"
        style="margin-left: 20px; max-width: 550px"
      />
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>上传单据
      </el-button>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-input v-model="filter.keyword" placeholder="搜索单据编号/标题" clearable style="width: 240px" />
        <el-select v-model="filter.documentType" placeholder="单据类型" clearable style="width: 160px">
          <el-option label="采购单" value="purchase" />
          <el-option label="入库单" value="stock_in" />
          <el-option label="领用单" value="stock_out" />
          <el-option label="送检单" value="inspection" />
          <el-option label="检测报告" value="report" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="documentNo" label="单据编号" width="180" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ typeLabel(row.documentType) }}</template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column prop="documentDate" label="单据日期" width="120">
          <template #default="{ row }">{{ row.documentDate?.split('T')[0] }}</template>
        </el-table-column>
        <el-table-column label="关联试剂" width="100">
          <template #default="{ row }">{{ row.relatedReagentIds?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="关联申请" width="100">
          <template #default="{ row }">{{ row.relatedApplicationIds?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="关联样本" width="100">
          <template #default="{ row }">{{ row.relatedSampleIds?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="关联课题" width="100">
          <template #default="{ row }">{{ row.relatedProjectIds?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="uploadedByName" label="上传人" width="100" />
        <el-table-column prop="createdAt" label="上传时间" width="170">
          <template #default="{ row }">{{ row.createdAt?.replace('T', ' ').slice(0, 19) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
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

    <el-dialog v-model="showDialog" title="上传原始单据" width="640px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单据编号" prop="documentNo">
              <el-input v-model="form.documentNo" placeholder="唯一编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单据类型" prop="documentType">
              <el-select v-model="form.documentType" style="width: 100%">
                <el-option label="采购单" value="purchase" />
                <el-option label="入库单" value="stock_in" />
                <el-option label="领用单" value="stock_out" />
                <el-option label="送检单" value="inspection" />
                <el-option label="检测报告" value="report" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单据日期">
              <el-date-picker v-model="form.documentDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-input v-model="form.source" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件">
              <el-input v-model="form.fileUrl" placeholder="文件URL或路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联试剂">
              <el-select v-model="form.relatedReagentIds" multiple filterable style="width: 100%">
                <el-option v-for="r in reagents" :key="r._id" :label="r.name" :value="r._id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联申请">
              <el-select v-model="form.relatedApplicationIds" multiple filterable style="width: 100%">
                <el-option v-for="a in applications" :key="a._id" :label="a.applicationNo" :value="a._id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联样本">
              <el-select v-model="form.relatedSampleIds" multiple filterable style="width: 100%">
                <el-option v-for="s in samples" :key="s._id" :label="s.sampleCode" :value="s._id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联课题">
              <el-select v-model="form.relatedProjectIds" multiple filterable style="width: 100%">
                <el-option v-for="p in projects" :key="p._id" :label="p.name" :value="p._id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" :rows="2" />
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
import { dashboardApi, reagentApi, applicationApi, sampleApi, projectApi } from '@/api'
import type { OriginalDocument, Reagent, Application, Sample, Project } from '@/types'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<OriginalDocument[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDialog = ref(false)
const reagents = ref<Reagent[]>([])
const applications = ref<Application[]>([])
const samples = ref<Sample[]>([])
const projects = ref<Project[]>([])

const filter = reactive({ keyword: '', documentType: '' })

const formRef = ref<FormInstance>()
const form = reactive<any>({
  documentNo: '', title: '', documentType: '', documentDate: '', source: '',
  fileUrl: '', fileName: '', description: '',
  relatedReagentIds: [] as string[],
  relatedApplicationIds: [] as string[],
  relatedSampleIds: [] as string[],
  relatedProjectIds: [] as string[],
})

const rules: FormRules = {
  documentNo: [{ required: true, message: '请输入单据编号', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  documentType: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

function typeLabel(t: string) {
  return {
    purchase: '采购单', stock_in: '入库单', stock_out: '领用单',
    inspection: '送检单', report: '检测报告', other: '其他',
  }[t] || t
}

function viewDetail(row: OriginalDocument) {
  ElMessage.info(`单据 ${row.documentNo} 详情`)
}

async function loadData() {
  loading.value = true
  try {
    const res = await dashboardApi.listDocuments({ ...filter, page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await dashboardApi.createDocument(form)
      ElMessage.success('上传成功')
      showDialog.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  loadData()
  try {
    const [r, a, s, p] = await Promise.all([
      reagentApi.list({ pageSize: 50, page: 1 }),
      applicationApi.list({ pageSize: 50, page: 1 }),
      sampleApi.list({ pageSize: 50, page: 1 }),
      projectApi.list({ pageSize: 50, page: 1 }),
    ])
    reagents.value = r.list
    applications.value = a.list
    samples.value = s.list
    projects.value = p.list
  } catch {}
})
</script>
