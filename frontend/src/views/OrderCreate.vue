<template>
  <div class="order-create">
    <el-card shadow="never">
      <template #header>
        <span>提交报修</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="max-width: 800px;">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入报修标题" />
        </el-form-item>

        <el-form-item label="问题分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择问题分类" style="width: 100%;">
            <el-option label="水电维修" value="水电维修" />
            <el-option label="家电维修" value="家电维修" />
            <el-option label="门窗维修" value="门窗维修" />
            <el-option label="墙面地面" value="墙面地面" />
            <el-option label="公共设施" value="公共设施" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority">
            <el-radio value="LOW">低</el-radio>
            <el-radio value="NORMAL">普通</el-radio>
            <el-radio value="HIGH">高</el-radio>
            <el-radio value="URGENT">紧急</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="报修房间" prop="roomId">
          <el-select v-model="form.roomId" placeholder="请选择报修房间" style="width: 100%;">
            <el-option v-for="room in roomList" :key="room.id" :label="room.buildingName + ' ' + room.roomNo" :value="room.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" placeholder="请输入联系人姓名" />
        </el-form-item>

        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="预约时间">
          <el-date-picker
            v-model="form.appointTime"
            type="datetime"
            placeholder="选择预约上门时间"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="问题描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="请详细描述您遇到的问题" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">提交报修</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createOrder } from '@/api/order'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  title: '',
  category: '',
  priority: 'NORMAL',
  roomId: null,
  contactPerson: '',
  contactPhone: '',
  appointTime: null,
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择问题分类', trigger: 'change' }],
  roomId: [{ required: true, message: '请选择报修房间', trigger: 'change' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
}

const roomList = ref([
  { id: 1, buildingName: '1栋', roomNo: '101室' },
  { id: 4, buildingName: '1栋', roomNo: '202室' },
  { id: 6, buildingName: '2栋', roomNo: '303室' }
])

async function submitForm() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await createOrder(form)
        ElMessage.success('报修提交成功')
        router.push(`/orders/${res.data.id}`)
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.order-create {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
