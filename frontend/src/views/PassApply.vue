<template>
  <div class="pass-apply">
    <el-card>
      <template #header>
        <span>访客通行证申请</span>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-divider content-position="left">人员信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="form.id_card" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="form.gender">
                <el-radio value="男">男</el-radio>
                <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人员类型" prop="person_type">
              <el-select v-model="form.person_type" placeholder="请选择人员类型" style="width: 100%">
                <el-option label="访客" value="visitor" />
                <el-option label="工人" value="worker" />
                <el-option label="承包商" value="contractor" />
                <el-option label="供应商" value="supplier" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属单位">
              <el-input v-model="form.company" placeholder="请输入所属单位" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">车辆信息（可选）</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号">
              <el-input v-model="form.plate_number" placeholder="请输入车牌号（无车辆可不填）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆类型">
              <el-select v-model="form.vehicle_type" placeholder="请选择车辆类型" style="width: 100%">
                <el-option label="小轿车" value="car" />
                <el-option label="货车" value="truck" />
                <el-option label="面包车" value="van" />
                <el-option label="工程车" value="engineering" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">通行信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="通行证类型" prop="pass_type">
              <el-select v-model="form.pass_type" placeholder="请选择通行证类型" style="width: 100%">
                <el-option label="临时通行证" value="temporary" />
                <el-option label="日常通行证" value="daily" />
                <el-option label="长期通行证" value="long_term" />
                <el-option label="特种作业通行证" value="special" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="访问事由">
              <el-input v-model="form.purpose" placeholder="请输入访问事由" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期开始" prop="valid_from">
              <el-date-picker
                v-model="form.valid_from"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期结束" prop="valid_until">
              <el-date-picker
                v-model="form.valid_until"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="作业区域" prop="work_zone_ids">
              <el-select
                v-model="form.work_zone_ids"
                multiple
                placeholder="请选择作业区域（危险区域需二级审批）"
                style="width: 100%"
              >
                <el-option
                  v-for="zone in workZones"
                  :key="zone.id"
                  :label="`${zone.name}${zone.requires_second_approval ? '（需二级审批）' : ''}`"
                  :value="zone.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
            提交申请
          </el-button>
          <el-button size="large" @click="resetForm">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { peopleApi, vehiclesApi, passesApi, workZonesApi } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const workZones = ref([])

const form = reactive({
  name: '',
  id_card: '',
  gender: '男',
  phone: '',
  person_type: 'visitor',
  company: '',
  plate_number: '',
  vehicle_type: '',
  pass_type: 'temporary',
  purpose: '',
  valid_from: '',
  valid_until: '',
  work_zone_ids: []
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  id_card: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
  person_type: [{ required: true, message: '请选择人员类型', trigger: 'change' }],
  pass_type: [{ required: true, message: '请选择通行证类型', trigger: 'change' }],
  valid_from: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  valid_until: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const fetchWorkZones = async () => {
  try {
    workZones.value = await workZonesApi.list({ active: 'true' })
  } catch (e) {}
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        let person = null
        try {
          person = await peopleApi.create({
            name: form.name,
            id_card: form.id_card,
            gender: form.gender,
            phone: form.phone,
            company: form.company,
            person_type: form.person_type
          })
        } catch (e) {
          if (e.response?.status === 422 && e.response.data?.error?.includes('已存在')) {
            const res = await peopleApi.list({ 'q[id_card_eq]': form.id_card })
            person = res.data[0]
          } else {
            throw e
          }
        }

        let vehicle = null
        if (form.plate_number) {
          try {
            vehicle = await vehiclesApi.create({
              plate_number: form.plate_number,
              vehicle_type: form.vehicle_type
            })
          } catch (e) {
            if (e.response?.status === 422) {
              const res = await vehiclesApi.list({ 'q[plate_number_eq]': form.plate_number })
              vehicle = res.data[0]
            }
          }
        }

        await passesApi.create({
          person_id: person.id,
          vehicle_id: vehicle?.id,
          pass_type: form.pass_type,
          purpose: form.purpose,
          valid_from: form.valid_from,
          valid_until: form.valid_until,
          work_zone_ids: form.work_zone_ids
        })

        ElMessage.success('申请提交成功，等待审批')
        router.push('/passes')
      } catch (e) {
        // error handled
      } finally {
        loading.value = false
      }
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchWorkZones()
})
</script>

<style scoped>
.pass-apply {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
