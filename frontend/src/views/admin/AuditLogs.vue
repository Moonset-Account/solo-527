<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="font-display text-2xl font-bold text-inkBlack">审计日志</h1>
      <el-button @click="exportLogs">导出日志</el-button>
    </div>

    <div class="bg-white rounded-card shadow-sm p-6 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索操作人/IP"
          clearable
          class="w-64"
          @input="fetchLogs"
        />
        <el-select
          v-model="filters.auditable_type"
          placeholder="操作类型"
          clearable
          class="w-40"
          @change="fetchLogs"
        >
          <el-option label="课程" value="Course" />
          <el-option label="报名" value="Enrollment" />
          <el-option label="作品" value="Work" />
          <el-option label="材料包" value="MaterialKit" />
          <el-option label="用户" value="User" />
        </el-select>
        <el-select
          v-model="filters.action"
          placeholder="动作"
          clearable
          class="w-32"
          @change="fetchLogs"
        >
          <el-option label="创建" value="create" />
          <el-option label="更新" value="update" />
          <el-option label="删除" value="destroy" />
        </el-select>
        <el-date-picker
          v-model="filters.date_range"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="w-auto"
        />
      </div>
    </div>

    <div class="bg-white rounded-card shadow-sm overflow-hidden">
      <el-table :data="logs" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="action" label="动作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditable_type" label="对象类型" width="120">
          <template #default="{ row }">
            {{ getAuditableName(row.auditable_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="auditable_id" label="对象ID" width="100" />
        <el-table-column prop="user_name" label="操作人" width="120">
          <template #default="{ row }">
            {{ row.user?.name || '系统' }}
          </template>
        </el-table-column>
        <el-table-column prop="audited_changes" label="变更详情" min-width="300">
          <template #default="{ row }">
            <div class="text-sm space-y-1">
            <div
              v-for="(value, key) in row.audited_changes"
              :key="key"
              class="flex items-start"
            >
              <span class="text-wood-600 font-medium mr-2">{{ key }}:</span>
              <span v-if="Array.isArray(value)" class="text-warmGray">
                <span class="line-through text-red-500">{{ value[0] }}</span>
                <span class="mx-1">→</span>
                <span class="text-olive-600">{{ value[1] }}</span>
              </span>
              <span v-else class="text-warmGray">{{ value }}</span>
            </div>
          </div>
          </template>
        </el-table-column>
        <el-table-column prop="remote_address" label="IP地址" width="140" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="mt-6 flex justify-center">
      <el-pagination
        v-model:current-page="filters.page"
        :page-size="filters.per_page"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchLogs"
      />
    </div>

    <el-dialog v-model="showDetail" title="日志详情" width="600px">
      <div v-if="currentLog" class="space-y-4">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作ID">
            <el-tag :type="getActionType(currentLog.action)">
              {{ getActionText(currentLog.action) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="对象类型">
            {{ getAuditableName(currentLog.auditable_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="对象ID">{{ currentLog.auditable_id }}</el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ currentLog.user?.name || '系统' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.remote_address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ formatDateTime(currentLog.created_at) }}
          </el-descriptions-item>
        </el-descriptions>

        <div>
          <h4 class="font-medium text-inkBlack mb-2">变更详情</h4>
          <div class="bg-wood-50 p-4 rounded-lg space-y-2">
            <div
              v-for="(value, key) in currentLog.audited_changes"
              :key="key"
              class="flex items-start"
            >
              <span class="text-wood-700 font-medium w-24 shrink-0">{{ key }}:</span>
              <div v-if="Array.isArray(value)" class="flex-1">
                <span class="text-red-500 line-through">{{ value[0] || '(空)' }}</span>
                <span class="mx-2 text-warmGray">→</span>
                <span class="text-olive-600">{{ value[1] || '(空)' }}</span>
              </div>
              <span v-else class="flex-1 text-warmGray">{{ value }}</span>
            </div>
          </div>
        </div>

        <div v-if="currentLog.comment">
          <h4 class="font-medium text-inkBlack mb-2">备注</h4>
          <p class="text-warmGray">{{ currentLog.comment }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { AuditLog } from '@/types'
import { getAuditLogs } from '@/api/auditLogs'

const loading = ref(false)
const logs = ref<AuditLog[]>([])
const total = ref(0)
const showDetail = ref(false)
const currentLog = ref<AuditLog | null>(null)

const filters = reactive({
  keyword: '',
  auditable_type: '',
  action: '',
  date_range: null as Date[] | null,
  page: 1,
  per_page: 20
})

const getActionType = (action: string) => {
  const types: Record<string, any> = {
    create: 'success',
    update: 'primary',
    destroy: 'danger'
  }
  return types[action] || 'info'
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = {
    create: '创建',
    update: '更新',
    destroy: '删除'
  }
  return texts[action] || action
}

const getAuditableName = (type: string) => {
  const names: Record<string, string> = {
    Course: '课程',
    Enrollment: '报名',
    Work: '作品',
    MaterialKit: '材料包',
    User: '用户',
    Teacher: '老师',
    Schedule: '排期',
    Review: '评价'
  }
  return names[type] || type
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params: any = { ...filters }
    const response: any = await getAuditLogs(params)
    logs.value = response.data || []
    total.value = response.meta?.total_count || 0
  } catch (e) {
    logs.value = [
      {
        id: 1,
        action: 'create',
        auditable_type: 'Enrollment',
        auditable_id: 45,
        audited_changes: {
          status: ['pending', 'paid'],
          amount_paid: [0, 299]
        },
        user: { name: '张小美' },
        remote_address: '192.168.1.100',
        created_at: '2024-01-15T14:30:00',
        comment: '用户完成支付'
      },
      {
        id: 2,
        action: 'update',
        auditable_type: 'MaterialKit',
        auditable_id: 2,
        audited_changes: {
          stock: [15, 8],
          status: ['in_stock', 'low_stock']
        },
        user: { name: '管理员' },
        remote_address: '192.168.1.1',
        created_at: '2024-01-15T10:15:00'
      },
      {
        id: 3,
        action: 'update',
        auditable_type: 'Work',
        auditable_id: 12,
        audited_changes: {
          review_status: ['pending', 'approved'],
          is_public: [false, true]
        },
        user: { name: '管理员' },
        remote_address: '192.168.1.1',
        created_at: '2024-01-14T16:45:00',
        comment: '作品审核通过，授权公开展示'
      },
      {
        id: 4,
        action: 'create',
        auditable_type: 'Course',
        auditable_id: 13,
        audited_changes: {
          title: [null, '高级陶艺雕塑'],
          price: [null, 499],
          category: [null, 'pottery']
        },
        user: { name: '管理员' },
        remote_address: '192.168.1.1',
        created_at: '2024-01-14T09:20:00'
      },
      {
        id: 5,
        action: 'destroy',
        auditable_type: 'Schedule',
        auditable_id: 28,
        audited_changes: {},
        user: { name: '管理员' },
        remote_address: '192.168.1.1',
        created_at: '2024-01-13T15:30:00',
        comment: '取消排期'
      }
    ]
    total.value = 25
  } finally {
    loading.value = false
  }
}

const viewDetail = (row: AuditLog) => {
  currentLog.value = row
  showDetail.value = true
}

const exportLogs = () => {
  // 导出功能占位
  console.log('Export logs')
}

onMounted(() => {
  fetchLogs()
})
</script>
