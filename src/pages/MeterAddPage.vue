<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { meterApi, zoneApi } from '@/api'
import type { Zone } from '@/types'

const router = useRouter()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const zones = ref<Zone[]>([])

const form = reactive({
  meterNo: '',
  location: '',
  zoneId: undefined as number | undefined,
  communication_params: '',
  sourceDocumentNo: '',
  remark: '',
})

const rules: FormRules = {
  meterNo: [{ required: true, message: '请输入电表编号', trigger: 'blur' }],
  location: [{ required: true, message: '请输入安装位置', trigger: 'blur' }],
  zoneId: [{ required: true, message: '请选择所属分区', trigger: 'change' }],
}

async function fetchZones() {
  try {
    zones.value = await zoneApi.getList()
  } catch {
    ElMessage.error('获取分区列表失败')
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await meterApi.create({
      meterNo: form.meterNo,
      location: form.location,
      zoneId: form.zoneId,
      sourceDocumentNo: form.sourceDocumentNo,
      remark: form.remark,
    })
    ElMessage.success('新增表计成功')
    router.push('/meters')
  } catch {
    ElMessage.error('新增表计失败')
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.back()
}

onMounted(() => {
  fetchZones()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px">
        <el-button @click="handleCancel" :icon="'ArrowLeft'" circle />
        <h2>新增表计</h2>
      </div>
    </div>

    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 600px"
      >
        <el-form-item label="电表编号" prop="meterNo">
          <el-input v-model="form.meterNo" placeholder="请输入电表编号" />
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="所属分区" prop="zoneId">
          <el-select v-model="form.zoneId" placeholder="请选择所属分区" style="width: 100%">
            <el-option
              v-for="zone in zones"
              :key="zone.id"
              :label="zone.name"
              :value="zone.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通信参数">
          <el-input
            v-model="form.communication_params"
            type="textarea"
            :rows="4"
            placeholder="请输入通信参数"
          />
        </el-form-item>
        <el-form-item label="来源单据号">
          <el-input v-model="form.sourceDocumentNo" placeholder="请输入来源单据号" />
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入补充说明"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
