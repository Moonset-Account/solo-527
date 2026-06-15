<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Warning /></el-icon>异常记录
        <span style="font-weight:normal;font-size:13px;color:#909399;margin-left:10px;">按素材授权风险分类，新媒体运营写处理结论</span>
      </h2>
      <div>
        <el-tag type="danger" effect="dark" style="margin-right:12px;">
          <el-icon><WarningFilled /></el-icon> 待处理 {{ abnormalTodo }} 条
        </el-tag>
        <el-button type="danger" @click="$router.push('/abnormal/create')">
          <el-icon><Plus /></el-icon>上报异常
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6" v-for="s in abnormalStats" :key="s.key">
        <div class="stat-card">
          <div class="flex-between">
            <div>
              <div class="stat-label">{{ s.label }}</div>
              <div class="stat-value" :style="{ color: s.color }">{{ s.count }}</div>
            </div>
            <el-icon :size="34" :color="s.color"><component :is="s.icon" /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="search-bar">
      <el-form :inline="true" :model="query" @submit.prevent>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="标题/描述" clearable style="width:200px;" />
        </el-form-item>
        <el-form-item label="风险类型">
          <el-select v-model="query.abnormalType" placeholder="全部" clearable style="width:170px;">
            <el-option v-for="t in abnormalTypeOptions" :key="t.value" :label="t.label" :value="t.value">
              <el-tag :type="t.type" size="small">{{ t.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:140px;">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="content-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="title" label="异常标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="abnormalType" label="风险类型" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getAbnormalTypeTag(row.abnormalType).type" size="small" effect="dark">
              {{ getAbnormalTypeTag(row.abnormalType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessName" label="关联业务" min-width="160" show-overflow-tooltip />
        <el-table-column prop="reporterName" label="上报人" width="90" />
        <el-table-column prop="handlerName" label="处理人" width="90">
          <template #default="{ row }">{{ row.handlerName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上报时间" width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status !== 3"
              type="success"
              link
              size="small"
              @click="openHandleDialog(row)"
            >
              处理结论
            </el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleChangeStatus(row, cmd)">
              <el-button type="warning" link size="small">
                改状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="s in statusOptions" :key="s.value" :command="s.value">
                    <el-tag :type="s.type" size="small">{{ s.label }}</el-tag>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:16px;text-align:right;"
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog v-model="detailVisible" title="异常详情" width="760px" destroy-on-close>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="异常标题" :span="2">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="风险类型">
          <el-tag :type="getAbnormalTypeTag(detail.abnormalType).type" effect="dark">
            {{ getAbnormalTypeTag(detail.abnormalType).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="getStatusTag(detail.status).type">
            {{ getStatusTag(detail.status).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联业务">{{ detail.businessName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上报人">{{ detail.reporterName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ detail.handlerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上报时间">{{ detail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ detail.handleTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="异常描述" :span="2">
          <div style="white-space:pre-wrap;">{{ detail.description }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="证据材料" :span="2">
          <div v-if="detail.evidence">
            <div v-for="(url, i) in parseEvidence(detail.evidence)" :key="i" style="margin-bottom:6px;">
              <el-link type="primary" :href="url" target="_blank">
                <el-icon><Picture /></el-icon>证据{{ i + 1 }}：{{ url }}
              </el-link>
            </div>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="处理结论" :span="2">
          <div v-if="detail.conclusion" style="padding:10px;background:#f0f9eb;border-left:3px solid #67C23A;border-radius:4px;white-space:pre-wrap;">
            {{ detail.conclusion }}
          </div>
          <el-empty v-else-if="detail.status !== 3" description="尚未处理" :image-size="80" />
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="detail && detail.status !== 3" type="success" @click="openHandleDialog(detail)">
          <el-icon><Edit /></el-icon>填写处理结论
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleVisible" title="新媒体运营处理" width="640px" destroy-on-close>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="mb-20"
        title="请认真填写处理结论，该记录将永久留存作为合规审计依据"
      />
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="异常标题">
          <el-input v-model="handleForm._title" disabled />
        </el-form-item>
        <el-form-item label="处理人">
          <el-select v-model="handleForm.handlerId" style="width:100%;" @change="onHandlerChange">
            <el-option v-for="h in operators" :key="h.id" :label="h.nickname" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结论" required>
          <el-input
            v-model="handleForm.conclusion"
            type="textarea"
            :rows="6"
            maxlength="1000"
            show-word-limit
            placeholder="请填写：1)风险识别情况 2)已采取措施 3)后续建议 4)是否需要升级上报"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="success" :loading="handing" @click="submitHandle">
          <el-icon><CircleCheck /></el-icon>提交结论并标记完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAbnormalPage,
  getAbnormalDetail,
  updateAbnormalStatus,
  handleAbnormal,
  getAbnormalOverview
} from '../../api/abnormal'
import { getOperatorList } from '../../api/user'
import {
  statusOptions,
  getStatusTag,
  abnormalTypeOptions,
  getAbnormalTypeTag
} from '../../utils/constants'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const detailVisible = ref(false)
const detail = ref(null)
const handleVisible = ref(false)
const handing = ref(false)
const operators = ref([])
const overview = ref({})

const query = reactive({
  keyword: '',
  abnormalType: null,
  status: null,
  current: 1,
  size: 10
})

const handleForm = reactive({
  id: null,
  conclusion: '',
  handlerId: null,
  handlerName: '',
  _title: ''
})

const abnormalTodo = computed(() =>
  (overview.value.pending || 0) + (overview.value.processing || 0)
)

const abnormalStats = computed(() => [
  { key: 'total', label: '异常总数', count: overview.value.total || 0, color: '#909399', icon: 'Files' },
  { key: 'pending', label: '待处理', count: overview.value.pending || 0, color: '#E6A23C', icon: 'Clock' },
  { key: 'processing', label: '处理中', count: overview.value.processing || 0, color: '#409EFF', icon: 'Loading' },
  { key: 'completed', label: '已解决', count: overview.value.completed || 0, color: '#67C23A', icon: 'CircleCheck' }
])

function parseEvidence(str) {
  if (!str) return []
  return str.split(',').filter(Boolean)
}

function onHandlerChange(id) {
  const h = operators.value.find(o => o.id === id)
  handleForm.handlerName = h?.nickname || ''
}

async function fetchOverview() {
  try {
    const res = await getAbnormalOverview()
    overview.value = res.data || {}
  } catch (e) {
    overview.value = { total: 3, pending: 1, processing: 1, completed: 1 }
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAbnormalPage(query)
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    console.error(e)
    applyMock()
  } finally {
    loading.value = false
  }
}

function applyMock() {
  tableData.value = [
    {
      id: 1, title: '脚本背景音乐版权风险',
      abnormalType: 4, abnormalTypeName: '背景音乐授权',
      businessId: 1, businessType: 'script', businessName: '防晒衣测评：这件居然比遮阳伞还顶用？',
      description: '脚本BGM使用了某流行歌曲片段，未获得商用授权，存在侵权风险',
      evidence: '/uploads/evidence/bgm1.png,/uploads/evidence/bgm2.png',
      reporterId: 4, reporterName: '陈审核',
      handlerId: 5, handlerName: '赵运营',
      status: 3, conclusion: '已更换为平台免费商用BGM《Sunny Day》，保留替换记录，联系版权方确认无风险',
      handleTime: '2026-06-10 15:30:00',
      createTime: '2026-06-09 10:20:00', updateTime: '2026-06-10 15:30:00'
    },
    {
      id: 2, title: '视频素材疑似未经授权的明星肖像',
      abnormalType: 2, abnormalTypeName: '肖像权风险',
      businessId: 2, businessType: 'script', businessName: '防晒衣避坑指南：3个指标教你选对',
      description: '脚本中引用的对比素材包含某明星街拍照片，未获得肖像授权',
      evidence: '/uploads/evidence/portrait1.jpg',
      reporterId: 4, reporterName: '陈审核',
      handlerId: 5, handlerName: '赵运营',
      status: 2, conclusion: null, handleTime: null,
      createTime: '2026-06-11 14:00:00', updateTime: '2026-06-12 09:10:00'
    },
    {
      id: 3, title: '产品Logo使用超出授权范围',
      abnormalType: 3, abnormalTypeName: '商标侵权风险',
      businessId: 3, businessType: 'script', businessName: '618必买清单Top5，错过等一年！',
      description: '脚本中展示了竞品品牌Logo用于对比，可能违反商标法相关规定',
      evidence: '/uploads/evidence/logo1.png',
      reporterId: 4, reporterName: '陈审核',
      handlerId: null, handlerName: null,
      status: 1, conclusion: null, handleTime: null,
      createTime: '2026-06-13 11:30:00', updateTime: '2026-06-13 11:30:00'
    }
  ]
  total.value = 3
}

function handleSearch() {
  query.current = 1
  fetchList()
}

function handleReset() {
  query.keyword = ''
  query.abnormalType = null
  query.status = null
  handleSearch()
}

async function handleView(row) {
  try {
    const res = await getAbnormalDetail(row.id)
    detail.value = res.data
  } catch (e) {
    detail.value = row
  }
  detailVisible.value = true
}

function openHandleDialog(row) {
  detailVisible.value = false
  handleForm.id = row.id
  handleForm._title = row.title
  handleForm.conclusion = row.conclusion || ''
  handleForm.handlerId = row.handlerId || userStore.userInfo?.id
  handleForm.handlerName = row.handlerName || userStore.userInfo?.nickname
  handleVisible.value = true
}

async function handleChangeStatus(row, status) {
  try {
    await ElMessageBox.confirm(`确定将异常状态改为"${getStatusTag(status).label}"吗？`, '提示', { type: 'warning' })
    await updateAbnormalStatus(row.id, status)
    ElMessage.success('状态更新成功')
    fetchList()
    fetchOverview()
  } catch (e) {}
}

async function submitHandle() {
  if (!handleForm.conclusion?.trim()) {
    ElMessage.warning('请填写处理结论')
    return
  }
  handing.value = true
  try {
    await handleAbnormal({
      id: handleForm.id,
      conclusion: handleForm.conclusion,
      handlerId: handleForm.handlerId,
      handlerName: handleForm.handlerName
    })
    ElMessage.success('处理结论已提交')
    handleVisible.value = false
    fetchList()
    fetchOverview()
  } catch (e) {
    console.error(e)
    ElMessage.success('处理结论已提交（模拟）')
    handleVisible.value = false
    fetchList()
    fetchOverview()
  } finally {
    handing.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getOperatorList()
    operators.value = res.data || []
    if (!operators.value.length) {
      operators.value = [{ id: 5, nickname: '赵运营' }]
    }
  } catch (e) {
    operators.value = [{ id: 5, nickname: '赵运营' }]
  }
  fetchOverview()
  fetchList()
})
</script>
