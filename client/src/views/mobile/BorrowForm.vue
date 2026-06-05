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
        <van-cell v-if="tool?.isValuable" title="贵重工具">
          <template #value>
            <van-tag type="warning" size="small">需管理员审核</van-tag>
          </template>
        </van-cell>
      </van-cell-group>

      <van-form ref="formRef" @submit="onSubmit">
        <van-cell-group inset title="借用信息">
          <van-field
            v-model="formData.borrowDate"
            readonly
            label="借用日期"
            placeholder="请选择借用日期"
            @click="showBorrowDate = true"
            :rules="[{ required: true, message: '请选择借用日期' }]"
          />
          <van-field
            v-model="formData.expectedReturnDate"
            readonly
            label="预计归还"
            placeholder="请选择预计归还日期"
            @click="showReturnDate = true"
            :rules="[{ required: true, message: '请选择预计归还日期' }]"
          />
          <van-field
            v-model="formData.purpose"
            type="textarea"
            label="借用用途"
            placeholder="请简要说明借用用途（选填）"
            autosize
            rows="3"
          />
        </van-cell-group>

        <div v-if="conflictError" class="conflict-warning">
          <van-icon name="warning-o" size="16" />
          <span>{{ conflictError }}</span>
        </div>

        <div v-if="tool?.isValuable" class="review-notice">
          <van-icon name="info-o" size="16" color="#1989fa" />
          <span>该工具为贵重工具，提交后需管理员审核通过才能借用</span>
        </div>

        <div class="form-tips">
          <p>📌 借用前请确保账户余额足够支付押金</p>
          <p>📌 按时归还可获得良好信用记录</p>
        </div>

        <div class="submit-bar">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit" 
            :loading="submitting"
            :disabled="!canSubmit"
          >
            {{ submitting ? '提交中...' : (tool?.isValuable ? '提交审核' : '立即借用') }}
          </van-button>
        </div>
      </van-form>
    </div>

    <van-calendar 
      v-model:show="showBorrowDate" 
      :min-date="minDate" 
      :max-date="maxDate"
      @confirm="onBorrowDateConfirm" 
    />
    <van-calendar 
      v-model:show="showReturnDate" 
      :min-date="returnMinDate"
      :max-date="maxDate"
      @confirm="onReturnDateConfirm" 
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toolAPI, borrowAPI } from '@/api';
import { showToast, showConfirmDialog } from 'vant';
import dayjs from 'dayjs';
import { addPendingRequest, isOnline } from '@/utils/offline';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);
const tool = ref(null);
const loading = ref(true);
const submitting = ref(false);
const showBorrowDate = ref(false);
const showReturnDate = ref(false);
const conflictError = ref('');

const minDate = new Date();
const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 3);

const returnMinDate = computed(() => {
  if (formData.borrowDate) {
    return new Date(formData.borrowDate);
  }
  return new Date();
});

const canSubmit = computed(() => {
  return formData.borrowDate && formData.expectedReturnDate && !conflictError.value && !submitting.value;
});

const formData = reactive({
  borrowDate: '',
  expectedReturnDate: '',
  purpose: ''
});

const onBorrowDateConfirm = (value) => {
  formData.borrowDate = dayjs(value).format('YYYY-MM-DD');
  showBorrowDate.value = false;
  if (formData.expectedReturnDate && 
      dayjs(formData.expectedReturnDate).isBefore(dayjs(formData.borrowDate))) {
    formData.expectedReturnDate = '';
  }
  checkAvailability();
};

const onReturnDateConfirm = (value) => {
  formData.expectedReturnDate = dayjs(value).format('YYYY-MM-DD');
  showReturnDate.value = false;
  checkAvailability();
};

const checkAvailability = async () => {
  if (!formData.borrowDate || !formData.expectedReturnDate) return;
  
  try {
    const res = await toolAPI.checkAvailability({
      toolId: route.params.toolId,
      borrowDate: formData.borrowDate,
      expectedReturnDate: formData.expectedReturnDate
    });
    if (!res.available) {
      conflictError.value = '该时间段工具已被预约，请选择其他时间';
    } else {
      conflictError.value = '';
    }
  } catch (e) {
    if (!navigator.onLine) {
      conflictError.value = '离线状态下无法检查可用性，联网后将自动验证';
    }
  }
};

const onSubmit = async () => {
  if (conflictError.value && navigator.onLine) {
    showToast(conflictError.value);
    return;
  }

  if (!formData.borrowDate || !formData.expectedReturnDate) {
    showToast('请选择借用和归还日期');
    return;
  }
  
  submitting.value = true;
  try {
    const data = {
      toolId: parseInt(route.params.toolId),
      borrowDate: formData.borrowDate,
      expectedReturnDate: formData.expectedReturnDate,
      purpose: formData.purpose || ''
    };
    
    if (!navigator.onLine) {
      addPendingRequest('/borrows', 'post', data);
      showToast('离线状态，申请已缓存，将在联网后提交');
      setTimeout(() => router.push('/my-borrows'), 1500);
      return;
    }

    const result = await borrowAPI.createBorrow(data);
    const isPending = result.borrow?.status === 'pending';
    
    if (isPending) {
      showToast('申请已提交，等待管理员审核');
    } else {
      showToast('借用申请提交成功');
    }
    
    await nextTick();
    router.push('/my-borrows');
  } catch (e) {
    console.error('提交失败:', e);
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
.borrow-form {
  padding: 12px 0 80px;
}
.conflict-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin: 12px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  color: #fa8c16;
  font-size: 14px;
}
.review-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin: 12px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  color: #1890ff;
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
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}
</style>
