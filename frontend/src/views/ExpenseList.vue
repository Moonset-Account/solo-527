<template>
  <div class="expense-list">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span>费用管理</span>
          <el-button type="primary" @click="createDialogVisible = true" v-if="canCreate">
            <el-icon><Plus /></el-icon>
            登记费用
          </el-button>
        </div>
      </template>

      <el-table :data="expenseList" v-loading="loading">
        <el-table-column prop="expenseNo" label="费用编号" width="160" />
        <el-table-column prop="orderNo" label="关联工单" width="160" />
        <el-table-column prop="expenseType" label="费用类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.expenseType === 'MATERIAL' ? '材料费' : row.expenseType === 'LABOR' ? '人工费' : '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="费用描述" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥ {{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payerName" label="缴费人" width="100" />
        <el-table-column label="缴费状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.payStatus === 'PAID' ? 'success' : 'warning'" size="small">
              {{ row.payStatus === 'PAID' ? '已缴费' : '未缴费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payMethod" label="缴费方式" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="100" v-if="canPay">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="row.payStatus === 'UNPAID'" @click="handlePay(row)">
              缴费
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="登记费用" width="500px">
      <el-form :model="expenseForm" label-width="100px">
        <el-form-item label="费用类型">
          <el-select v-model="expenseForm.expenseType" style="width: 100%;">
            <el-option label="材料费" value="MATERIAL" />
            <el-option label="人工费" value="LABOR" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="expenseForm.amount" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="费用描述">
          <el-input v-model="expenseForm.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExpense">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getExpensePage, createExpense, payExpense } from '@/api/expense'

const userStore = useUserStore()
const expenseList = ref([])
const loading = ref(false)
const createDialogVisible = ref(false)

const userRole = computed(() => userStore.userInfo?.role)
const canCreate = computed(() => ['ADMIN', 'PROPERTY'].includes(userRole.value))
const canPay = computed(() => ['OWNER', 'ADMIN', 'PROPERTY'].includes(userRole.value))

const expenseForm = reactive({
  expenseType: 'MATERIAL',
  amount: 0,
  description: ''
})

async function loadData() {
  loading.value = true
  try {
    const res = await getExpensePage({ page: 1, size: 20 })
    expenseList.value = res.data.records
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function submitExpense() {
  try {
    await createExpense(null, expenseForm.expenseType, expenseForm.amount, expenseForm.description, null)
    ElMessage.success('费用登记成功')
    createDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handlePay(row) {
  try {
    await payExpense(row.id, 'WECHAT')
    ElMessage.success('缴费成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>
