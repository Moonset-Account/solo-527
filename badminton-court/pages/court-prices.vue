<template>
  <div class="space-y-5">
    <div class="card p-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <select v-model="filter.courtId" class="input !w-auto" @change="loadList">
          <option value="">全部场地</option>
          <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.courtNumber }} {{ c.name }}</option>
        </select>
        <select v-model="filter.weekDay" class="input !w-auto" @change="loadList">
          <option value="">全部星期</option>
          <option v-for="d in weekDays" :key="d.v" :value="d.v">{{ d.t }}</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary" @click="copyMode = !copyMode">{{ copyMode ? '取消复制' : '📋 复制上周' }}</button>
        <button class="btn-primary" @click="openEdit = true">+ 新增价格</button>
      </div>
    </div>

    <div v-for="court in groupedPrices" :key="court.courtId" class="card overflow-hidden">
      <div class="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <span class="font-semibold">{{ court.courtNumber }} · {{ court.courtName }}</span>
          <span class="text-xs text-gray-500 ml-3">{{ court.items.length }} 个价格配置</span>
        </div>
        <button class="btn-secondary !py-1 !text-xs" @click="openEditCourt(court)">新增</button>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th class="px-4 py-2 text-left">星期</th>
            <th class="px-4 py-2 text-left">时段</th>
            <th class="px-4 py-2 text-right">原价</th>
            <th class="px-4 py-2 text-right">会员价</th>
            <th class="px-4 py-2 text-center">节假日</th>
            <th class="px-4 py-2 text-center">特殊标签</th>
            <th class="px-4 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="p in court.items" :key="p.id" class="hover:bg-gray-50/50">
            <td class="px-4 py-2">{{ weekDays.find(d => d.v == p.weekDay)?.t }}</td>
            <td class="px-4 py-2"><span class="font-mono">{{ p.startTime }} - {{ p.endTime }}</span></td>
            <td class="px-4 py-2 text-right font-medium text-red-600">¥{{ Number(p.price).toFixed(2) }}</td>
            <td class="px-4 py-2 text-right font-medium text-green-600">¥{{ Number(p.memberPrice).toFixed(2) }}</td>
            <td class="px-4 py-2 text-center">
              <span class="badge" :class="p.isHoliday ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'">
                {{ p.isHoliday ? '是' : '否' }}
              </span>
            </td>
            <td class="px-4 py-2 text-center text-xs">
              <span v-if="p.isSpecial && p.specialName" class="badge bg-purple-100 text-purple-700">{{ p.specialName }}</span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-2 text-right">
              <button class="text-primary-600 text-xs hover:underline" @click="editPrice(p)">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="openEdit" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openEdit = false">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b flex items-center justify-between">
          <h3 class="font-semibold text-lg">{{ form.id ? '编辑价格' : '新增价格' }}</h3>
          <button class="text-2xl text-gray-400" @click="openEdit = false">×</button>
        </div>
        <div class="p-5 space-y-3">
          <div>
            <label class="label">场地 *</label>
            <select v-model="form.courtId" class="input">
              <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.courtNumber }} {{ c.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">星期 *</label>
              <select v-model.number="form.weekDay" class="input">
                <option v-for="d in weekDays" :key="d.v" :value="d.v">{{ d.t }}</option>
              </select>
            </div>
            <div>
              <label class="label">节假日</label>
              <select v-model="form.isHoliday" class="input">
                <option :value="false">否</option><option :value="true">是</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">开始时间 *</label>
              <select v-model="form.startTime" class="input">
                <option v-for="h in 18" :key="h" :value="`${String(h+5).padStart(2,'0')}:00`">{{ String(h+5).padStart(2,'0') }}:00</option>
              </select>
            </div>
            <div>
              <label class="label">结束时间 *</label>
              <select v-model="form.endTime" class="input">
                <option v-for="h in 18" :key="h" :value="`${String(h+6).padStart(2,'0')}:00`">{{ String(h+6).padStart(2,'0') }}:00</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">原价 (元/时) *</label>
              <input v-model.number="form.price" type="number" step="0.01" class="input" />
            </div>
            <div>
              <label class="label">会员价 (元/时) *</label>
              <input v-model.number="form.memberPrice" type="number" step="0.01" class="input" />
            </div>
          </div>
          <div>
            <label class="label"><input type="checkbox" v-model="form.isSpecial" class="mr-1" /> 特殊价格标签</label>
            <input v-if="form.isSpecial" v-model="form.specialName" class="input mt-1" placeholder="例：春节特惠、早鸟价" />
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openEdit = false">取消</button>
          <button class="btn-primary" @click="submitPrice">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
const { get, post, put, del } = useApi()
const route = useRoute()
const filter = reactive({ courtId: Number(route.query.courtId || ''), weekDay: '' })
const weekDays = [{ v: 0, t: '周一' }, { v: 1, t: '周二' }, { v: 2, t: '周三' }, { v: 3, t: '周四' }, { v: 4, t: '周五' }, { v: 5, t: '周六' }, { v: 6, t: '周日' }]
const courts = ref<any[]>([])
const prices = ref<any[]>([])
const openEdit = ref(false)
const copyMode = ref(false)
const form = reactive<any>({ id: 0, courtId: 0, weekDay: 0, startTime: '06:00', endTime: '09:00', price: 60, memberPrice: 45, isHoliday: false, isSpecial: false, specialName: '' })

const groupedPrices = computed(() => {
  const groups: any[] = []
  const courtMap = new Map()
  for (const p of prices.value) {
    const key = p.courtId
    if (!courtMap.has(key)) {
      courtMap.set(key, { courtId: key, courtNumber: p.court?.courtNumber, courtName: p.court?.name, items: [] })
    }
    courtMap.get(key).items.push(p)
  }
  return Array.from(courtMap.values())
})

async function loadList() {
  try {
    const params: any = {}
    if (filter.courtId) params.courtId = filter.courtId
    if (filter.weekDay !== '') params.weekDay = filter.weekDay
    const r = await get('/api/courts/prices', params)
    if (r.code === 0) prices.value = r.data
  } catch {}
}

async function loadCourts() {
  try {
    const r = await get('/api/courts', { noPagination: 'true' })
    if (r.code === 0) { courts.value = r.data.list || r.data; if (courts.value.length && !form.courtId) form.courtId = courts.value[0].id }
  } catch {}
}

function openEditCourt(court: any) {
  Object.assign(form, { id: 0, courtId: court.courtId, weekDay: 0, startTime: '06:00', endTime: '09:00', price: 60, memberPrice: 45, isHoliday: false, isSpecial: false, specialName: '' })
  openEdit.value = true
}

function editPrice(p: any) {
  Object.assign(form, { id: p.id, courtId: p.courtId, weekDay: p.weekDay, startTime: p.startTime, endTime: p.endTime, price: Number(p.price), memberPrice: Number(p.memberPrice), isHoliday: p.isHoliday, isSpecial: p.isSpecial, specialName: p.specialName || '' })
  openEdit.value = true
}

async function submitPrice() {
  try {
    const payload = { ...form, specialName: form.specialName || null }
    const r = form.id ? await put('/api/courts/prices', { ...payload, id: form.id }) : await post('/api/courts/prices', payload)
    if (r.code === 0) { openEdit.value = false; loadList() } else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

onMounted(async () => { await loadCourts(); loadList() })
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
