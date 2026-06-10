<template>
  <div class="space-y-5">
    <div class="card p-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3 flex-wrap">
        <select v-model="filter.status" class="input !w-auto" @change="loadList">
          <option value="">全部状态</option>
          <option value="FAULT_REPORTED">待处理</option>
          <option value="REPAIRING">维修中</option>
          <option value="REPAIRED">已修复</option>
          <option value="NORMAL">正常</option>
          <option value="SCRAPPED">已报废</option>
        </select>
        <select v-model="filter.courtId" class="input !w-auto" @change="loadList">
          <option value="">全部场地</option>
          <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.courtNumber }}</option>
        </select>
      </div>
      <button class="btn-primary" @click="openReport = true">+ 报修</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="f in list" :key="f.id"
        class="card overflow-hidden"
        :class="f.status==='FAULT_REPORTED' ? 'ring-2 ring-red-200' : f.status==='REPAIRING' ? 'ring-2 ring-yellow-200' : ''">
        <div class="p-4 border-l-4"
          :class="f.status==='FAULT_REPORTED'?'border-red-500':f.status==='REPAIRING'?'border-yellow-500':f.status==='REPAIRED'?'border-blue-500':f.status==='SCRAPPED'?'border-gray-500':'border-green-500'">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl">🔧</span>
                <span class="font-semibold text-gray-800">{{ f.deviceName }}</span>
              </div>
              <div class="text-xs text-gray-500 font-mono">{{ f.faultNo }} · {{ f.deviceType }}</div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="badge" :class="faultClass(f.status)">{{ statusText(f.status) }}</span>
              <span class="text-xs px-2 py-0.5 rounded"
                :class="f.faultLevel==='紧急'?'bg-red-100 text-red-700':f.faultLevel==='高'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-700'">
                {{ f.faultLevel }}
              </span>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 text-sm mb-3">
            <div class="text-xs text-gray-500 mb-1">📍 位置</div>
            <div>{{ f.court?.courtNumber || '公共设备' }} · {{ f.court?.name || '' }}</div>
          </div>

          <div class="border-l-4 border-orange-200 pl-3 mb-3">
            <div class="text-xs text-gray-500 mb-0.5">故障描述</div>
            <div class="text-sm text-gray-800">{{ f.description }}</div>
          </div>

          <div v-if="f.repairResult" class="border-l-4 border-green-200 pl-3 mb-3">
            <div class="text-xs text-gray-500 mb-0.5">维修结果</div>
            <div class="text-sm text-gray-800">{{ f.repairResult }}</div>
            <div v-if="f.repairCost" class="text-xs text-green-700 mt-1">费用: ¥{{ Number(f.repairCost).toFixed(2) }}</div>
          </div>

          <div class="flex gap-2 mb-3 text-xs text-gray-500">
            <div>📝 {{ f.reporter?.realName }} · {{ formatDate(f.reportedAt, 'MM-DD HH:mm') }}</div>
          </div>
          <div v-if="f.handlerId" class="flex gap-2 text-xs text-gray-500">
            <div>👷 {{ f.handler?.realName }}</div>
            <div v-if="f.acceptedAt">接单: {{ formatDate(f.acceptedAt, 'MM-DD HH:mm') }}</div>
            <div v-if="f.repairedAt">完成: {{ formatDate(f.repairedAt, 'MM-DD HH:mm') }}</div>
          </div>

          <div v-if="f.affectCoach" class="mt-3 bg-yellow-50 rounded p-2 text-xs text-yellow-800">
            ⚠️ 已关联教练产能报表 · 影响小时数将记录
          </div>

          <div class="mt-3 flex gap-2">
            <template v-if="f.status === 'FAULT_REPORTED'">
              <button class="flex-1 btn-primary !py-1.5 !text-xs" @click="doAction(f, 'accept')">🙋 接单</button>
            </template>
            <template v-else-if="f.status === 'REPAIRING'">
              <button class="flex-1 btn-success !py-1.5 !text-xs" @click="repairForm.faultId = f.id; openRepair = true">🔧 维修完成</button>
            </template>
            <template v-else-if="f.status === 'REPAIRED'">
              <button class="flex-1 btn-success !py-1.5 !text-xs" @click="doAction(f, 'complete')">✅ 确认正常</button>
            </template>
            <template v-if="['FAULT_REPORTED','REPAIRING'].includes(f.status)">
              <button class="flex-1 btn-secondary !py-1.5 !text-xs" @click="doAction(f, 'scrap')">🗑️ 报废</button>
            </template>
          </div>
        </div>
      </div>
      <div v-if="!list.length" class="col-span-full text-center text-gray-400 py-16 card">暂无设备故障，运行良好 👍</div>
    </div>

    <div v-if="openReport" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openReport = false">
      <div class="bg-white rounded-2xl w-full max-w-lg">
        <div class="p-5 border-b"><h3 class="font-semibold text-lg">设备报修</h3></div>
        <div class="p-5 space-y-3">
          <div><label class="label">设备名称 *</label><input v-model="reportForm.deviceName" class="input" placeholder="例：场地灯光、网柱、球拍" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">设备类型</label><input v-model="reportForm.deviceType" class="input" placeholder="电气/机械/耗材" /></div>
            <div><label class="label">严重程度</label>
              <select v-model="reportForm.faultLevel" class="input">
                <option>一般</option><option>高</option><option>紧急</option>
              </select>
            </div>
          </div>
          <div><label class="label">关联场地</label>
            <select v-model="reportForm.courtId" class="input">
              <option :value="0">公共设备（不关联）</option>
              <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.courtNumber }} {{ c.name }}</option>
            </select>
          </div>
          <div><label class="label">故障描述 *</label><textarea v-model="reportForm.description" rows="3" class="input" placeholder="详细描述故障现象、发现时间等"></textarea></div>
          <div>
            <label class="label"><input type="checkbox" v-model="reportForm.affectCoach" class="mr-1" /> 是否影响教练教学（将写入产能报表）</label>
          </div>
          <div v-if="reportForm.affectCoach" class="bg-yellow-50 rounded-lg p-3">
            <label class="label mb-2">选择受影响教练（可多选）</label>
            <div v-if="!coaches.length" class="text-xs text-gray-400">加载中...</div>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="c in coaches" :key="c.id" class="flex items-center gap-2 text-sm bg-white rounded p-2 border cursor-pointer hover:border-yellow-400" :class="reportForm.affectedCoachIds.includes(c.userId) ? 'border-yellow-500 bg-yellow-100' : ''">
                <input type="checkbox" :value="c.userId" v-model="reportForm.affectedCoachIds" class="rounded" />
                <span>{{ c.user?.realName || '教练' + c.id }}</span>
                <span class="text-xs text-gray-400">¥{{ c.hourlyRate }}/h</span>
              </label>
            </div>
            <div v-if="reportForm.affectedCoachIds.length" class="mt-2 text-xs text-yellow-700">已选 {{ reportForm.affectedCoachIds.length }} 位教练，维修完成后将写入其本周产能报表</div>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openReport = false">取消</button>
          <button class="btn-primary" @click="submitReport">提交报修</button>
        </div>
      </div>
    </div>

    <div v-if="openRepair" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openRepair = false">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b"><h3 class="font-semibold text-lg">维修结果</h3></div>
        <div class="p-5 space-y-3">
          <div><label class="label">维修说明 *</label><textarea v-model="repairForm.result" rows="3" class="input" placeholder="请描述维修过程和结果"></textarea></div>
          <div><label class="label">维修费用</label><input v-model.number="repairForm.cost" type="number" class="input" /></div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openRepair = false">取消</button>
          <button class="btn-primary" @click="submitRepair">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
const { get, post, put } = useApi()
const filter = reactive({ status: '', courtId: 0 })
const list = ref<any[]>([])
const courts = ref<any[]>([])
const coaches = ref<any[]>([])
const openReport = ref(false)
const openRepair = ref(false)
const reportForm = reactive<any>({ deviceName: '', deviceType: '电气', faultLevel: '一般', courtId: 0, description: '', affectCoach: false, affectedCoachIds: [] })
const repairForm = reactive({ faultId: 0, result: '', cost: 0 })

function faultClass(s: string) {
  return { FAULT_REPORTED: 'bg-red-100 text-red-700', REPAIRING: 'bg-yellow-100 text-yellow-700', REPAIRED: 'bg-blue-100 text-blue-700', NORMAL: 'bg-green-100 text-green-700', SCRAPPED: 'bg-gray-100 text-gray-600' }[s] || ''
}

async function loadList() {
  try {
    const params: any = {}
    if (filter.status) params.status = filter.status
    if (filter.courtId) params.courtId = filter.courtId
    const r = await get('/api/devices/faults', { ...params, pageSize: 100 })
    if (r.code === 0) list.value = r.data.list
  } catch {}
}

async function loadCourts() {
  try {
    const r = await get('/api/courts', { noPagination: 'true' })
    if (r.code === 0) courts.value = r.data.list || r.data
  } catch {}
}

async function loadCoaches() {
  try {
    const r = await get('/api/coaches')
    if (r.code === 0) coaches.value = r.data || []
  } catch {}
}

async function doAction(f: any, action: string) {
  try {
    const r = await put('/api/devices/faults', { id: f.id, action })
    if (r.code === 0) loadList(); else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function submitReport() {
  if (!reportForm.deviceName || !reportForm.description) return alert('请填写设备名和描述')
  try {
    const payload: any = { ...reportForm, courtId: reportForm.courtId || undefined }
    if (!reportForm.affectCoach) {
      payload.affectedCoachIds = []
      delete payload.affectedCoachIds
    } else if (!reportForm.affectedCoachIds?.length) {
      return alert('请至少选择一位受影响教练')
    }
    const r = await post('/api/devices/faults', payload)
    if (r.code === 0) { openReport.value = false; Object.assign(reportForm, { deviceName: '', deviceType: '电气', faultLevel: '一般', courtId: 0, description: '', affectCoach: false, affectedCoachIds: [] }); loadList() }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function submitRepair() {
  if (!repairForm.result) return alert('请填写维修结果')
  try {
    const r = await put('/api/devices/faults', { id: repairForm.faultId, action: 'repair', repairResult: repairForm.result, repairCost: repairForm.cost || undefined })
    if (r.code === 0) { openRepair.value = false; repairForm.faultId = 0; repairForm.result = ''; repairForm.cost = 0; loadList() }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

onMounted(async () => { await loadCourts(); loadCoaches(); loadList() })
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
