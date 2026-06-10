<template>
  <div class="settings-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本设置" name="general" />
      <el-tab-pane label="营业时间" name="business" />
      <el-tab-pane label="提醒设置" name="reminder" />
      <el-tab-pane label="默认负责人" name="default_owner" />
    </el-tabs>

    <el-card v-loading="loading">
      <el-form :model="settingsForm" label-width="140px" style="max-width: 600px">
        <template v-if="activeTab === 'general'">
          <el-form-item label="店铺名称">
            <el-input v-model="settingsForm.shop_name" placeholder="请输入店铺名称" />
          </el-form-item>
          <el-form-item label="店铺电话">
            <el-input v-model="settingsForm.shop_phone" placeholder="请输入店铺电话" />
          </el-form-item>
          <el-form-item label="店铺地址">
            <el-input v-model="settingsForm.shop_address" placeholder="请输入店铺地址" />
          </el-form-item>
        </template>

        <template v-if="activeTab === 'business'">
          <el-form-item label="营业开始时间">
            <el-time-picker
              v-model="settingsForm.business_start_time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择开始时间"
              style="width: 160px"
            />
          </el-form-item>
          <el-form-item label="营业结束时间">
            <el-time-picker
              v-model="settingsForm.business_end_time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择结束时间"
              style="width: 160px"
            />
          </el-form-item>
        </template>

        <template v-if="activeTab === 'reminder'">
          <el-form-item label="预约提前提醒">
            <el-input-number
              v-model="settingsForm.appointment_advance_minutes"
              :min="0"
              :max="120"
              style="width: 150px"
            />
            <span style="margin-left: 8px">分钟</span>
          </el-form-item>
          <el-form-item label="预约冲突阻断">
            <el-switch v-model="appointmentConflictBlocking" />
            <span style="margin-left: 8px; color: #999; font-size: 12px">
              开启后预约冲突将阻止创建
            </span>
          </el-form-item>
          <el-form-item label="会员卡到期提醒">
            <el-input-number
              v-model="settingsForm.membership_expire_days"
              :min="1"
              :max="365"
              style="width: 150px"
            />
            <span style="margin-left: 8px">天前提醒</span>
          </el-form-item>
          <el-form-item label="每日报表时间">
            <el-time-picker
              v-model="settingsForm.daily_report_time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择时间"
              style="width: 160px"
            />
          </el-form-item>
        </template>

        <template v-if="activeTab === 'default_owner'">
          <el-form-item label="默认负责人">
            <el-select v-model="settingsForm.default_technician_id" placeholder="请选择默认负责人" style="width: 100%">
              <el-option
                v-for="tech in technicians"
                :key="tech._id"
                :label="tech.name"
                :value="tech._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="负责人姓名">
            <el-input v-model="settingsForm.default_technician_name" placeholder="请输入负责人姓名" />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSave">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllSettings, batchUpdateSettings } from '@/api/settings'
import { getActiveTechnicians } from '@/api/technicians'

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('general')
const technicians = ref([])

const settingsForm = reactive({
  shop_name: '',
  shop_phone: '',
  shop_address: '',
  business_start_time: '09:00',
  business_end_time: '21:00',
  appointment_advance_minutes: 30,
  appointment_conflict_blocking: 'true',
  membership_expire_days: 30,
  daily_report_time: '22:00',
  default_technician_id: '',
  default_technician_name: '',
})

const appointmentConflictBlocking = computed({
  get() {
    return settingsForm.appointment_conflict_blocking === 'true'
  },
  set(val) {
    settingsForm.appointment_conflict_blocking = val ? 'true' : 'false'
  },
})

async function loadSettings() {
  loading.value = true
  try {
    const data = await getAllSettings()
    Object.assign(settingsForm, data)
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

async function loadTechnicians() {
  try {
    const data = await getActiveTechnicians()
    technicians.value = data
  } catch (e) {}
}

async function handleSave() {
  submitting.value = true
  try {
    const settings = Object.entries(settingsForm).map(([key, value]) => ({
      key,
      value: String(value),
    }))
    await batchUpdateSettings(settings)
    ElMessage.success('保存成功')
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadTechnicians()
})
</script>

<style scoped lang="scss">
.settings-page {
  max-width: 800px;
}
</style>
