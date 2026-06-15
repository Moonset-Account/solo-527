<script setup lang="ts">
import { Plus, Edit2, Save, X, Trash2, User, Stethoscope, Briefcase, Users, Phone, Mail } from 'lucide-vue-next'

interface Advisor {
  id: string
  name: string
  avatar?: string
  role: 'doctor' | 'consultant' | 'nurse' | 'manager'
  roleLabel: string
  activeCases: number
  totalCases: number
  status: 'active' | 'leave' | 'disabled'
  statusLabel: string
  phone: string
  email: string
  specialty: string
}

const advisors = ref<Advisor[]>([
  { id: '1', name: '林医生', role: 'doctor', roleLabel: '主治医生', activeCases: 28, totalCases: 356, status: 'active', statusLabel: '在岗', phone: '138****0001', email: 'lin@clinic.com', specialty: '口腔种植' },
  { id: '2', name: '王医生', role: 'doctor', roleLabel: '主治医生', activeCases: 24, totalCases: 289, status: 'active', statusLabel: '在岗', phone: '139****0002', email: 'wang@clinic.com', specialty: '口腔正畸' },
  { id: '3', name: '张顾问', role: 'consultant', roleLabel: '咨询顾问', activeCases: 45, totalCases: 512, status: 'active', statusLabel: '在岗', phone: '137****0003', email: 'zhang@clinic.com', specialty: '客户咨询' },
  { id: '4', name: '刘顾问', role: 'consultant', roleLabel: '咨询顾问', activeCases: 38, totalCases: 421, status: 'active', statusLabel: '在岗', phone: '136****0004', email: 'liu@clinic.com', specialty: '儿童齿科' },
  { id: '5', name: '陈护士', role: 'nurse', roleLabel: '护士长', activeCases: 0, totalCases: 0, status: 'active', statusLabel: '在岗', phone: '135****0005', email: 'chen@clinic.com', specialty: '护理管理' },
  { id: '6', name: '赵经理', role: 'manager', roleLabel: '运营总监', activeCases: 12, totalCases: 128, status: 'leave', statusLabel: '休假中', phone: '134****0006', email: 'zhao@clinic.com', specialty: '运营管理' },
  { id: '7', name: '孙医生', role: 'doctor', roleLabel: '特聘医生', activeCases: 8, totalCases: 67, status: 'disabled', statusLabel: '已停用', phone: '133****0007', email: 'sun@clinic.com', specialty: '牙周治疗' },
])

const roleOptions = [
  { label: '主治医生', value: 'doctor' },
  { label: '咨询顾问', value: 'consultant' },
  { label: '护士', value: 'nurse' },
  { label: '运营管理', value: 'manager' },
]
const statusOptions = [
  { label: '在岗', value: 'active' },
  { label: '休假中', value: 'leave' },
  { label: '已停用', value: 'disabled' },
]

const roleIconMap: Record<string, any> = {
  doctor: Stethoscope,
  consultant: Briefcase,
  nurse: User,
  manager: Briefcase,
}
const roleColorMap: Record<string, { bg: string, text: string }> = {
  doctor: { bg: 'bg-primary-50', text: 'text-primary-600' },
  consultant: { bg: 'bg-violet-50', text: 'text-violet-600' },
  nurse: { bg: 'bg-pink-50', text: 'text-pink-600' },
  manager: { bg: 'bg-amber-50', text: 'text-amber-600' },
}
const statusColorMap: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  leave: 'bg-amber-100 text-amber-700',
  disabled: 'bg-gray-100 text-gray-500',
}
const avatarColors = ['#0EA5A9', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#3B82F6']

const editingId = ref<string | null>(null)
const editingData = reactive({ name: '', role: 'doctor', status: 'active', specialty: '', phone: '', email: '' })
const showAdd = ref(false)
const newData = reactive({ name: '', role: 'consultant', status: 'active', specialty: '', phone: '', email: '' })

function startEdit(a: Advisor) {
  editingId.value = a.id
  Object.assign(editingData, {
    name: a.name, role: a.role, status: a.status,
    specialty: a.specialty, phone: a.phone, email: a.email,
  })
}
function cancelEdit() { editingId.value = null }
function saveEdit(a: Advisor) {
  if (!editingData.name.trim()) return
  a.name = editingData.name.trim()
  a.role = editingData.role
  a.roleLabel = roleOptions.find(r => r.value === editingData.role)?.label || a.roleLabel
  a.status = editingData.status
  a.statusLabel = statusOptions.find(s => s.value === editingData.status)?.label || a.statusLabel
  a.specialty = editingData.specialty
  a.phone = editingData.phone
  a.email = editingData.email
  editingId.value = null
}
function deleteAdvisor(id: string) {
  const i = advisors.value.findIndex(a => a.id === id)
  if (i !== -1) advisors.value.splice(i, 1)
}
function addAdvisor() {
  if (!newData.name.trim()) return
  const roleLabel = roleOptions.find(r => r.value === newData.role)?.label || '顾问'
  const statusLabel = statusOptions.find(s => s.value === newData.status)?.label || '在岗'
  advisors.value.push({
    id: 'a' + Date.now(),
    name: newData.name.trim(),
    role: newData.role as any,
    roleLabel,
    status: newData.status as any,
    statusLabel,
    activeCases: 0,
    totalCases: 0,
    phone: newData.phone,
    email: newData.email,
    specialty: newData.specialty,
  })
  Object.assign(newData, { name: '', role: 'consultant', status: 'active', specialty: '', phone: '', email: '' })
  showAdd.value = false
}
function getAvatarColor(name: string) {
  let sum = 0
  for (const ch of name) sum += ch.charCodeAt(0)
  return avatarColors[sum % avatarColors.length]
}
</script>

<template>
  <div class="p-6 space-y-5 bg-gray-50 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">顾问团队管理</h1>
        <p class="text-gray-500 text-sm mt-1">管理诊所的医疗及咨询团队成员</p>
      </div>
      <UButton color="primary" @click="showAdd = !showAdd">
        <template #leading><Plus class="w-4 h-4" /></template>
        新增成员
      </UButton>
    </div>

    <Transition name="slide-down">
      <UCard v-if="showAdd" class="border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-5">
            <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <Users class="w-5 h-5 text-primary-500" />
            </div>
            <h3 class="font-semibold text-gray-800">新增团队成员</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div class="md:col-span-2">
              <UFormGroup label="姓名" required>
                <UInput v-model="newData.name" placeholder="请输入姓名" size="md" />
              </UFormGroup>
            </div>
            <div class="md:col-span-1">
              <UFormGroup label="角色">
                <USelect v-model="newData.role" :options="roleOptions" size="md" />
              </UFormGroup>
            </div>
            <div class="md:col-span-1">
              <UFormGroup label="状态">
                <USelect v-model="newData.status" :options="statusOptions" size="md" />
              </UFormGroup>
            </div>
            <div class="md:col-span-2">
              <UFormGroup label="专长领域">
                <UInput v-model="newData.specialty" placeholder="如：口腔种植" size="md" />
              </UFormGroup>
            </div>
            <div class="md:col-span-2">
              <UFormGroup label="联系电话">
                <UInput v-model="newData.phone" placeholder="手机号" size="md">
                  <template #leading><Phone class="w-4 h-4 text-gray-400" /></template>
                </UInput>
              </UFormGroup>
            </div>
            <div class="md:col-span-3">
              <UFormGroup label="邮箱">
                <UInput v-model="newData.email" placeholder="email@clinic.com" size="md">
                  <template #leading><Mail class="w-4 h-4 text-gray-400" /></template>
                </UInput>
              </UFormGroup>
            </div>
            <div class="md:col-span-1 flex items-end">
              <UButton block color="primary" size="md" @click="addAdvisor">确认添加</UButton>
            </div>
          </div>
        </template>
      </UCard>
    </Transition>

    <UCard class="border-0 shadow-card">
      <template #body>
        <UTable :rows="advisors">
          <template #head>
            <UTh>成员信息</UTh>
            <UTh>角色</UTh>
            <UTh class="text-center">跟进客户数</UTh>
            <UTh>专长</UTh>
            <UTh>联系方式</UTh>
            <UTh class="text-center">状态</UTh>
            <UTh class="text-right w-40">操作</UTh>
          </template>
          <template #body="{ rows }">
            <UTR v-for="a in rows" :key="a.id">
              <UTD>
                <template v-if="editingId === a.id">
                  <UInput v-model="editingData.name" size="sm" />
                </template>
                <template v-else>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      :style="{ background: getAvatarColor(a.name) }"
                    >
                      {{ a.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-800">{{ a.name }}</p>
                      <p class="text-xs text-gray-400">累计服务 {{ a.totalCases }} 位客户</p>
                    </div>
                  </div>
                </template>
              </UTD>
              <UTD>
                <template v-if="editingId === a.id">
                  <USelect v-model="editingData.role" :options="roleOptions" size="sm" />
                </template>
                <template v-else>
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" :class="[roleColorMap[a.role].bg]">
                    <component :is="roleIconMap[a.role]" class="w-3.5 h-3.5" :class="roleColorMap[a.role].text" />
                    <span class="text-xs font-medium" :class="roleColorMap[a.role].text">{{ a.roleLabel }}</span>
                  </div>
                </template>
              </UTD>
              <UTD class="text-center">
                <div class="inline-flex flex-col items-center">
                  <span class="text-xl font-bold text-primary-600">{{ a.activeCases }}</span>
                  <span class="text-xs text-gray-400">在跟进</span>
                </div>
              </UTD>
              <UTD>
                <template v-if="editingId === a.id">
                  <UInput v-model="editingData.specialty" size="sm" />
                </template>
                <template v-else>
                  <span class="text-sm text-gray-700">{{ a.specialty }}</span>
                </template>
              </UTD>
              <UTD>
                <div class="text-sm space-y-0.5">
                  <p class="flex items-center gap-1 text-gray-600"><Phone class="w-3 h-3 text-gray-400" /> {{ a.phone }}</p>
                  <p class="flex items-center gap-1 text-gray-500 text-xs"><Mail class="w-3 h-3 text-gray-400" /> {{ a.email }}</p>
                </div>
              </UTD>
              <UTD class="text-center">
                <template v-if="editingId === a.id">
                  <USelect v-model="editingData.status" :options="statusOptions" size="sm" class="!max-w-[120px] mx-auto" />
                </template>
                <template v-else>
                  <UBadge size="sm" class="px-3" :class="statusColorMap[a.status]">{{ a.statusLabel }}</UBadge>
                </template>
              </UTD>
              <UTD class="text-right">
                <div v-if="editingId === a.id" class="flex justify-end gap-1.5">
                  <UButton size="xs" color="primary" @click="saveEdit(a)"><Save class="w-3 h-3" /></UButton>
                  <UButton size="xs" variant="ghost" color="gray" @click="cancelEdit"><X class="w-3 h-3" /></UButton>
                </div>
                <div v-else class="flex justify-end gap-1">
                  <UButton size="xs" variant="ghost" color="gray" @click="startEdit(a)"><Edit2 class="w-4 h-4" /></UButton>
                  <UButton size="xs" variant="ghost" color="red" @click="deleteAdvisor(a.id)"><Trash2 class="w-4 h-4" /></UButton>
                </div>
              </UTD>
            </UTR>
          </template>
        </UTable>
      </template>
    </UCard>
  </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
