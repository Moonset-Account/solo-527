<template>
  <div class="lead-list-container">
    <div class="page-header">
      <span class="page-title">线索列表</span>
      <el-button type="primary" :icon="Plus" @click="handleCreate">新建线索</el-button>
    </div>

    <FilterBar
      :show-keyword="true"
      :show-date-range="true"
      :show-owner="true"
      :status-options="statusOptions"
      :user-list="userList"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="table-container">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="leadNo" label="线索编号" width="140" />
        <el-table-column prop="projectName" label="项目名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="customerName" label="客户姓名" width="100" />
        <el-table-column prop="customerPhone" label="电话" width="130" />
        <el-table-column prop="source" label="来源" width="110">
          <template #default="{ row }">
            {{ getLeadSourceName(row.source) }}
          </template>
        </el-table-column>
        <el-table-column prop="followStage" label="跟进阶段" width="110">
          <template #default="{ row }">
            {{ getFollowStageName(row.followStage) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="leadStatusMap" />
          </template>
        </el-table-column>
        <el-table-column prop="ownerName" label="负责人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="handleAssign(row)">分配</el-button>
            <el-button type="success" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="handleAddFollow(row)">新增跟进</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination-container"
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadList"
        @current-change="loadList"
      />
    </div>

    <el-dialog v-model="assignDialogVisible" title="分配线索" width="400px">
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="负责人">
          <el-select v-model="assignForm.ownerId" placeholder="请选择负责人" style="width: 100%">
            <el-option v-for="user in userList" :key="user.id" :label="user.nickname || user.username" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="followDialogVisible" title="新增跟进" width="500px">
      <el-form :model="followForm" label-width="80px">
        <el-form-item label="跟进方式">
          <el-select v-model="followForm.followType" placeholder="请选择跟进方式" style="width: 100%">
            <el-option label="电话" value="PHONE" />
            <el-option label="微信" value="WECHAT" />
            <el-option label="面谈" value="MEETING" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容">
          <el-input v-model="followForm.content" type="textarea" :rows="4" placeholder="请输入跟进内容" />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker v-model="followForm.nextFollowTime" type="datetime" placeholder="选择下次跟进时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmFollow">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import FilterBar from '@/components/FilterBar.vue'
import StatusTag from '@/components/StatusTag.vue'
import { getLeadList, assignLead } from '@/api/lead'
import { createFollow } from '@/api/follow'
import { getUserList } from '@/api/user'
import { getDictOptions, LEAD_STATUS, LEAD_SOURCE, FOLLOW_STAGE, getLeadSourceName, getFollowStageName } from '@/utils/dict'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const userList = ref([])

const statusOptions = getDictOptions(LEAD_STATUS)

const leadStatusMap = {
  NEW: { label: '新建', type: 'primary' },
  FOLLOWING: { label: '跟进中', type: 'success' },
  MEASURED: { label: '已量房', type: 'warning' },
  DESIGNED: { label: '已出方案', type: 'warning' },
  QUOTED: { label: '已报价', type: 'warning' },
  NEGOTIATING: { label: '洽谈中', type: 'primary' },
  DEALED: { label: '已成交', type: 'success' },
  LOST: { label: '已流失', type: 'danger' },
  INVALID: { label: '无效', type: 'info' }
}

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const searchParams = reactive({})

const assignDialogVisible = ref(false)
const assignForm = reactive({
  leadId: null,
  ownerId: null
})

const followDialogVisible = ref(false)
const followForm = reactive({
  leadId: null,
  followType: '',
  content: '',
  nextFollowTime: null
})

const loadList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchParams,
      current: pagination.current,
      size: pagination.size
    }
    const res = await getLeadList(params)
    tableData.value = res.records || []
    pagination.total = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadUserList = async () => {
  try {
    const res = await getUserList()
    userList.value = res || []
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = (params) => {
  Object.assign(searchParams, params)
  pagination.current = 1
  loadList()
}

const handleReset = () => {
  Object.keys(searchParams).forEach(key => delete searchParams[key])
  pagination.current = 1
  loadList()
}

const handleCreate = () => {
  ElMessage.info('新建线索功能')
}

const handleView = (row) => {
  router.push(`/leads/${row.id}`)
}

const handleEdit = (row) => {
  ElMessage.info(`编辑线索：${row.leadNo}`)
}

const handleAssign = (row) => {
  assignForm.leadId = row.id
  assignForm.ownerId = row.ownerId
  assignDialogVisible.value = true
}

const confirmAssign = async () => {
  if (!assignForm.ownerId) {
    ElMessage.warning('请选择负责人')
    return
  }
  try {
    await assignLead(assignForm.leadId, assignForm.ownerId)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    loadList()
  } catch (e) {
    console.error(e)
  }
}

const handleAddFollow = (row) => {
  followForm.leadId = row.id
  followForm.followType = ''
  followForm.content = ''
  followForm.nextFollowTime = null
  followDialogVisible.value = true
}

const confirmFollow = async () => {
  if (!followForm.followType) {
    ElMessage.warning('请选择跟进方式')
    return
  }
  if (!followForm.content) {
    ElMessage.warning('请输入跟进内容')
    return
  }
  try {
    await createFollow(followForm)
    ElMessage.success('跟进记录已添加')
    followDialogVisible.value = false
    loadList()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadList()
  loadUserList()
})
</script>
