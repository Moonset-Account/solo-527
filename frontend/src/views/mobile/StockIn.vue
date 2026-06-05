<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <div class="font-medium text-gray-800 mb-4">入库登记</div>
      <el-form :model="form" label-position="top">
        <el-form-item label="试剂">
          <el-select
            v-model="form.reagent_id"
            placeholder="选择试剂"
            filterable
            @change="onReagentChange"
          >
            <el-option
              v-for="item in reagents"
              :key="item.id"
              :label="`${item.name} (${item.cas_number || '-'})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="批号">
          <el-input v-model="form.batch_number" placeholder="输入批号" />
        </el-form-item>
        
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="0.1" :step="1" class="w-full" />
        </el-form-item>
        
        <el-form-item label="单位">
          <el-input v-model="form.unit" placeholder="如: g, mL, L" />
        </el-form-item>
        
        <el-form-item label="过期日期">
          <el-date-picker
            v-model="form.expiry_date"
            type="date"
            placeholder="选择过期日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
        
        <el-form-item label="存放柜位">
          <el-select v-model="form.storage_cabinet_id" placeholder="选择柜位">
            <el-option
              v-for="cab in cabinets"
              :key="cab.id"
              :label="`${cab.code} - ${cab.location}`"
              :value="cab.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="2"
            placeholder="选填"
          />
        </el-form-item>
        
        <el-form-item label="附件照片">
          <el-upload
            action="#"
            :auto-upload="false"
            list-type="picture-card"
            :on-change="handleFileChange"
            multiple
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        
        <el-button type="primary" class="w-full" :loading="submitting" @click="submit">
          {{ offlineMode ? '离线保存，稍后同步' : '提交入库' }}
        </el-button>
        
        <el-button v-if="pendingSyncCount > 0" class="w-full mt-2" type="warning" @click="syncOfflineData">
          同步待提交数据 ({{ pendingSyncCount }})
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import localforage from 'localforage'
import api from '@/api'
import { Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const reagents = ref<any[]>([])
const cabinets = ref<any[]>([])
const submitting = ref(false)
const files = ref<any[]>([])
const offlineMode = ref(false)
const pendingSyncCount = ref(0)

const form = reactive({
  reagent_id: null as number | null,
  batch_number: '',
  quantity: 1,
  unit: 'g',
  expiry_date: '',
  storage_cabinet_id: null as number | null,
  notes: ''
})

async function loadData() {
  try {
    const [reagentData, cabinetData] = await Promise.all([
      api.get('/reagents?limit=100'),
      api.get('/storage/cabinets')
    ]) as any[]
    reagents.value = reagentData.items || reagentData || []
    cabinets.value = cabinetData || []
  } catch (e) {
    console.error(e)
  }
}

function onReagentChange() {
  const reagent = reagents.value.find(r => r.id === form.reagent_id)
  if (reagent?.unit) {
    form.unit = reagent.unit
  }
}

function handleFileChange(file: any) {
  if (files.value.length < 5) {
    files.value.push(file.raw)
  }
}

async function submit() {
  if (!form.reagent_id) {
    ElMessage.warning('请选择试剂')
    return
  }
  if (!form.batch_number) {
    ElMessage.warning('请输入批号')
    return
  }
  if (!form.expiry_date) {
    ElMessage.warning('请选择过期日期')
    return
  }
  if (!form.storage_cabinet_id) {
    ElMessage.warning('请选择存放柜位')
    return
  }
  
  if (offlineMode.value || !navigator.onLine) {
    await saveOffline()
    return
  }
  
  submitting.value = true
  try {
    const submitData = {
      reagent_id: form.reagent_id,
      batch_number: form.batch_number,
      quantity: form.quantity,
      expiry_date: form.expiry_date,
      storage_cabinet_id: form.storage_cabinet_id,
      remarks: form.notes || ''
    }
    
    await api.post(`/reagents/${form.reagent_id}/batches`, submitData)
    
    ElMessage.success('入库成功')
    router.back()
  } catch (e: any) {
    if (!navigator.onLine) {
      ElMessage.warning('网络不可用，已切换到离线模式')
      offlineMode.value = true
      await saveOffline()
    } else {
      console.error(e)
    }
  } finally {
    submitting.value = false
  }
}

async function saveOffline() {
  try {
    const offlineRecord = {
      type: 'stock_in',
      data: {
        reagent_id: form.reagent_id,
        batch_number: form.batch_number,
        quantity: form.quantity,
        expiry_date: form.expiry_date,
        storage_cabinet_id: form.storage_cabinet_id,
        remarks: form.notes || ''
      },
      timestamp: Date.now(),
      id: Date.now().toString()
    }
    
    const pending = await localforage.getItem('offline_records') as any[] || []
    pending.push(offlineRecord)
    await localforage.setItem('offline_records', pending)
    updatePendingCount()
    
    ElMessage.success('已保存到本地，联网后将自动同步')
    router.back()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败，请重试')
  }
}

async function updatePendingCount() {
  const pending = await localforage.getItem('offline_records') as any[] || []
  pendingSyncCount.value = pending.length
}

async function syncOfflineData() {
  if (!navigator.onLine) {
    ElMessage.warning('请先连接网络')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要同步 ${pendingSyncCount.value} 条离线数据吗？`, '同步确认')
    
    const pending = await localforage.getItem('offline_records') as any[] || []
    let successCount = 0
    
    for (const record of pending) {
      try {
        if (record.type === 'stock_in') {
          const data = record.data
          await api.post(`/reagents/${data.reagent_id}/batches`, data)
        }
        successCount++
      } catch (e) {
        console.error('Sync failed:', record, e)
      }
    }
    
    const remaining = pending.slice(successCount)
    await localforage.setItem('offline_records', remaining)
    updatePendingCount()
    
    ElMessage.success(`成功同步 ${successCount} 条数据`)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
  updatePendingCount()
  
  if (route.query.barcode) {
    form.batch_number = route.query.barcode as string
  }
})
</script>
