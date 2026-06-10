<template>
  <div class="appointment-page">
    <div class="page-title">
      <h2>在线预约</h2>
      <p>选择您喜欢的服务和技师，轻松预约</p>
    </div>

    <div class="steps">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="选择服务" />
        <el-step title="选择技师" />
        <el-step title="选择时间" />
        <el-step title="填写信息" />
      </el-steps>
    </div>

    <div class="step-content">
      <div v-if="currentStep === 0" class="service-list">
        <h3>选择服务项目</h3>
        <div class="service-grid">
          <div
            v-for="service in services"
            :key="service._id"
            :class="['service-card', { active: selectedServices.includes(service._id) }]"
            @click="toggleService(service)"
          >
            <div class="service-image">
              <img v-if="service.images?.length" :src="service.images[0]" :alt="service.name" />
              <div v-else class="placeholder">
                <el-icon :size="48"><NailPolish /></el-icon>
              </div>
            </div>
            <div class="service-info">
              <h4>{{ service.name }}</h4>
              <p class="description">{{ service.description }}</p>
              <div class="service-meta">
                <span class="price">¥{{ service.price }}</span>
                <span class="duration">{{ service.duration }}分钟</span>
              </div>
            </div>
            <div class="selected-check" v-if="selectedServices.includes(service._id)">
              <el-icon :size="24"><Check /></el-icon>
            </div>
          </div>
        </div>
        <div class="step-actions">
          <el-button type="primary" :disabled="selectedServices.length === 0" @click="nextStep">
            下一步
          </el-button>
        </div>
      </div>

      <div v-if="currentStep === 1" class="technician-list">
        <h3>选择技师</h3>
        <div class="technician-grid">
          <div
            v-for="tech in technicians"
            :key="tech._id"
            :class="['technician-card', { active: selectedTechnician?._id === tech._id }]"
            @click="selectTechnician(tech)"
          >
            <div class="tech-avatar">
              <el-avatar :size="80" :src="tech.avatar">
                {{ tech.name?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="tech-info">
              <h4>{{ tech.name }}</h4>
              <p class="position">{{ tech.position }}</p>
              <div class="skills">
                <el-tag v-for="skill in tech.skills?.slice(0, 3)" :key="skill" size="small" type="info">
                  {{ skill }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" :disabled="!selectedTechnician" @click="nextStep">
            下一步
          </el-button>
        </div>
      </div>

      <div v-if="currentStep === 2" class="time-select">
        <h3>选择时间</h3>
        <div class="date-selector">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadTimeSlots"
          />
        </div>
        <div class="time-slots">
          <h4>可选时段</h4>
          <div v-loading="loadingSlots" class="slots-grid">
            <div
              v-for="slot in timeSlots"
              :key="slot"
              :class="['time-slot', { active: selectedTime === slot }]"
              @click="selectTime(slot)"
            >
              {{ slot }}
            </div>
          </div>
          <div v-if="!loadingSlots && timeSlots.length === 0" class="no-slots">
            <p>该日期暂无可用时段</p>
          </div>
        </div>
        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" :disabled="!selectedTime" @click="nextStep">
            下一步
          </el-button>
        </div>
      </div>

      <div v-if="currentStep === 3" class="confirm-form">
        <h3>确认预约信息</h3>
        <div class="summary-card">
          <div class="summary-item">
            <label>服务项目：</label>
            <div class="value">
              <div v-for="s in selectedServiceDetails" :key="s._id" class="service-item">
                <span>{{ s.name }}</span>
                <span class="price">¥{{ s.price }}</span>
              </div>
            </div>
          </div>
          <div class="summary-item">
            <label>服务技师：</label>
            <span class="value">{{ selectedTechnician?.name }}</span>
          </div>
          <div class="summary-item">
            <label>预约时间：</label>
            <span class="value">{{ selectedDate }} {{ selectedTime }}</span>
          </div>
          <div class="summary-item">
            <label>预计时长：</label>
            <span class="value">{{ totalDuration }}分钟</span>
          </div>
          <div class="summary-item total">
            <label>总计金额：</label>
            <span class="value price">¥{{ totalPrice }}</span>
          </div>
        </div>

        <el-form :model="customerForm" label-width="80px" class="customer-form">
          <el-form-item label="姓名" required>
            <el-input v-model="customerForm.name" placeholder="请输入您的姓名" />
          </el-form-item>
          <el-form-item label="手机号" required>
            <el-input v-model="customerForm.phone" placeholder="请输入您的手机号" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="customerForm.remark"
              type="textarea"
              :rows="3"
              placeholder="如有特殊需求请备注"
            />
          </el-form-item>
        </el-form>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" :loading="submitting" @click="submitAppointment">
            确认预约
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="successVisible" title="预约成功" width="400px" center>
      <div class="success-content">
        <el-icon :size="64" color="#67c23a"><CircleCheck /></el-icon>
        <h3>预约成功！</h3>
        <p>我们会在预约时间前提醒您</p>
      </div>
      <template #footer>
        <el-button @click="goToMyAppointments">查看我的预约</el-button>
        <el-button type="primary" @click="resetAndNew">再约一个</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, CircleCheck, NailPolish } from '@element-plus/icons-vue'
import { getActiveServices } from '@/api/services'
import { getActiveTechnicians, getTechniciansByService } from '@/api/technicians'
import { getAvailableTimeSlots, createPublicAppointment } from '@/api/appointments'
import dayjs from 'dayjs'

const router = useRouter()

const currentStep = ref(0)
const services = ref([])
const technicians = ref([])
const selectedServices = ref([])
const selectedTechnician = ref(null)
const selectedDate = ref('')
const selectedTime = ref('')
const timeSlots = ref([])
const loadingSlots = ref(false)
const submitting = ref(false)
const successVisible = ref(false)

const customerForm = reactive({
  name: '',
  phone: '',
  remark: '',
})

const selectedServiceDetails = computed(() => {
  return services.value.filter(s => selectedServices.value.includes(s._id))
})

const totalPrice = computed(() => {
  return selectedServiceDetails.value.reduce((sum, s) => sum + s.price, 0)
})

const totalDuration = computed(() => {
  return selectedServiceDetails.value.reduce((sum, s) => sum + (s.duration || 60), 0)
})

async function loadServices() {
  try {
    const data = await getActiveServices()
    services.value = data
  } catch (e) {
    // 错误已处理
  }
}

function toggleService(service) {
  const index = selectedServices.value.indexOf(service._id)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  } else {
    selectedServices.value.push(service._id)
  }
}

function selectTechnician(tech) {
  selectedTechnician.value = tech
}

async function loadTechnicians() {
  try {
    if (selectedServices.value.length > 0) {
      // 如果选择了服务，加载能做这些服务的技师
      const firstServiceId = selectedServices.value[0]
      const data = await getTechniciansByService(firstServiceId)
      technicians.value = data
    }
    if (technicians.value.length === 0) {
      const data = await getActiveTechnicians()
      technicians.value = data
    }
  } catch (e) {
    // 错误已处理
  }
}

function disabledDate(time) {
  return time.getTime() < Date.now() - 8.64e7
}

async function loadTimeSlots() {
  if (!selectedTechnician.value || !selectedDate.value) return
  
  loadingSlots.value = true
  try {
    const data = await getAvailableTimeSlots(
      selectedTechnician.value._id,
      selectedDate.value,
      totalDuration.value
    )
    timeSlots.value = data
  } catch (e) {
    timeSlots.value = []
  } finally {
    loadingSlots.value = false
  }
}

function selectTime(time) {
  selectedTime.value = time
}

function nextStep() {
  if (currentStep.value === 0) {
    loadTechnicians()
  }
  if (currentStep.value === 1 && selectedDate.value) {
    loadTimeSlots()
  }
  currentStep.value++
}

function prevStep() {
  currentStep.value--
}

async function submitAppointment() {
  if (!customerForm.name || !customerForm.phone) {
    ElMessage.warning('请填写姓名和手机号')
    return
  }

  submitting.value = true
  try {
    await createPublicAppointment({
      serviceIds: selectedServices.value,
      technicianId: selectedTechnician.value._id,
      appointmentDate: selectedDate.value,
      startTime: selectedTime.value,
      customerName: customerForm.name,
      customerPhone: customerForm.phone,
      remark: customerForm.remark,
    })
    
    successVisible.value = true
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function goToMyAppointments() {
  successVisible.value = false
  router.push('/customer/my-appointments')
}

function resetAndNew() {
  successVisible.value = false
  currentStep.value = 0
  selectedServices.value = []
  selectedTechnician.value = null
  selectedDate.value = ''
  selectedTime.value = ''
  customerForm.name = ''
  customerForm.phone = ''
  customerForm.remark = ''
}

onMounted(() => {
  loadServices()
  selectedDate.value = dayjs().format('YYYY-MM-DD')
})
</script>

<style scoped lang="scss">
.appointment-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    font-size: 28px;
    margin: 0 0 8px 0;
    color: #333;
  }

  p {
    color: #999;
    margin: 0;
  }
}

.steps {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.step-content {
  background: #fff;
  padding: 30px;
  border-radius: 12px;

  h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #333;
  }
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.service-card {
  border: 2px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;

  &:hover {
    border-color: #ffb6c1;
    transform: translateY(-2px);
  }

  &.active {
    border-color: #e91e63;
    box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
  }

  .service-image {
    height: 140px;
    background: #f9f0f4;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder {
      color: #e91e63;
      opacity: 0.5;
    }
  }

  .service-info {
    padding: 16px;

    h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
    }

    .description {
      font-size: 12px;
      color: #999;
      margin: 0 0 12px 0;
      height: 36px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .service-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .price {
        color: #e91e63;
        font-size: 18px;
        font-weight: bold;
      }

      .duration {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .selected-check {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #e91e63;
    color: #fff;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.technician-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.technician-card {
  border: 2px solid #eee;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #ffb6c1;
  }

  &.active {
    border-color: #e91e63;
    background: #fff0f5;
  }

  .tech-avatar {
    margin-bottom: 12px;
  }

  .tech-info {
    h4 {
      margin: 0 0 4px 0;
    }

    .position {
      font-size: 12px;
      color: #999;
      margin: 0 0 12px 0;
    }

    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: center;
    }
  }
}

.date-selector {
  margin-bottom: 20px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.time-slot {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #e91e63;
    color: #e91e63;
  }

  &.active {
    background: #e91e63;
    color: #fff;
    border-color: #e91e63;
  }
}

.no-slots {
  text-align: center;
  padding: 40px;
  color: #999;
}

.summary-card {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  .summary-item {
    display: flex;
    margin-bottom: 12px;

    label {
      width: 100px;
      color: #666;
    }

    .value {
      flex: 1;
      color: #333;

      .service-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;

        .price {
          color: #e91e63;
        }
      }

      &.price {
        color: #e91e63;
        font-size: 20px;
        font-weight: bold;
      }
    }

    &.total {
      border-top: 1px dashed #ddd;
      padding-top: 12px;
      margin-top: 12px;
    }
  }
}

.customer-form {
  margin-bottom: 20px;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.success-content {
  text-align: center;
  padding: 20px 0;

  h3 {
    margin: 16px 0 8px 0;
    color: #333;
  }

  p {
    color: #999;
    margin: 0;
  }
}
</style>
