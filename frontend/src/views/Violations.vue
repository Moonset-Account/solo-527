<template>
  <div class="violations">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>违规管理</span>
          <el-button type="primary" size="small" @click="openDialog()">
            登记违规
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="违规类型">
          <el-select v-model="searchForm.violation_type" placeholder="全部" clearable style="width: 120px">
            <el-option label="无证进入" value="unauthorized_entry" />
            <el-option label="超时停留" value="overtime" />
            <el-option label="违规区域" value="restricted_zone" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-date-picker v-model="searchForm.month" type="month" placeholder="选择月份" style="width: 150px" value-format="YYYY-MM" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchList">搜索</el-button>
          <el-button size="small" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="violation_type" label="违规类型" width="120">
          <template #default="{ row }">
            {{ getTypeName(row.violation_type) }}
          </template>
        </el-table-column>
        <el-table-column label="违规人员" width="100">
          <template #default="{ row }">
            {{ row.person?.name }}
          </template>
        </el-table-column>
        <el-table-column label="通行证号" width="160">
          <template #default="{ row }">
            {{ row.pass?.pass_number }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="违规描述" show-overflow-tooltip />
        <el-table-column prop="penalty" label="处罚" width="120" />
        <el-table-column label="记录人" width="100">
          <template #default="{ row }">
            {{ row.recorded_by?.real_name }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑违规' : '登记违规'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="通行证" prop="pass_id">
          <el-select v-model="form.pass_id" placeholder="请选择通行证" filterable style="width: 100%">
            <el-option v-for="p in passesList" :key="p.id" :label="p.pass_number" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规类型" prop="violation_type">
          <el-select v-model="form.violation_type" placeholder="请选择类型">
            <el-option label="无证进入" value="unauthorized_entry" />
            <el-option label="超时停留" value="overtime" />
            <el-option label="违规区域" value="restricted_zone" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入违规描述" />
        </el-form-item>
        <el-form-item label="处罚" prop="penalty">
          <el-input v-model="form.penalty" placeholder="如：警告、冻结3天" />
        </el-form-item>
        <el-form-item label="是否冻结通行证">
          <el-switch v-model="form.freeze_pass" active-text="是" inactive-text="否" />
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
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { violationsApi, passesApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
const passesList = ref([])

const searchForm = reactive({
  violation_type: '',
  month: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const form = reactive({
  pass_id: '',
  violation_type: '',
  description: '',
  penalty: '',
  freeze_pass: false
})

const rules = {
  pass_id: [{ required: true, message: '请选择通行证', trigger: 'change' }],
  violation_type: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入违规描述', trigger: 'blur' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    const res = await violationsApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const fetchPasses = async () => {
  try {
    const res = await passesApi.list({ per_page: 100, status: 'approved' })
    passesList.value = res.data
  } catch (e) {}
}

const resetSearch = () => {
  searchForm.violation_type = ''
  searchForm.month = ''
  page.value = 1
  fetchList()
}

const getTypeName = (type) => {
  const map = { unauthorized_entry: '无证进入', overtime: '超时停留', restricted_zone: '违规区域', other: '其他' }
  return map[type] || type
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const openDialog = (row = null) => {
  isEdit.value = !!row
  currentId.value = row?.id
  if (row) {
    Object.assign(form, {
      pass_id: row.pass_id,
      violation_type: row.violation_type,
      description: row.description,
      penalty: row.penalty,
      freeze_pass: false
    })
  } else {
    Object.assign(form, {
      pass_id: '',
      violation_type: '',
      description: '',
      penalty: '',
      freeze_pass: false
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await violationsApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await violationsApi.create(form)
      ElMessage.success('登记成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (e) {}
}

onMounted(() => {
  fetchList()
  fetchPasses()
})
</script>
