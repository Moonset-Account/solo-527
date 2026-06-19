<template>
  <div class="register-page">
    <div class="register-header">
      <h1>{{ event?.name || '活动报名' }}</h1>
      <p v-if="event?.description">{{ event.description }}</p>
    </div>
    
    <n-card class="register-card" :bordered="false">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="2" :x-gap="24">
          <n-form-item-gi label="真实姓名" path="real_name">
            <n-input v-model:value="form.real_name" placeholder="请输入真实姓名" />
          </n-form-item-gi>
          <n-form-item-gi label="手机号码" path="phone">
            <n-input v-model:value="form.phone" placeholder="请输入手机号码" />
          </n-form-item-gi>
          <n-form-item-gi label="身份证号" path="id_card_no">
            <n-input v-model:value="form.id_card_no" placeholder="请输入身份证号" />
          </n-form-item-gi>
          <n-form-item-gi label="电子邮箱" path="email">
            <n-input v-model:value="form.email" placeholder="请输入电子邮箱" />
          </n-form-item-gi>
          <n-form-item-gi label="公司名称" path="company">
            <n-input v-model:value="form.company" placeholder="请输入公司名称" />
          </n-form-item-gi>
          <n-form-item-gi label="职位" path="position">
            <n-input v-model:value="form.position" placeholder="请输入职位" />
          </n-form-item-gi>
          <n-form-item-gi label="票种" path="ticket_type">
            <n-select v-model:value="form.ticket_type" :options="ticketTypeOptions" placeholder="请选择票种" />
          </n-form-item-gi>
          <n-form-item-gi label="票价(元)" path="ticket_price">
            <n-input-number v-model:value="form.ticket_price" :min="0" style="width: 100%" />
          </n-form-item-gi>
        </n-grid>
        
        <n-form-item label="备注">
          <n-input v-model:value="form.remark" type="textarea" :rows="3" placeholder="选填" />
        </n-form-item>
        
        <n-form-item>
          <n-space>
            <n-button type="primary" :loading="loading" @click="handleSubmit">
              提交报名
            </n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>
    
    <n-modal v-model:show="showSuccess" preset="card" title="报名成功" style="width: 500px">
      <div class="success-info">
        <n-icon size="48" color="#18a058">
          <CheckmarkCircleOutline />
        </n-icon>
        <p>您的报名已提交成功！</p>
        <p>报名编号：<strong>{{ registrationNo }}</strong></p>
        <p class="tip">请妥善保管您的报名编号，签到时使用</p>
      </div>
      <template #footer>
        <n-button type="primary" @click="showSuccess = false; handleReset()">
          继续报名
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard, NForm, NFormItem, NFormItemGi, NGrid,
  NInput, NInputNumber, NSelect, NButton, NSpace,
  NModal, NIcon, useMessage
} from 'naive-ui'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const message = useMessage()
const api = useApi()

const formRef = ref()
const loading = ref(false)
const event = ref<any>(null)
const showSuccess = ref(false)
const registrationNo = ref('')

const form = reactive({
  real_name: '',
  id_card_no: '',
  phone: '',
  email: '',
  company: '',
  position: '',
  ticket_type: 'standard',
  ticket_price: 0,
  remark: '',
})

const ticketTypeOptions = [
  { label: '标准票', value: 'standard' },
  { label: 'VIP票', value: 'vip' },
  { label: '嘉宾票', value: 'guest' },
  { label: '免费票', value: 'free' },
]

const rules = {
  real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号码', trigger: 'blur' }],
}

const fetchEvent = async () => {
  const eventId = route.query.event_id || 1
  try {
    const data = await api.get(`/events/${eventId}`)
    event.value = data
  } catch (e: any) {
    console.error('获取活动信息失败:', e)
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  
  const eventId = route.query.event_id || 1
  
  try {
    loading.value = true
    const result: any = await api.post('/registrations', {
      ...form,
      event_id: Number(eventId),
    })
    registrationNo.value = result.registration_no
    showSuccess.value = true
  } catch (e: any) {
    message.error(e.message || '提交失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  formRef.value?.restoreValidation()
  Object.assign(form, {
    real_name: '',
    id_card_no: '',
    phone: '',
    email: '',
    company: '',
    position: '',
    ticket_type: 'standard',
    ticket_price: 0,
    remark: '',
  })
}

onMounted(() => {
  fetchEvent()
})
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 28px;
    color: #333;
    margin-bottom: 8px;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
}

.register-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
}

.success-info {
  text-align: center;
  padding: 20px 0;
  
  p {
    margin: 12px 0;
    font-size: 16px;
  }
  
  strong {
    color: #18a058;
    font-size: 18px;
  }
  
  .tip {
    color: #999;
    font-size: 13px;
    margin-top: 16px;
  }
}
</style>
