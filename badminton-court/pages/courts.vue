<template>
  <div class="space-y-5">
    <div class="card p-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <select v-model="filter.status" class="input !w-auto">
          <option value="">全部状态</option>
          <option value="AVAILABLE">可用</option>
          <option value="MAINTENANCE">维护中</option>
          <option value="CLOSED">关闭</option>
        </select>
        <input v-model="filter.keyword" class="input !w-64" placeholder="名称/编号/位置" />
        <button class="btn-primary" @click="loadList">查询</button>
      </div>
      <button class="btn-primary" @click="openCreate = true">+ 新增场地</button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="c in list" :key="c.id" class="card overflow-hidden hover:shadow-lg transition">
        <div class="h-32 bg-gradient-to-br from-primary-400 to-primary-600 relative">
          <div class="absolute top-3 left-3">
            <span class="badge bg-white/90 backdrop-blur">{{ c.courtNumber }}</span>
          </div>
          <div class="absolute top-3 right-3">
            <span class="badge" :class="c.status==='AVAILABLE'?'bg-green-100 text-green-700':c.status==='MAINTENANCE'?'bg-gray-100 text-gray-700':'bg-red-100 text-red-700'">
              {{ statusText(c.status) }}
            </span>
          </div>
          <div class="absolute bottom-3 left-3 text-white text-lg font-bold drop-shadow">
            {{ c.name }}
          </div>
        </div>
        <div class="p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">类型</span><span>{{ c.courtType }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">位置</span><span>{{ c.location || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">容纳人数</span><span>{{ c.maxCapacity }}人</span>
          </div>
          <div v-if="c.facilities" class="pt-2 border-t">
            <div class="text-xs text-gray-500 mb-1">设施</div>
            <div class="flex flex-wrap gap-1">
              <span v-for="f in String(c.facilities).split(/[,，]/).filter(Boolean)" :key="f" class="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{{ f }}</span>
            </div>
          </div>
          <div class="flex gap-1.5 pt-3 border-t">
            <button class="flex-1 btn-secondary !py-1.5 !text-xs" @click="router.push(`/court-prices?courtId=${c.id}`)">
              💰 价格
            </button>
            <button class="flex-1 btn-secondary !py-1.5 !text-xs" @click="editCourt(c)">✏️ 编辑</button>
          </div>
        </div>
      </div>
      <div v-if="!list.length" class="col-span-full text-center text-gray-400 py-16 card">
        暂无场地，点击右上角新增
      </div>
    </div>

    <div v-if="openCreate" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openCreate = false">
      <div class="bg-white rounded-2xl w-full max-w-lg">
        <div class="p-5 border-b flex items-center justify-between"><h3 class="font-semibold text-lg">
          {{ form.id ? '编辑场地' : '新增场地'
        }}</h3><button class="text-2xl text-gray-400" @click="openCreate = false">×</button></div>
        <div class="p-5 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">场地编号 *</label>
              <input v-model="form.courtNumber" class="input" placeholder="例：C01" />
            </div>
            <div>
              <label class="label">场地名称 *</label>
              <input v-model="form.name" class="input" placeholder="例：1号场地" />
            </div>
            <div>
              <label class="label">场地类型 *</label>
              <select v-model="form.courtType" class="input">
                <option>标准单打</option><option>标准双打</option><option>VIP双打</option>
                <option>儿童训练</option><option>比赛专用</option>
              </select>
            </div>
            <div>
              <label class="label">容纳人数</label>
              <input v-model.number="form.maxCapacity" type="number" min="1" class="input" />
            </div>
            <div class="col-span-2">
              <label class="label">位置</label>
              <input v-model="form.location" class="input" placeholder="例：A区-01" />
            </div>
            <div class="col-span-2">
              <label class="label">设施（逗号分隔）</label>
              <input v-model="form.facilities" class="input" placeholder="例：空调,休息区,更衣室" />
            </div>
            <div class="col-span-2">
              <label class="label">状态</label>
              <select v-model="form.status" class="input">
                <option value="AVAILABLE">可用</option>
                <option value="MAINTENANCE">维护中</option>
                <option value="CLOSED">关闭</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="label">描述</label>
              <textarea v-model="form.description" rows="2" class="input"></textarea>
            </div>
            <div>
              <label class="label">排序权重</label>
              <input v-model.number="form.sortOrder" type="number" class="input" />
            </div>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openCreate = false">取消</button>
          <button class="btn-primary" :disabled="submitting" @click="submitForm">{{ submitting ? '提交中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
const { get, post, put } = useApi()
const router = useRouter()
const filter = reactive({ status: '', keyword: '' })
const list = ref<any[]>([])
const openCreate = ref(false)
const submitting = ref(false)
const form = reactive<any>({ id: 0, courtNumber: '', name: '', courtType: '标准双打', location: '', description: '', status: 'AVAILABLE', maxCapacity: 4, facilities: '', sortOrder: 0 })

function editCourt(c: any) {
  Object.assign(form, { id: c.id, courtNumber: c.courtNumber, name: c.name, courtType: c.courtType, location: c.location || '', description: c.description || '', status: c.status, maxCapacity: c.maxCapacity, facilities: c.facilities || '', sortOrder: c.sortOrder || 0 })
  openCreate.value = true
}

async function loadList() {
  try {
    const r = await get('/api/courts', { ...filter, noPagination: 'true' })
    if (r.code === 0) list.value = r.data.list || r.data
  } catch {}
}

async function submitForm() {
  if (!form.courtNumber || !form.name) return alert('请填写必填项')
  submitting.value = true
  try {
    if (form.id) {
      const r = await put(`/api/courts/${form.id}`)
    } else {
      const r = await post('/api/courts', form)
      if (r.code !== 0) alert(r.message)
    }
    openCreate.value = false; loadList()
  } catch (e: any) { alert(e.message) }
  finally { submitting.value = false }
}
onMounted(loadList)
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
