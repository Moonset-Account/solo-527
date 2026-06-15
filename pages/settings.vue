<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">系统设置</h1>
      <p class="text-slate-500 mt-1">管理用户、角色和系统配置</p>
    </div>

    <div class="flex gap-4 border-b border-slate-200">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === tab.value ? 'text-primary-600 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-700'"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'users'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" v-model="searchKeyword" placeholder="搜索用户..." class="input pl-9 w-64" />
        </div>
        <button class="btn-primary flex items-center gap-1.5">
          <UserPlus class="w-4 h-4" />
          添加用户
        </button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="table-header">用户</th>
              <th class="table-header">用户名</th>
              <th class="table-header">角色</th>
              <th class="table-header">邮箱</th>
              <th class="table-header">创建时间</th>
              <th class="table-header">状态</th>
              <th class="table-header text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="table-cell">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                    {{ user.name.charAt(0) }}
                  </div>
                  <span class="font-medium text-slate-700">{{ user.name }}</span>
                </div>
              </td>
              <td class="table-cell">
                <span class="text-slate-600 font-mono text-sm">{{ user.username }}</span>
              </td>
              <td class="table-cell">
                <span class="badge badge-primary">{{ getRoleName(user.roleId) }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-500 text-sm">{{ user.email || '-' }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-500 text-sm">{{ formatDate(user.createdAt) }}</span>
              </td>
              <td class="table-cell">
                <span class="badge badge-success">正常</span>
              </td>
              <td class="table-cell text-right">
                <div class="flex justify-end gap-2">
                  <button class="text-primary-500 hover:text-primary-600 text-sm">编辑</button>
                  <button class="text-danger-500 hover:text-danger-600 text-sm">禁用</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'roles'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-500">管理系统角色和权限配置</p>
        <button class="btn-primary flex items-center gap-1.5">
          <Plus class="w-4 h-4" />
          新建角色
        </button>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="role in roles" :key="role.id" class="card p-5 hover:shadow-card-hover transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Shield class="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">{{ role.name }}</h3>
                <p class="text-xs text-slate-500">{{ getRoleUserCount(role.id) }} 名用户</p>
              </div>
            </div>
            <button class="text-slate-400 hover:text-slate-600">
              <MoreVertical class="w-5 h-5" />
            </button>
          </div>
          <p class="text-sm text-slate-500 mb-4">{{ role.description }}</p>
          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <span class="text-xs text-slate-400">{{ getPermissionCount(role.id) }} 项权限</span>
            <button class="text-sm text-primary-500 hover:text-primary-600 font-medium">管理权限</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'system'" class="space-y-4">
      <div class="card p-5">
        <h3 class="text-base font-semibold text-slate-800 mb-4">基本设置</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p class="text-sm font-medium text-slate-700">系统名称</p>
              <p class="text-xs text-slate-500">显示在登录页和浏览器标题</p>
            </div>
            <input type="text" value="销售经营数据门户" class="input w-60 text-right" />
          </div>
          <div class="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p class="text-sm font-medium text-slate-700">会话超时时间</p>
              <p class="text-xs text-slate-500">用户无操作多久后自动退出</p>
            </div>
            <select class="select w-40">
              <option>30 分钟</option>
              <option>1 小时</option>
              <option>2 小时</option>
              <option>8 小时</option>
            </select>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p class="text-sm font-medium text-slate-700">数据刷新频率</p>
              <p class="text-xs text-slate-500">指标数据自动刷新间隔</p>
            </div>
            <select class="select w-40">
              <option>5 分钟</option>
              <option>15 分钟</option>
              <option>30 分钟</option>
              <option>1 小时</option>
            </select>
          </div>
          <div class="flex items-center justify-between py-3">
            <div>
              <p class="text-sm font-medium text-slate-700">启用邮件通知</p>
              <p class="text-xs text-slate-500">告警和待办事项通过邮件发送</p>
            </div>
            <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-success-500">
              <span class="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white shadow-sm"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="text-base font-semibold text-slate-800 mb-4">接口监控</h3>
        <div class="grid grid-cols-4 gap-4 mb-4">
          <div class="p-4 bg-success-50 rounded-lg text-center">
            <p class="text-2xl font-bold text-success-600 font-mono">98.5%</p>
            <p class="text-xs text-success-700 mt-1">接口成功率</p>
          </div>
          <div class="p-4 bg-warning-50 rounded-lg text-center">
            <p class="text-2xl font-bold text-warning-600 font-mono">12</p>
            <p class="text-xs text-warning-700 mt-1">今日错误数</p>
          </div>
          <div class="p-4 bg-primary-50 rounded-lg text-center">
            <p class="text-2xl font-bold text-primary-600 font-mono">125ms</p>
            <p class="text-xs text-primary-700 mt-1">平均响应</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg text-center">
            <p class="text-2xl font-bold text-slate-600 font-mono">2.3万</p>
            <p class="text-xs text-slate-500 mt-1">今日调用量</p>
          </div>
        </div>
        <p class="text-sm text-slate-500">
          接口错误会自动通知供应链经理，并记录到异常波动报表，方便月底复盘。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, UserPlus, Plus, Shield, MoreVertical } from 'lucide-vue-next'
import dayjs from 'dayjs'
import type { User, Role } from '~/types'

const tabs = [
  { value: 'users', label: '用户管理' },
  { value: 'roles', label: '角色管理' },
  { value: 'system', label: '系统配置' }
]

const activeTab = ref('users')
const searchKeyword = ref('')

const users = ref<User[]>([])
const roles = ref<Role[]>([])

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  const keyword = searchKeyword.value.toLowerCase()
  return users.value.filter(u =>
    u.name.toLowerCase().includes(keyword) ||
    u.username.toLowerCase().includes(keyword)
  )
})

const getRoleName = (roleId: string): string => {
  const role = roles.value.find(r => r.id === roleId)
  return role?.name || roleId
}

const getRoleUserCount = (roleId: string): number => {
  return users.value.filter(u => u.roleId === roleId).length
}

const getPermissionCount = (roleId: string): number => {
  const counts: Record<string, number> = {
    'role_admin': 42,
    'role_sales_director': 28,
    'role_data_admin': 20,
    'role_business_owner': 12,
    'role_supply_chain': 8
  }
  return counts[roleId] || 0
}

const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD')
}

const fetchData = async () => {
  users.value = [
    { id: 'user_admin', username: 'admin', name: '系统管理员', email: 'admin@example.com', roleId: 'role_admin', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'user_director', username: 'director', name: '张总监', email: 'director@example.com', roleId: 'role_sales_director', createdAt: '2024-01-02T00:00:00Z' },
    { id: 'user_data_admin', username: 'dataadmin', name: '李数据', email: 'dataadmin@example.com', roleId: 'role_data_admin', createdAt: '2024-01-03T00:00:00Z' },
    { id: 'user_business', username: 'business', name: '王业务', email: 'business@example.com', roleId: 'role_business_owner', createdAt: '2024-01-04T00:00:00Z' },
    { id: 'user_supply', username: 'supply', name: '赵供应', email: 'supply@example.com', roleId: 'role_supply_chain', createdAt: '2024-01-05T00:00:00Z' },
    { id: 'user_business2', username: 'business2', name: '陈经理', email: 'chen@example.com', roleId: 'role_business_owner', createdAt: '2024-01-10T00:00:00Z' },
    { id: 'user_business3', username: 'business3', name: '刘主管', email: 'liu@example.com', roleId: 'role_business_owner', createdAt: '2024-01-15T00:00:00Z' }
  ]

  roles.value = [
    { id: 'role_admin', name: '系统管理员', description: '拥有系统全部权限' },
    { id: 'role_sales_director', name: '销售总监', description: '查看全部经营数据，审批权限' },
    { id: 'role_data_admin', name: '数据管理员', description: '维护权限配置和数据规则' },
    { id: 'role_business_owner', name: '业务负责人', description: '查看所辖数据，处理待办' },
    { id: 'role_supply_chain', name: '供应链经理', description: '处理供应链相关异常' }
  ]
}

onMounted(() => {
  fetchData()
})

definePageMeta({
  layout: 'default'
})
</script>
