<template>
  <div class="mobile-container">
    <van-nav-bar title="借用申请" left-arrow @click-left="$router.back()" />
    
    <div v-if="loading" class="loading-wrap">
      <van-loading size="24px">加载中...</van-loading>
    </div>
    
    <div v-else class="borrow-form">
      <van-cell-group inset>
        <van-cell title="工具名称" :value="tool?.name" />
        <van-cell title="押金" :value="'¥' + (tool?.deposit || 0)" />
        <van-cell v-if="tool?.isValuable" title="审核说明" value="该工具为贵重工具，需管理员审核后才能借用">
          <template #icon>
            <van-icon name="warning-o" color="#ff976a" />
          </template>
        </van-cell>
      </van-cell-group>

      <van-form @submit="submitBorrow">
        <van-cell-group inset title="借用信息">
          <van-field
            v-model="form.borrowDate"
            readonly
            label="借用日期"
            placeholder="请选择借用日期"
            @click="showBorrowDate = true"
            :rules="[{ required: true, message: '请选择借用日期' }]"
          />
          <van-field
            v-model="form.expectedReturnDate"
            readonly
            label="预计归还"
            placeholder="请选择预计归还日期"
            @click="showReturnDate = true"
            :rules="[{ required: true, message: '请选择预计归还日期' }]"
          />
          <van-field
            v-model="form.purpose"
            type="textarea"
            label="借用用途"
            placeholder="请简要说明借用用途"
            autosize
            rows="3"
          />
        </van-cell-group>

        <div v-if="conflictError" class="conflict-warning">
          <van-icon name="warning-o" color="#ff6034" />
          <span>{{ conflictError }}</span>
        </div>

        <div class="form-tips">
          <p>📌 借用前请确保账户余额足够支付押金</p>
          <p>📌 按时归还可获得良好信用记录</p>
          <p>📌 贵重工具将在管理员审核通过后生效</p>
        </div>

        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit" :loading="submitting">
            提交申请
          </van-button>
        </div>
      </van-form>
    </div>

    <van-calendar v-model:show="showBorrowDate" :min-date="minDate" @confirm="onBorrowDateConfirm" />
    <van-calendar v-model:show="showReturnDate" :min-date="returnMinDate" @confirm="onReturnDateConfirm" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toolAPI, borrowAPI } from '@/api';
import { showToast } from 'vant';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const tool = ref(null);
const loading = ref(true);
const submitting = ref(false);
const showBorrowDate = ref(false);
const showReturnDate = ref(false);
const conflictError = ref('');

const minDate = new Date();
const returnMinDate = computed(() => {
  if (form.value.borrowDate) {
    return new Date(form.value.borrowDate);
  }
  return new Date();
});

const form = reactive({
  borrowDate: '',
  expectedReturnDate: '',
  purpose: ''
});

const onBorrowDateConfirm = (value) => {
  form.borrowDate = dayjs(value).format('YYYY-MM-DD');
  showBorrowDate.value = false;
  checkAvailability();
};

const onReturnDateConfirm = (value) => {
  form.expectedReturnDate = dayjs(value).format('YYYY-MM-DD');
  showReturnDate.value = false;
  checkAvailability();
};

const checkAvailability = async () => {
  if (!form.borrowDate || !form.expectedReturnDate) return;
  
  try {
    const res = await toolAPI.checkAvailability({
      toolId: route.params.toolId,
      borrowDate: form.borrowDate,
      expectedReturnDate: form.expectedReturnDate
    });
    if (!res.available) {
      conflictError.value = '该时间段工具已被预约，请选择其他时间';
    } else {
      conflictError.value = '';
    }
  } catch (e) {
    console.error(e);
  }
};

const submitBorrow = async () => {
  if (conflictError.value) {
    showToast(conflictError.value);
    return;
  }
  
  submitting.value = true;
  try {
    const data = {
      toolId: parseInt(route.params.toolId),
      borrowDate: form.borrowDate,
      expectedReturnDate: form.expectedReturnDate,
      purpose: form.purpose
    };
    
    const pendingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    pendingQueue.push({
      url: '/borrows',
      method: 'post',
      data,
      timestamp: Date.now()
    });
    localStorage.setItem('pendingRequests', JSON.stringify(pendingQueue));
    
    if (navigator.onLine) {
      await borrowAPI.createBorrow(data);
      showToast('申请提交成功');
      router.push('/my-borrows');
    } else {
      showToast('离线状态，申请已缓存，将在联网后提交');
      setTimeout(() => router.push('/my-borrows'), 1500);
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
    tool.value = res.tool;
  } catch (e) {
    console.error(e);
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
.borrow-form {
  padding: 12px 0;
}
.conflict-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin: 12px;
  background: #fff7e6;
  border-radius: 8px;
  color: #fa8c16;
  font-size: 14px;
}
.form-tips {
  padding: 16px;
  background: #f7f8fa;
  margin: 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #646566;
}
.form-tips p {
  margin: 4px 0;
}
</style>
