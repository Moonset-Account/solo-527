<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">发布排期</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新建排期
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">关键词：</span>
          <el-input v-model="filters.keyword" placeholder="内容标题" style="width: 200px" clearable @keyup.enter="loadList" />
        </div>
        <div class="filter-item">
          <span class="filter-label">状态：</span>
          <el-select v-model="filters.status" placeholder="全部" style="width: 140px" clearable>
            <el-option v-for="(v, k) in SCHEDULE_STATUS" :key="k" :label="v.label" :value="k" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">发布时间：</span>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">执行人：</span>
          <el-select v-model="filters.publisher" placeholder="全部" style="width: 140px" clearable>
            <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </div>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="contentTitle" label="内容标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="发布平台" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="p in row.platformIds" :key="p?._id || p" style="margin-right: 4px">
              {{ typeof p === 'object' ? p.name : PLATFORM_TYPE[p]?.label || p }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计划发布时间" width="180">
          <template #default="{ row }">{{ formatDate(row.scheduledTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="SCHEDULE_STATUS[row.status]?.type">{{ SCHEDULE_STATUS[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行人" width="100">
          <template #default="{ row }">{{ getUserById(row.publisher).name }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="markPublished(row)" v-if="row.status === 'pending'">标记发布</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑排期' : '新建排期'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="内容标题" prop="contentTitle">
          <el-input v-model="form.contentTitle" />
        </el-form-item>
        <el-form-item label="关联内容ID">
          <el-input v-model="form.contentId" placeholder="可选" />
        </el-form-item>
        <el-form-item label="发布平台" prop="platformIds">
          <el-select v-model="form.platformIds" multiple style="width: 100%">
            <el-option v-for="(v, k) in PLATFORM_TYPE" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间" prop="scheduledTime">
          <el-date-picker
            v-model="form.scheduledTime"
            type="datetime"
            placeholder="选择日期时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="执行人">
          <el-select v-model="form.publisher" style="width: 100%">
            <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { operationApi } from '@/api'
import { PLATFORM_TYPE, SCHEDULE_STATUS, USERS, getUserById, formatDate } from '@/utils/constants'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref()

const filters = reactive({ keyword: '', status: '', dateRange: [], publisher: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  contentId: '',
  contentTitle: '',
  platformIds: [],
  scheduledTime: '',
  publisher: '',
  remark: ''
})
const rules = {
  contentTitle: [{ required: true, message: '请输入内容标题', trigger: 'blur' }],
  platformIds: [{ required: true, message: '请选择发布平台', trigger: 'change' }],
  scheduledTime: [{ required: true, message: '请选择发布时间', trigger: 'change' }]
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      publisher: filters.publisher || undefined,
      startDate: filters.dateRange?.[0] || undefined,
      endDate: filters.dateRange?.[1] || undefined
    }
    const res = await operationApi.scheduleList(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, { keyword: '', status: '', dateRange: [], publisher: '' })
  pagination.page = 1
  loadList()
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    editId.value = row._id
    Object.assign(form, {
      contentId: row.contentId || '',
      contentTitle: row.contentTitle || '',
      platformIds: row.platformIds?.map(p => typeof p === 'object' ? p.platform : p) || [],
      scheduledTime: row.scheduledTime ? formatDate(row.scheduledTime) : '',
      publisher: row.publisher || '',
      remark: row.remark || ''
    })
  } else {
    editId.value = ''
    Object.assign(form, { contentId: '', contentTitle: '', platformIds: [], scheduledTime: '', publisher: '', remark: '' })
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  try {
    if (isEdit.value) {
      await operationApi.updateSchedule(editId.value, form)
      ElMessage.success('修改成功')
    } else {
      await operationApi.createSchedule(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {}
}

async function markPublished(row) {
  await operationApi.updateSchedule(row._id, { status: 'published' })
  ElMessage.success('已标记为已发布')
  loadList()
}

async function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除排期"${row.contentTitle}"吗?`, '提示', { type: 'warning' }).then(async () => {
    await operationApi.removeSchedule(row._id)
    ElMessage.success('删除成功')
    loadList()
  }).catch(() => {})
}

onMounted(loadList)
</script>
