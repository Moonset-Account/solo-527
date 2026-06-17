<template>
  <div class="page-container">
    <div class="page-header">
      <h2>账单管理</h2>
      <el-button-group>
        <el-button type="primary" v-if="auth.isManager" @click="showCreate = true">
          <el-icon><Plus /></el-icon> 新建账单
        </el-button>
        <el-button type="success" @click="loadData">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </el-button-group>
    </div>
    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="账单状态" clearable @change="loadData" style="width: 140px;">
        <el-option label="未缴" value="unpaid" />
        <el-option label="部分已缴" value="partial" />
        <el-option label="已缴" value="paid" />
        <el-option label="逾期" value="overdue" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-select v-model="filters.type" placeholder="费用类型" clearable @change="loadData" style="width: 140px;">
        <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
      </el-select>
      <el-input v-model="filters.roomNo" placeholder="房间号" clearable @keyup.enter="loadData" style="width: 140px;" />
      <el-input v-model="filters.billingPeriod" placeholder="账期如2025-01" clearable @keyup.enter="loadData" style="width: 160px;" />
    </div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="billNo" label="账单编号" width="180" />
        <el-table-column prop="roomNo" label="房间" width="100" />
        <el-table-column prop="residentName" label="住户" width="100" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabels[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="billingPeriod" label="账期" width="110" />
        <el-table-column label="总额" width="120" align="right">
          <template #default="{ row }">¥ {{ row.totalAmount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="已缴" width="120" align="right">
          <template #default="{ row }">¥ {{ row.paidAmount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="未缴" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #E6A23C;">¥ {{ row.unpaidAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" size="small" effect="dark">{{ statusLabels[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy.realName" label="创建人" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status !== 'paid' && row.status !== 'cancelled'"
              size="small" type="success" link @click="openPay(row)"
            >缴费</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          :current-page="page" :page-size="limit" :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePage"
        />
      </div>
    </el-card>
    <el-dialog v-model="showCreate" title="新建账单" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="费用类型">
          <el-select v-model="form.type" style="width: 100%;">
            <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间号"><el-input v-model="form.roomNo" /></el-form-item>
        <el-form-item label="住户姓名"><el-input v-model="form.residentName" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.residentPhone" /></el-form-item>
        <el-form-item label="账期"><el-input v-model="form.billingPeriod" placeholder="如 2025-06" /></el-form-item>
        <el-form-item label="金额"><el-input-number v-model="form.totalAmount" :min="0" :precision="2" style="width: 100%;" /></el-form-item>
        <el-form-item label="到期日"><el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item>
        <el-form-item label="备注"><el-input type="textarea" v-model="form.remark" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认创建</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="detailVisible" title="账单详情" width="600px">
      <el-descriptions v-if="currentBill" :column="2" border>
        <el-descriptions-item label="账单编号">{{ currentBill.billNo }}</el-descriptions-item>
        <el-descriptions-item label="费用类型">{{ typeLabels[currentBill.type] }}</el-descriptions-item>
        <el-descriptions-item label="房间号">{{ currentBill.roomNo }}</el-descriptions-item>
        <el-descriptions-item label="住户">{{ currentBill.residentName }}</el-descriptions-item>
        <el-descriptions-item label="账期">{{ currentBill.billingPeriod }}</el-descriptions-item>
        <el-descriptions-item label="到期日">{{ currentBill.dueDate }}</el-descriptions-item>
        <el-descriptions-item label="总额">¥ {{ currentBill.totalAmount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="已缴">¥ {{ currentBill.paidAmount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="未缴">¥ {{ currentBill.unpaidAmount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag[currentBill.status]" size="small">{{ statusLabels[currentBill.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人" :span="2">{{ currentBill.createdBy?.realName }} ({{ currentBill.createdAt }})</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentBill.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="currentBill?.paymentRecords?.length" style="margin-top: 20px;">
        <b>缴费记录</b>
        <el-table :data="currentBill.paymentRecords" border size="small" style="margin-top: 10px;">
          <el-table-column prop="date" label="时间" width="170" />
          <el-table-column label="金额" width="110" align="right">
            <template #default="{ row }">¥ {{ row.amount.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="method" label="方式" width="100" />
          <el-table-column prop="paidBy.realName" label="操作人" width="100" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </div>
    </el-dialog>
    <el-dialog v-model="payVisible" title="缴费操作" width="420px">
      <el-form label-width="90px">
        <el-form-item label="待缴金额">
          <span style="color: #F56C6C; font-weight: 600; font-size: 16px;">
            ¥ {{ currentBill?.unpaidAmount?.toFixed(2) }}
          </span>
        </el-form-item>
        <el-form-item label="本次金额">
          <el-input-number v-model="payForm.amount" :min="0.01" :max="currentBill?.unpaidAmount || 0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="payForm.method" style="width: 100%;">
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行转账" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="payForm.remark" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePay">确认缴费</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getBills, createBill, payBill } from '@/api/bill';
import { useAuthStore } from '@/store/auth';
import type { Bill } from '@/types';

const auth = useAuthStore();
const loading = ref(false);
const list = ref<Bill[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const filters = reactive({ status: '', type: '', roomNo: '', billingPeriod: '' });

const typeLabels: Record<string, string> = {
  rent: '租金', water: '水费', electricity: '电费', gas: '燃气费',
  network: '网费', property: '物业费', other: '其他',
};
const statusLabels: Record<string, string> = {
  unpaid: '未缴', partial: '部分已缴', paid: '已缴', overdue: '逾期', cancelled: '已取消',
};
const statusTag: Record<string, any> = {
  unpaid: 'warning', partial: 'primary', paid: 'success', overdue: 'danger', cancelled: 'info',
};

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getBills({ page: page.value, limit: limit.value, ...filters });
    list.value = res.data || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePage(p: number) { page.value = p; loadData(); }
onMounted(loadData);

const showCreate = ref(false);
const form = reactive<any>({ type: 'rent', roomNo: '', residentName: '', residentPhone: '', billingPeriod: '', totalAmount: 0, dueDate: '', remark: '' });
async function handleCreate() {
  if (!form.type || !form.roomNo || !form.residentName || !form.billingPeriod || !form.totalAmount || !form.dueDate) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  try {
    await createBill(form);
    ElMessage.success('账单创建成功');
    showCreate.value = false;
    loadData();
  } catch (_) {}
}

const detailVisible = ref(false);
const currentBill = ref<Bill | null>(null);
async function viewDetail(row: Bill) {
  currentBill.value = row;
  detailVisible.value = true;
}

const payVisible = ref(false);
const payForm = reactive({ amount: 0, method: 'wechat', remark: '' });
function openPay(row: Bill) {
  currentBill.value = row;
  payForm.amount = row.unpaidAmount;
  payForm.method = 'wechat';
  payForm.remark = '';
  payVisible.value = true;
}
async function handlePay() {
  if (!payForm.amount || !payForm.method) { ElMessage.warning('请填写缴费信息'); return; }
  try {
    await ElMessageBox.confirm(`确认收取 ¥${payForm.amount.toFixed(2)} ?`, '确认', { type: 'warning' });
    await payBill(currentBill.value!._id, payForm);
    ElMessage.success('缴费成功');
    payVisible.value = false;
    loadData();
  } catch (_) {}
}
</script>
