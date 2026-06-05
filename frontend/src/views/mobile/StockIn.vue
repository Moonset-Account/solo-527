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
            :on-remove="handleFileRemove"
            :file-list="fileList"
            multiple
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div v-if="uploading" class="text-sm text-blue-600 mt-1">
            正在上传附件...
          </div>
        </el-form-item>
        
        <el-button type="primary" class="w-full" :loading="submitting || uploading" @click="submit">
          {{ offlineMode ? '离线保存，稍后同步' : '提交入库' }}
        </el-button>
        
        <el-button v-if="pendingSyncCount > 0" class="w-full mt-2" type="warning" :loading="syncing" @click="syncOfflineData">
          {{ syncing ? '同步中...' : `同步待提交数据 (${pendingSyncCount})` }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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
const uploading = ref(false)
const syncing = ref(false)
const offlineMode = ref(false)
const pendingSyncCount = ref(0)

const fileList = ref<any[]>([])
const uploadedAttachmentIds = ref<number[]>([])

const form = reactive({
  reagent_id: null as number | null,
  batch_number: '',
  quantity: 1,
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

async function handleFileChange(file: any) {
  if (!file.raw) return
  
  if (offlineMode.value || !navigator.onLine) {
    fileList.value.push(file)
    return
  }
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    
    const result = await api.post('/attachments/pre-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }) as any
    
    uploadedAttachmentIds.value.push(result.id)
    fileList.value.push(file)
    ElMessage.success(`附件 ${file.name} 上传成功`)
  } catch (e) {
    console.error('Upload failed:', e)
    ElMessage.error(`附件 ${file.name} 上传失败`)
  } finally {
    uploading.value = false
  }
}

function handleFileRemove(file: any, index: number) {
  uploadedAttachmentIds.value.splice(index, 1)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
  if (uploading.value) {
    ElMessage.warning('请等待附件上传完成')
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
      remarks: form.notes || '',
      attachment_ids: uploadedAttachmentIds.value
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
      ElMessage.error('提交失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

async function saveOffline() {
  try {
    const fileBase64List: string[] = []
    for (const file of fileList.value) {
      if (file.raw) {
        const b64 = await fileToBase64(file.raw)
        fileBase64List.push(b64)
      }
    }
    
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
      files: fileBase64List,
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

function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

async function syncOfflineData() {
  if (!navigator.onLine) {
    ElMessage.warning('请先连接网络')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要同步 ${pendingSyncCount.value} 条离线数据吗？`, '同步确认')
    
    syncing.value = true
    const pending = await localforage.getItem('offline_records') as any[] || []
    let successCount = 0
    
    for (const record of pending) {
      try {
        if (record.type === 'stock_in') {
          const attachmentIds: number[] = []
          
          if (record.files && record.files.length > 0) {
            for (let i = 0; i < record.files.length; i++) {
              const file = base64ToFile(record.files[i], `offline_${Date.now()}_${i}.jpg`)
              const formData = new FormData()
              formData.append('file', file)
              const result = await api.post('/attachments/pre-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              }) as any
              attachmentIds.push(result.id)
            }
          }
          
          const data = { ...record.data, attachment_ids: attachmentIds }
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
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  loadData()
  updatePendingCount()
  
  if (route.query.barcode) {
    form.batch_number = route.query.barcode as string
  }
  
  if (!navigator.onLine) {
    offlineMode.value = true
  }
})
</script>
