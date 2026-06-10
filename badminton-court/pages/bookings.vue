<template>
  <div class="space-y-5">
    <div class="card p-4">
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap gap-3 items-center">
          <input v-model="filter.date" type="date" class="input !w-auto" />
          <select v-model="filter.status" class="input !w-auto">
            <option value="">全部状态</option>
            <option v-for="s in statusOpts" :key="s.v" :value="s.v">{{ s.t }}</option>
          </select>
          <select v-model="filter.courtId" class="input !w-auto">
            <option value="">全部场地</option>
            <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.courtNumber }} {{ c.name }}</option>
          </select>
          <input v-model="filter.keyword" class="input !w-56" placeholder="订单号/客户/核销码" />
          <button class="btn-primary" @click="loadList">查询</button>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary" @click="openCreate = true">+ 创建预约</button>
          <button class="btn-secondary" @click="exportExcel">📥 导出</button>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-left font-medium">订单号 / 核销码</th>
            <th class="px-4 py-3 text-left font-medium">客户信息</th>
            <th class="px-4 py-3 text-left font-medium">场地 / 时段</th>
            <th class="px-4 py-3 text-right font-medium">金额</th>
            <th class="px-4 py-3 text-center font-medium">状态</th>
            <th class="px-4 py-3 text-center font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="b in list" :key="b.id" class="hover:bg-gray-50/50 cursor-pointer" @click="showDetail(b.id)">
            <td class="px-4 py-3">
              <div class="font-medium text-gray-800">{{ b.orderNo }}</div>
              <div class="text-xs text-gray-400 mt-0.5">核销码: <span class="font-mono font-semibold text-gray-600">{{ b.checkInCode }}</span></div>
            </td>
            <td class="px-4 py-3">
              <div class="text-gray-800">{{ b.customer?.realName || b.customer?.username }}</div>
              <div class="text-xs text-gray-500">{{ b.customer?.phone }}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-gray-800">{{ b.court?.courtNumber }} · {{ b.court?.name }}</div>
              <div class="text-xs text-gray-500">{{ formatDate(b.bookingDate) }} {{ b.startTime }} - {{ b.endTime }}</div>
              <div v-if="b.tournamentId" class="text-xs text-primary-600 mt-0.5">关联赛事</div>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="text-gray-800 font-medium">¥{{ Number(b.actualAmount).toFixed(2) }}</div>
              <div class="text-xs" :class="b.paidAmount > 0 ? 'text-green-600' : 'text-orange-600'">
                已付: ¥{{ Number(b.paidAmount || 0).toFixed(2) }}
              </div>
            </td>
            <td class="px-4 py-3 text-center">
              <span class="badge" :class="statusColor(b.status)">{{ statusText(b.status) }}</span>
              <div v-if="b.status === 'ABNORMAL'" class="text-xs text-orange-600 mt-1">
                {{ abnormalReasonText(b.abnormalReason) }}
              </div>
            </td>
            <td class="px-4 py-3 text-center">
              <div class="flex justify-center gap-1" @click.stop>
                <template v-if="b.status === 'PENDING'">
                  <button class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200" @click="updateStatus(b, 'confirm')">确认</button>
                  <button class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200" @click="payAction(b)">支付</button>
                </template>
                <template v-if="b.status === 'CONFIRMED' || b.status === 'PAID'">
                  <button class="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200" @click="updateStatus(b, 'checkin')">签到</button>
                </template>
                <template v-if="b.status === 'CHECKED_IN'">
                  <button class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200" @click="updateStatus(b, 'complete')">完成</button>
                </template>
                <template v-if="['PENDING','CONFIRMED','PAID','CHECKED_IN'].includes(b.status)">
                  <button class="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200" @click="abnormalAction(b)">异常</button>
                </template>
                <template v-if="['PENDING','CONFIRMED'].includes(b.status)">
                  <button class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200" @click="updateStatus(b, 'cancel')">取消</button>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0"><td colspan="6" class="py-16 text-center text-gray-400">暂无预约记录</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="flex justify-center items-center gap-2 text-sm">
      <button class="btn-secondary !py-1 !px-3" :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
      <button class="btn-secondary !py-1 !px-3" :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <div v-if="openCreate" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openCreate = false">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-5 border-b flex items-center justify-between">
          <h3 class="text-lg font-semibold">创建预约</h3>
          <button class="text-gray-400 text-xl" @click="openCreate = false">×</button>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">选择场地 *</label>
              <select v-model="createForm.courtId" class="input">
                <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.courtNumber }} · {{ c.name }} ({{ c.courtType }})</option>
              </select>
            </div>
            <div>
              <label class="label">客户 *</label>
              <select v-model="createForm.customerId" class="input">
                <option v-for="u in customers" :key="u.id" :value="u.id">{{ u.realName || u.username }} · {{ u.phone }}</option>
              </select>
            </div>
            <div>
              <label class="label">预约日期 *</label>
              <input v-model="createForm.bookingDate" type="date" class="input" />
            </div>
            <div>
              <label class="label">人数</label>
              <input v-model.number="createForm.peopleCount" type="number" min="1" class="input" />
            </div>
            <div>
              <label class="label">开始时间 *</label>
              <select v-model="createForm.startTime" class="input">
                <option v-for="h in 18" :key="h" :value="`${String(h+5).padStart(2,'0')}:00`">{{ String(h+5).padStart(2,'0') }}:00</option>
              </select>
            </div>
            <div>
              <label class="label">结束时间 *</label>
              <select v-model="createForm.endTime" class="input">
                <option v-for="h in 18" :key="h" :value="`${String(h+6).padStart(2,'0')}:00`">{{ String(h+6).padStart(2,'0') }}:00</option>
              </select>
            </div>
          </div>
          <div>
            <label class="label">备注</label>
            <textarea v-model="createForm.remark" rows="2" class="input" placeholder="选填"></textarea>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openCreate = false">取消</button>
          <button class="btn-primary" :disabled="createLoading" @click="submitCreate">
            {{ createLoading ? '提交中...' : '确认创建' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="abnormalModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="abnormalModal = null">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b"><h3 class="text-lg font-semibold">异常结束</h3></div>
        <div class="p-5 space-y-4">
          <div>
            <label class="label">异常原因 *</label>
            <select v-model="abnormalForm.reason" class="input">
              <option v-for="r in abnormalReasons" :key="r.v" :value="r.v">{{ r.t }}</option>
            </select>
          </div>
          <div>
            <label class="label">详细说明</label>
            <textarea v-model="abnormalForm.remark" rows="3" class="input" placeholder="请补充说明"></textarea>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="abnormalModal = null">取消</button>
          <button class="btn-danger" @click="submitAbnormal">确认异常</button>
        </div>
      </div>
    </div>

    <div v-if="payModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="payModal = null">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b"><h3 class="text-lg font-semibold">确认收款</h3></div>
        <div class="p-5 space-y-4">
          <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">订单号</span><span class="font-medium">{{ payModal.orderNo }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">应收金额</span><span class="text-lg font-bold text-red-600">¥{{ Number(payModal.actualAmount).toFixed(2) }}</span></div>
          </div>
          <div>
            <label class="label">支付方式</label>
            <select v-model="payForm.method" class="input">
              <option value="WECHAT">微信支付</option>
              <option value="ALIPAY">支付宝</option>
              <option value="CASH">现金</option>
              <option value="CARD">刷卡</option>
              <option value="BALANCE">余额</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          <div>
            <label class="label">实收金额</label>
            <input v-model.number="payForm.paidAmount" type="number" class="input" />
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="payModal = null">取消</button>
          <button class="btn-success" @click="submitPay">确认收款</button>
        </div>
      </div>
    </div>

    <div v-if="detailId" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="detailId = null">
      <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h3 class="text-lg font-semibold">预约详情</h3>
            <div class="text-xs text-gray-500 mt-0.5">{{ detail?.orderNo }}</div>
          </div>
          <button class="text-gray-400 text-xl" @click="detailId = null">×</button>
        </div>
        <div v-if="detail" class="p-5">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="card p-4 space-y-3 text-sm">
                <h4 class="font-semibold text-gray-800 border-b pb-2 mb-2">📅 预约信息</h4>
                <div class="flex justify-between"><span class="text-gray-500">场地</span><span class="font-medium">{{ detail.court?.courtNumber }} · {{ detail.court?.name }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">日期时段</span><span>{{ formatDate(detail.bookingDate) }} {{ detail.startTime }} - {{ detail.endTime }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">时长</span><span>{{ Math.round(detail.duration / 60 * 10) / 10 }} 小时</span></div>
                <div class="flex justify-between"><span class="text-gray-500">人数</span><span>{{ detail.peopleCount }} 人</span></div>
                <div class="flex justify-between"><span class="text-gray-500">核销码</span><span class="font-mono font-bold bg-yellow-50 px-2 py-0.5 rounded">{{ detail.checkInCode }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">状态</span><span class="badge" :class="statusColor(detail.status)">{{ statusText(detail.status) }}</span></div>
                <div v-if="detail.status === 'ABNORMAL'" class="bg-orange-50 rounded-lg p-3">
                  <div class="text-orange-800 text-xs font-semibold mb-1">⚠️ 异常信息</div>
                  <div class="text-xs text-orange-700">原因: {{ abnormalReasonText(detail.abnormalReason) }}</div>
                  <div v-if="detail.abnormalRemark" class="text-xs text-orange-600 mt-1">说明: {{ detail.abnormalRemark }}</div>
                </div>
              </div>

              <div class="card p-4 space-y-3 text-sm">
                <h4 class="font-semibold text-gray-800 border-b pb-2 mb-2">👤 客户信息</h4>
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-lg">{{ (detail.customer?.realName || detail.customer?.username).charAt(0) }}</div>
                  <div>
                    <div class="font-medium text-gray-800">{{ detail.customer?.realName || detail.customer?.username }}</div>
                    <div class="text-xs text-gray-500">{{ detail.customer?.phone }} · {{ detail.customer?.email || '无邮箱' }}</div>
                    <div class="text-xs text-gray-400 mt-0.5">余额: ¥{{ Number(detail.customer?.balance || 0).toFixed(2) }}</div>
                  </div>
                </div>
              </div>

              <div v-if="detail.coachAssignments?.length" class="card p-4 space-y-3 text-sm">
                <h4 class="font-semibold text-gray-800 border-b pb-2 mb-2">🎾 教练安排</h4>
                <div v-for="a in detail.coachAssignments" :key="a.id" class="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <div class="font-medium">{{ a.coach?.user?.realName }}</div>
                    <div class="text-xs text-gray-500">{{ a.startTime }} - {{ a.endTime }} · {{ a.coach?.level }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-medium">¥{{ Number(a.totalCost).toFixed(2) }}</div>
                    <div class="text-xs text-gray-400">¥{{ Number(a.hourlyRate).toFixed(2) }}/时</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="card p-4 space-y-3 text-sm">
                <h4 class="font-semibold text-gray-800 border-b pb-2 mb-2">💳 费用信息</h4>
                <div class="flex justify-between"><span class="text-gray-500">场地原价</span><span>¥{{ Number(detail.originalPrice).toFixed(2) }}</span></div>
                <div v-if="detail.coachAssignments?.length" class="flex justify-between"><span class="text-gray-500">教练费用</span><span>¥{{ detail.coachAssignments.reduce((s:number,a:any)=>s+Number(a.totalCost),0).toFixed(2) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">优惠减免</span><span class="text-green-600">-¥{{ Number(detail.discountAmount).toFixed(2) }}</span></div>
                <div class="border-t pt-2 flex justify-between font-semibold text-base"><span>应收总额</span><span class="text-red-600">¥{{ Number(detail.actualAmount).toFixed(2) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">已收金额</span><span class="text-green-600 font-medium">¥{{ Number(detail.paidAmount).toFixed(2) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">待收金额</span><span :class="(detail.actualAmount - detail.paidAmount) > 0 ? 'text-orange-600 font-medium' : 'text-green-600'">¥{{ (Number(detail.actualAmount) - Number(detail.paidAmount)).toFixed(2) }}</span></div>
                <div v-if="detail.payment" class="bg-gray-50 rounded-lg p-3 mt-2">
                  <div class="text-xs text-gray-500">支付单号: {{ detail.payment.paymentNo }}</div>
                  <div class="text-xs">方式: <span class="font-medium">{{ detail.payment.method }}</span> · 状态: <span class="badge" :class="detail.payment.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">{{ detail.payment.status }}</span></div>
                </div>
              </div>

              <div class="card p-4 space-y-3 text-sm">
                <h4 class="font-semibold text-gray-800 border-b pb-2 mb-2">✋ 签到记录</h4>
                <div v-for="c in detail.checkIns" :key="c.id" class="border-l-4 border-teal-400 pl-3 py-1">
                  <div class="flex justify-between items-center">
                    <span class="badge" :class="statusColor(c.status)">{{ statusText(c.status) }}</span>
                    <span class="text-xs text-gray-500">{{ c.operator?.realName }} 操作</span>
                  </div>
                  <div v-if="c.checkInTime" class="text-xs text-gray-500 mt-0.5">签到: {{ formatDate(c.checkInTime, 'YYYY-MM-DD HH:mm') }}</div>
                  <div v-if="c.checkOutTime" class="text-xs text-gray-500">签退: {{ formatDate(c.checkOutTime, 'YYYY-MM-DD HH:mm') }}</div>
                </div>
                <div v-if="!detail.checkIns?.length" class="text-center text-gray-400 text-xs py-3">暂无签到记录</div>
              </div>

              <div class="card p-4 space-y-2 text-sm">
                <h4 class="font-semibold text-gray-800 border-b pb-2 mb-2">📝 操作日志</h4>
                <div v-for="l in detail.logs" :key="l.id" class="text-xs py-1.5 border-b last:border-0">
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{{ l.action }} <span v-if="l.oldStatus" class="text-gray-400">{{ l.oldStatus }} → {{ l.newStatus }}</span></span>
                    <span class="text-gray-400">{{ formatDate(l.createdAt, 'HH:mm') }}</span>
                  </div>
                  <div v-if="l.remark" class="text-gray-500 mt-0.5">{{ l.remark }}</div>
                  <div v-if="l.operator" class="text-gray-400 mt-0.5">操作人: {{ l.operator.realName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'

const { get, post, put } = useApi()

const filter = reactive({ date: new Date().toISOString().slice(0, 10), status: '', courtId: '', keyword: '' })
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const courts = ref<any[]>([])
const customers = ref<any[]>([])
const openCreate = ref(false)
const createLoading = ref(false)
const createForm = reactive<any>({ courtId: '', bookingDate: new Date().toISOString().slice(0, 10), startTime: '18:00', endTime: '20:00', peopleCount: 2, customerId: '', remark: '' })
const detailId = ref<number | null>(null)
const detail = ref<any>(null)
const abnormalModal = ref<any>(null)
const abnormalForm = reactive({ reason: 'OTHER', remark: '' })
const payModal = ref<any>(null)
const payForm = reactive({ method: 'WECHAT', paidAmount: 0 })

const statusOpts = [
  { v: 'PENDING', t: '待确认' }, { v: 'CONFIRMED', t: '已确认' }, { v: 'PAID', t: '已支付' },
  { v: 'CHECKED_IN', t: '已签到' }, { v: 'COMPLETED', t: '已完成' }, { v: 'ABNORMAL', t: '异常结束' },
  { v: 'CANCELLED', t: '已取消' }, { v: 'REFUNDED', t: '已退款' }
]
const abnormalReasons = [
  { v: 'CUSTOMER_NO_SHOW', t: '客户未到场' }, { v: 'CUSTOMER_EARLY_LEAVE', t: '客户提前离开' },
  { v: 'EQUIPMENT_FAILURE', t: '设备故障' }, { v: 'WEATHER_ISSUE', t: '天气原因' },
  { v: 'DOUBLE_BOOKING', t: '重复预约冲突' }, { v: 'STAFF_ERROR', t: '操作失误' }, { v: 'OTHER', t: '其他原因' }
]

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

function abnormalReasonText(r: string) {
  return abnormalReasons.find(x => x.v === r)?.t || r || '-'
}

async function loadList() {
  try {
    const r = await get('/api/bookings', { ...filter, page: page.value, pageSize: pageSize.value })
    if (r.code === 0) { list.value = r.data.list; total.value = r.data.total }
  } catch {}
}

async function loadMeta() {
  try {
    const [c, u] = await Promise.all([
      get('/api/courts', { noPagination: 'true' }),
      get('/api/users', { role: 'CUSTOMER', pageSize: 100 })
    ])
    if (c.code === 0) courts.value = c.data.list || c.data
    if (u.code === 0) customers.value = u.data.list
  } catch {}
}

async function showDetail(id: number) {
  detailId.value = id
  try {
    const r = await get(`/api/bookings/${id}`)
    if (r.code === 0) detail.value = r.data
  } catch {}
}

async function submitCreate() {
  if (!createForm.courtId || !createForm.bookingDate || !createForm.startTime || !createForm.endTime || !createForm.customerId) {
    alert('请完善必填项')
    return
  }
  createLoading.value = true
  try {
    const r = await post('/api/bookings', createForm)
    if (r.code === 0) {
      openCreate.value = false
      loadList()
      alert('创建成功')
    } else {
      alert(r.message)
    }
  } catch (e: any) { alert(e.message || '创建失败') }
  finally { createLoading.value = false }
}

async function updateStatus(b: any, action: string) {
  if (action !== 'confirm' && !confirm(`确定${action === 'cancel' ? '取消' : action === 'checkin' ? '签到' : action === 'complete' ? '完成' : '确认'}此预约？`)) return
  try {
    const r = await put(`/api/bookings/${b.id}/status`, { action })
    if (r.code === 0) { loadList(); if (detailId.value === b.id) showDetail(b.id) }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

function abnormalAction(b: any) {
  abnormalModal.value = b
  abnormalForm = { reason: 'OTHER', remark: '' }
}

async function submitAbnormal() {
  try {
    const r = await put(`/api/bookings/${abnormalModal.value.id}/status`, {
      action: 'abnormal', abnormalReason: abnormalForm.reason, abnormalRemark: abnormalForm.remark
    })
    if (r.code === 0) { abnormalModal.value = null; loadList() }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

function payAction(b: any) {
  payModal.value = b
  payForm = { method: 'WECHAT', paidAmount: Number(b.actualAmount) }
}

async function submitPay() {
  try {
    const r = await put(`/api/bookings/${payModal.value.id}/status`, {
      action: 'pay', method: payForm.method, paidAmount: payForm.paidAmount
    })
    if (r.code === 0) { payModal.value = null; loadList() }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function exportExcel() {
  try {
    const r = await post('/api/downloads', { type: 'bookings', params: { date: filter.date }, name: `预约导出-${filter.date}` })
    if (r.code === 0 && r.data.fileUrl) {
      alert('导出成功，即将下载')
      window.open(r.data.fileUrl, '_blank')
    } else {
      alert(r.message || '导出中，请稍后在下载中心查看')
    }
  } catch (e: any) { alert(e.message || '导出失败') }
}

onMounted(async () => {
  await loadMeta()
  loadList()
})

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
