<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Odometer /></el-icon>
        工作台
        <span style="font-weight:normal;font-size:14px;color:#909399;margin-left:8px;">
          欢迎回来，{{ userStore.userInfo?.nickname }}
        </span>
      </h2>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <div class="stat-card">
          <div class="flex-between">
            <div>
              <div class="stat-label">选题总数</div>
              <div class="stat-value">{{ todoStore.topicStats.total || 0 }}</div>
            </div>
            <el-icon :size="36" color="#409EFF"><Collection /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="flex-between">
            <div>
              <div class="stat-label">脚本总数</div>
              <div class="stat-value">{{ todoStore.scriptStats.total || 0 }}</div>
            </div>
            <el-icon :size="36" color="#67C23A"><Document /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="flex-between">
            <div>
              <div class="stat-label">待办事项</div>
              <div class="stat-value" style="color:#E6A23C;">{{ pendingTotal }}</div>
            </div>
            <el-icon :size="36" color="#E6A23C"><Clock /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="flex-between">
            <div>
              <div class="stat-label">异常待处理</div>
              <div class="stat-value" style="color:#F56C6C;">{{ abnormalTodo }}</div>
            </div>
            <el-icon :size="36" color="#F56C6C"><Warning /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <div class="content-card">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">选题快速通道</h3>
            <el-button type="primary" size="small" @click="$router.push('/topic/create')">
              <el-icon><Plus /></el-icon>提交新选题
            </el-button>
          </div>
          <el-table :data="topicOverview" size="small" style="margin-top:10px;">
            <el-table-column prop="label" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.type">{{ row.label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" width="100" align="center" />
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button type="primary" link size="small" @click="$router.push('/topic')">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="content-card">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">脚本快速通道</h3>
            <el-button type="success" size="small" @click="$router.push('/script/create')">
              <el-icon><Plus /></el-icon>提交新脚本
            </el-button>
          </div>
          <el-table :data="scriptOverview" size="small" style="margin-top:10px;">
            <el-table-column prop="label" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.type">{{ row.label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" width="100" align="center" />
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button type="primary" link size="small" @click="$router.push('/script')">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="content-card">
      <div class="flex-between mb-10">
        <h3 style="margin:0;">快捷入口</h3>
      </div>
      <el-row :gutter="16">
        <el-col :span="4">
          <div class="quick-entry" @click="$router.push('/topic/create')">
            <el-icon :size="32" color="#409EFF"><EditPen /></el-icon>
            <span>提交选题</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-entry" @click="$router.push('/script/create')">
            <el-icon :size="32" color="#67C23A"><DocumentAdd /></el-icon>
            <span>提交脚本</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-entry" @click="$router.push('/review')">
            <el-icon :size="32" color="#E6A23C"><View /></el-icon>
            <span>审核追溯</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-entry" @click="$router.push('/abnormal')">
            <el-icon :size="32" color="#F56C6C"><Warning /></el-icon>
            <span>异常中心</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-entry" @click="$router.push('/dashboard')">
            <el-icon :size="32" color="#909399"><DataAnalysis /></el-icon>
            <span>数据复盘</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-entry" @click="$router.push('/productivity')">
            <el-icon :size="32" color="#409EFF"><TrendCharts /></el-icon>
            <span>产能复盘</span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTodoStore } from '../stores/todo'
import { useUserStore } from '../stores/user'
import { getTopicOverview, getScriptOverview } from '../api/topic'
import { getScriptOverview as getScriptOv } from '../api/script'

const todoStore = useTodoStore()
const userStore = useUserStore()

const topicOverview = ref([
  { label: '待办', value: 1, type: 'info', count: 0 },
  { label: '处理中', value: 2, type: 'warning', count: 0 },
  { label: '已完成', value: 3, type: 'success', count: 0 },
  { label: '异常', value: 4, type: 'danger', count: 0 }
])
const scriptOverview = ref([
  { label: '待办', value: 1, type: 'info', count: 0 },
  { label: '处理中', value: 2, type: 'warning', count: 0 },
  { label: '已完成', value: 3, type: 'success', count: 0 },
  { label: '异常', value: 4, type: 'danger', count: 0 }
])

const pendingTotal = computed(() =>
  (todoStore.topicStats.pending || 0) +
  (todoStore.scriptStats.pending || 0) +
  (todoStore.abnormalStats.pending || 0)
)
const abnormalTodo = computed(() =>
  (todoStore.abnormalStats.pending || 0) + (todoStore.abnormalStats.processing || 0)
)

onMounted(async () => {
  todoStore.fetchTodoStats()
  try {
    const t = await getTopicOverview()
    if (t.data) {
      topicOverview.value[0].count = t.data.pending || 0
      topicOverview.value[1].count = t.data.processing || 0
      topicOverview.value[2].count = t.data.completed || 0
      topicOverview.value[3].count = t.data.abnormal || 0
    }
    const s = await getScriptOv()
    if (s.data) {
      scriptOverview.value[0].count = s.data.pending || 0
      scriptOverview.value[1].count = s.data.processing || 0
      scriptOverview.value[2].count = s.data.completed || 0
      scriptOverview.value[3].count = s.data.abnormal || 0
    }
  } catch (e) {
    console.error(e)
    topicOverview.value = [
      { label: '待办', value: 1, type: 'info', count: 2 },
      { label: '处理中', value: 2, type: 'warning', count: 1 },
      { label: '已完成', value: 3, type: 'success', count: 2 },
      { label: '异常', value: 4, type: 'danger', count: 0 }
    ]
    scriptOverview.value = [
      { label: '待办', value: 1, type: 'info', count: 1 },
      { label: '处理中', value: 2, type: 'warning', count: 1 },
      { label: '已完成', value: 3, type: 'success', count: 2 },
      { label: '异常', value: 4, type: 'danger', count: 0 }
    ]
  }
})
</script>

<style scoped lang="scss">
.quick-entry {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ecf5ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  span {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: #606266;
  }
}
</style>
