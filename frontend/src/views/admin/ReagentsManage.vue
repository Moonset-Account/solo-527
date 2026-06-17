<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">试剂管理</h2>
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增试剂
      </el-button>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-input v-model="filter.keyword" placeholder="名称/CAS/批号" clearable style="width: 200px" />
        <el-select v-model="filter.category" placeholder="分类" clearable style="width: 140px">
          <el-option v-for="c in categoryDict" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
        <el-switch v-model="filter.lowStock" active-text="库存预警" />
        <el-switch v-model="filter.nearExpiry" active-text="近效期" />
        <el-switch v-model="filter.isHazardous" active-text="危化品" />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="试剂名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column prop="casNo" label="CAS号" width="130" />
        <el-table-column prop="batchNo" label="批号" width="120" />
        <el-table-column label="规格" width="140">
          <template #default="{ row }">{{ row.specification || '-' }} {{ row.purity || '' }}</template>
        </el-table-column>
        <el-table-column label="库存" width="140">
          <template #default="{ row }">
            <span :style="{ color: row.availableQuantity <= row.warningThreshold ? '#f56c6c' : '' }">
              {{ row.availableQuantity }} / {{ row.totalQuantity }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="预警值" width="90">
          <template #default="{ row }">{{ row.warningThreshold }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="有效期" width="110">
          <template #default="{ row }">
            <span :style="{ color: isNearExpiry(row.expiryDate) ? '#f56c6c' : '' }">
              {{ formatDate(row.expiryDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="危化" width="70">
          <template #default="{ row }">
            <el-tag v-if="row.isHazardous" type="danger" size="small">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleAdjust(row)">调库存</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑试剂' : '新增试剂'" width="720px" top="5vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="试剂名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称">
              <el-input v-model="form.nameEn" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="CAS号">
              <el-input v-model="form.casNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择" style="width: 100%">
                <el-option v-for="c in categoryDict" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产厂家">
              <el-input v-model="form.manufacturer" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批号">
              <el-input v-model="form.batchNo" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总库存" prop="totalQuantity">
              <el-input-number v-model="form.totalQuantity" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="可用库存">
              <el-input-number v-model="form.availableQuantity" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" style="width: 100%">
                <el-option v-for="u in unitDict" :key="u.value" :label="u.label" :value="u.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预警阈值">
              <el-input-number v-model="form.warningThreshold" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="规格/纯度">
              <el-input v-model="form.specification" placeholder="如: AR / 99.5%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="有效期" prop="expiryDate">
              <el-date-picker v-model="form.expiryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否危化品">
              <el-switch v-model="form.isHazardous" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="危化类别" v-if="form.isHazardous">
              <el-select v-model="form.hazardousCategory" style="width: 100%">
                <el-option label="爆炸物" value="explosive" />
                <el-option label="易燃" value="flammable" />
                <el-option label="有毒" value="toxic" />
                <el-option label="腐蚀" value="corrosive" />
                <el-option label="氧化性" value="oxidizing" />
                <el-option label="放射性" value="radioactive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置">
              <el-input v-model="form.storageLocation" placeholder="位置/柜号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="储存温度(℃)">
              <el-input-number v-model="form.storageTemperature" style="width: 100%" />
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

    <el-dialog v-model="showAdjustDialog" title="调整库存" width="420px">
      <el-alert type="info" show-icon style="margin-bottom: 16px">
        当前库存: {{ adjustCurrent?.name }} - {{ adjustCurrent?.availableQuantity }} {{ adjustCurrent?.unit }}
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="调整数量">
          <el-input-number v-model="adjustForm.quantity" :precision="3" />
          <span style="margin-left: 8px; color: #909399">正数增加，负数减少</span>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdjustDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdjust">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { reagentApi, configApi } from '@/api'
import type { Reagent, DictionaryItem } from '@/types'
import dayjs from 'dayjs'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<Reagent[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDialog = ref(false)
const showAdjustDialog = ref(false)
const isEdit = ref(false)
const editId = ref('')
const adjustCurrent = ref<Reagent | null>(null)

const categoryDict = ref<DictionaryItem[]>([])
const unitDict = ref<DictionaryItem[]>([])

const filter = reactive({
  keyword: '',
  category: '',
  lowStock: false,
  nearExpiry: false,
  isHazardous: false,
})

const formRef = ref<FormInstance>()
const form = reactive<any>({
  name: '',
  nameEn: '',
  casNo: '',
  category: '',
  manufacturer: '',
  batchNo: '',
  totalQuantity: 0,
  availableQuantity: 0,
  unit: '',
  warningThreshold: 0,
  specification: '',
  expiryDate: '',
  isHazardous: false,
  hazardousCategory: '',
  storageLocation: '',
  storageTemperature: undefined,
  remarks: '',
})

const adjustForm = reactive({ quantity: 0, reason: '' })

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  totalQuantity: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择有效期', trigger: 'change' }],
}

function formatDate(d: string) {
  return d ? dayjs(d).format('YYYY-MM-DD') : '-'
}
function isNearExpiry(d: string) {
  return d && dayjs(d).diff(dayjs(), 'month') <= 3
}

function resetForm() {
  Object.assign(form, {
    name: '', nameEn: '', casNo: '', category: '', manufacturer: '', batchNo: '',
    totalQuantity: 0, availableQuantity: 0, unit: '', warningThreshold: 0,
    specification: '', expiryDate: '', isHazardous: false, hazardousCategory: '',
    storageLocation: '', storageTemperature: undefined, remarks: '',
  })
}

async function loadData() {
  loading.value = true
  try {
    const res = await reagentApi.list({ ...filter, page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleEdit(row: Reagent) {
  isEdit.value = true
  editId.value = row._id
  Object.assign(form, {
    name: row.name,
    nameEn: row.nameEn || '',
    casNo: row.casNo || '',
    category: row.category,
    manufacturer: row.manufacturer || '',
    batchNo: row.batchNo || '',
    totalQuantity: row.totalQuantity,
    availableQuantity: row.availableQuantity,
    unit: row.unit,
    warningThreshold: row.warningThreshold,
    specification: row.specification || '',
    expiryDate: row.expiryDate,
    isHazardous: row.isHazardous,
    hazardousCategory: row.hazardousCategory || '',
    storageLocation: row.storage?.location || '',
    storageTemperature: row.storage?.temperature,
    remarks: row.remarks || '',
  })
  showDialog.value = true
}

async function handleDelete(row: Reagent) {
  try {
    await ElMessageBox.confirm(`确定删除试剂 ${row.name}？`, '提示', { type: 'warning' })
    await reagentApi.remove(row._id)
    ElMessage.success('已删除')
    loadData()
  } catch {}
}

function handleAdjust(row: Reagent) {
  adjustCurrent.value = row
  adjustForm.quantity = 0
  adjustForm.reason = ''
  showAdjustDialog.value = true
}

async function submitAdjust() {
  if (!adjustCurrent.value) return
  submitting.value = true
  try {
    await reagentApi.adjustStock(adjustCurrent.value._id, adjustForm)
    ElMessage.success('调整成功')
    showAdjustDialog.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        ...form,
        storage: form.storageLocation || form.storageTemperature !== undefined ? {
          location: form.storageLocation,
          temperature: form.storageTemperature,
        } : undefined,
      }
      if (isEdit.value) {
        await reagentApi.update(editId.value, payload)
        ElMessage.success('更新成功')
      } else {
        await reagentApi.create(payload)
        ElMessage.success('创建成功')
      }
      showDialog.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

async function loadDicts() {
  try {
    [categoryDict.value, unitDict.value] = await Promise.all([
      configApi.getDictionaryItems('reagent_category'),
      configApi.getDictionaryItems('reagent_unit'),
    ])
  } catch {}
}

onMounted(() => {
  loadDicts()
  loadData()
})
</script>
