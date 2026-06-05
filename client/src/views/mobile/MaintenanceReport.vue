<template>
  <div class="mobile-container">
    <van-nav-bar title="申报维修" left-arrow @click-left="$router.back()" />

    <van-form @submit="submitReport">
      <van-cell-group inset>
        <van-cell title="工具名称" :value="toolName" />
        <van-field
          v-model="form.description"
          type="textarea"
          label="问题描述"
          placeholder="请详细描述工具存在的问题"
          autosize
          rows="4"
          :rules="[{ required: true, message: '请描述问题' }]"
        />
      </van-cell-group>

      <van-cell-group inset title="上传照片">
        <van-uploader v-model="fileList" multiple :max-count="5" />
      </van-cell-group>

      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" :loading="submitting">
          提交申报
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toolAPI, maintenanceAPI } from '@/api';
import { showToast } from 'vant';

const route = useRoute();
const router = useRouter();
const toolName = ref('');
const submitting = ref(false);
const fileList = ref([]);

const form = reactive({
  description: ''
});

const submitReport = async () => {
  submitting.value = true;
  try {
    const formData = new FormData();
    formData.append('toolId', route.params.toolId);
    formData.append('description', form.description);
    
    fileList.value.forEach((file, index) => {
      if (file.file) {
        formData.append('photos', file.file);
      }
    });

    const pendingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    pendingQueue.push({
      url: '/maintenances',
      method: 'post',
      data: { toolId: route.params.toolId, description: form.description },
      timestamp: Date.now()
    });
    localStorage.setItem('pendingRequests', JSON.stringify(pendingQueue));

    if (navigator.onLine) {
      await maintenanceAPI.createMaintenance(formData);
      showToast('申报成功');
      router.push('/maintenance');
    } else {
      showToast('离线状态，申报已缓存');
      setTimeout(() => router.push('/maintenance'), 1500);
    }
  } catch (e) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
};

const fetchTool = async () => {
  try {
    const res = await toolAPI.getTool(route.params.toolId);
    toolName.value = res.tool.name;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchTool();
});
</script>
