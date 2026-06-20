<template>
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
          size="default"
        />
      </el-form-item>
      <el-form-item label="状态" v-if="showStatus">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable size="default" style="width: 140px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人" v-if="showOwner">
        <el-select v-model="searchForm.ownerId" placeholder="请选择负责人" clearable size="default" style="width: 140px" filterable>
          <el-option v-for="item in interviewers" :key="item._id" :label="item.name" :value="item._id" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input
          v-model="searchForm.keyword"
          placeholder="候选人/职位/备注"
          clearable
          size="default"
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
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import * as usersApi from '../api/users';
import type { User } from '../types';

interface Props {
  showStatus?: boolean;
  showOwner?: boolean;
  statusOptions?: { label: string; value: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  showStatus: true,
  showOwner: true,
  statusOptions: () => [],
});

const emit = defineEmits<{
  (e: 'search', params: Record<string, any>): void;
}>();

const dateRange = ref<string[]>([]);
const searchForm = reactive({
  status: '',
  ownerId: '',
  keyword: '',
});

const interviewers = ref<User[]>([]);

async function fetchInterviewers() {
  try {
    const result = await usersApi.getInterviewers();
    interviewers.value = result;
  } catch (e) {
    console.error('Failed to fetch interviewers:', e);
  }
}

function handleSearch() {
  const params: Record<string, any> = {
    keyword: searchForm.keyword || undefined,
    status: searchForm.status || undefined,
    ownerId: searchForm.ownerId || undefined,
  };
  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0];
    params.endDate = dateRange.value[1];
  }
  emit('search', params);
}

function handleReset() {
  dateRange.value = [];
  searchForm.status = '';
  searchForm.ownerId = '';
  searchForm.keyword = '';
  handleSearch();
}

onMounted(() => {
  fetchInterviewers();
});
</script>

<style scoped>
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
</style>
