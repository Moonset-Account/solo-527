<template>
  <Layout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">报名质量统计</h1>
          <p class="mt-1 text-sm text-gray-500">五维评分模型 · SABCD分级 · 智能画像分析</p>
        </div>
        <select v-model="filters.event_id" @change="applyFilters" class="input-base w-64">
          <option :value="null">全部活动</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div class="stat-card">
          <div class="text-sm text-gray-500">总报名数</div>
          <div class="mt-2 text-2xl font-bold text-gray-900">{{ totals.total }}</div>
        </div>
        <div class="stat-card">
          <div class="text-sm text-gray-500">平均分数</div>
          <div class="mt-2 text-2xl font-bold text-indigo-600">{{ totals.avg_score }}</div>
        </div>
        <div class="stat-card border-l-4 border-purple-500">
          <div class="text-sm text-gray-500">S级 (顶尖)</div>
          <div class="mt-2 text-2xl font-bold text-purple-600">{{ totals.s_count }}</div>
        </div>
        <div class="stat-card border-l-4 border-blue-500">
          <div class="text-sm text-gray-500">A级 (优质)</div>
          <div class="mt-2 text-2xl font-bold text-blue-600">{{ totals.a_count }}</div>
        </div>
        <div class="stat-card border-l-4 border-green-500">
          <div class="text-sm text-gray-500">B级 (良好)</div>
          <div class="mt-2 text-2xl font-bold text-green-600">{{ totals.b_count }}</div>
        </div>
        <div class="stat-card bg-gradient-to-br from-amber-50 to-orange-50">
          <div class="text-sm text-amber-700">重点客户/VIP</div>
          <div class="mt-2 text-2xl font-bold text-amber-600">{{ totals.key_customers + totals.vips }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">质量等级分布</h3>
          <div class="space-y-3">
            <div v-for="(item, level) in distribution" :key="level" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="font-medium" :style="{ color: item.config?.color || '#666' }">{{ item.config?.label || level }}</span>
                <span class="text-gray-500">{{ item.count }} 人 · 平均分 {{ item.avg_score }}</span>
              </div>
              <div class="h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                <div class="h-full rounded-lg transition-all" :style="{
                  width: Math.max(4, pct(item.count, maxCount)) + '%',
                  background: item.config?.gradient || '#e5e7eb'
                }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">分数区间分布</h3>
          <div class="space-y-3">
            <div v-for="(r, i) in score_range_stats" :key="i" class="flex items-center gap-3">
              <div class="w-32 text-sm text-gray-600 shrink-0">{{ r.range }}</div>
              <div class="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative">
                <div class="absolute left-0 top-0 bottom-0 rounded-lg transition-all" :style="{
                  width: pct(r.count, maxRangeCount) + '%',
                  background: `linear-gradient(90deg, rgb(99,102,241), rgb(168,85,247))`
                }"></div>
                <span class="absolute inset-0 flex items-center pl-3 text-sm font-medium text-gray-800">{{ r.count }} 人</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">行业质量分析 TOP 15</h3>
          <div class="overflow-x-auto">
            <table class="table-base">
              <thead>
                <tr>
                  <th>行业</th>
                  <th class="text-center">人数</th>
                  <th class="text-center">优质率(S+A)</th>
                  <th class="text-center">平均分</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in industry_stats" :key="row.industry">
                  <td class="font-medium">{{ row.industry }}</td>
                  <td class="text-center">{{ row.count }}</td>
                  <td class="text-center">
                    <span class="badge" :class="row.high_quality_rate >= 0.6 ? 'badge-green' : row.high_quality_rate >= 0.3 ? 'badge-blue' : 'badge-gray'">
                      {{ (row.high_quality_rate * 100).toFixed(1) }}%
                    </span>
                  </td>
                  <td class="text-center font-semibold text-indigo-600">{{ row.avg_score }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">来源渠道质量对比</h3>
          <div class="overflow-x-auto">
            <table class="table-base">
              <thead>
                <tr>
                  <th>来源渠道</th>
                  <th class="text-center">人数</th>
                  <th class="text-center">付费转化</th>
                  <th class="text-center">平均分</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in source_stats" :key="row.source_channel">
                  <td class="font-medium">{{ row.source_channel }}</td>
                  <td class="text-center">{{ row.count }}</td>
                  <td class="text-center">
                    <span class="badge badge-purple">{{ row.paid_count }} / {{ (row.conversion_rate * 100).toFixed(1) }}%</span>
                  </td>
                  <td class="text-center font-semibold text-purple-600">{{ row.avg_score }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">职位级别质量分布</h3>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div v-for="p in position_stats" :key="p.score" class="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-100">
            <div class="text-sm text-gray-500">{{ p.score_range }}</div>
            <div class="mt-2 flex items-end justify-between">
              <span class="text-xl font-bold text-gray-800">{{ p.count }}</span>
              <span class="text-sm text-indigo-600 font-medium">均分 {{ p.avg_score }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 class="font-semibold text-gray-900">明细列表</h3>
          <div class="flex flex-wrap gap-2 items-center">
            <select v-model="filters.quality_level" @change="applyFilters" class="input-base w-32 text-sm">
              <option :value="null">全部等级</option>
              <option v-for="(cfg, lv) in quality_levels" :key="lv" :value="lv">{{ cfg.label }}</option>
            </select>
            <input type="number" v-model.number="filters.min_score" placeholder="最低分" @change="applyFilters" class="input-base w-28 text-sm">
            <label class="flex items-center gap-1 text-sm text-gray-600">
              <input type="checkbox" v-model="filters.is_key_customer" true-value="1" false-value="0" @change="applyFilters">
              重点客户
            </label>
            <label class="flex items-center gap-1 text-sm text-gray-600">
              <input type="checkbox" v-model="filters.is_vip" true-value="1" false-value="0" @change="applyFilters">
              VIP
            </label>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table-base">
            <thead>
              <tr>
                <th>报名号</th>
                <th>姓名</th>
                <th>公司</th>
                <th>职位</th>
                <th>来源</th>
                <th class="text-center">总分</th>
                <th class="text-center">等级</th>
                <th class="text-center">信息完整</th>
                <th class="text-center">职位级别</th>
                <th class="text-center">公司质量</th>
                <th class="text-center">行业匹配</th>
                <th class="text-center">历史行为</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in scores.data" :key="s.id">
                <td class="text-xs font-mono text-indigo-600">{{ s.registration_no }}</td>
                <td class="font-medium">
                  {{ s.name }}
                  <div v-if="s.is_key_customer || s.is_vip" class="flex gap-1 mt-0.5">
                    <span v-if="s.is_vip" class="badge badge-red text-[10px]">VIP</span>
                    <span v-if="s.is_key_customer" class="badge badge-amber text-[10px]">重点</span>
                  </div>
                </td>
                <td class="text-gray-600 text-sm">{{ s.company }}</td>
                <td class="text-sm">{{ s.position }}</td>
                <td class="text-xs text-gray-500">{{ s.source_channel }}</td>
                <td class="text-center font-bold text-lg" :style="{ color: s.quality_color }">{{ s.total_score }}</td>
                <td class="text-center"><span class="badge" :style="{ background: s.quality_color + '20', color: s.quality_color, borderColor: s.quality_color + '40' }">{{ s.quality_level }}</span></td>
                <td class="text-center text-sm">{{ s.information_completeness }}</td>
                <td class="text-center text-sm">{{ s.position_level_score }}</td>
                <td class="text-center text-sm">{{ s.company_quality_score }}</td>
                <td class="text-center text-sm">{{ s.industry_match_score }}</td>
                <td class="text-center text-sm">{{ s.history_score }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="scores.links && scores.links.length > 3" class="mt-4 flex justify-center">
          <nav class="flex gap-1">
            <a v-for="link in scores.links" :key="link.url || Math.random()"
               @click="link.url && visit(link.url, { preserveScroll: true })"
               :class="['px-3 py-1.5 text-sm rounded border transition',
                        link.active ? 'bg-indigo-600 text-white border-indigo-600' :
                        link.url ? 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 cursor-pointer' :
                        'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed']"
               v-html="link.label.replace('&laquo;', '←').replace('&raquo;', '→')"></a>
          </nav>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/Components/Layout.vue';
import { router as visit } from '@inertiajs/vue3';
import { reactive, computed } from 'vue';

const props = defineProps(['events', 'selectedEvent', 'filters', 'scores', 'distribution', 'industry_stats', 'source_stats', 'position_stats', 'score_range_stats', 'totals', 'quality_levels']);

const filters = reactive({ ...props.filters });

const maxCount = computed(() => Math.max(1, ...Object.values(props.distribution).map(d => d.count)));
const maxRangeCount = computed(() => Math.max(1, ...props.score_range_stats.map(r => r.count)));

function pct(v, max) { return (v / max) * 100; }

function applyFilters() {
  visit(route('admin.quality.index'), { data: filters, preserveState: true, preserveScroll: true });
}
</script>
