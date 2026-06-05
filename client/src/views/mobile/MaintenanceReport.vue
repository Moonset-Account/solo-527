<template>
  <div class="mobile-container">
    <van-nav-bar title="申报维修" left-arrow @click-left="$router.back()" />

    <div v-if="loading" class="loading-wrap">
      <van-loading size="24px">加载中...</van-loading>
    </div>

    <van-form v-else ref="formRef" @submit="submitReport">
      <van-cell-group inset>
        <van-cell title="工具名称" :value="tool?.name" />
        <van-field
          v-model="formData.description"
          type="textarea"
          label="问题描述"
          placeholder="请详细描述工具存在的问题"
          autosize
          rows="4"
          :rules="[{ required: true, message: '请描述问题' }]"
        />
      </van-cell-group>

      <van-cell-group inset title="上传照片（选填）">
        <van-uploader 
          v-model="fileList" 
          multiple 
          :max-count="5" 
          :after-read="afterRead"
        />
        <div v-if="!navigator.onLine" class="offline-tip">
          <van-icon name="info-o" />
          <span>离线状态下照片将在联网后自动上传</span>
        </div>
      </van-cell-group>

      <div style="margin: 16px; padding-bottom: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="submitting">
          {{ submitting ? '提交中...' : '提交申报' }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toolAPI, maintenanceAPI } from '@/api';
import { showToast } from 'vant';
import { saveOfflineMaintenance, isOnline } from '@/utils/offline';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);
const tool = ref(null);
const loading = ref(true);
const submitting = ref(false);
const fileList = ref([]);
const navigatorOnline = ref(navigator.onLine);

window.addEventListener('online', () => { navigatorOnline.value = true; });
window.addEventListener('offline', () => { navigatorOnline.value = false; });

const formData = reactive({
  description: ''
});

const afterRead = (file) => {
  console.log('照片已选择:', file);
};

const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const submitReport = async () => {
  if (!formData.description.trim()) {
    showToast('请描述工具问题');
    return;
  }

  submitting.value = true;
  try {
    const data = {
      toolId: parseInt(route.params.toolId),
      description: formData.description.trim()
    };

    if (!navigator.onLine) {
      const photoDataURLs = [];
      for (const f of fileList.value) {
        if (f.content) {
          photoDataURLs.push(f.content);
        } else if (f.file) {
          const dataUrl = await fileToDataURL(f.file);
          photoDataURLs.push(dataUrl);
        }
      }
      saveOfflineMaintenance(route.params.toolId, data, photoDataURLs);
      showToast('离线状态，申报已缓存，联网后自动提交');
      setTimeout(() => router.push('/maintenance'), 1500);
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('toolId', route.params.toolId);
    formDataObj.append('description', formData.description);
    
    fileList.value.forEach((file) => {
      if (file.file) {
        formDataObj.append('photos', file.file);
      }
    });

    await maintenanceAPI.createMaintenance(formDataObj);
    showToast('申报成功');
    router.push('/maintenance');
  } catch (e) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
};

const fetchTool = async () => {
  try {
    const res = await toolAPI.getTool(route.params.toolId);
    tool.value = res.tool;
  } catch (e) {
    console.error(e);
    showToast('获取工具信息失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTool();
});
</script>

<style scoped>
.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
.offline-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 13px;
  color: #969799;
  background: #f7f8fa;
}
</style>
