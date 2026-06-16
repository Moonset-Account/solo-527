<template>
  <div class="payment-page">
    <div class="page-header">
      <h2>订单支付</h2>
      <el-button @click="goBack">返回</el-button>
    </div>

    <div class="payment-content">
      <el-card class="order-card" v-if="bookingInfo">
        <template #header>
          <div class="card-header">
            <span>订单信息</span>
            <el-tag :type="getStatusType(bookingInfo.status)">
              {{ getStatusText(bookingInfo.status) }}
            </el-tag>
          </div>
        </template>

        <div class="order-info">
          <div class="info-item">
            <span class="label">预约单号：</span>
            <span class="value">{{ bookingInfo.bookingNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">场地名称：</span>
            <span class="value">{{ bookingInfo.courtName }}</span>
          </div>
          <div class="info-item">
            <span class="label">预约日期：</span>
            <span class="value">{{ bookingInfo.bookingDate }}</span>
          </div>
          <div class="info-item">
            <span class="label">预约时段：</span>
            <span class="value">{{ formatTime(bookingInfo.startTime) }} - {{ formatTime(bookingInfo.endTime) }}</span>
          </div>
          <div class="info-item total">
            <span class="label">支付金额：</span>
            <span class="value price">¥{{ bookingInfo.payAmount || bookingInfo.totalAmount }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="payment-card" v-if="bookingInfo && bookingInfo.status === 0">
        <template #header>
          <span>选择支付方式</span>
        </template>

        <div class="payment-methods">
          <div
            v-for="method in paymentMethods"
            :key="method.value"
            class="payment-method"
            :class="{ active: selectedPayType === method.value }"
            @click="selectPayType(method.value)"
          >
            <el-icon class="method-icon" :style="{ color: method.color }">
              <component :is="method.icon" />
            </el-icon>
            <span class="method-name">{{ method.label }}</span>
            <el-icon class="check-icon" v-if="selectedPayType === method.value">
              <Check />
            </el-icon>
          </div>
        </div>

        <div class="pay-actions">
          <el-button
            type="primary"
            size="large"
            style="width: 100%;"
            :loading="paying"
            :disabled="!selectedPayType"
            @click="handlePay"
          >
            立即支付 ¥{{ bookingInfo.payAmount || bookingInfo.totalAmount }}
          </el-button>
        </div>
      </el-card>

      <el-card class="success-card" v-if="bookingInfo && bookingInfo.status === 1">
        <div class="success-content">
          <el-icon class="success-icon"><CircleCheck /></el-icon>
          <h3>支付成功</h3>
          <p>您的订单已支付完成</p>
          <el-button type="primary" @click="goToMyBookings">查看我的预约</el-button>
        </div>
      </el-card>

      <el-card class="success-card" v-if="bookingInfo && bookingInfo.status === 2">
        <div class="success-content">
          <el-icon class="cancel-icon"><CircleClose /></el-icon>
          <h3>订单已取消</h3>
          <p>该预约已被取消</p>
          <el-button type="primary" @click="goToCourts">重新预约</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBookingDetail } from '@/api/booking'
import { createPayment, mockPay } from '@/api/payment'
import { ElMessage } from 'element-plus'
import { Wallet, Money, CreditCard, Check, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const bookingInfo = ref(null)
const selectedPayType = ref('')
const paying = ref(false)

const paymentMethods = [
  { value: 'wechat', label: '微信支付', icon: 'Wallet', color: '#07c160' },
  { value: 'alipay', label: '支付宝', icon: 'Money', color: '#1677ff' },
  { value: 'card', label: '银行卡', icon: 'CreditCard', color: '#faad14' }
]

const fetchBookingDetail = async () => {
  try {
    const bookingId = route.params.bookingId
    const res = await getBookingDetail(bookingId)
    bookingInfo.value = res
  } catch (error) {
    ElMessage.error('获取订单信息失败')
  }
}

const formatTime = (time) => {
  if (!time) return ''
  if (typeof time === 'string') {
    return time.substring(0, 5)
  }
  return time
}

const getStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'primary'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已完成'
  }
  return textMap[status] || '未知'
}

const selectPayType = (type) => {
  selectedPayType.value = type
}

const handlePay = async () => {
  if (!selectedPayType.value) {
    ElMessage.warning('请选择支付方式')
    return
  }

  paying.value = true
  try {
    const paymentData = {
      bookingId: bookingInfo.value.id,
      payType: selectedPayType.value
    }
    const payment = await createPayment(paymentData)
    await mockPay(payment.payNo)
    ElMessage.success('支付成功')
    await fetchBookingDetail()
  } catch (error) {
    ElMessage.error('支付失败')
  } finally {
    paying.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToMyBookings = () => {
  router.push('/my-bookings')
}

const goToCourts = () => {
  router.push('/courts')
}

onMounted(() => {
  fetchBookingDetail()
})
</script>

<style scoped>
.payment-page {
  max-width: 500px;
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

.payment-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.order-info {
  padding: 10px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  color: #303133;
}

.info-item.total {
  padding-top: 15px;
  font-weight: bold;
}

.info-item.total .price {
  color: #f56c6c;
  font-size: 24px;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
}

.payment-method {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.payment-method:hover {
  border-color: #409eff;
}

.payment-method.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.method-icon {
  font-size: 28px;
  margin-right: 15px;
}

.method-name {
  flex: 1;
  font-size: 15px;
  color: #303133;
}

.check-icon {
  color: #409eff;
  font-size: 20px;
}

.pay-actions {
  padding-top: 20px;
}

.success-card,
.success-content {
  text-align: center;
  padding: 40px 20px;
}

.success-icon {
  font-size: 72px;
  color: #67c23a;
  margin-bottom: 20px;
}

.cancel-icon {
  font-size: 72px;
  color: #909399;
  margin-bottom: 20px;
}

.success-content h3 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.success-content p {
  color: #909399;
  margin-bottom: 30px;
}
</style>
