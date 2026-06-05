<template>
  <div class="admin-borrows">
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3>借用管理</h3>
        <div>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 150px; margin-right: 10px;" @change="fetchBorrows">
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="待取件" value="approved" />
            <el-option label="借用中" value="borrowed" />
            <el-option label="已逾期" value="overdue" />
            <el-option label="已归还" value="returned" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
          <el-button type="primary" @click="fetchBorrows">刷新</el-button>
        </div>
      </div>

      <el-table :data="borrows" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="tool.name" label="工具" />
        <el-table-column prop="user.realName" label="借用人" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="borrowDate" label="借用日期" :formatter="formatDate" />
        <el-table-column prop="expectedReturnDate" label="应还日期" :formatter="formatDate" />
        <el-table-column prop="depositAmount" label="押金" :formatter="formatDeposit" />
        <el-table-column label="押金状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDepositType(row.depositStatus)">{{ getDepositText(row.depositStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" size="small" @click="approve(row.id)">通过</el-button>
            <el-button v-if="row.status === 'pending'" type="danger" size="small" @click="reject(row.id)">拒绝</el-button>
            <el-button v-if="row.status === 'approved'" type="success" size="small" @click="pickup(row.id)">确认取件</el-button>
            <el-button v-if="['borrowed', 'overdue'].includes(row.status)" type="primary" size="small" @click="returnTool(row)">归还</el-button>
            <el-button v-if="['borrowed', 'overdue'].includes(row.status)" type="warning" size="small" @click="reportDamage(row.id)">报损</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showReturnDialog" title="归还工具" width="500px">
      <el-form>
        <el-form-item label="归还备注">
          <el-input v-model="returnForm.returnNote" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="归还照片">
          <el-upload v-model:file-list="returnPhotoList" list-type="picture-card" :limit="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReturn">确认归还</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { borrowAPI } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

const borrows = ref([]);
const filterStatus = ref('');
const showReturnDialog = ref(false);
const currentBorrowId = ref(null);
const returnPhotoList = ref([]);
const returnForm = reactive({ returnNote: '' });

const getStatusText = (s) => {
  const m = { pending: '待审核', approved: '待取件', borrowed: '借用中', returned: '已归还', rejected: '已拒绝', overdue: '已逾期', damaged: '已损坏' };
  return m[s] || s;
};
const getStatusType = (s) => {
  const m = { pending: 'warning', approved: 'primary', borrowed: 'success', returned: 'info', rejected: 'danger', overdue: 'danger', damaged: 'danger' };
  return m[s] || '';
};
const getDepositText = (s) => {
  const m = { unpaid: '未支付', paid: '已支付', refunded: '已退还', deducted: '已扣除' };
  return m[s] || s;
};
const getDepositType = (s) => {
  const m = { unpaid: 'info', paid: 'success', refunded: '', deducted: 'danger' };
  return m[s] || '';
};
const formatDate = (row, col, v) => dayjs(v).format('YYYY-MM-DD');
const formatDeposit = (row, col, v) => '¥' + v;

const approve = async (id) => {
  try {
    await borrowAPI.approveBorrow(id);
    ElMessage.success('已通过');
    fetchBorrows();
  } catch (e) {}
};

const reject = async (id) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝申请');
    await borrowAPI.rejectBorrow(id, { rejectReason: value });
    ElMessage.success('已拒绝');
    fetchBorrows();
  } catch (e) {}
};

const pickup = async (id) => {
  try {
    await borrowAPI.confirmPickup(id);
    ElMessage.success('已确认取件');
    fetchBorrows();
  } catch (e) {}
};

const returnTool = (row) => {
  currentBorrowId.value = row.id;
  returnForm.returnNote = '';
  returnPhotoList.value = [];
  showReturnDialog.value = true;
};

const confirmReturn = async () => {
  try {
    const formData = new FormData();
    if (returnForm.returnNote) formData.append('returnNote', returnForm.returnNote);
    if (returnPhotoList.value.length > 0 && returnPhotoList.value[0].raw) {
      formData.append('returnPhoto', returnPhotoList.value[0].raw);
    }
    await borrowAPI.returnTool(currentBorrowId.value, formData);
    ElMessage.success('归还成功');
    showReturnDialog.value = false;
    fetchBorrows();
  } catch (e) {}
};

const reportDamage = async (id) => {
  try {
    await ElMessageBox.confirm('确认标记为损坏？', '提示');
    await borrowAPI.reportDamage(id, { damageNote: '' });
    ElMessage.success('已申报损坏');
    fetchBorrows();
  } catch (e) {}
};

const fetchBorrows = async () => {
  try {
    const res = await borrowAPI.getAllBorrows({ status: filterStatus.value || undefined });
    borrows.value = res.borrows;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchBorrows();
});
</script>
