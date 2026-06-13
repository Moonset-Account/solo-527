<template>
  <AppLayout title="公海规则">
    <div class="ocean-page">
      <el-card shadow="never" class="filter-card" :body-style="{ padding: '16px 20px' }">
        <div class="filter-row">
          <div class="left">
            <el-icon color="#2563eb"><Brush /></el-icon>
            <span class="title">公海规则说明</span>
            <el-tag type="warning" effect="plain" size="small">诊所运营日常参考</el-tag>
          </div>
          <el-switch
            v-model="activeOnly"
            active-text="仅启用"
            inactive-text="全部"
            @change="reload"
          />
        </div>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="24" v-for="r in rules" :key="r.id">
          <el-card shadow="hover" class="rule-card">
            <div class="rule-head">
              <el-tag :type="r.is_active ? 'success' : 'info'">
                {{ r.is_active ? '生效中' : '已停用' }}
              </el-tag>
              <h3 class="rule-name">{{ r.name }}</h3>
            </div>
            <el-row :gutter="16" class="metrics">
              <el-col :xs="12" :sm="6">
                <div class="metric">
                  <div class="lbl">未分配流入</div>
                  <div class="val">{{ r.days_unassigned }}<span class="unit">天</span></div>
                  <div class="sub">线索创建后未分配责任人</div>
                </div>
              </el-col>
              <el-col :xs="12" :sm="6">
                <div class="metric">
                  <div class="lbl">无跟进流入</div>
                  <div class="val">{{ r.days_no_follow }}<span class="unit">天</span></div>
                  <div class="sub">距上次咨询/响应超期</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12">
                <div class="metric desc-metric">
                  <div class="lbl">规则描述</div>
                  <div class="val-desc">{{ r.description || '未填写' }}</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="explain-card">
        <template #header>
          <div class="card-title"><el-icon><Warning /></el-icon>公海触发条件详解（运营必读）</div>
        </template>
        <el-table :data="conditionsExplained" border>
          <el-table-column prop="condition" label="条件" width="160">
            <template #default="{ row }">
              <el-tag type="warning" effect="plain">{{ row.condition }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="trigger" label="触发时机" min-width="280" />
          <el-table-column prop="recommendation" label="建议做法" min-width="280">
            <template #default="{ row }">
              <span style="color:#047857">{{ row.recommendation }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage<any>();
const activeOnly = ref<boolean>(page.props.filters?.is_active === true ? true : false);
const rules = computed<any[]>(() => page.props.rules || []);
const conditionsExplained = computed<any[]>(() => page.props.conditionsExplained || []);
const reload = () => {
  router.get('/ocean-rules', { is_active: activeOnly.value ? 1 : null }, { preserveState: true, replace: true });
};
</script>

<style scoped>
.ocean-page { display: flex; flex-direction: column; gap: 16px; }
.filter-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.filter-row .left { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #1f2937; }
.rule-card { }
.rule-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.rule-name { margin: 0; font-size: 16px; font-weight: 600; color: #111827; }
.metrics .metric { background: #f9fafb; padding: 14px 16px; border-radius: 6px; height: 100%; }
.metric .lbl { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.metric .val { font-size: 26px; font-weight: 700; color: #1d4ed8; }
.metric .val .unit { font-size: 14px; margin-left: 4px; color: #6b7280; font-weight: 400; }
.metric .sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
.desc-metric .val-desc { font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap; }
.card-title { display: flex; align-items: center; gap: 6px; font-weight: 600; }
:deep(.el-table th.el-table__cell) { background: #f9fafb; }
</style>
