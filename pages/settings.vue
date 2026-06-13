<script setup lang="ts">
import { UserPlus, Loader2, Users, Shield, UserCheck } from 'lucide-vue-next'

const api = useApi()

const users = ref<any[]>([])
const loading = ref(true)
const showCreate = ref(false)
const creating = ref(false)

const newUser = reactive({
  username: '',
  displayName: '',
  password: '',
  role: 'agent',
})

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await api.get('/api/users')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!newUser.username || !newUser.displayName || !newUser.password) return
  creating.value = true
  try {
    await api.post('/api/users', newUser)
    newUser.username = ''
    newUser.displayName = ''
    newUser.password = ''
    newUser.role = 'agent'
    showCreate.value = false
    await loadUsers()
  } catch (e: any) {
    alert(e?.data?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

const roleLabels: Record<string, { label: string; class: string; icon: any }> = {
  admin: { label: '管理员', class: 'bg-purple-100 text-purple-700', icon: Shield },
  supervisor: { label: '客服主管', class: 'bg-blue-100 text-blue-700', icon: UserCheck },
  agent: { label: '客服专员', class: 'bg-slate-100 text-slate-700', icon: Users },
}

onMounted(loadUsers)
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">设置</h1>
      <button @click="showCreate = !showCreate" class="btn-primary flex items-center gap-1.5">
        <UserPlus class="w-4 h-4" />
        新建用户
      </button>
    </div>

    <div v-if="showCreate" class="card p-5 border-l-4 border-l-brand-500">
      <h3 class="font-bold text-slate-800 mb-4">新建用户</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">用户名</label>
          <input v-model="newUser.username" class="input-field" placeholder="输入用户名" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">显示名称</label>
          <input v-model="newUser.displayName" class="input-field" placeholder="输入显示名称" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">密码</label>
          <input v-model="newUser.password" type="password" class="input-field" placeholder="输入密码" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">角色</label>
          <select v-model="newUser.role" class="select-field">
            <option value="supervisor">客服主管</option>
            <option value="agent">客服专员</option>
          </select>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-4">
        <button @click="handleCreate" class="btn-primary flex items-center gap-1.5" :disabled="creating">
          <Loader2 v-if="creating" class="w-4 h-4 animate-spin" />
          {{ creating ? '创建中...' : '创建' }}
        </button>
        <button @click="showCreate = false" class="btn-secondary">取消</button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-brand-500" />
    </div>

    <div v-else class="card">
      <div class="px-5 py-4 border-b border-slate-200">
        <h2 class="font-bold text-slate-800 flex items-center gap-2">
          <Users class="w-5 h-5 text-slate-400" />
          用户列表
        </h2>
      </div>
      <div class="divide-y divide-slate-100">
        <div v-for="user in users" :key="user.id" class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            :class="user.role === 'admin' ? 'bg-purple-500' : user.role === 'supervisor' ? 'bg-blue-500' : 'bg-slate-500'">
            {{ user.displayName?.charAt(0) || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-800">{{ user.displayName }}</p>
            <p class="text-xs text-slate-400">@{{ user.username }}</p>
          </div>
          <span :class="['badge', roleLabels[user.role]?.class || 'badge-pending']">
            {{ roleLabels[user.role]?.label || user.role }}
          </span>
          <span class="text-xs text-slate-400">{{ new Date(user.createdAt).toLocaleDateString() }}</span>
        </div>
      </div>
      <div v-if="users.length === 0" class="text-center py-12 text-slate-400 text-sm">暂无用户</div>
    </div>
  </div>
</template>
