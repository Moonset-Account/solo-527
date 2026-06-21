<template>
  <Layout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">到场反馈管理</h1>
          <p class="mt-1 text-sm text-gray-500">五维评分模型 · NPS推荐指数 · 改进建议收集</p>
        </div>
        <select v-model="filters.event_id" @change="applyFilters" class="input-base w-64">
          <option :value="null">全部活动</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div class="stat-card">
          <div class="text-sm text-gray-500">总反馈数</div>
          <div class="mt-2 text-2xl font-bold">{{ stats.total }}</div>
        </div>
        <div class="stat-card border-l-4 border-indigo-500">
          <div class="text-sm text-gray-500">综合评分</div>
          <div class="mt-2 text-2xl font-bold text-indigo-600">{{ stats.overall }}<span class="text-sm">/5</span></div>
        </div>
        <div class="stat-card border-l-4 border-blue-500">
          <div class="text-sm text-gray-500">内容</div>
          <div class="mt-2 text-2xl font-bold text-blue-600">{{ stats.content }}</div>
        </div>
        <div class="stat-card border-l-4 border-green-500">
          <div class="text-sm text-gray-500">场地</div>
          <div class="mt-2 text-2xl font-bold text-green-600">{{ stats.venue }}</div>
        </div>
        <div class="stat-card border-l-4 border-purple-500">
          <div class="text-sm text-gray-500">服务</div>
          <div class="mt-2 text-2xl font-bold text-purple-600">{{ stats.service }}</div>
        </div>
        <div class="stat-card border-l-4 border-amber-500">
          <div class="text-sm text-gray-500">组织</div>
          <div class="mt-2 text-2xl font-bold text-amber-600">{{ stats.organization }}</div>
        </div>
        <div class="stat-card bg-gradient-to-br from-emerald-50 to-green-50">
          <div class="text-sm text-emerald-700">复购意愿</div>
          <div class="mt-2 text-2xl font-bold text-emerald-600">{{ stats.willing_rate }}%</div>
        </div>
        <div class="stat-card bg-gradient-to-br from-sky-50 to-blue-50">
          <div class="text-sm text-sky-700">NPS推荐</div>
          <div class="mt-2 text-2xl font-bold text-sky-600">{{ stats.recommend_rate }}%</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">各维度评分对比</h3>
          <div class="space-y-4">
            <div v-for="(item, idx) in radarDimensions" :key="idx" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-700 font-medium">{{ item.label }}</span>
                <span class="text-gray-900 font-bold">{{ item.value }} / 5.0</span>
              </div>
              <div class="h-8 bg-gray-50 rounded-xl overflow-hidden relative">
                <div class="h-full rounded-xl transition-all duration-500" :style="{width: item.value / 5 * 100 + '%', background: item.gradient}"></div>
                <div class="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-gray-800">
                  <span v-for="star in 5" :key="star" :class="star <= Math.round(item.value) ? 'text-yellow-500' : 'text-gray-300'">★</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">综合评分分布</h3>
          <div class="space-y-2">
            <div v-for="s in [5,4,3,2,1]" :key="s" class="flex items-center gap-3">
              <div class="w-16 text-sm font-bold text-amber-500">★×{{ s }}</div>
              <div class="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg transition-all" :style="{width: ratingWidth(s)}"></div>
              </div>
              <div class="w-12 text-right text-sm text-gray-600 font-medium">{{ ratingCount(s) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 class="font-semibold text-gray-900">反馈明细</h3>
          <div class="flex gap-2 items-center">
            <select v-model.number="filters.min_rating" @change="applyFilters" class="input-base w-32 text-sm">
              <option :value="null">全部评分</option>
              <option v-for="n in [5,4,3,2,1]" :key="n" :value="n">{{ n }}星及以上</option>
            </select>
          </div>
        </div>
        <div class="space-y-4">
          <div v-for="f in feedbacks.data" :key="f.id" class="p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all bg-white">
            <div class="flex flex-wrap gap-4 items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg font-bold text-indigo-700">
                  {{ f.registrant_name?.[0] || '匿' }}
                </div>
                <div>
                  <div class="font-semibold text-gray-900">
                    {{ f.registrant_name }}
                    <span v-if="f.is_anonymous" class="text-xs text-gray-400 ml-1">(匿名)</span>
                  </div>
                  <div class="text-xs text-gray-500">{{ f.company || '-' }} · {{ f.session_name }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="flex gap-0.5 items-center">
                  <span v-for="s in 5" :key="s" :class="['text-xl', s <= f.overall_rating ? 'text-yellow-400' : 'text-gray-200']">★</span>
                  <span class="ml-2 text-lg font-bold text-amber-600">{{ f.average_rating?.toFixed(1) }}</span>
                </div>
                <div class="text-xs text-gray-400">{{ f.created_at }} · 提交人 {{ f.submitter_name || '系统' }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div class="text-xs"><span class="text-gray-500">内容: </span><span class="text-amber-600 font-medium">{{ f.content_rating }}★</span></div>
              <div class="text-xs"><span class="text-gray-500">场地: </span><span class="text-amber-600 font-medium">{{ f.venue_rating }}★</span></div>
              <div class="text-xs"><span class="text-gray-500">服务: </span><span class="text-amber-600 font-medium">{{ f.service_rating }}★</span></div>
              <div class="text-xs"><span class="text-gray-500">组织: </span><span class="text-amber-600 font-medium">{{ f.organization_rating }}★</span></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div v-if="f.content_feedback" class="p-3 rounded-xl bg-indigo-50/40">
                <div class="text-xs font-medium text-indigo-700 mb-1">📝 内容反馈</div>
                <div class="text-gray-700">{{ f.content_feedback }}</div>
              </div>
              <div v-if="f.improvement_suggestion" class="p-3 rounded-xl bg-purple-50/40">
                <div class="text-xs font-medium text-purple-700 mb-1">💡 改进建议</div>
                <div class="text-gray-700">{{ f.improvement_suggestion }}</div>
              </div>
              <div v-if="f.good_points" class="p-3 rounded-xl bg-emerald-50/40">
                <div class="text-xs font-medium text-emerald-700 mb-1">👍 做得好的</div>
                <div class="text-gray-700">{{ f.good_points }}</div>
              </div>
              <div v-if="f.other_comments" class="p-3 rounded-xl bg-blue-50/40">
                <div class="text-xs font-medium text-blue-700 mb-1">💬 其他意见</div>
                <div class="text-gray-700">{{ f.other_comments }}</div>
              </div>
            </div>
            <div class="mt-4 flex gap-2 text-xs">
              <span v-if="f.is_willing_next_time" class="badge badge-green">✓ 愿意参加下次</span>
              <span v-else-if="f.is_willing_next_time === false" class="badge badge-red">✗ 暂不考虑</span>
              <span v-if="f.would_recommend" class="badge badge-blue">✓ 愿意推荐</span>
              <span v-else-if="f.would_recommend === false" class="badge badge-gray">✗ 暂不推荐</span>
            </div>
          </div>
        </div>

        <div v-if="feedbacks.links && feedbacks.links.length > 3" class="mt-4 flex justify-center">
          <nav class="flex gap-1">
            <a v-for="link in feedbacks.links" :key="link.url || Math.random()"
               @click="link.url && router.visit(link.url, { preserveScroll: true })"
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
import { router } from '@inertiajs/vue3';
import { reactive, computed } from 'vue';

const props = defineProps(['events', 'filters', 'feedbacks', 'stats']);

const localFilters = reactive({ ...props.filters });

const radarDimensions = computed(() => [
  { label: '综合体验', value: props.stats.overall || 0, gradient: 'linear-gradient(90deg, rgb(99,102,241), rgb(168,85,247))' },
  { label: '内容质量', value: props.stats.content || 0, gradient: 'linear-gradient(90deg, rgb(59,130,246), rgb(99,102,241))' },
  { label: '场地设施', value: props.stats.venue || 0, gradient: 'linear-gradient(90deg, rgb(34,197,94), rgb(16,185,129))' },
  { label: '服务体验', value: props.stats.service || 0, gradient: 'linear-gradient(90deg, rgb(168,85,247), rgb(236,72,153))' },
  { label: '组织安排', value: props.stats.organization || 0, gradient: 'linear-gradient(90deg, rgb(245,158,11), rgb(239,68,68))' },
]);

function ratingWidth(s) {
  const total = props.feedbacks.data?.filter(f => Math.round(f.average_rating || f.overall_rating) === s).length || 0;
  const all = Math.max(1, props.feedbacks.data?.length || 1);
  return Math.min(100, (total / all) * 100) + '%';
}

function ratingCount(s) {
  return props.feedbacks.data?.filter(f => Math.round(f.average_rating || f.overall_rating) === s).length || 0;
}

function applyFilters() {
  router.visit(route('admin.config.feedbacks.index'), { data: localFilters, preserveState: true });
}
</script>
