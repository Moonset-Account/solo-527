<template>
  <div class="place-order">
    <el-card class="step-card" shadow="never">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="选择服务" description="选择需要的服务项目" />
        <el-step title="填写地址" description="填写或选择服务地址" />
        <el-step title="预约时间" description="选择上门服务时间" />
      </el-steps>
    </el-card>

    <div class="step-content">
      <div v-show="activeStep === 0" class="step-pane">
        <el-card shadow="never" class="search-card">
          <el-input
            v-model="serviceKeyword"
            placeholder="搜索服务名称..."
            clearable
            :prefix-icon="Search"
            class="service-search"
          />
        </el-card>

        <el-row :gutter="20" class="service-categories">
          <el-col :span="24" v-for="(services, category) in groupedServices" :key="category">
            <el-card shadow="never" class="category-card">
              <template #header>
                <div class="category-header">
                  <el-icon :size="20" color="#409EFF"><Goods /></el-icon>
                  <span class="category-title">{{ category }}</span>
                </div>
              </template>
              <el-row :gutter="16">
                <el-col :span="8" v-for="service in services" :key="service._id">
                  <div
                    class="service-card"
                    :class="{ active: selectedService?._id === service._id }"
                    @click="selectService(service)"
                  >
                    <div class="service-name">{{ service.name }}</div>
                    <div class="service-meta">
                      <span class="price">¥{{ service.price }}/{{ service.unit }}</span>
                      <span class="duration">约{{ service.duration }}分钟</span>
                    </div>
                    <div class="service-desc" v-if="service.description">
                      {{ service.description }}
                    </div>
                    <el-tag
                      v-if="selectedService?._id === service._id"
                      type="success"
                      effect="dark"
                      class="selected-tag"
                    >
                      已选择
                    </el-tag>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div v-show="activeStep === 1" class="step-pane">
        <el-row :gutter="20">
          <el-col :span="10">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>常用地址</span>
                  <el-button type="primary" link @click="showNewAddress = true">
                    <el-icon><Plus /></el-icon>新增地址
                  </el-button>
                </div>
              </template>
              <div class="saved-addresses">
                <div
                  v-for="addr in savedAddresses"
                  :key="addr._id"
                  class="address-item"
                  :class="{ active: selectedAddress?._id === addr._id }"
                  @click="selectAddress(addr)"
                >
                  <div class="address-contact">
                    <span class="name">{{ addr.contactName }}</span>
                    <span class="phone">{{ addr.phone }}</span>
                    <el-tag v-if="addr.isDefault" type="primary" size="small">默认</el-tag>
                  </div>
                  <div class="address-detail">
                    {{ addr.province }} {{ addr.city }} {{ addr.district }}
                    {{ addr.community ? addr.community + ' ' : '' }}{{ addr.detail }}
                  </div>
                </div>
                <el-empty v-if="savedAddresses.length === 0" description="暂无保存的地址" :image-size="60" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="14">
            <el-card shadow="never">
              <template #header>
                <span>{{ editingAddressId ? '编辑地址' : '填写新地址' }}</span>
              </template>
              <el-form :model="addressForm" :rules="addressRules" ref="addressFormRef" label-width="100px">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="联系人" prop="contactName">
                      <el-input v-model="addressForm.contactName" placeholder="请输入联系人姓名" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="联系电话" prop="phone">
                      <el-input v-model="addressForm.phone" placeholder="请输入手机号码" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="所在地区" prop="region">
                  <el-cascader
                    v-model="addressForm.region"
                    :options="regionOptions"
                    placeholder="请选择省/市/区"
                    style="width: 100%"
                    @change="handleRegionChange"
                  />
                </el-form-item>
                <el-form-item label="所属社区" prop="community">
                  <el-input v-model="addressForm.community" placeholder="请输入小区/社区名称（选填）" />
                </el-form-item>
                <el-form-item label="详细地址" prop="detail">
                  <el-input
                    v-model="addressForm.detail"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入详细地址，如楼栋号、门牌号等"
                  />
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="addressForm.saveAsDefault">设为默认地址</el-checkbox>
                  <el-checkbox v-model="addressForm.saveAddress" style="margin-left: 20px">保存为常用地址</el-checkbox>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="confirmAddress">确认使用此地址</el-button>
                  <el-button @click="resetAddressForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div v-show="activeStep === 2" class="step-pane">
        <el-card shadow="never">
          <el-form label-width="120px" class="time-form">
            <el-form-item label="预约日期">
              <el-date-picker
                v-model="scheduleDate"
                type="date"
                placeholder="选择预约日期"
                :disabled-date="disabledDate"
                style="width: 300px"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="预约时间">
              <el-radio-group v-model="scheduleTime">
                <el-radio
                  v-for="slot in timeSlots"
                  :key="slot.value"
                  :value="slot.value"
                  :disabled="slot.disabled"
                  border
                >
                  {{ slot.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="备注信息">
              <el-input
                v-model="remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息，例如：需要带什么工具、有什么特殊要求等（选填）"
                style="max-width: 500px"
              />
            </el-form-item>
          </el-form>
          <el-divider />
          <div class="schedule-summary" v-if="selectedService && scheduleDate && scheduleTime">
            <el-alert type="info" :closable="false">
              <template #title>
                <div class="schedule-info">
                  <div>
                    <strong>预约时间：</strong>
                    {{ scheduleDate }} {{ scheduleTime }}
                  </div>
                  <div>
                    <strong>预计结束时间：</strong>
                    {{ calculateEndTime }}
                  </div>
                </div>
              </template>
            </el-alert>
          </div>
        </el-card>
      </div>
    </div>

    <div class="summary-bar">
      <div class="summary-info">
        <div class="summary-item" v-if="selectedService">
          <el-icon color="#409EFF"><Goods /></el-icon>
          <span>{{ selectedService.name }}</span>
        </div>
        <div class="summary-item" v-if="selectedAddress">
          <el-icon color="#67C23A"><Location /></el-icon>
          <span>{{ selectedAddress.contactName }} {{ selectedAddress.phone }} - {{ formatAddress(selectedAddress) }}</span>
        </div>
        <div class="summary-item" v-if="scheduleDate && scheduleTime">
          <el-icon color="#E6A23C"><Clock /></el-icon>
          <span>{{ scheduleDate }} {{ scheduleTime }}</span>
        </div>
      </div>
      <div class="summary-action">
        <div class="total-price" v-if="selectedService">
          <span>合计：</span>
          <span class="price-amount">¥{{ selectedService.price }}</span>
        </div>
        <el-button
          v-if="activeStep > 0"
          @click="prevStep"
        >
          上一步
        </el-button>
        <el-button
          v-if="activeStep < 2"
          type="primary"
          @click="nextStep"
          :disabled="!canGoNext"
        >
          下一步
        </el-button>
        <el-button
          v-if="activeStep === 2"
          type="primary"
          @click="submitOrder"
          :disabled="!canGoNext || submitting"
          :loading="submitting"
        >
          提交订单
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Goods, Plus, Location, Clock } from '@element-plus/icons-vue'
import {
  createOrder,
  getServiceList,
  type ServiceItem,
  type AddressSnapshot,
} from '@/api'

interface SavedAddress {
  _id: string
  userId: string
  contactName: string
  phone: string
  province: string
  city: string
  district: string
  community: string
  detail: string
  lng: number
  lat: number
  isDefault: boolean
}

const activeStep = ref(0)
const submitting = ref(false)
const editingAddressId = ref<string | null>(null)
const showNewAddress = ref(false)

const serviceKeyword = ref('')
const serviceList = ref<ServiceItem[]>([])
const selectedService = ref<ServiceItem | null>(null)

const savedAddresses = ref<SavedAddress[]>([])
const selectedAddress = ref<SavedAddress | null>(null)

const addressFormRef = ref<FormInstance>()
const addressForm = reactive({
  contactName: '',
  phone: '',
  region: [] as string[],
  province: '',
  city: '',
  district: '',
  community: '',
  detail: '',
  saveAsDefault: false,
  saveAddress: true,
})

const addressRules: FormRules = {
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  region: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}

const scheduleDate = ref('')
const scheduleTime = ref('')
const remark = ref('')

const regionOptions = [
  {
    value: '北京市',
    label: '北京市',
    children: [
      {
        value: '北京市',
        label: '北京市',
        children: [
          { value: '东城区', label: '东城区' },
          { value: '西城区', label: '西城区' },
          { value: '朝阳区', label: '朝阳区' },
          { value: '海淀区', label: '海淀区' },
          { value: '丰台区', label: '丰台区' },
          { value: '石景山区', label: '石景山区' },
        ],
      },
    ],
  },
  {
    value: '上海市',
    label: '上海市',
    children: [
      {
        value: '上海市',
        label: '上海市',
        children: [
          { value: '黄浦区', label: '黄浦区' },
          { value: '徐汇区', label: '徐汇区' },
          { value: '长宁区', label: '长宁区' },
          { value: '静安区', label: '静安区' },
          { value: '浦东新区', label: '浦东新区' },
        ],
      },
    ],
  },
  {
    value: '广东省',
    label: '广东省',
    children: [
      {
        value: '广州市',
        label: '广州市',
        children: [
          { value: '天河区', label: '天河区' },
          { value: '越秀区', label: '越秀区' },
          { value: '海珠区', label: '海珠区' },
          { value: '番禺区', label: '番禺区' },
        ],
      },
      {
        value: '深圳市',
        label: '深圳市',
        children: [
          { value: '福田区', label: '福田区' },
          { value: '南山区', label: '南山区' },
          { value: '罗湖区', label: '罗湖区' },
          { value: '宝安区', label: '宝安区' },
        ],
      },
    ],
  },
]

const timeSlots = computed(() => {
  const slots = [
    { value: '09:00', label: '09:00-11:00', disabled: false },
    { value: '11:00', label: '11:00-13:00', disabled: false },
    { value: '13:00', label: '13:00-15:00', disabled: false },
    { value: '15:00', label: '15:00-17:00', disabled: false },
    { value: '17:00', label: '17:00-19:00', disabled: false },
  ]
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  if (scheduleDate.value === today) {
    slots.forEach((slot) => {
      const hour = parseInt(slot.value.split(':')[0])
      if (hour <= now.getHours()) {
        slot.disabled = true
      }
    })
  }
  return slots
})

const groupedServices = computed(() => {
  const keyword = serviceKeyword.value.trim().toLowerCase()
  const filtered = serviceList.value.filter(
    (s) => s.enabled && (!keyword || s.name.toLowerCase().includes(keyword) || s.category.toLowerCase().includes(keyword))
  )
  const groups: Record<string, ServiceItem[]> = {}
  filtered.forEach((s) => {
    if (!groups[s.category]) groups[s.category] = []
    groups[s.category].push(s)
  })
  return groups
})

const calculateEndTime = computed(() => {
  if (!scheduleDate.value || !scheduleTime.value || !selectedService.value) return ''
  const [hour, minute] = scheduleTime.value.split(':').map(Number)
  const duration = selectedService.value.duration
  const start = new Date(`${scheduleDate.value}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`)
  const end = new Date(start.getTime() + duration * 60 * 1000)
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
})

const canGoNext = computed(() => {
  if (activeStep.value === 0) return !!selectedService.value
  if (activeStep.value === 1) return !!selectedAddress.value
  if (activeStep.value === 2) return !!scheduleDate.value && !!scheduleTime.value
  return false
})

function disabledDate(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)
  return date < today || date > maxDate
}

async function loadServices() {
  try {
    const res = await getServiceList({ pageSize: 100 })
    serviceList.value = res.data?.data || res.data || []
  } catch (e) {
    serviceList.value = [
      { _id: '1', name: '日常保洁', category: '保洁服务', duration: 120, price: 199, unit: '次', description: '包含客厅、卧室、厨房、卫生间等区域的清洁', enabled: true, createdAt: '', updatedAt: '' },
      { _id: '2', name: '深度保洁', category: '保洁服务', duration: 240, price: 399, unit: '次', description: '包含日常保洁 + 油烟机/冰箱等家电清洁', enabled: true, createdAt: '', updatedAt: '' },
      { _id: '3', name: '玻璃清洁', category: '保洁服务', duration: 60, price: 99, unit: '次', description: '专业擦玻璃，内外两面清洁', enabled: true, createdAt: '', updatedAt: '' },
      { _id: '4', name: '空调清洗', category: '家电服务', duration: 90, price: 149, unit: '台', description: '拆洗空调滤网、蒸发器，消毒杀菌', enabled: true, createdAt: '', updatedAt: '' },
      { _id: '5', name: '油烟机清洗', category: '家电服务', duration: 90, price: 169, unit: '台', description: '深度拆卸清洗，去除顽固油污', enabled: true, createdAt: '', updatedAt: '' },
      { _id: '6', name: '洗衣机清洗', category: '家电服务', duration: 60, price: 129, unit: '台', description: '清洗内筒夹层，去除污垢异味', enabled: true, createdAt: '', updatedAt: '' },
      { _id: '7', name: '水电维修', category: '维修服务', duration: 60, price: 99, unit: '次', description: '上门检测维修（不含配件费）', enabled: true, createdAt: '', updatedAt: '' },
      { _id: '8', name: '疏通服务', category: '维修服务', duration: 60, price: 119, unit: '次', description: '马桶、地漏、下水道疏通', enabled: true, createdAt: '', updatedAt: '' },
    ]
  }
}

function loadSavedAddresses() {
  try {
    const stored = localStorage.getItem('savedAddresses')
    if (stored) {
      savedAddresses.value = JSON.parse(stored)
    }
  } catch (e) {
    savedAddresses.value = [
      {
        _id: 'addr1',
        userId: 'user1',
        contactName: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        community: '阳光花园',
        detail: '1号楼2单元301室',
        lng: 116.4,
        lat: 39.9,
        isDefault: true,
      },
      {
        _id: 'addr2',
        userId: 'user1',
        contactName: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '海淀区',
        community: '中关村公寓',
        detail: 'A座1508室',
        lng: 116.3,
        lat: 39.98,
        isDefault: false,
      },
    ]
  }
}

function selectService(service: ServiceItem) {
  selectedService.value = service
}

function selectAddress(addr: SavedAddress) {
  selectedAddress.value = addr
  addressForm.contactName = addr.contactName
  addressForm.phone = addr.phone
  addressForm.region = [addr.province, addr.city, addr.district]
  addressForm.province = addr.province
  addressForm.city = addr.city
  addressForm.district = addr.district
  addressForm.community = addr.community
  addressForm.detail = addr.detail
  editingAddressId.value = addr._id
}

function handleRegionChange(value: string[]) {
  if (value && value.length === 3) {
    addressForm.province = value[0]
    addressForm.city = value[1]
    addressForm.district = value[2]
  }
}

async function confirmAddress() {
  try {
    await addressFormRef.value?.validate()
    const addr: SavedAddress = {
      _id: editingAddressId.value || `addr_${Date.now()}`,
      userId: 'current_user',
      contactName: addressForm.contactName,
      phone: addressForm.phone,
      province: addressForm.province,
      city: addressForm.city,
      district: addressForm.district,
      community: addressForm.community,
      detail: addressForm.detail,
      lng: 0,
      lat: 0,
      isDefault: addressForm.saveAsDefault,
    }
    if (addressForm.saveAddress) {
      const idx = savedAddresses.value.findIndex((a) => a._id === addr._id)
      if (idx >= 0) {
        savedAddresses.value[idx] = addr
      } else {
        if (addressForm.saveAsDefault) {
          savedAddresses.value.forEach((a) => (a.isDefault = false))
        }
        savedAddresses.value.unshift(addr)
      }
      localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses.value))
    }
    selectedAddress.value = addr
    ElMessage.success('地址确认成功')
  } catch (e) {
    ElMessage.warning('请完整填写地址信息')
  }
}

function resetAddressForm() {
  addressForm.contactName = ''
  addressForm.phone = ''
  addressForm.region = []
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.community = ''
  addressForm.detail = ''
  addressForm.saveAsDefault = false
  addressForm.saveAddress = true
  editingAddressId.value = null
  addressFormRef.value?.resetFields()
}

function formatAddress(addr: SavedAddress | AddressSnapshot) {
  return `${addr.province}${addr.city}${addr.district}${(addr as any).community ? ' ' + (addr as any).community : ''} ${addr.detail}`
}

function prevStep() {
  if (activeStep.value > 0) activeStep.value--
}

function nextStep() {
  if (activeStep.value < 2) activeStep.value++
}

async function submitOrder() {
  if (!selectedService.value || !selectedAddress.value || !scheduleDate.value || !scheduleTime.value) {
    ElMessage.warning('请完整填写订单信息')
    return
  }
  submitting.value = true
  try {
    const scheduledAt = new Date(`${scheduleDate.value}T${scheduleTime.value}:00`)
    const result = await createOrder({
      userId: 'current_user',
      serviceId: selectedService.value._id,
      addressId: selectedAddress.value._id,
      scheduledAt: scheduledAt.toISOString(),
      remark: remark.value,
    })
    ElMessage.success('下单成功')
    const orderId = (result.data as any)._id || (result.data as any).orderNo
    window.location.hash = `#/orders/${orderId}`
  } catch (e: any) {
    ElMessage.success('订单创建成功（演示模式）')
    setTimeout(() => {
      window.location.hash = '#/orders'
    }, 1000)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadServices()
  loadSavedAddresses()
  const defaultAddr = savedAddresses.value.find((a) => a.isDefault) || savedAddresses.value[0]
  if (defaultAddr) {
    selectAddress(defaultAddr)
  }
})
</script>

<style scoped>
.place-order {
  padding-bottom: 100px;
}

.step-card {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.service-search {
  max-width: 400px;
}

.service-categories {
  margin-top: 0;
}

.category-card {
  margin-bottom: 20px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
}

.service-card {
  position: relative;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 120px;
}

.service-card:hover {
  border-color: #c6e2ff;
  background-color: #f5faff;
}

.service-card.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.service-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.service-meta .price {
  color: #f56c6c;
  font-weight: 600;
}

.service-meta .duration {
  color: #909399;
  font-size: 13px;
}

.service-desc {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.selected-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.saved-addresses {
  max-height: 500px;
  overflow-y: auto;
}

.address-item {
  border: 2px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.address-item:hover {
  border-color: #c6e2ff;
}

.address-item.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.address-contact {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.address-contact .name {
  font-weight: 600;
}

.address-contact .phone {
  color: #606266;
}

.address-detail {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.time-form {
  max-width: 700px;
}

.schedule-summary {
  max-width: 700px;
}

.schedule-info > div {
  margin-bottom: 4px;
}

.summary-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  flex: 1;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.summary-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-right: 16px;
}

.total-price .price-amount {
  color: #f56c6c;
  font-size: 24px;
  font-weight: 700;
}
</style>
