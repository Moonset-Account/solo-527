<template>
  <div class="operation-logs-page">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="操作人">
          <el-select
            v-model="searchForm.userId"
            placeholder="全部"
            clearable
            style="width: 140px"
            filterable
          >
            <el-option v-for="item in users" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operationType" placeholder="全部" clearable style="width: 140px">
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="签到" value="check_in" />
            <el-option label="测评" value="assessment" />
            <el-option label="导出" value="export" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="searchForm.module" placeholder="全部" clearable style="width: 140px">
            <el-option label="用户" value="users" />
            <el-option label="面试" value="interviews" />
            <el-option label="测评" value="assessments" />
            <el-option label="档期" value="schedules" />
            <el-option label="题库" value="question_bank" />
            <el-option label="导出" value="exports" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="操作详情"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-container">
      <el-table :data="logs" v-loading="loading" style="width: 100%" stripe>
        <el-table-column label="操作时间" width="180" sortable>
          <template #default="{ row }">
            {{ row.createdAt }}
          </template>
        </el-table-column>
        <el-table-column prop="userId.name" label="操作人" width="100" />
        <el-table-column label="角色" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ RoleLabel[row.userId.role as keyof typeof RoleLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getOperationType(row.operationType)" size="small">{{ getOperationLabel(row.operationType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100" />
        <el-table-column prop="targetId" label="目标ID" width="180" show-overflow-tooltip />
        <el-table-column prop="details" label="操作详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import * as operationLogsApi from '../api/operationLogs';
import * as usersApi from '../api/users';
import { RoleLabel } from '../types';
import type { User, OperationLog } from '../types';

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const logs = ref<OperationLog[]>([]);
const users = ref<User[]>([]);

const dateRange = ref<string[]>([]);
const searchForm = reactive({
  userId: '',
  operationType: '',
  module: '',
  keyword: '',
});

function getOperationType(type: string) {
  const map: Record<string, string> = {
    login: 'success',
    logout: 'info',
    create: 'primary',
    update: 'warning',
    delete: 'danger',
    check_in: 'success',
    assessment: '',
    export: 'info',
  };
  return map[type] || 'info';
}

function getOperationLabel(type: string) {
  const map: Record<string, string> = {
    login: '登录',
    logout: '登出',
    create: '创建',
    update: '更新',
    delete: '删除',
    check_in: '签到',
    assessment: '测评',
    export: '导出',
  };
  return map[type] || type;
}

async function fetchUsers() {
  try {
    const result = await usersApi.getUsers({ pageSize: 100 });
    users.value = result.data;
  } catch (e) {
    console.error('Failed to fetch users:', e);
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    if (searchForm.userId) params.userId = searchForm.userId;
    if (searchForm.operationType) params.operationType = searchForm.operationType;
    if (searchForm.module) params.module = searchForm.module;
    if (searchForm.keyword) params.keyword = searchForm.keyword;

    const result = await operationLogsApi.getOperationLogs(params);
    logs.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handleReset() {
  dateRange.value = [];
  searchForm.userId = '';
  searchForm.operationType = '';
  searchForm.module = '';
  searchForm.keyword = '';
  handleSearch();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  fetchData();
}

function handleCurrentChange(page: number) {
  currentPage.value = page;
  fetchData();
}

onMounted(() => {
  fetchUsers();
  fetchData();
});
</script>

<style scoped>
.operation-logs-page {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.page-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
}
</style>
