<template>
  <div class="scan-page">
    <div class="scan-container">
      <div id="reader" ref="readerRef" class="reader"></div>
      
      <div class="scan-result" v-if="scanResult">
        <van-cell-group inset>
          <van-cell title="扫描结果" :value="scanResult" />
        </van-cell-group>
        
        <div class="action-btns" v-if="bookInfo">
          <van-button type="primary" block @click="goToDetail">查看图书详情</van-button>
          <van-button type="success" block class="mt-12" @click="createReservation">创建预留</van-button>
        </div>
        
        <van-empty v-else description="未找到该图书" />
      </div>
      
      <div class="scan-tips" v-else>
        <van-icon name="scan" size="64" color="#1890ff" />
        <p>将图书ISBN条码放入框内</p>
        <p class="tip">或手动输入ISBN查询</p>
        
        <van-field
          v-model="manualIsbn"
          placeholder="请输入ISBN号"
          clearable
          class="manual-input"
        >
          <template #button>
            <van-button size="small" type="primary" @click="searchByIsbn">查询</van-button>
          </template>
        </van-field>
      </div>
    </div>
    
    <div class="scan-actions">
      <van-button type="default" block @click="toggleCamera">
        {{ isScanning ? '停止扫描' : '开始扫描' }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoading, hideLoading } from 'vant'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '@/utils/request'

const router = useRouter()
const readerRef = ref(null)
const isScanning = ref(false)
const scanResult = ref('')
const bookInfo = ref(null)
const manualIsbn = ref('')
let html5QrCode = null

const startScanning = async () => {
  try {
    showLoading('正在启动相机...')
    html5QrCode = new Html5Qrcode('reader')
    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 }
      },
      (decodedText) => {
        handleScanResult(decodedText)
      },
      () => {}
    )
    isScanning.value = true
    hideLoading()
  } catch (e) {
    hideLoading()
    showToast('相机启动失败，请手动输入ISBN')
  }
}

const stopScanning = async () => {
  if (html5QrCode && isScanning.value) {
    try {
      await html5QrCode.stop()
      isScanning.value = false
    } catch (e) {}
  }
}

const toggleCamera = () => {
  if (isScanning.value) {
    stopScanning()
  } else {
    startScanning()
  }
}

const handleScanResult = async (text) => {
  if (scanResult.value === text) return
  
  scanResult.value = text
  await stopScanning()
  
  if (navigator.vibrate) {
    navigator.vibrate(200)
  }
  
  showToast('扫描成功')
  await searchBook(text)
}

const searchBook = async (isbn) => {
  try {
    showLoading('查询中...')
    const { data } = await api.get('/books/books/search_by_isbn/', { params: { isbn } })
    bookInfo.value = data
  } catch (e) {
    bookInfo.value = null
  } finally {
    hideLoading()
  }
}

const searchByIsbn = () => {
  if (!manualIsbn.value) {
    showToast('请输入ISBN号')
    return
  }
  scanResult.value = manualIsbn.value
  searchBook(manualIsbn.value)
}

const goToDetail = () => {
  if (bookInfo.value) {
    router.push(`/m/books/${bookInfo.value.id}`)
  }
}

const createReservation = () => {
  if (bookInfo.value) {
    router.push({
      path: '/m/reservations/create',
      query: { book_id: bookInfo.value.id }
    })
  }
}

onMounted(() => {
  if (typeof Html5Qrcode !== 'undefined') {
  }
})

onUnmounted(() => {
  stopScanning()
})
</script>

<style lang="scss" scoped>
.scan-page {
  padding: 0;
  
  .scan-container {
    min-height: 400px;
  }
  
  .reader {
    width: 100%;
    min-height: 300px;
    background: #000;
  }
  
  .scan-tips {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    
    p {
      margin-top: 16px;
      color: #666;
      
      &.tip {
        font-size: 13px;
        color: #999;
        margin-top: 8px;
      }
    }
    
    .manual-input {
      width: 100%;
      margin-top: 20px;
    }
  }
  
  .scan-result {
    padding: 20px;
    
    .action-btns {
      margin-top: 20px;
      
      .mt-12 {
        margin-top: 12px;
      }
    }
  }
  
  .scan-actions {
    padding: 20px;
  }
}
</style>
