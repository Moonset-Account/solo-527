<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <div id="qr-reader" class="w-full max-w-sm mx-auto rounded-lg overflow-hidden"></div>
      <div class="text-center mt-4">
        <el-button type="primary" @click="startScan" :disabled="scanning">
          {{ scanning ? '扫描中...' : '开始扫码' }}
        </el-button>
        <el-button v-if="scanning" @click="stopScan">停止</el-button>
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <div class="font-medium text-gray-800 mb-3">手动输入条码</div>
      <div class="flex gap-2">
        <el-input v-model="manualCode" placeholder="请输入条码编号" />
        <el-button type="primary" @click="searchByCode">查询</el-button>
      </div>
    </div>
    
    <div v-if="scannedData" class="bg-white rounded-xl p-4 shadow-sm">
      <div class="font-medium text-gray-800 mb-3">扫描结果</div>
      <div v-if="scannedData.batch">
        <div class="text-lg font-bold text-gray-800 mb-2">{{ scannedData.reagent?.name }}</div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-gray-500">CAS号：</div>
          <div>{{ scannedData.reagent?.cas_number || '-' }}</div>
          <div class="text-gray-500">危险等级：</div>
          <div>
            <el-tag size="small" :class="`bg-hazard-level-${scannedData.reagent?.hazard_level?.toLowerCase()}`">
              {{ scannedData.reagent?.hazard_level }}
            </el-tag>
          </div>
          <div class="text-gray-500">批号：</div>
          <div>{{ scannedData.batch.batch_number }}</div>
          <div class="text-gray-500">过期日期：</div>
          <div :class="{ 'text-red-500 font-medium': isExpiringSoon(scannedData.batch.expiry_date) }">
            {{ scannedData.batch.expiry_date }}
          </div>
          <div class="text-gray-500">剩余数量：</div>
          <div class="font-medium">{{ scannedData.batch.remaining_quantity }} {{ scannedData.reagent?.unit }}</div>
          <div class="text-gray-500">存放柜位：</div>
          <div>{{ scannedData.cabinet?.code }} - {{ scannedData.cabinet?.location }}</div>
        </div>
        <div class="flex gap-2 mt-4">
          <el-button type="primary" class="flex-1" @click="goStockIn">入库</el-button>
          <el-button type="warning" class="flex-1" @click="goRequisition">领用</el-button>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-4">
        未找到该条码对应的试剂批次
      </div>
    </div>
    
    <div v-if="scanHistory.length > 0" class="bg-white rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="font-medium text-gray-800">历史扫描</div>
        <el-button type="primary" link size="small" @click="scanHistory = []">清空</el-button>
      </div>
      <div class="space-y-2">
        <div
          v-for="(item, index) in scanHistory"
          :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          @click="selectHistory(item)"
        >
          <div>
            <div class="text-sm font-medium text-gray-700">{{ item.name }}</div>
            <div class="text-xs text-gray-500">{{ item.barcode }}</div>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Html5Qrcode } from 'html5-qrcode'
import api from '@/api'
import { ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const scanning = ref(false)
const manualCode = ref('')
const scannedData = ref<any>(null)
const scanHistory = ref<any[]>([])
let html5QrCode: Html5Qrcode | null = null

function isExpiringSoon(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 30
}

async function searchByCode() {
  if (!manualCode.value.trim()) {
    ElMessage.warning('请输入条码编号')
    return
  }
  await searchBatch(manualCode.value.trim())
}

async function searchBatch(barcode: string) {
  try {
    const data = await api.get(`/reagents/batches/by-barcode/${barcode}`)
    scannedData.value = data
    scanHistory.value.unshift({
      barcode,
      name: (data as any).reagent?.name || '',
      timestamp: Date.now()
    })
    if (scanHistory.value.length > 10) {
      scanHistory.value.pop()
    }
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory.value))
  } catch (e: any) {
    if (e.response?.status === 404) {
      ElMessage.warning('未找到该条码对应的试剂')
    }
    scannedData.value = null
  }
}

function selectHistory(item: any) {
  manualCode.value = item.barcode
  searchByCode()
}

function startScan() {
  if (scanning.value) return
  
  html5QrCode = new Html5Qrcode('qr-reader')
  scanning.value = true
  
  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      stopScan()
      manualCode.value = decodedText
      searchBatch(decodedText)
      ElMessage.success('扫码成功')
    },
    () => {}
  ).catch((err) => {
    console.error(err)
    ElMessage.error('摄像头启动失败，请检查权限')
    scanning.value = false
  })
}

function stopScan() {
  if (html5QrCode && scanning.value) {
    html5QrCode.stop().then(() => {
      scanning.value = false
    }).catch(() => {
      scanning.value = false
    })
  } else {
    scanning.value = false
  }
}

function goStockIn() {
  if (scannedData.value) {
    router.push({
      path: '/m/stock-in',
      query: { barcode: scannedData.value.batch.barcode }
    })
  }
}

function goRequisition() {
  if (scannedData.value) {
    router.push({
      path: '/m/requisition',
      query: { batch_id: scannedData.value.batch.id }
    })
  }
}

onMounted(() => {
  const saved = localStorage.getItem('scanHistory')
  if (saved) {
    try {
      scanHistory.value = JSON.parse(saved)
    } catch (e) {}
  }
})

onBeforeUnmount(() => {
  stopScan()
})
</script>
