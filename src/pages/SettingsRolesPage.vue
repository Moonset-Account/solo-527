<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Save } from 'lucide-vue-next'
import { settingsApi } from '@/api'

interface Role {
  id: number
  name: string
  permissions: string[]
}

const roles = ref<Role[]>([])
const allPermissions = [
  { key: 'leads:read', label: '查看线索' },
  { key: 'leads:write', label: '编辑线索' },
  { key: 'leads:delete', label: '删除线索' },
  { key: 'followups:read', label: '查看回访' },
  { key: 'followups:write', label: '编辑回访' },
  { key: 'predictions:read', label: '查看预测' },
  { key: 'churn:read', label: '查看流失' },
  { key: 'tags:read', label: '查看标签' },
  { key: 'tags:write', label: '编辑标签' },
  { key: 'reports:read', label: '查看报表' },
  { key: 'settings:read', label: '查看设置' },
  { key: 'settings:write', label: '编辑设置' },
  { key: 'roles:manage', label: '管理角色' },
]

async function fetchRoles() {
  const { data } = await settingsApi.roles.list()
  roles.value = data
}

function togglePermission(roleIdx: number, permKey: string) {
  const perms = roles.value[roleIdx].permissions
  const idx = perms.indexOf(permKey)
  if (idx >= 0) perms.splice(idx, 1)
  else perms.push(permKey)
}

async function saveRole(role: Role) {
  await settingsApi.roles.update(role.id, { name: role.name, permissions: role.permissions })
}

onMounted(fetchRoles)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-slate-800">角色与权限</h1>

    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 sticky left-0 bg-slate-50 z-10 min-w-[100px]">角色</th>
              <th
                v-for="perm in allPermissions"
                :key="perm.key"
                class="px-3 py-3 text-center text-xs font-medium text-slate-500 min-w-[80px]"
              >
                {{ perm.label }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 min-w-[60px]">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(role, rIdx) in roles" :key="role.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-sm font-medium text-slate-800 sticky left-0 bg-white z-10">
                {{ role.name }}
              </td>
              <td
                v-for="perm in allPermissions"
                :key="perm.key"
                class="px-3 py-3 text-center"
              >
                <input
                  type="checkbox"
                  :checked="role.permissions.includes(perm.key)"
                  class="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                  @change="togglePermission(rIdx, perm.key)"
                />
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  class="p-1 rounded hover:bg-emerald-50 text-emerald-600"
                  @click="saveRole(role)"
                >
                  <Save class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
