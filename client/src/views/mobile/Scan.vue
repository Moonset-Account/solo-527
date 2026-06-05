<template>
  <div class="mobile-container">
    <van-nav-bar title="扫码" left-arrow @click-left="$router.back()" />
    
    <div class="scan-container">
      <div id="qr-reader" class="qr-reader"></div>
      
      <div class="scan-tips">
        <van-icon name="scan" size="40" color="#1989fa" />
        <p>将工具二维码放入框内，自动扫描</p>
      </div>
      
      <div class="scan-actions">
        <van-button type="primary" @click="startScan" :disabled="scanning">
          {{ scanning ? '扫描中...' : '开始扫描' }}
        </van-button>
        <van-button plain type="primary" @click="manualInput">
          手动输入编号
        </van-button>
      </div>
    </div>

    <van-dialog v-model:show="showManualInput" title="手动输入工具编号" show-cancel-button @confirm="handleManualInput">
      <van-field v-model="manualCode" placeholder="请输入工具编号" />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Html5Qrcode } from 'html5-qrcode';
import { toolAPI } from '@/api';
import { showToast } from 'vant';

const router = useRouter();
const scanning = ref(false);
const showManualInput = ref(false);
const manualCode = ref('');
let html5QrCode = null;

const startScan = async () => {
  try {
    scanning.value = true;
    html5QrCode = new Html5Qrcode('qr-reader');
    
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await stopScan();
        await handleScanResult(decodedText);
      },
      () => {}
    );
  } catch (e) {
    showToast('无法启动摄像头，请检查权限');
    scanning.value = false;
    console.error(e);
  }
};

const stopScan = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
    } catch (e) {}
    html5QrCode = null;
  }
  scanning.value = false;
};

const handleScanResult = async (text) => {
  try {
    const qrCode = text.trim();
    const res = await toolAPI.getToolByQr(qrCode);
    router.push(`/tools/${res.tool.id}`);
  } catch (e) {
    showToast('未找到该工具');
  }
};

const manualInput = () => {
  showManualInput.value = true;
};

const handleManualInput = async () => {
  if (manualCode.value) {
    await handleScanResult(manualCode.value);
  }
};

onMounted(() => {
  if (!navigator.onLine) {
    showToast('离线状态下扫码功能可能受限');
  }
});

onUnmounted(() => {
  stopScan();
});
</script>

<style scoped>
.scan-container {
  padding: 20px;
  text-align: center;
}
.qr-reader {
  width: 100%;
  max-width: 300px;
  height: 300px;
  margin: 0 auto 20px;
  background: #f7f8fa;
  border-radius: 12px;
  overflow: hidden;
}
.scan-tips {
  padding: 20px 0;
}
.scan-tips p {
  color: #969799;
  margin-top: 12px;
}
.scan-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px;
}
</style>
