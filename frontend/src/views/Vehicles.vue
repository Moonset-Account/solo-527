<template>
  <div class="vehicles">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>车辆管理</span>
          <el-button type="primary" size="small" @click="openDialog()">
            新增车辆
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.plate_number" placeholder="请输入" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.blacklisted" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="false" />
            <el-option label="已拉黑" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchList">搜索</el-button>
          <el-button size="small" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column prop="vehicle_type" label="车辆类型" width="100" />
        <el-table-column prop="owner_name" label="车主姓名" width="100" />
        <el-table-column prop="owner_phone" label="联系电话" width="130" />
        <el-table-column prop="company" label="所属单位" show-overflow-tooltip />
        <el-table-column prop="blacklisted" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.blacklisted ? 'danger' : 'success'" size="small">
              {{ row.blacklisted ? '已拉黑' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <template v-if="!row.blacklisted">
              <el-button type="danger" size="small" @click="handleBlacklist(row)">
                拉黑
              </el-button>
            </template>
            <template v-else>
              <el-button type="success" size="small" @click="handleRemoveBlacklist(row)">
                解除
              </el-button>
            </template>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑车辆' : '新增车辆'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="车牌号" prop="plate_number">
          <el-input v-model="form.plate_number" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="车辆类型" prop="vehicle_type">
          <el-input v-model="form.vehicle_type" placeholder="如：货车、轿车、挖掘机" />
        </el-form-item>
        <el-form-item label="车主姓名" prop="owner_name">
          <el-input v-model="form.owner_name" placeholder="请输入车主姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="owner_phone">
          <el-input v-model="form.owner_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="所属单位" prop="company">
          <el-input v-model="form.company" placeholder="请输入所属单位" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="blacklistVisible" title="拉黑车辆" width="500px">
      <el-form label-width="80px">
        <el-form-item label="拉黑原因">
          <el-input v-model="blacklistReason" type="textarea" :rows="3" placeholder="请输入拉黑原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="blacklistVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBlacklist">确认拉黑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { vehiclesApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)

const searchForm = reactive({
  plate_number: '',
  blacklisted: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const form = reactive({
  plate_number: '',
  vehicle_type: '',
  owner_name: '',
  owner_phone: '',
  company: '',
  remark: ''
})

const rules = {
  plate_number: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  vehicle_type: [{ required: true, message: '请输入车辆类型', trigger: 'blur' }],
  owner_name: [{ required: true, message: '请输入车主姓名', trigger: 'blur' }],
  owner_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const blacklistVisible = ref(false)
const blacklistReason = ref('')
const currentBlacklistId = ref(null)

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    const res = await vehiclesApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.plate_number = ''
  searchForm.blacklisted = ''
  page.value = 1
  fetchList()
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  currentId.value = row?.id
  if (row) {
    Object.assign(form, {
      plate_number: row.plate_number,
      vehicle_type: row.vehicle_type,
      owner_name: row.owner_name,
      owner_phone: row.owner_phone,
      company: row.company,
      remark: row.remark
    })
  } else {
    Object.assign(form, {
      plate_number: '',
      vehicle_type: '',
      owner_name: '',
      owner_phone: '',
      company: '',
      remark: ''
    })
  }
  dialogVisible.value = true
}

const viewDetail = async (row) => {
  try {
    const res = await vehiclesApi.detail(row.id)
    ElMessageBox.alert(
      `<div>
        <p><strong>车牌号：</strong>${res.plate_number}</p>
        <p><strong>车辆类型：</strong>${res.vehicle_type}</p>
        <p><strong>车主姓名：</strong>${res.owner_name}</p>
        <p><strong>联系电话：</strong>${res.owner_phone}</p>
        <p><strong>所属单位：</strong>${res.company}</p>
        <p><strong>状态：</strong>${res.blacklisted ? '已拉黑' : '正常'}</p>
        <p><strong>备注：</strong>${res.remark || '无'}</p>
      </div>`,
      '车辆详情',
      { dangerouslyUseHTMLString: true }
    )
  } catch (e) {}
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await vehiclesApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await vehiclesApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (e) {}
}

const handleBlacklist = (row) => {
  currentBlacklistId.value = row.id
  blacklistReason.value = ''
  blacklistVisible.value = true
}

const confirmBlacklist = async () => {
  if (!blacklistReason.value.trim()) {
    ElMessage.warning('请输入拉黑原因')
    return
  }
  try {
    await vehiclesApi.blacklist(currentBlacklistId.value, blacklistReason.value)
    ElMessage.success('已拉黑')
    blacklistVisible.value = false
    fetchList()
  } catch (e) {}
}

const handleRemoveBlacklist = async (row) => {
  try {
    await ElMessageBox.confirm('确定解除该车辆的黑名单吗？', '提示', { type: 'warning' })
    await vehiclesApi.blacklist(row.id)
    ElMessage.success('已解除')
    fetchList()
  } catch (e) {}
}

onMounted(() => {
  fetchList()
})
</script>
