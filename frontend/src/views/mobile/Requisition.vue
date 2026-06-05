<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <div class="font-medium text-gray-800 mb-4">领用申请</div>
      <el-form :model="form" label-position="top">
        <el-form-item label="申请标题">
          <el-input
            v-model="form.title"
            placeholder="请输入申请标题"
          />
        </el-form-item>
        
        <el-form-item label="领用用途">
          <el-input
            v-model="form.purpose"
            type="textarea"
            :rows="2"
            placeholder="请说明领用用途"
          />
        </el-form-item>
        
        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium">领用明细</div>
            <el-button type="primary" link size="small" @click="addItem">+ 添加</el-button>
          </div>
          
          <div v-if="form.items.length === 0" class="text-center text-gray-400 py-4 text-sm">
            暂无领用项
          </div>
          
          <div v-for="(item, index) in form.items" :key="index" class="p-3 bg-gray-50 rounded-lg mb-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">试剂 {{ index + 1 }}</span>
              <el-button type="danger" link size="small" @click="removeItem(index)">删除</el-button>
            </div>
            <el-form-item label="选择试剂">
              <el-select
                v-model="item.reagent_batch_id"
                placeholder="选择试剂批次"
                filterable
                class="w-full"
              >
                <el-option
                  v-for="batch in availableBatches"
                  :key="batch.id"
                  :label="`${batch.reagent?.name} - ${batch.batch_number} (剩余: ${batch.remaining_quantity}${batch.reagent?.unit})`"
                  :value="batch.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数量">
              <el-input-number v-model="item.quantity" :min="0.1" :step="1" class="w-full" />
            </el-form-item>
          </div>
        </div>
        
        <div v-if="hasHazardous" class="p-3 bg-red-50 rounded-lg text-red-600 text-sm mt-4">
          <el-icon class="mr-1"><Warning /></el-icon>
          包含高危/极危试剂，需要双人确认后才能审批
        </div>
        
        <el-button type="primary" class="w-full mt-4" :loading="submitting" @click="submit">
          提交申请
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { Warning } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const availableBatches = ref<any[]>([])

const form = reactive({
  title: '',
  purpose: '',
  items: [] as any[]
})

const hasHazardous = computed(() => {
  return form.items.some(item => {
    const batch = availableBatches.value.find(b => b.id === item.reagent_batch_id)
    return batch?.reagent?.hazard_level === 'HIGH' || batch?.reagent?.hazard_level === 'EXTREME'
  })
})

async function loadBatches() {
  try {
    const data = await api.get('/reagents/batches?in_stock_only=true&limit=200') as any
    availableBatches.value = data.items || data || []
  } catch (e) {
    console.error(e)
  }
}

function addItem() {
  form.items.push({
    reagent_batch_id: null,
    quantity: 1
  })
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

async function submit() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写申请标题')
    return
  }
  if (!form.purpose.trim()) {
    ElMessage.warning('请填写领用用途')
    return
  }
  if (form.items.length === 0) {
    ElMessage.warning('请添加至少一项领用试剂')
    return
  }
  if (form.items.some(i => !i.reagent_batch_id || i.quantity <= 0)) {
    ElMessage.warning('请完善所有领用项信息')
    return
  }
  
  submitting.value = true
  try {
    await api.post('/requisitions', form)
    ElMessage.success('申请已提交')
    router.push('/m/requisitions')
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadBatches()
  
  if (route.query.batch_id) {
    form.items.push({
      reagent_batch_id: Number(route.query.batch_id),
      quantity: 1
    })
  }
})
</script>
