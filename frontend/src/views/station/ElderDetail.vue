<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getElderDetail,
  updateElder,
  tempSuspendElder,
  getFamilyContacts,
  familyConfirm,
  getSubsidyRecords,
  checkSubsidy
} from '../../api'

const route = useRoute()
const router = useRouter()
const elderId = computed(() => route.params.id)

const elder = ref(null)
const familyContacts = ref([])
const subsidyRecords = ref([])
const loading = ref(false)
const suspendVisible = ref(false)
const suspendForm = ref({ is_suspended: false, reason: '', suspend_until: '' })
const confirmVisible = ref(false)
const confirmForm = ref({ confirmation_id: '', confirmer_name: '', status: 'approved', note: '' })

async function loadData() {
  loading.value = true
  try {
    elder.value = await getElderDetail(elderId.value)
    familyContacts.value = await getFamilyContacts(elderId.value)
    subsidyRecords.value = await getSubsidyRecords({ elder_id: elderId.value })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const balance = computed(() => {
  if (!elder.value) return 0
  return (elder.value.subsidy_quota - elder.value.subsidy_used).toFixed(2)
})

function openSuspend() {
  suspendForm.value = {
    is_suspended: !elder.value?.is_temp_suspended,
    reason: elder.value?.suspend_reason || '',
    suspend_until: elder.value?.suspend_until || ''
  }
  suspendVisible.value = true
}

async function handleSuspend() {
  try {
    await tempSuspendElder(elderId.value, suspendForm.value)
    suspendVisible.value = false
    await loadData()
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

function openConfirm(record) {
  confirmForm.value.confirmation_id = record.confirmation_id || ''
  confirmForm.value.confirmer_name = ''
  confirmForm.value.status = 'approved'
  confirmForm.value.note = ''
  confirmVisible.value = true
}

async function handleConfirm() {
  try {
    await familyConfirm(elderId.value, confirmForm.value)
    confirmVisible.value = false
    await loadData()
  } catch (e) {
    alert('确认失败: ' + e.message)
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="page-card">
    <div class="detail-header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h2 class="card-title">长者详情</h2>
    </div>

    <div v-if="loading" class="empty-state">加载中...</div>

    <template v-else-if="elder">
      <div class="info-grid">
        <div class="info-section">
          <h3 class="section-title">基本信息</h3>
          <div class="info-row"><span class="label">姓名</span><span>{{ elder.name }}</span></div>
          <div class="info-row"><span class="label">楼栋</span><span>{{ elder.building }} {{ elder.unit }} {{ elder.room }}</span></div>
          <div class="info-row"><span class="label">联系电话</span><span>{{ elder.phone }}</span></div>
          <div class="info-row">
            <span class="label">临时停餐</span>
            <span :class="['status-dot', elder.is_temp_suspended ? 'active' : '']">
              {{ elder.is_temp_suspended ? '已停餐' : '正常' }}
            </span>
          </div>
          <div v-if="elder.is_temp_suspended" class="info-row">
            <span class="label">停餐原因</span><span>{{ elder.suspend_reason }}</span>
          </div>
          <button class="btn-action" @click="openSuspend">
            {{ elder.is_temp_suspended ? '恢复送餐' : '临时停餐' }}
          </button>
        </div>

        <div class="info-section">
          <h3 class="section-title">补贴额度</h3>
          <div class="subsidy-display">
            <div class="subsidy-main">
              <div class="subsidy-label">剩余额度</div>
              <div class="subsidy-amount" :class="{ exceed: balance < 0 }">¥{{ balance }}</div>
            </div>
            <div class="subsidy-sub">
              <span>总额度: ¥{{ elder.subsidy_quota?.toFixed(2) }}</span>
              <span>已使用: ¥{{ elder.subsidy_used?.toFixed(2) }}</span>
            </div>
          </div>
          <div v-if="balance < 0" class="exceed-warning">
            ⚠ 补贴额度不足，需家属或社工确认后方可配送
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3 class="section-title">家属联系人</h3>
        <div v-if="!familyContacts.length" class="empty-state">暂无家属信息</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>电话</th>
              <th>关系</th>
              <th>主要联系人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in familyContacts" :key="c.id">
              <td>{{ c.name }}</td>
              <td>{{ c.phone }}</td>
              <td>{{ c.kinship }}</td>
              <td>{{ c.is_primary ? '是' : '否' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="info-section">
        <h3 class="section-title">忌口信息</h3>
        <div v-if="!elder.dietary_restrictions?.length" class="empty-state">无忌口记录</div>
        <div v-else class="tag-list">
          <span
            v-for="d in elder.dietary_restrictions"
            :key="d.id"
            :class="['diet-tag', d.severity]"
          >
            {{ d.restriction_type }}: {{ d.ingredient }} ({{ d.severity }})
          </span>
        </div>
      </div>

      <div class="info-section">
        <h3 class="section-title">补贴对账记录</h3>
        <div v-if="!subsidyRecords.length" class="empty-state">暂无对账记录</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>金额</th>
              <th>变动前</th>
              <th>变动后</th>
              <th>超额</th>
              <th>确认状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in subsidyRecords" :key="r.id">
              <td>{{ r.created_at?.slice(0, 10) }}</td>
              <td>¥{{ r.amount?.toFixed(2) }}</td>
              <td>¥{{ r.balance_before?.toFixed(2) }}</td>
              <td>¥{{ r.balance_after?.toFixed(2) }}</td>
              <td>{{ r.is_exceed ? '是' : '否' }}</td>
              <td>
                <span v-if="r.confirmed" class="status-tag approved">已确认</span>
                <span v-else class="status-tag pending">待确认</span>
              </td>
              <td>
                <button
                  v-if="r.is_exceed && !r.confirmed"
                  class="btn-sm btn-primary"
                  @click="openConfirm(r)"
                >
                  确认
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="suspendVisible" class="modal-overlay" @click.self="suspendVisible = false">
        <div class="modal-content">
          <h3>{{ suspendForm.is_suspended ? '临时停餐' : '恢复送餐' }}</h3>
          <div v-if="suspendForm.is_suspended" class="form-group">
            <label>停餐原因</label>
            <input v-model="suspendForm.reason" class="form-input" placeholder="请输入停餐原因" />
            <label>停餐至</label>
            <input v-model="suspendForm.suspend_until" type="date" class="form-input" />
          </div>
          <div class="modal-actions">
            <button class="btn-action" @click="handleSuspend">确定</button>
            <button class="btn-cancel" @click="suspendVisible = false">取消</button>
          </div>
        </div>
      </div>

      <div v-if="confirmVisible" class="modal-overlay" @click.self="confirmVisible = false">
        <div class="modal-content">
          <h3>家属/社工确认</h3>
          <div class="form-group">
            <label>确认人姓名</label>
            <input v-model="confirmForm.confirmer_name" class="form-input" placeholder="请输入确认人姓名" />
          </div>
          <div class="form-group">
            <label>确认结果</label>
            <select v-model="confirmForm.status" class="form-input">
              <option value="approved">同意</option>
              <option value="rejected">拒绝</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn-action" @click="handleConfirm">确认</button>
            <button class="btn-cancel" @click="confirmVisible = false">取消</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.btn-back {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #666;
}
.btn-back:hover { color: #e8912d; border-color: #e8912d; }
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
.info-section {
  margin-bottom: 24px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e8912d;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
}
.info-row .label { color: #999; }
.status-dot {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #f6ffed;
  color: #389e0d;
}
.status-dot.active {
  background: #fff2f0;
  color: #cf1322;
}
.subsidy-display {
  background: linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%);
  border-radius: 8px;
  padding: 20px;
  color: #fff;
}
.subsidy-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}
.subsidy-amount {
  font-size: 28px;
  font-weight: 700;
}
.subsidy-amount.exceed { color: #ff6b6b; }
.subsidy-sub {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  opacity: 0.7;
}
.exceed-warning {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
  color: #d48806;
  font-size: 13px;
}
.btn-action {
  margin-top: 12px;
  padding: 6px 20px;
  border: 1px solid #e8912d;
  border-radius: 4px;
  background: #e8912d;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.btn-action:hover { background: #d07b1e; }
.btn-cancel {
  margin-top: 12px;
  padding: 6px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
.empty-state {
  text-align: center;
  padding: 20px 0;
  color: #999;
  font-size: 14px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.data-table th {
  background: #fafafa;
  color: #666;
  font-weight: 500;
}
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.approved { background: #f6ffed; color: #389e0d; }
.status-tag.pending { background: #fff7e6; color: #d48806; }
.btn-sm {
  padding: 3px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
}
.btn-sm.btn-primary {
  background: #e8912d;
  border-color: #e8912d;
  color: #fff;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.diet-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  background: #f0f0f0;
  color: #666;
}
.diet-tag.danger { background: #fff2f0; color: #cf1322; }
.diet-tag.warn { background: #fff7e6; color: #d48806; }
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
}
.modal-content h3 {
  font-size: 16px;
  color: #1a3a5c;
  margin-bottom: 16px;
}
.form-group {
  margin-bottom: 12px;
}
.form-group label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}
.form-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}
.form-input:focus { border-color: #e8912d; }
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
