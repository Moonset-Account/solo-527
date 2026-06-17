<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">用户管理</h2>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增用户
      </button>
    </div>

    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>部门</th>
                <th>电话</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="user-avatar" style="width:36px;height:36px;font-size:14px">
                      {{ u.name?.charAt(0) }}
                    </div>
                    <span class="font-semibold">{{ u.name }}</span>
                  </div>
                </td>
                <td>{{ u.username }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <span class="badge" :class="getRoleBadgeClass(u.role)">{{ getRoleLabel(u.role) }}</span>
                </td>
                <td class="text-gray-600">{{ u.department || '-' }}</td>
                <td class="text-gray-600">{{ u.phone || '-' }}</td>
                <td>
                  <span class="badge" :class="u.isActive ? 'badge-completed' : 'badge-error'">
                    {{ u.isActive ? '启用' : '禁用' }}
                  </span>
                </td>
                <td style="white-space:nowrap">{{ formatDate(u.createdAt, false) }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <button class="btn btn-secondary btn-sm" @click="editUser(u)">编辑</button>
                    <button class="btn btn-secondary btn-sm" :class="u.isActive ? '' : 'btn-success'" @click="toggleActive(u)">
                      {{ u.isActive ? '禁用' : '启用' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="9" class="text-center text-gray-400 py-12">暂无用户</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreateModal || showEditModal" class="modal-mask" @click.self="closeModal">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">{{ showCreateModal ? '新增用户' : '编辑用户' }}</div>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <div class="modal-body">
              <div class="grid-2 mb-4">
                <div>
                  <label class="form-label"><span class="text-danger">*</span> 姓名</label>
                  <input v-model="form.name" class="form-input" placeholder="真实姓名" />
                </div>
                <div>
                  <label class="form-label"><span class="text-danger">*</span> 用户名</label>
                  <input v-model="form.username" class="form-input" :disabled="showEditModal" placeholder="登录用户名" />
                </div>
                <div>
                  <label class="form-label"><span class="text-danger">*</span> 角色</label>
                  <select v-model="form.role" class="form-select">
                    <option value="LEGAL_MANAGER">法务负责人</option>
                    <option value="LAWYER">律师</option>
                    <option value="REVIEWER">复核人</option>
                    <option value="ADMIN">系统管理员</option>
                  </select>
                </div>
                <div>
                  <label class="form-label"><span class="text-danger">*</span> 邮箱</label>
                  <input v-model="form.email" type="email" class="form-input" placeholder="name@example.com" />
                </div>
                <div v-if="showCreateModal">
                  <label class="form-label"><span class="text-danger">*</span> 初始密码</label>
                  <input v-model="form.password" type="text" class="form-input" placeholder="至少6位" />
                </div>
                <div>
                  <label class="form-label">部门</label>
                  <input v-model="form.department" class="form-input" placeholder="如：法务部" />
                </div>
                <div>
                  <label class="form-label">电话</label>
                  <input v-model="form.phone" class="form-input" placeholder="联系电话" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeModal">取消</button>
              <button class="btn btn-primary" @click="saveUser">{{ showCreateModal ? '创建用户' : '保存修改' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const ui = useUiStore()

const users = ref<any[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingUserId = ref<string | null>(null)

const form = reactive({
  name: '',
  username: '',
  email: '',
  role: 'LAWYER',
  password: '',
  department: '',
  phone: ''
})

function resetForm() {
  Object.assign(form, {
    name: '', username: '', email: '', role: 'LAWYER',
    password: '', department: '', phone: ''
  })
  editingUserId.value = null
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

function editUser(u: any) {
  Object.assign(form, {
    name: u.name, username: u.username, email: u.email, role: u.role,
    department: u.department || '', phone: u.phone || ''
  })
  editingUserId.value = u.id
  showEditModal.value = true
}

async function fetchUsers() {
  ui.showLoading()
  try {
    const res: any = await $fetch('/api/users', { params: { pageSize: 200 } })
    users.value = res.data || []
  } finally {
    ui.hideLoading()
  }
}

async function saveUser() {
  if (!form.name || !form.username || !form.email || !form.role) {
    alert('请填写必填字段')
    return
  }
  if (showCreateModal.value && !form.password) {
    alert('请设置初始密码')
    return
  }
  ui.showLoading()
  try {
    if (showCreateModal.value) {
      await $fetch('/api/users', {
        method: 'POST',
        body: { ...form }
      })
    } else {
      await $fetch(`/api/users/${editingUserId.value}`, {
        method: 'PUT',
        body: { ...form }
      })
    }
    closeModal()
    alert('保存成功！')
    fetchUsers()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '操作失败')
  } finally {
    ui.hideLoading()
  }
}

async function toggleActive(u: any) {
  if (!confirm(`确定${u.isActive ? '禁用' : '启用'}用户 ${u.name}？`)) return
  try {
    await $fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      body: { isActive: !u.isActive }
    })
    fetchUsers()
  } catch (e: any) {
    alert(e?.data?.message || '操作失败')
  }
}

onMounted(() => {
  ui.setPageTitle('用户管理')
  ui.setActiveNav('users')
  fetchUsers()
})
</script>
