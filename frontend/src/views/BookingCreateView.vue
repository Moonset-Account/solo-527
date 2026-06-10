<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">新建预约</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#909399">为客户快速安排洁牙服务</p>
      </div>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
    </div>

    <div class="two-col-create">
      <div class="section-card">
        <div class="card-header"><h3 class="card-title">客户信息</h3></div>
        <div class="card-body">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="手机号" prop="customerPhone">
              <el-input v-model="form.customerPhone" placeholder="请输入手机号" maxlength="20" @blur="searchCustomer" />
            </el-form-item>
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="form.customerName" placeholder="请输入姓名" maxlength="50" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="form.gender">
                <el-radio value="男">男</el-radio>
                <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="年龄">
              <el-input-number v-model="form.age" :min="0" :max="150" />
            </el-form-item>
            <el-form-item label="病史备注">
              <el-input v-model="form.medicalHistory" type="textarea" :rows="3" placeholder="填写病史、药物过敏等信息" maxlength="500" />
            </el-form-item>
          </el-form>
        </div>

        <div class="card-header" style="border-top:1px solid #f0f0f0"><h3 class="card-title">预约信息</h3></div>
        <div class="card-body">
          <el-form ref="formRef2" :model="form" :rules="rules2" label-width="100px">
            <el-form-item label="服务项目" prop="serviceId">
              <el-select v-model="form.serviceId" placeholder="请选择服务项目" style="width:100%" @change="onServiceChange">
                <el-option v-for="s in serviceList" :key="s.id" :label="`${s.name} · ${s.duration_minutes}分钟 · ¥${s.price}`" :value="s.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="医生/技师" prop="staffId">
              <el-select v-model="form.staffId" placeholder="请选择人员" style="width:100%" @change="loadAvailableSlots">
                <el-option v-for="s in filteredStaffList" :key="s.id" :label="`${s.name} (${s.title || s.type === 'doctor' ? '医生' : '技师'})`" :value="s.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="预约日期" prop="bookingDate">
              <el-date-picker
                v-model="form.bookingDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                :disabled-date="disablePastDate"
                style="width:100%"
                @change="loadAvailableSlots"
              />
            </el-form-item>
            <el-form-item label="预约时段" prop="startTime">
              <div v-loading="slotsLoading">
                <div v-if="availableSlots.length === 0" class="empty-slots">
                  <el-empty description="暂无可用时段，请先选择日期和人员" :image-size="60" />
                </div>
                <div v-else class="slots-grid">
                  <div
                    v-for="slot in availableSlots"
                    :key="slot.id"
                    :class="['slot-item', { selected: form.timeSlotId === slot.id, full: slot.status === 'full' || slot.booked_count >= slot.capacity }]"
                    @click="selectSlot(slot)"
                  >
                    <div class="slot-time">{{ slot.start_time }} - {{ slot.end_time }}</div>
                    <div class="slot-rem">
                      剩 {{ slot.capacity - slot.booked_count }} / {{ slot.capacity }}
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="服务金额">
              <el-input-number v-model="form.amount" :min="0" :precision="2" :step="10" />
            </el-form-item>
            <el-form-item label="预约来源">
              <el-select v-model="form.source" style="width:100%">
                <el-option label="前台登记" value="front_desk" />
                <el-option label="线上预约" value="online" />
                <el-option label="电话预约" value="phone" />
                <el-option label="到店预约" value="walk_in" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="填写预约相关备注" maxlength="500" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="aside-create">
        <div class="section-card summary-card">
          <div class="card-header"><h3 class="card-title">预约摘要</h3></div>
          <div class="card-body">
            <div class="summary-item">
              <span>客户</span>
              <span class="val">{{ form.customerName || '-' }}</span>
            </div>
            <div class="summary-item">
              <span>服务</span>
              <span class="val">{{ selectedServiceName || '-' }}</span>
            </div>
            <div class="summary-item">
              <span>医生/技师</span>
              <span class="val">{{ selectedStaffName || '-' }}</span>
            </div>
            <div class="summary-item">
              <span>日期时段</span>
              <span class="val">{{ form.bookingDate || '-' }} {{ form.startTime ? (form.startTime + '-' + form.endTime) : '' }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-total">
              <span>应收金额</span>
              <span class="val price">¥{{ form.amount?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="card-body">
            <el-button type="primary" size="large" style="width:100%" :loading="submitting" @click="handleSubmit">
              <el-icon><Check /></el-icon> 确认创建预约
            </el-button>
            <el-button size="large" style="width:100%;margin-top:10px" @click="$router.back()">
              取消
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import { createBooking } from '@/api/booking'
import { getCustomerList } from '@/api/customer'
import { getServiceList } from '@/api/service'
import { getStaffList } from '@/api/staff'
import { getAvailableSlots } from '@/api/timeslot'

const router = useRouter()
const formRef = ref<FormInstance>()
const formRef2 = ref<FormInstance>()

const submitting = ref(false)
const slotsLoading = ref(false)
const serviceList = ref<any[]>([])
const staffList = ref<any[]>([])
const availableSlots = ref<any[]>([])

const form = reactive({
  customerName: '',
  customerPhone: '',
  gender: '',
  age: null as number | null,
  medicalHistory: '',
  serviceId: null as number | null,
  staffId: null as number | null,
  bookingDate: '',
  timeSlotId: null as number | null,
  startTime: '',
  endTime: '',
  amount: 0,
  source: 'front_desk',
  remark: '',
})

const rules: FormRules = {
  customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  customerPhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}
const rules2: FormRules = {
  serviceId: [{ required: true, message: '请选择服务项目', trigger: 'change' }],
  staffId: [{ required: true, message: '请选择医生/技师', trigger: 'change' }],
  bookingDate: [{ required: true, message: '请选择预约日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择预约时段', trigger: 'change' }],
}

const filteredStaffList = computed(() => {
  if (!form.serviceId) return staffList.value
  return staffList.value
})

const selectedServiceName = computed(() => {
  const s = serviceList.value.find(x => x.id === form.serviceId)
  return s ? s.name : ''
})
const selectedStaffName = computed(() => {
  const s = staffList.value.find(x => x.id === form.staffId)
  return s ? s.name : ''
})

const disablePastDate = (d: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d.getTime() < today.getTime()
}

const searchCustomer = async () => {
  if (!form.customerPhone) return
  try {
    const res = await getCustomerList({ keyword: form.customerPhone, perPage: 1 })
    const c = res.data.data?.[0]
    if (c && c.phone === form.customerPhone) {
      form.customerName = c.name
      form.gender = c.gender || ''
      form.age = c.age
      form.medicalHistory = c.medical_history || ''
      ElMessage.info('已自动加载该客户信息')
    }
  } catch (_) {
    // ignore
  }
}

const onServiceChange = (id: number) => {
  const s = serviceList.value.find(x => x.id === id)
  if (s) {
    form.amount = s.price
  }
  loadAvailableSlots()
}

const loadAvailableSlots = async () => {
  if (!form.bookingDate || !form.staffId) {
    availableSlots.value = []
    return
  }
  slotsLoading.value = true
  try {
    const res = await getAvailableSlots({
      date: form.bookingDate,
      staffId: form.staffId,
      serviceId: form.serviceId || undefined,
    })
    availableSlots.value = res.data || []
  } finally {
    slotsLoading.value = false
  }
}

const selectSlot = (slot: any) => {
  if (slot.booked_count >= slot.capacity || slot.status === 'full') {
    ElMessage.warning('该时段已满')
    return
  }
  form.timeSlotId = slot.id
  form.startTime = slot.start_time
  form.endTime = slot.end_time
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  await formRef2.value?.validate()
  submitting.value = true
  try {
    const res = await createBooking({ ...form })
    ElMessage.success('预约创建成功！')
    router.replace(`/bookings/${res.data.id}`)
  } catch (err: any) {
    ElMessage.error(err.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const [sRes, stRes] = await Promise.all([
    getServiceList({ active: '1' }),
    getStaffList({ active: '1' }),
  ])
  serviceList.value = sRes.data
  staffList.value = stRes.data
})
</script>

<style scoped>
.two-col-create {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: flex-start;
}
@media (max-width: 1100px) {
  .two-col-create { grid-template-columns: 1fr; }
}
.aside-create {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.slot-item {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.slot-item:hover:not(.full) {
  border-color: #2ab99f;
  background: #f0faf7;
}
.slot-item.selected {
  border-color: #2ab99f;
  background: #2ab99f;
  color: #fff;
}
.slot-item.selected .slot-time,
.slot-item.selected .slot-rem {
  color: #fff;
}
.slot-item.full {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f7fa;
}
.slot-time {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.slot-rem {
  font-size: 11px;
  color: #909399;
}

.empty-slots {
  padding: 30px 0;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
}

.summary-card {
  background: linear-gradient(135deg, #e6f7f3 0%, #f0faf7 100%);
  border: none;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 13px;
  color: #606266;
}
.summary-item .val {
  color: #303133;
  font-weight: 500;
  max-width: 55%;
  text-align: right;
}
.summary-divider {
  height: 1px;
  background: #d0ebe2;
  margin: 10px 0;
}
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  font-size: 14px;
  color: #606266;
}
.summary-total .val.price {
  font-size: 24px;
  font-weight: 700;
  color: #2ab99f;
}
</style>
