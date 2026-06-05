<template>
  <div class="work-zones">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>作业区域</span>
          <el-button type="primary" size="small" @click="openDialog()">
            新增区域
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="区域名称">
          <el-input v-model="searchForm.name" placeholder="请输入" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="危险区域">
          <el-select v-model="searchForm.requires_second_approval" placeholder="全部" clearable style="width: 120px">
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchList">搜索</el-button>
          <el-button size="small" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="区域名称" width="150" />
        <el-table-column prop="code" label="区域编码" width="120" />
        <el-table-column prop="location" label="位置" show-overflow-tooltip />
        <el-table-column label="区域类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.zone_type === 'dangerous' ? 'danger' : 'success'" size="small">
              {{ row.zone_type === 'dangerous' ? '危险' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="max_capacity" label="最大容量" width="100" />
        <el-table-column prop="time_restrictions" label="时段限制" width="120" show-overflow-tooltip />
        <el-table-column label="二级审批" width="100">
          <template #default="{ row }">
            <el-tag :type="row.requires_second_approval ? 'warning' : 'info'" size="small">
              {{ row.requires_second_approval ? '需要' : '不需要' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑区域' : '新增区域'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="区域编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入区域编码" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入位置" />
        </el-form-item>
        <el-form-item label="区域类型" prop="zone_type">
          <el-select v-model="form.zone_type" placeholder="请选择区域类型" @change="handleZoneTypeChange">
            <el-option label="普通区域" value="normal" />
            <el-option label="危险区域" value="dangerous" />
            <el-option label="限制区域" value="restricted" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大容量" prop="max_capacity">
          <el-input-number v-model="form.max_capacity" :min="0" :max="10000" style="width: 100%" placeholder="0表示不限制" />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">同时在该区域的最大人数</div>
        </el-form-item>
        <el-form-item label="时段限制" prop="time_restrictions">
          <el-input v-model="form.time_restrictions" placeholder="如：08:00-18:00，留空表示不限制" />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">允许作业的时段，多个时段用逗号分隔</div>
        </el-form-item>
        <el-form-item label="需要二级审批" prop="requires_second_approval">
          <el-switch v-model="form.requires_second_approval" active-text="是" inactive-text="否" />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">危险区域默认开启</div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
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
import { workZonesApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)

const searchForm = reactive({
  name: '',
  requires_second_approval: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const form = reactive({
  name: '',
  code: '',
  location: '',
  zone_type: 'normal',
  max_capacity: 0,
  time_restrictions: '',
  requires_second_approval: false,
  description: ''
})

const handleZoneTypeChange = (val) => {
  if (val === 'dangerous') {
    form.requires_second_approval = true
  }
}

const rules = {
  name: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入区域编码', trigger: 'blur' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    const res = await workZonesApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.requires_second_approval = ''
  page.value = 1
  fetchList()
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  currentId.value = row?.id
  if (row) {
    Object.assign(form, {
      name: row.name,
      code: row.code,
      location: row.location,
      zone_type: row.zone_type || 'normal',
      max_capacity: row.max_capacity || 0,
      time_restrictions: row.time_restrictions || '',
      requires_second_approval: row.requires_second_approval,
      description: row.description
    })
  } else {
    Object.assign(form, {
      name: '',
      code: '',
      location: '',
      zone_type: 'normal',
      max_capacity: 0,
      time_restrictions: '',
      requires_second_approval: false,
      description: ''
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await workZonesApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await workZonesApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (e) {}
}

onMounted(() => {
  fetchList()
})
</script>
