<template>
  <div class="space-y-5">
    <div class="card p-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3 flex-wrap">
        <select v-model="filter.status" class="input !w-auto" @change="loadList">
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="REGISTERING">报名中</option>
          <option value="UPCOMING">即将开始</option>
          <option value="ONGOING">进行中</option>
          <option value="COMPLETED">已结束</option>
          <option value="CANCELLED">已取消</option>
        </select>
        <input v-model="filter.keyword" class="input !w-64" placeholder="赛事名称/主办方" @keyup.enter="loadList" />
      </div>
      <button class="btn-primary" @click="openCreate = true">+ 新建赛事</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="t in list" :key="t.id" class="card overflow-hidden hover:shadow-lg transition">
        <div class="h-36 bg-gradient-to-br from-purple-500 to-pink-500 relative p-4 text-white">
          <div class="absolute top-3 right-3"><span class="badge bg-white/90 text-gray-800">{{ statusText(t.status) }}</span></div>
          <div class="mt-8">
            <div class="text-xl font-bold drop-shadow">{{ t.name }}</div>
            <div class="text-xs opacity-90 mt-1">{{ t.formatType || '' }} · {{ t.level || '' }} · {{ t.category || '' }}</div>
          </div>
        </div>
        <div class="p-4 space-y-3 text-sm">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-gray-50 p-2 rounded"><span class="text-gray-500">📅</span> {{ formatDate(t.startDate) }} ~ {{ formatDate(t.endDate) }}</div>
            <div class="bg-gray-50 p-2 rounded"><span class="text-gray-500">⏰</span> 截止 {{ formatDate(t.regDeadline, 'MM-DD HH:mm') }}</div>
            <div class="bg-red-50 p-2 rounded text-red-800">报名费 <span class="font-bold text-lg">¥{{ Number(t.registrationFee).toFixed(0) }}</span></div>
            <div class="bg-orange-50 p-2 rounded text-orange-800">奖金池 <span class="font-bold text-lg">¥{{ Number(t.prizePool).toFixed(0) }}</span></div>
          </div>
          <div>
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>报名进度</span>
              <span>{{ t.currentPlayers }} / {{ t.maxPlayers }}</span>
            </div>
            <div class="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div class="bg-primary-500 h-full rounded-full transition-all" :style="{ width: pct(t.currentPlayers, t.maxPlayers) }"></div>
            </div>
          </div>
          <div v-if="t.organizer" class="text-xs text-gray-500">主办方: {{ t.organizer }} · {{ t.contactPerson }} {{ t.contactPhone }}</div>
          <div class="flex gap-2 pt-2 border-t">
            <nuxt-link :to="`/todos?type=tournament`" class="flex-1 btn-secondary !py-1.5 !text-xs text-center">👥 报名/签到</nuxt-link>
            <button class="flex-1 btn-primary !py-1.5 !text-xs" @click="editTournament(t)">编辑</button>
          </div>
        </div>
      </div>
      <div v-if="!list.length" class="col-span-full text-center text-gray-400 py-16 card">暂无赛事</div>
    </div>

    <div v-if="openCreate" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openCreate = false">
      <div class="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="p-5 border-b flex items-center justify-between">
          <h3 class="font-semibold text-lg">{{ form.id ? '编辑赛事' : '新建赛事' }}</h3>
          <button class="text-2xl text-gray-400" @click="openCreate = false">×</button>
        </div>
        <div class="p-5 space-y-3">
          <div>
            <label class="label">赛事名称 *</label>
            <input v-model="form.name" class="input" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">类型</label><input v-model="form.formatType" class="input" placeholder="例：男单/女双/混团" /></div>
            <div><label class="label">级别</label><input v-model="form.level" class="input" placeholder="例：公开级/业余级" /></div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="label">开始日期 *</label><input v-model="form.startDate" type="date" class="input" /></div>
            <div><label class="label">结束日期 *</label><input v-model="form.endDate" type="date" class="input" /></div>
            <div><label class="label">报名截止 *</label><input v-model="form.regDeadline" type="datetime-local" class="input" /></div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="label">报名费</label><input v-model.number="form.registrationFee" type="number" class="input" /></div>
            <div><label class="label">奖金池</label><input v-model.number="form.prizePool" type="number" class="input" /></div>
            <div><label class="label">人数上限</label><input v-model.number="form.maxPlayers" type="number" class="input" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">主办方</label><input v-model="form.organizer" class="input" /></div>
            <div><label class="label">联系人</label><input v-model="form.contactPerson" class="input" /></div>
          </div>
          <div><label class="label">联系电话</label><input v-model="form.contactPhone" class="input" /></div>
          <div><label class="label">规则说明</label><textarea v-model="form.rules" rows="3" class="input"></textarea></div>
          <div><label class="label">赛事描述</label><textarea v-model="form.description" rows="2" class="input"></textarea></div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openCreate = false">取消</button>
          <button class="btn-primary" @click="submit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
const { get, post } = useApi()
const filter = reactive({ status: '', keyword: '' })
const list = ref<any[]>([])
const openCreate = ref(false)
const form = reactive<any>({ id: 0, name: '', formatType: '', level: '', category: '', description: '', startDate: '', endDate: '', regDeadline: '', registrationFee: 0, prizePool: 0, maxPlayers: 32, minPlayers: 2, organizer: '', contactPerson: '', contactPhone: '', rules: '' })

function pct(a: number, b: number) { return Math.min(100, Math.round(a / b * 100)) + '%' }

async function loadList() {
  try {
    const r = await get('/api/tournaments', { ...filter, pageSize: 100 })
    if (r.code === 0) list.value = r.data.list
  } catch {}
}

function editTournament(t: any) {
  Object.assign(form, { id: t.id, name: t.name, formatType: t.formatType || '', level: t.level || '', category: t.category || '', description: t.description || '', startDate: formatDate(t.startDate), endDate: formatDate(t.endDate), regDeadline: new Date(t.regDeadline).toISOString().slice(0, 16), registrationFee: Number(t.registrationFee), prizePool: Number(t.prizePool), maxPlayers: t.maxPlayers, minPlayers: t.minPlayers, organizer: t.organizer || '', contactPerson: t.contactPerson || '', contactPhone: t.contactPhone || '', rules: t.rules || '' })
  openCreate.value = true
}

async function submit() {
  if (!form.name) return alert('请填写赛事名称')
  try {
    const r = await post('/api/tournaments', form)
    if (r.code === 0) { openCreate.value = false; loadList() } else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

onMounted(loadList)
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
