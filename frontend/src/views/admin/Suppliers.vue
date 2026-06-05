<template>
  <div class="admin-suppliers">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>供应商管理</span>
          <el-button type="primary" icon="Plus" @click="openDialog()">新增供应商</el-button>
        </div>
      </template>

      <el-table :data="suppliers" v-loading="loading" stripe border>
        <el-table-column prop="code" label="供应商编码" width="150" />
        <el-table-column prop="name" label="供应商名称" min-width="200" />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteSupplier(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑供应商' : '新增供应商'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商编码" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="form.contact" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址">
              <el-input v-model="form.address" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSupplier">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const loading = ref(false)
const suppliers = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null, code: '', name: '', contact: '', phone: '', email: '', address: '', remark: ''
})

const rules = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

const loadSuppliers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/books/suppliers/', { params: { page_size: 100 } })
    suppliers.value = data.results
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { id: null, code: '', name: '', contact: '', phone: '', email: '', address: '', remark: '' })
  }
  dialogVisible.value = true
}

const saveSupplier = async () => {
  await formRef.value.validate()
  try {
    if (form.id) {
      await api.put(`/books/suppliers/${form.id}/`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/books/suppliers/', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadSuppliers()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteSupplier = async (row) => {
  await ElMessageBox.confirm('确定删除这个供应商吗？', '提示', { type: 'warning' })
  try {
    await api.delete(`/books/suppliers/${row.id}/`)
    ElMessage.success('删除成功')
    loadSuppliers()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(loadSuppliers)
</script>

<style lang="scss" scoped>
.admin-suppliers {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
