<template>
  <div class="booking-create">
    <div class="page-header">
      <h2>预约场地</h2>
      <el-button @click="goBack">返回列表</el-button>
    </div>

    <el-card class="booking-form-card">
      <el-form :model="bookingForm" label-width="100px" label-position="left">
        <el-form-item label="选择日期">
          <el-date-picker
            v-model="bookingForm.bookingDate"
            type="date"
            placeholder="选择预约日期"
            :disabled-date="disabledDate"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item label="选择场地">
          <el-select
            v-model="bookingForm.courtId"
            placeholder="请选择场地"
            style="width: 100%;"
            @change="handleCourtChange"
          >
            <el-option
              v-for="court in courtList"
              :key="court.id"
              :label="`${court.name} - ¥${court.pricePerHour}/小时`"
              :value="court.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选择时段" v-if="availableSlots.length > 0">
          <div class="time-slots">
            <div
              v-for="(slot, index) in availableSlots"
              :key="index"
              class="time-slot"
              :class="{ active: isSlotSelected(slot), disabled: !isSlotAvailable(slot) }"
              @click="selectSlot(slot)"
            >
              {{ formatTime(slot[0]) }} - {{ formatTime(slot[1]) }}
            </div>
          </div>
        </el-form-item>

        <el-form-item label="选择时段" v-else-if="bookingForm.courtId && bookingForm.bookingDate">
          <el-empty description="该日期暂无可用时段" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="bookingForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item v-if="selectedSlot && selectedCourt">
          <el-card class="summary-card" shadow="never">
            <h3>预约信息确认</h3>
            <div class="summary-item">
              <span class="label">场地名称：</span>
              <span class="value">{{ selectedCourt.name }}</span>
            </div>
            <div class="summary-item">
              <span class="label">预约日期：</span>
              <span class="value">{{ bookingForm.bookingDate }}</span>
            </div>
            <div class="summary-item">
              <span class="label">预约时段：</span>
              <span class="value">{{ formatTime(selectedSlot[0]) }} - {{ formatTime(selectedSlot[1]) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">时长：</span>
              <span class="value">{{ calculateDuration() }}小时</span>
            </div>
            <div class="summary-item total">
              <span class="label">预计费用：</span>
              <span class="value price">¥{{ calculateTotalPrice() }}</span>
            </div>
          </el-card>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%;"
            :disabled="!canSubmit"
            :loading="submitting"
            @click="submitBooking"
          >
            提交预约
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="successDialogVisible" title="预约成功" width="400px">
      <div class="success-content">
        <el-icon class="success-icon"><Check /></el-icon>
        <p>预约提交成功！</p>
        <p class="booking-no">预约单号：{{ bookingResult?.bookingNo }}</p>
      </div>
      <template #footer>
        <el-button @click="successDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToPayment">去支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourtList } from '@/api/court'
import { getAvailableSlots, createBooking } from '@/api/booking'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const courtList = ref([])
const availableSlots = ref([])
const selectedSlot = ref(null)
const submitting = ref(false)
const successDialogVisible = ref(false)
const bookingResult = ref(null)

const bookingForm = ref({
  bookingDate: '',
  courtId: null,
  remark: ''
})

const selectedCourt = computed(() => {
  return courtList.value.find(c => c.id === bookingForm.value.courtId)
})

const canSubmit = computed(() => {
  return bookingForm.value.bookingDate &&
         bookingForm.value.courtId &&
         selectedSlot.value
})

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 86400000
}

const fetchCourtList = async () => {
  try {
    const res = await getCourtList(1)
    courtList.value = res
  } catch (error) {
    ElMessage.error('获取场地列表失败')
  }
}

const fetchAvailableSlots = async () => {
  if (!bookingForm.value.courtId || !bookingForm.value.bookingDate) {
    availableSlots.value = []
    return
  }
  try {
    const res = await getAvailableSlots(bookingForm.value.courtId, bookingForm.value.bookingDate)
    availableSlots.value = res
    selectedSlot.value = null
  } catch (error) {
    ElMessage.error('获取可用时段失败')
  }
}

const handleDateChange = () => {
  selectedSlot.value = null
  if (bookingForm.value.courtId) {
    fetchAvailableSlots()
  }
}

const handleCourtChange = () => {
  selectedSlot.value = null
  if (bookingForm.value.bookingDate) {
    fetchAvailableSlots()
  }
}

const isSlotSelected = (slot) => {
  if (!selectedSlot.value) return false
  return selectedSlot.value[0] === slot[0] && selectedSlot.value[1] === slot[1]
}

const isSlotAvailable = (slot) => {
  return true
}

const selectSlot = (slot) => {
  if (!isSlotAvailable(slot)) return
  selectedSlot.value = slot
}

const formatTime = (time) => {
  if (!time) return ''
  if (typeof time === 'string') return time.substring(0, 5)
  return time
}

const calculateDuration = () => {
  if (!selectedSlot.value) return 0
  const start = selectedSlot.value[0]
  const end = selectedSlot.value[1]
  const startHour = parseInt(start.split(':')[0])
  const startMin = parseInt(start.split(':')[1])
  const endHour = parseInt(end.split(':')[0])
  const endMin = parseInt(end.split(':')[1])
  const duration = (endHour - startHour) + (endMin - startMin) / 60
  return duration
}

const calculateTotalPrice = () => {
  if (!selectedCourt.value) return '0.00'
  const duration = calculateDuration()
  const price = parseFloat(selectedCourt.value.pricePerHour) * duration
  return price.toFixed(2)
}

const submitBooking = async () => {
  if (!canSubmit.value) return
  
  submitting.value = true
  try {
    const data = {
      courtId: bookingForm.value.courtId,
      bookingDate: bookingForm.value.bookingDate,
      startTime: selectedSlot.value[0],
      endTime: selectedSlot.value[1],
      remark: bookingForm.value.remark
    }
    const res = await createBooking(data)
    bookingResult.value = res
    successDialogVisible.value = true
  } catch (error) {
    ElMessage.error('预约提交失败')
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.push('/courts')
}

const goToPayment = () => {
  successDialogVisible.value = false
  router.push(`/payment/${bookingResult.value.id}`)
}

onMounted(() => {
  fetchCourtList()
  const courtId = route.query.courtId
  if (courtId) {
    bookingForm.value.courtId = parseInt(courtId)
  }
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  bookingForm.value.bookingDate = `${year}-${month}-${day}`
  if (courtId) {
    fetchAvailableSlots()
  }
})
</script>

<style scoped>
.booking-create {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
}

.booking-form-card {
  border-radius: 8px;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.time-slot {
  padding: 12px 8px;
  text-align: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.time-slot:hover {
  border-color: #409eff;
  color: #409eff;
}

.time-slot.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.time-slot.disabled {
  background-color: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
  border-color: #ebeef5;
}

.summary-card {
  background-color: #f5f7fa;
  width: 100%;
}

.summary-card h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.summary-item .label {
  color: #909399;
}

.summary-item .value {
  color: #303133;
}

.summary-item.total {
  margin-top: 10px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  font-weight: bold;
}

.summary-item.total .price {
  color: #f56c6c;
  font-size: 20px;
}

.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 20px;
}

.success-content p {
  font-size: 16px;
  color: #303133;
  margin-bottom: 10px;
}

.booking-no {
  color: #909399;
  font-size: 14px;
}
</style>
