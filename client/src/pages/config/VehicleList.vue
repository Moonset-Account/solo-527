<template>
  <div>
    <PageHeader title="车辆档案" subtitle="管理车辆档案信息" />
    <a-card>
      <div class="flex justify-between mb-4">
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索车牌号、车主姓名、手机号"
          style="width: 300px"
          @search="loadData"
          enter-button
        />
        <a-button type="primary" @click="handleAdd">
          <template #icon><Plus /></template>
          新增
        </a-button>
      </div>
      <a-table
        :columns="columns"
        :data-source="data"
        :pagination="pagination"
        @change="handlePageChange"
        row-key="id"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm title="确定删除此车辆档案吗？" @confirm="handleDelete(record.id)">
              <a class="text-red-500">删除</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑车辆' : '新增车辆'"
      @ok="handleSubmit"
      :confirm-loading="submitting"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="车牌号" name="plateNumber">
              <a-input v-model:value="formData.plateNumber" placeholder="请输入车牌号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="VIN码" name="vin">
              <a-input v-model:value="formData.vin" placeholder="请输入VIN码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="品牌" name="brand">
              <a-input v-model:value="formData.brand" placeholder="请输入品牌" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="型号" name="model">
              <a-input v-model:value="formData.model" placeholder="请输入型号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="车主姓名" name="ownerName">
              <a-input v-model:value="formData.ownerName" placeholder="请输入车主姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="车主电话" name="ownerPhone">
              <a-input v-model:value="formData.ownerPhone" placeholder="请输入车主电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="里程数" name="mileage">
              <a-input-number v-model:value="formData.mileage" placeholder="里程数" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="上次保养日期" name="lastMaintenanceDate">
              <a-date-picker
                v-model:value="formData.lastMaintenanceDate"
                format="YYYY-MM-DD"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import { getVehicleList, createVehicle, updateVehicle, deleteVehicle } from '@/api/vehicles'
import type { Vehicle } from '@/types'
import type { TablePaginationConfig } from 'ant-design-vue'

const keyword = ref('')
const loading = ref(false)
const data = ref<Vehicle[]>([])
const pagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })
const modalVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)

const formData = reactive({
  plateNumber: '',
  vin: '',
  brand: '',
  model: '',
  ownerName: '',
  ownerPhone: '',
  mileage: null as number | null,
  lastMaintenanceDate: null as Dayjs | null
})

const rules = {
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  ownerPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const columns = [
  { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
  { title: '品牌', dataIndex: 'brand', key: 'brand' },
  { title: '型号', dataIndex: 'model', key: 'model' },
  { title: 'VIN', dataIndex: 'vin', key: 'vin' },
  { title: '车主姓名', dataIndex: 'ownerName', key: 'ownerName' },
  { title: '车主电话', dataIndex: 'ownerPhone', key: 'ownerPhone' },
  { title: '里程数', dataIndex: 'mileage', key: 'mileage' },
  { title: '上次保养日期', dataIndex: 'lastMaintenanceDate', key: 'lastMaintenanceDate' },
  { title: '操作', key: 'action', width: 150 }
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await getVehicleList({
      page: pagination.value.current || 1,
      pageSize: pagination.value.pageSize || 10,
      keyword: keyword.value
    })
    data.value = res.list
    pagination.value.total = res.total
  } catch (e) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: TablePaginationConfig) => {
  pagination.value = page
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    plateNumber: '',
    vin: '',
    brand: '',
    model: '',
    ownerName: '',
    ownerPhone: '',
    mileage: null,
    lastMaintenanceDate: null
  })
  modalVisible.value = true
}

const handleEdit = (record: Vehicle) => {
  isEdit.value = true
  editId.value = record.id
  Object.assign(formData, {
    plateNumber: record.plateNumber,
    vin: record.vin || '',
    brand: record.brand,
    model: record.model,
    ownerName: record.ownerName,
    ownerPhone: record.ownerPhone,
    mileage: record.mileage || null,
    lastMaintenanceDate: record.lastMaintenanceDate ? dayjs(record.lastMaintenanceDate) : null
  })
  modalVisible.value = true
}

const handleDelete = async (id: number) => {
  try {
    await deleteVehicle(id)
    message.success('删除成功')
    loadData()
  } catch (e) {
    message.error('删除失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    const submitData = {
      ...formData,
      year: new Date().getFullYear(),
      lastMaintenanceDate: formData.lastMaintenanceDate?.format('YYYY-MM-DD')
    }
    if (isEdit.value && editId.value) {
      await updateVehicle(editId.value, submitData)
      message.success('更新成功')
    } else {
      await createVehicle(submitData as any)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) message.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
