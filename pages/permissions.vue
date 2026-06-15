<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">权限管理</h1>
        <p class="text-slate-500 mt-1">管理数据访问权限和脱敏规则</p>
      </div>
      <div class="flex bg-slate-100 rounded-lg p-1">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="activeTab === tab.value ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'approvals'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <button
            v-for="status in statusTabs"
            :key="status.value"
            class="px-4 py-2 text-sm rounded-lg transition-colors"
            :class="statusFilter === status.value ? 'bg-primary-50 text-primary-600 font-medium' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'"
            @click="statusFilter = status.value"
          >
            {{ status.label }}
          </button>
        </div>
        <button class="btn-primary flex items-center gap-1.5">
          <Plus class="w-4 h-4" />
          新建申请
        </button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="table-header">申请人</th>
              <th class="table-header">申请类型</th>
              <th class="table-header">数据集/指标</th>
              <th class="table-header">申请原因</th>
              <th class="table-header">申请时间</th>
              <th class="table-header">状态</th>
              <th class="table-header text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="app in filteredApprovals" :key="app.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="table-cell">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
                    {{ app.applicantName.charAt(0) }}
                  </div>
                  <span class="font-medium text-slate-700">{{ app.applicantName }}</span>
                </div>
              </td>
              <td class="table-cell">
                <span class="text-slate-600">{{ getPermissionTypeText(app.permissionType) }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-600">{{ app.datasetName || '-' }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-500 text-sm max-w-xs truncate block">{{ app.reason }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-500 text-sm">{{ formatDate(app.createdAt) }}</span>
              </td>
              <td class="table-cell">
                <span class="badge" :class="'badge-' + getStatusBadge(app.status)">
                  {{ getStatusText(app.status) }}
                </span>
              </td>
              <td class="table-cell text-right">
                <div class="flex justify-end gap-2">
                  <button class="text-slate-500 hover:text-slate-700 text-sm">详情</button>
                  <template v-if="app.status === 'pending'">
                    <button class="text-danger-500 hover:text-danger-600 text-sm font-medium" @click="rejectApp(app)">
                      驳回
                    </button>
                    <button class="text-success-600 hover:text-success-700 text-sm font-medium" @click="approveApp(app)">
                      通过
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'data-masking'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-500">配置字段级数据脱敏规则，按角色控制可见性</p>
        <button class="btn-primary flex items-center gap-1.5">
          <Plus class="w-4 h-4" />
          添加字段
        </button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="table-header w-16">字段名</th>
              <th class="table-header">显示名称</th>
              <th class="table-header w-32">脱敏类型</th>
              <th class="table-header">角色配置</th>
              <th class="table-header w-24 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="config in dataMaskingConfigs" :key="config.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="table-cell">
                <span class="font-mono text-sm text-slate-700">{{ config.fieldName }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-700">{{ config.displayName }}</span>
              </td>
              <td class="table-cell">
                <select
                  v-model="config.maskType"
                  class="select text-xs py-1.5"
                  @change="updateMaskType(config)"
                >
                  <option value="none">不脱敏</option>
                  <option value="partial">部分脱敏</option>
                  <option value="full">完全脱敏</option>
                </select>
              </td>
              <td class="table-cell">
                <div class="flex flex-wrap gap-1">
                  <span v-for="role in getRolesForMaskType(config.maskType)" :key="role" class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                    {{ role }}
                  </span>
                  <span v-if="getRolesForMaskType(config.maskType).length === 0" class="text-xs text-slate-400">
                    全部角色
                  </span>
                </div>
              </td>
              <td class="table-cell text-right">
                <button class="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  配置
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card p-5">
        <h3 class="text-base font-semibold text-slate-800 mb-4">脱敏效果预览</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="p-4 bg-slate-50 rounded-lg">
            <p class="text-xs text-slate-500 mb-2">不脱敏</p>
            <p class="text-sm text-slate-700">13812345678</p>
            <p class="text-sm text-slate-700 mt-1">张三</p>
          </div>
          <div class="p-4 bg-warning-50 rounded-lg">
            <p class="text-xs text-slate-500 mb-2">部分脱敏</p>
            <p class="text-sm text-slate-700">138****5678</p>
            <p class="text-sm text-slate-700 mt-1">张*</p>
          </div>
          <div class="p-4 bg-danger-50 rounded-lg">
            <p class="text-xs text-slate-500 mb-2">完全脱敏</p>
            <p class="text-sm text-slate-700">***********</p>
            <p class="text-sm text-slate-700 mt-1">***</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'roles'" class="space-y-4">
      <div class="grid md:grid-cols-3 gap-4">
        <div v-for="role in roles" :key="role.id" class="card p-5 hover:shadow-card-hover transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Shield class="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">{{ role.name }}</h3>
                <p class="text-xs text-slate-500">{{ role.description }}</p>
              </div>
            </div>
            <button class="text-slate-400 hover:text-slate-600">
              <MoreVertical class="w-5 h-5" />
            </button>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">{{ getUserCount(role.id) }} 名用户</span>
            <button class="text-primary-500 hover:text-primary-600 font-medium">管理权限</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Shield, MoreVertical } from 'lucide-vue-next'
import dayjs from 'dayjs'
import type { PermissionApplication, DataMaskingConfig, Role } from '~/types'

const tabs = [
  { value: 'approvals', label: '权限审批' },
  { value: 'data-masking', label: '数据脱敏' },
  { value: 'roles', label: '角色管理' }
]

const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' }
]

const activeTab = ref('approvals')
const statusFilter = ref('all')

const applications = ref<PermissionApplication[]>([])
const dataMaskingConfigs = ref<DataMaskingConfig[]>([])
const roles = ref<Role[]>([])

const filteredApprovals = computed(() => {
  if (statusFilter.value === 'all') return applications.value
  return applications.value.filter(a => a.status === statusFilter.value)
})

const getPermissionTypeText = (type: string): string => {
  const map: Record<string, string> = {
    'dataset_view': '数据集查看',
    'dataset_edit': '数据集编辑',
    'metric_view': '指标查看',
    'admin': '管理员权限'
  }
  return map[type] || type
}

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'secondary'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return '待审批'
    case 'approved': return '已通过'
    case 'rejected': return '已驳回'
    default: return status
  }
}

const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getRolesForMaskType = (maskType: string): string[] => {
  if (maskType === 'none') return []
  if (maskType === 'partial') return ['业务负责人', '供应链经理']
  return ['销售总监', '数据管理员', '业务负责人']
}

const getUserCount = (roleId: string): number => {
  const counts: Record<string, number> = {
    'role_admin': 1,
    'role_sales_director': 1,
    'role_data_admin': 2,
    'role_business_owner': 8,
    'role_supply_chain': 3
  }
  return counts[roleId] || 0
}

const approveApp = async (app: PermissionApplication) => {
  if (!confirm('确定通过此申请？')) return
  try {
    await $fetch(`/api/permissions/applications/${app.id}/approve`, {
      method: 'POST',
      body: { approverId: 'user_director', approverName: '张总监' }
    })
    app.status = 'approved'
  } catch (e) {
    console.error('Failed to approve:', e)
  }
}

const rejectApp = async (app: PermissionApplication) => {
  const reason = prompt('请输入驳回原因：')
  if (!reason) return
  try {
    await $fetch(`/api/permissions/applications/${app.id}/reject`, {
      method: 'POST',
      body: { approverId: 'user_director', approverName: '张总监', comment: reason }
    })
    app.status = 'rejected'
  } catch (e) {
    console.error('Failed to reject:', e)
  }
}

const updateMaskType = async (config: DataMaskingConfig) => {
  try {
    await $fetch('/api/permissions/data-masking', {
      method: 'PATCH',
      body: config
    })
  } catch (e) {
    console.error('Failed to update masking config:', e)
  }
}

const fetchData = async () => {
  try {
    const [appsRes, masking, rolesData] = await Promise.all([
      $fetch('/api/permissions/applications'),
      $fetch('/api/permissions/data-masking'),
      Promise.resolve([
        { id: 'role_admin', name: '系统管理员', description: '拥有系统全部权限' },
        { id: 'role_sales_director', name: '销售总监', description: '查看全部经营数据，审批权限' },
        { id: 'role_data_admin', name: '数据管理员', description: '维护权限配置和数据规则' },
        { id: 'role_business_owner', name: '业务负责人', description: '查看所辖数据，处理待办' },
        { id: 'role_supply_chain', name: '供应链经理', description: '处理供应链相关异常' }
      ])
    ])

    applications.value = (appsRes as any).items || []
    dataMaskingConfigs.value = masking as DataMaskingConfig[]
    roles.value = rolesData
  } catch (e) {
    console.error('Failed to fetch permissions data:', e)
  }
}

onMounted(() => {
  fetchData()
})

definePageMeta({
  layout: 'default'
})
</script>
