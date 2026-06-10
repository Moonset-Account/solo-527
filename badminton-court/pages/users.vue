<template>
  <div class="space-y-5">
    <div class="card p-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex gap-3 items-center">
        <select v-model="filter.role" class="input !w-auto" @change="loadList">
          <option value="">全部角色</option>
          <option value="SUPER_ADMIN">超级管理员</option>
          <option value="ADMIN">管理员</option>
          <option value="MANAGER">运营经理</option>
          <option value="COACH">教练</option>
          <option value="STAFF">前台</option>
          <option value="CUSTOMER">客户</option>
        </select>
        <input v-model="filter.keyword" class="input !w-64" placeholder="姓名/手机/用户名" />
        <button class="btn-primary" @click="loadList">查询</button>
      </div>
      <button class="btn-primary" @click="openCreate = true">+ 新增用户</button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th class="text-left px-4 py-3">用户</th>
            <th class="text-left px-4 py-3">联系方式</th>
            <th class="text-left px-4 py-3">角色</th>
            <th class="text-right px-4 py-3">余额</th>
            <th class="text-center px-4 py-3">状态</th>
            <th class="text-left px-4 py-3">教练信息</th>
            <th class="text-right px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="u in list" :key="u.id" class="hover:bg-gray-50/50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  {{ (u.realName || u.username).charAt(0) }}
                </div>
                <div>
                  <div class="font-medium text-gray-800">{{ u.realName || u.username }}</div>
                  <div class="text-xs text-gray-500">@{{ u.username }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div>📞 {{ u.phone }}</div>
              <div v-if="u.email" class="text-xs text-gray-500">✉️ {{ u.email }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="badge" :class="roleClass(u.role)">{{ roleText(u.role) }}</span>
            </td>
            <td class="px-4 py-3 text-right font-medium" :class="u.balance > 0 ? 'text-green-600' : 'text-gray-600'">¥{{ Number(u.balance || 0).toFixed(2) }}</td>
            <td class="px-4 py-3 text-center">
              <span class="badge" :class="u.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ u.status === 1 ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs">
              <template v-if="u.coachProfile">
                <div class="font-medium text-teal-700">{{ u.coachProfile.level }}</div>
                <div class="text-gray-500">¥{{ Number(u.coachProfile.hourlyRate).toFixed(0) }}/时 · {{ u.coachProfile.specialty || '-' }}</div>
                <div class="text-gray-400">产能 {{ u.coachProfile.usedCapacity }}/{{ u.coachProfile.totalCapacity }}</div>
              </template>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="text-primary-600 text-xs hover:underline">编辑</button>
            </td>
          </tr>
          <tr v-if="!list.length"><td colspan="7" class="text-center text-gray-400 py-12">暂无用户</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="flex justify-center items-center gap-2 text-sm">
      <button class="btn-secondary !py-1 !px-3" :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
      <button class="btn-secondary !py-1 !px-3" :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <div v-if="openCreate" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openCreate = false">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b flex items-center justify-between">
          <h3 class="font-semibold text-lg">新增用户</h3>
          <button class="text-2xl text-gray-400" @click="openCreate = false">×</button>
        </div>
        <div class="p-5 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">用户名 *</label>
              <input v-model="form.username" class="input" />
            </div>
            <div>
              <label class="label">密码 *</label>
              <input v-model="form.password" type="text" class="input" placeholder="至少6位" />
            </div>
          </div>
          <div>
            <label class="label">真实姓名</label>
            <input v-model="form.realName" class="input" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">手机号 *</label>
              <input v-model="form.phone" class="input" />
            </div>
            <div>
              <label class="label">角色</label>
              <select v-model="form.role" class="input">
                <option value="CUSTOMER">客户</option>
                <option value="STAFF">前台</option>
                <option value="COACH">教练</option>
                <option value="MANAGER">运营经理</option>
                <option value="ADMIN">管理员</option>
              </select>
            </div>
          </div>
          <div>
            <label class="label">邮箱</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div>
            <label class="label">初始余额</label>
            <input v-model.number="form.balance" type="number" class="input" />
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openCreate = false">取消</button>
          <button class="btn-primary" :disabled="submitting" @click="submit">
            {{ submitting ? '提交中...' : '确认创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
const { get, post } = useApi()
const filter = reactive({ role: '', keyword: '' })
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const openCreate = ref(false)
const submitting = ref(false)
const form = reactive<any>({ username: '', password: '', realName: '', phone: '', role: 'CUSTOMER', email: '', balance: 0 })

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

function roleText(r: string) {
  return { SUPER_ADMIN: '超级管理员', ADMIN: '管理员', MANAGER: '运营经理', COACH: '教练', STAFF: '前台', CUSTOMER: '客户' }[r] || r
}
function roleClass(r: string) {
  return {
    SUPER_ADMIN: 'bg-red-100 text-red-700', ADMIN: 'bg-orange-100 text-orange-700', MANAGER: 'bg-purple-100 text-purple-700',
    COACH: 'bg-teal-100 text-teal-700', STAFF: 'bg-blue-100 text-blue-700', CUSTOMER: 'bg-gray-100 text-gray-700'
  }[r] || 'bg-gray-100 text-gray-700'
}

async function loadList() {
  try {
    const r = await get('/api/users', { ...filter, page: page.value, pageSize: pageSize.value })
    if (r.code === 0) { list.value = r.data.list; total.value = r.data.total }
  } catch {}
}

async function submit() {
  if (!form.username || !form.password || !form.phone) return alert('请填写必填项')
  submitting.value = true
  try {
    const r = await post('/api/users', form)
    if (r.code === 0) { openCreate.value = false; loadList() } else alert(r.message)
  } catch (e: any) { alert(e.message) }
  finally { submitting.value = false }
}

onMounted(loadList)
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
