<template>
  <div class="admin-home">
    <h2 style="margin-bottom: 24px;">数据概览</h2>
    
    <el-row :gutter="20" style="margin-bottom: 24px;">
      <el-col :span="6">
        <div class="stat-card">
          <p>工具总数</p>
          <h3 style="color: #1890ff;">{{ stats.tools?.total || 0 }}</h3>
          <span>可用 {{ stats.tools?.available || 0 }} / 借出 {{ stats.tools?.borrowed || 0 }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <p>注册用户</p>
          <h3 style="color: #52c41a;">{{ stats.users?.total || 0 }}</h3>
          <span>已认证 {{ stats.users?.verified || 0 }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <p>借用记录</p>
          <h3 style="color: #722ed1;">{{ stats.borrows?.total || 0 }}</h3>
          <span>今日新增 {{ stats.borrows?.today || 0 }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <p>待处理</p>
          <h3 style="color: #fa8c16;">{{ (stats.borrows?.pending || 0) + (stats.borrows?.overdue || 0) }}</h3>
          <span>待审核 {{ stats.borrows?.pending || 0 }} / 逾期 {{ stats.borrows?.overdue || 0 }}</span>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="admin-card">
          <h3>待审核申请</h3>
          <el-table :data="pendingBorrows" size="small" v-if="pendingBorrows.length > 0">
            <el-table-column prop="tool.name" label="工具" />
            <el-table-column prop="user.realName" label="申请人" />
            <el-table-column prop="borrowDate" label="借用日期" :formatter="formatDate" />
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="approve(row.id)">通过</el-button>
                <el-button type="danger" size="small" @click="reject(row.id)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无待审核申请" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="admin-card">
          <h3>逾期未还</h3>
          <el-table :data="overdueBorrows" size="small" v-if="overdueBorrows.length > 0">
            <el-table-column prop="tool.name" label="工具" />
            <el-table-column prop="user.realName" label="借用人" />
            <el-table-column prop="expectedReturnDate" label="应还日期" :formatter="formatDate" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="goBorrows">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无逾期记录" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { notificationAPI, borrowAPI } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

const router = useRouter();
const stats = ref({});
const pendingBorrows = ref([]);
const overdueBorrows = ref([]);

const formatDate = (row, col, value) => dayjs(value).format('YYYY-MM-DD');

const approve = async (id) => {
  try {
    await borrowAPI.approveBorrow(id);
    ElMessage.success('已通过');
    fetchData();
  } catch (e) {}
};

const reject = async (id) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝申请');
    await borrowAPI.rejectBorrow(id, { rejectReason: value });
    ElMessage.success('已拒绝');
    fetchData();
  } catch (e) {}
};

const goBorrows = () => router.push('/admin/borrows');

const fetchData = async () => {
  try {
    const [statsRes, borrowsRes] = await Promise.all([
      notificationAPI.getStatistics(),
      borrowAPI.getAllBorrows()
    ]);
    stats.value = statsRes;
    pendingBorrows.value = borrowsRes.borrows.filter(b => b.status === 'pending').slice(0, 5);
    overdueBorrows.value = borrowsRes.borrows.filter(b => b.status === 'overdue').slice(0, 5);
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.admin-home {
  padding: 0;
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.stat-card p {
  color: #666;
  margin: 0 0 8px;
}
.stat-card h3 {
  font-size: 32px;
  margin: 8px 0;
}
.stat-card span {
  color: #999;
  font-size: 13px;
}
.admin-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.admin-card h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
</style>
