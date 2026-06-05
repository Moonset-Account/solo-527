<template>
  <div class="credentials">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>证件管理</span>
          <el-button type="primary" size="small" @click="openDialog()">
            新增证件
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="证件号">
          <el-input v-model="searchForm.number" placeholder="请输入" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.credential_type" placeholder="全部" clearable style="width: 120px">
            <el-option label="身份证" value="id_card" />
            <el-option label="驾驶证" value="driver_license" />
            <el-option label="操作证" value="operation_cert" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.verified" placeholder="全部" clearable style="width: 120px">
            <el-option label="已核验" :value="true" />
            <el-option label="待核验" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchList">搜索</el-button>
          <el-button size="small" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="持有人" width="100">
          <template #default="{ row }">
            {{ row.person?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="credential_type" label="证件类型" width="100">
          <template #default="{ row }">
            {{ getTypeName(row.credential_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="number" label="证件号码" width="180" />
        <el-table-column prop="issued_by" label="签发机关" show-overflow-tooltip />
        <el-table-column prop="valid_until" label="有效期至" width="120">
          <template #default="{ row }">
            {{ formatDate(row.valid_until) }}
          </template>
        </el-table-column>
        <el-table-column prop="verified" label="核验状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.verified ? 'success' : 'warning'" size="small">
              {{ row.verified ? '已核验' : '待核验' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button v-if="!row.verified" type="primary" size="small" @click="handleVerify(row)">
              核验
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="perPage"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑证件' : '新增证件'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="所属人员" prop="person_id">
          <el-select v-model="form.person_id" placeholder="请选择人员" filterable style="width: 100%">
            <el-option v-for="p in peopleList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件类型" prop="credential_type">
          <el-select v-model="form.credential_type" placeholder="请选择类型">
            <el-option label="身份证" value="id_card" />
            <el-option label="驾驶证" value="driver_license" />
            <el-option label="操作证" value="operation_cert" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件号码" prop="number">
          <el-input v-model="form.number" placeholder="请输入证件号码" />
        </el-form-item>
        <el-form-item label="签发机关" prop="issued_by">
          <el-input v-model="form.issued_by" placeholder="请输入签发机关" />
        </el-form-item>
        <el-form-item label="签发日期" prop="issued_at">
          <el-date-picker v-model="form.issued_at" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="有效期至" prop="valid_until">
          <el-date-picker v-model="form.valid_until" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { credentialsApi, peopleApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
const peopleList = ref([])

const searchForm = reactive({
  number: '',
  credential_type: '',
  verified: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const form = reactive({
  person_id: '',
  credential_type: '',
  number: '',
  issued_by: '',
  issued_at: '',
  valid_until: ''
})

const rules = {
  person_id: [{ required: true, message: '请选择人员', trigger: 'change' }],
  credential_type: [{ required: true, message: '请选择证件类型', trigger: 'change' }],
  number: [{ required: true, message: '请输入证件号码', trigger: 'blur' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    const res = await credentialsApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const fetchPeople = async () => {
  try {
    const res = await peopleApi.list({ per_page: 100 })
    peopleList.value = res.data
  } catch (e) {}
}

const resetSearch = () => {
  searchForm.number = ''
  searchForm.credential_type = ''
  searchForm.verified = ''
  page.value = 1
  fetchList()
}

const getTypeName = (type) => {
  const map = { id_card: '身份证', driver_license: '驾驶证', operation_cert: '操作证', other: '其他' }
  return map[type] || type
}

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'

const openDialog = (row = null) => {
  isEdit.value = !!row
  currentId.value = row?.id
  if (row) {
    Object.assign(form, {
      person_id: row.person_id,
      credential_type: row.credential_type,
      number: row.number,
      issued_by: row.issued_by,
      issued_at: row.issued_at,
      valid_until: row.valid_until
    })
  } else {
    Object.assign(form, {
      person_id: '',
      credential_type: '',
      number: '',
      issued_by: '',
      issued_at: '',
      valid_until: ''
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await credentialsApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await credentialsApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (e) {}
}

const handleVerify = async (row) => {
  try {
    await ElMessageBox.confirm('确定核验该证件吗？', '提示', { type: 'success' })
    await credentialsApi.verify(row.id)
    ElMessage.success('核验成功')
    fetchList()
  } catch (e) {}
}

onMounted(() => {
  fetchList()
  fetchPeople()
})
</script>
