<template>
  <div class="create-order-page">
    <PageHeader title="快速下单" show-back />
    
    <div class="order-form">
      <el-card class="form-card">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          label-position="top"
        >
          <el-divider content-position="left">设备信息</el-divider>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="设备类型" prop="deviceType">
                <el-select v-model="form.deviceType" placeholder="请选择设备类型" style="width: 100%">
                  <el-option
                    v-for="item in deviceTypes"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="设备品牌" prop="deviceBrand">
                <el-select v-model="form.deviceBrand" placeholder="请选择品牌" style="width: 100%" filterable>
                  <el-option
                    v-for="brand in brands"
                    :key="brand"
                    :label="brand"
                    :value="brand"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="故障描述" prop="faultDescription">
            <el-input
              v-model="form.faultDescription"
              type="textarea"
              :rows="4"
              placeholder="请详细描述故障情况，如：空调不制冷、冰箱噪音大等"
            />
          </el-form-item>

          <el-form-item label="故障照片">
            <ImageUploader v-model="form.faultImages" :max-count="6" />
            <div class="tip">支持上传多张照片，帮助师傅更快判断问题（最多6张）</div>
          </el-form-item>

          <el-divider content-position="left">联系信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系人" prop="contactName">
                <el-input v-model="form.contactName" placeholder="请输入联系人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="contactPhone">
                <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="所属社区" prop="communityId">
            <el-select v-model="form.communityId" placeholder="请选择所属社区（可选）" style="width: 100%" filterable clearable>
              <el-option
                v-for="item in communities"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <div class="tip">选择社区可享受社区专属服务和优惠</div>
          </el-form-item>

          <el-form-item label="服务地址" prop="address">
            <el-input
              v-model="form.address"
              type="textarea"
              :rows="2"
              placeholder="请输入详细地址，如：XX小区X栋X单元X室"
            />
          </el-form-item>

          <el-form-item label="预约时间" prop="appointmentTime">
            <el-date-picker
              v-model="form.appointmentTime"
              type="datetime"
              placeholder="选择预约时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled-date="disabledDate"
              :disabled-hours="disabledHours"
            />
            <div class="tip">服务时间：每天 8:00 - 20:00</div>
          </el-form-item>

          <div class="form-actions">
            <el-button size="large" @click="goBack">取消</el-button>
            <el-button type="primary" size="large" :loading="submitting" @click="submitOrder">
              提交订单
            </el-button>
          </div>
        </el-form>
      </el-card>

      <el-card class="price-card">
        <h3>价格说明</h3>
        <div class="price-item">
          <span>上门费</span>
          <span>¥30.00</span>
        </div>
        <div class="price-item">
          <span>检测费</span>
          <span>¥50.00</span>
        </div>
        <div class="price-divider"></div>
        <div class="price-total">
          <span>预估总价</span>
          <span class="price">¥80.00起</span>
        </div>
        <div class="price-tip">
          <el-icon><InfoFilled /></el-icon>
          具体费用以师傅上门检测后报价为准，不修不收费
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { DEVICE_TYPES, BRANDS } from '@/utils/constants'
import { createOrder } from '@/api/order'
import { getAllCommunities } from '@/api/admin'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const deviceTypes = DEVICE_TYPES
const brands = BRANDS
const communities = ref<Array<{ id: number; name: string }>>([])

const form = reactive({
  deviceType: '',
  deviceBrand: '',
  faultDescription: '',
  faultImages: [] as string[],
  contactName: '',
  contactPhone: '',
  communityId: null as number | null,
  address: '',
  appointmentTime: ''
})

const rules: FormRules = {
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  deviceBrand: [{ required: true, message: '请选择品牌', trigger: 'change' }],
  faultDescription: [{ required: true, message: '请描述故障情况', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入服务地址', trigger: 'blur' }],
  appointmentTime: [{ required: true, message: '请选择预约时间', trigger: 'change' }]
}

function disabledDate(time: Date) {
  return time.getTime() < Date.now() - 8.64e7
}

function disabledHours() {
  const hours = []
  for (let i = 0; i < 8; i++) hours.push(i)
  for (let i = 20; i < 24; i++) hours.push(i)
  return hours
}

function goBack() {
  router.back()
}

async function submitOrder() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  
  if (appStore.isDemoMode) {
    setTimeout(() => {
      submitting.value = false
      ElMessage.success('订单提交成功！')
      router.push('/orders')
    }, 1000)
    return
  }

  try {
    const submitData = {
      deviceType: form.deviceType,
      faultDescription: form.faultDescription,
      faultPhotos: form.faultImages,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      address: form.address,
      appointmentTime: form.appointmentTime,
      communityId: form.communityId,
      remark: form.deviceBrand ? `品牌：${form.deviceBrand}` : undefined,
    }
    await createOrder(submitData)
    ElMessage.success('订单提交成功！')
    router.push('/orders')
  } catch (error) {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function loadCommunities() {
  try {
    const res = await getAllCommunities()
    communities.value = res.data || []
  } catch {
    // ignore error
  }
}

onMounted(() => {
  if (route.query.deviceType) {
    form.deviceType = route.query.deviceType as string
  }
  loadCommunities()
})
</script>

<style lang="scss" scoped>
.create-order-page {
  .order-form {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .form-card {
    flex: 1;

    :deep(.el-card__body) {
      padding: 30px;
    }
  }

  .price-card {
    width: 300px;
    position: sticky;
    top: 100px;

    h3 {
      margin-bottom: 20px;
      font-size: 18px;
    }

    .price-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      color: #606266;
    }

    .price-divider {
      border-top: 1px solid #ebeef5;
      margin: 12px 0;
    }

    .price-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 600;

      .price {
        color: #f56c6c;
        font-size: 20px;
      }
    }

    .price-tip {
      margin-top: 16px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 6px;
      font-size: 12px;
      color: #909399;
      display: flex;
      gap: 6px;
      align-items: flex-start;

      .el-icon {
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
  }

  .tip {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
  }

  .form-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
  }
}

@media (max-width: 900px) {
  .create-order-page .order-form {
    flex-direction: column;

    .price-card {
      width: 100%;
      position: static;
      order: -1;
    }
  }
}
</style>
