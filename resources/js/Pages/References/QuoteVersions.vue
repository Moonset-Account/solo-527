<template>
  <AppLayout title="报价版本">
    <div class="quotes-page">
      <el-card shadow="never" class="filter-card" :body-style="{ padding: '16px 20px' }">
        <div class="filter-row">
          <div class="left">
            <el-icon color="#2563eb"><Money /></el-icon>
            <span class="title">报价版本管理</span>
            <el-tag type="info" effect="plain" size="small">诊所运营快速查询</el-tag>
          </div>
          <div class="right">
            <el-switch
              v-model="activeOnly"
              active-text="仅启用"
              inactive-text="全部"
              @change="reload"
            />
            <el-input
              v-model="search"
              placeholder="搜索版本名称"
              clearable
              style="width: 220px"
              @keyup.enter="reload"
              @clear="reload"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
        </div>
      </el-card>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="8" v-for="q in quoteVersions" :key="q.id">
          <el-card shadow="hover" class="quote-card">
            <template #header>
              <div class="card-header">
                <div class="left">
                  <el-tag :type="q.is_active ? 'success' : 'info'" effect="light" size="small">
                    {{ q.is_active ? '已启用' : '已停用' }}
                  </el-tag>
                  <el-tag type="primary" effect="plain" size="small">{{ q.version }}</el-tag>
                  <span class="name">{{ q.name }}</span>
                </div>
                <el-tag type="warning" effect="plain" size="small">{{ q.leads_count }} 线索引用</el-tag>
              </div>
            </template>
            <div class="date-line">生效日期：<b>{{ q.effective_date }}</b> · 创建于 {{ q.created_at?.slice(0, 10) }}</div>
            <div class="desc" v-if="q.description">{{ q.description }}</div>
            <el-collapse>
              <el-collapse-item title="查看项目明细">
                <el-collapse v-for="(g, gi) in q.items" :key="gi">
                  <el-collapse-item :name="g.category">
                    <template #title>
                      <span class="cat-title">{{ g.category }}</span>
                      <el-tag size="small" type="info" effect="plain" style="margin-left: auto">
                        小计 ¥ {{ Number(g.total).toLocaleString() }}
                      </el-tag>
                    </template>
                    <el-table :data="g.items" size="small" border>
                      <el-table-column prop="name" label="项目" min-width="160" />
                      <el-table-column prop="price" label="价格(元)" width="120" align="right">
                        <template #default="{ row }">¥ {{ Number(row.price).toLocaleString() }}</template>
                      </el-table-column>
                      <el-table-column prop="unit" label="单位" width="80" align="center" />
                    </el-table>
                  </el-collapse-item>
                </el-collapse>
                <div class="grand-total">
                  总计：<span>¥ {{ Number(q.grand_total).toLocaleString() }}</span>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="!quoteVersions.length" description="暂无报价版本，请管理员在后台录入" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage<any>();
const activeOnly = ref<boolean>(page.props.filters?.is_active === true ? true : false);
const search = ref<string>(page.props.filters?.search || '');
const quoteVersions = computed<any[]>(() => page.props.quoteVersions || []);

const reload = () => {
  router.get('/quote-versions', {
    is_active: activeOnly.value ? 1 : null,
    search: search.value || null,
  }, { preserveState: true, replace: true });
};
</script>

<style scoped>
.quotes-page { display: flex; flex-direction: column; gap: 16px; }
.filter-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.filter-row .left { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #1f2937; }
.filter-row .right { display: flex; align-items: center; gap: 12px; }
.quote-card { height: 100%; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-header .left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.name { font-weight: 600; color: #111827; font-size: 14px; }
.date-line { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.desc { background: #f9fafb; padding: 8px 12px; border-radius: 4px; color: #374151; font-size: 13px; margin-bottom: 10px; }
.cat-title { font-weight: 500; color: #1f2937; display: inline-flex; align-items: center; }
.grand-total { text-align: right; padding: 10px 4px 0; font-size: 14px; color: #374151; }
.grand-total span { color: #1d4ed8; font-weight: 700; font-size: 18px; margin-left: 8px; }
:deep(.el-collapse-item__header) { padding: 0 4px; }
</style>
