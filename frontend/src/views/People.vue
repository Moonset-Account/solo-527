<template>
  <div class="people">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>人员管理</span>
          <el-button type="primary" size="small" @click="openDialog()">
            新增人员
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="身份证">
          <el-input v-model="searchForm.id_card" placeholder="请输入" clearable style="width: 150px" />
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
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="company" label="所属单位" show-overflow-tooltip />
        <el-table-column prop="blacklisted" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.blacklisted ? 'danger' : 'success'" size="small">
              {{ row.blacklisted ? '已拉黑' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑人员' : '新增人员'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="form.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
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

    <el-dialog v-model="blacklistVisible" title="拉黑人员" width="500px">
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
import dayjs from 'dayjs'
import { peopleApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)

const searchForm = reactive({
  name: '',
  id_card: '',
  blacklisted: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const form = reactive({
  name: '',
  id_card: '',
  phone: '',
  company: '',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  id_card: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  company: [{ required: true, message: '请输入所属单位', trigger: 'blur' }]
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
    const res = await peopleApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.id_card = ''
  searchForm.blacklisted = ''
  page.value = 1
  fetchList()
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const openDialog = (row = null) => {
  isEdit.value = !!row
  currentId.value = row?.id
  if (row) {
    Object.assign(form, {
      name: row.name,
      id_card: row.id_card,
      phone: row.phone,
      company: row.company,
      remark: row.remark
    })
  } else {
    Object.assign(form, {
      name: '',
      id_card: '',
      phone: '',
      company: '',
      remark: ''
    })
  }
  dialogVisible.value = true
}

const viewDetail = async (row) => {
  try {
    const res = await peopleApi.detail(row.id)
    ElMessageBox.alert(
      `<div>
        <p><strong>姓名：</strong>${res.name}</p>
        <p><strong>身份证号：</strong>${res.id_card}</p>
        <p><strong>联系电话：</strong>${res.phone}</p>
        <p><strong>所属单位：</strong>${res.company}</p>
        <p><strong>状态：</strong>${res.blacklisted ? '已拉黑' : '正常'}</p>
        <p><strong>备注：</strong>${res.remark || '无'}</p>
      </div>`,
      '人员详情',
      { dangerouslyUseHTMLString: true }
    )
  } catch (e) {}
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await peopleApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await peopleApi.create(form)
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
    await peopleApi.blacklist(currentBlacklistId.value, blacklistReason.value)
    ElMessage.success('已拉黑')
    blacklistVisible.value = false
    fetchList()
  } catch (e) {}
}

const handleRemoveBlacklist = async (row) => {
  try {
    await ElMessageBox.confirm('确定解除该人员的黑名单吗？', '提示', { type: 'warning' })
    await peopleApi.removeBlacklist(row.id)
    ElMessage.success('已解除')
    fetchList()
  } catch (e) {}
}

onMounted(() => {
  fetchList()
})
</script>
