<template>
  <Layout>
    <div class="space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">导出历史</h1>
          <p class="mt-1 text-sm text-gray-500">所有导出操作留痕 · 查询口径可追溯 · 防止报表串数</p>
        </div>
        <router-link :to="route('admin.export.index')" class="btn-secondary">
          <i class="fas fa-plus mr-2"></i>新建导出
        </router-link>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card">
          <div class="text-sm text-gray-500">总导出次数</div>
          <div class="mt-2 text-2xl font-bold">{{ stats.total }}</div>
        </div>
        <div class="stat-card border-l-4 border-indigo-500">
          <div class="text-sm text-gray-500">今日导出</div>
          <div class="mt-2 text-2xl font-bold text-indigo-600">{{ stats.today }}</div>
        </div>
        <div class="stat-card border-l-4 border-green-500">
          <div class="text-sm text-gray-500">本周导出</div>
          <div class="mt-2 text-2xl font-bold text-green-600">{{ stats.this_week }}</div>
        </div>
        <div class="stat-card bg-gradient-to-br from-purple-50 to-indigo-50">
          <div class="text-sm text-purple-700">累计导出记录</div>
          <div class="mt-2 text-2xl font-bold text-purple-700">{{ stats.total_records?.toLocaleString() }}</div>
        </div>
      </div>

      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select v-model="filters.export_type" @change="applyFilters" class="input-base text-sm">
            <option :value="null">全部类型</option>
            <option v-for="(cfg, key) in export_types" :key="key" :value="key">{{ cfg.label }}</option>
          </select>
          <select v-model="filters.event_id" @change="applyFilters" class="input-base text-sm">
            <option :value="null">全部活动</option>
            <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
          <label class="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-indigo-300 transition">
            <input type="checkbox" v-model="mineOnly" true-value="1" false-value="0" @change="applyFilters" class="rounded text-indigo-600">
            只看我导出的
          </label>
          <div></div>
        </div>

        <div class="overflow-x-auto">
          <table class="table-base text-sm">
            <thead>
              <tr>
                <th>文件名</th>
                <th>类型</th>
                <th>活动</th>
                <th class="text-center">记录数</th>
                <th class="text-center">大小</th>
                <th>查询口径</th>
                <th>导出人</th>
                <th class="text-center">下载</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records.data" :key="r.id">
                <td>
                  <div class="font-mono text-xs text-gray-700">{{ r.file_name }}</div>
                  <div class="text-xs text-gray-400 mt-0.5">
                    <i class="far fa-clock mr-1"></i>{{ r.created_at }}
                    <span v-if="r.expired_at" class="ml-2" :class="r.is_expired ? 'text-red-500' : 'text-gray-400'">
                      {{ r.is_expired ? '已过期' : '有效期至 ' + r.expired_at?.slice(0,10) }}
                    </span>
                  </div>
                </td>
                <td><span :class="['badge', typeBadge(r.export_type)]">{{ r.export_type_text }}</span></td>
                <td class="text-sm text-gray-700">{{ r.event_name || '全部活动' }}</td>
                <td class="text-center font-semibold text-indigo-600">{{ r.record_count?.toLocaleString() }}</td>
                <td class="text-center text-xs text-gray-600">{{ r.file_size_text }}</td>
                <td class="max-w-xs">
                  <details class="cursor-pointer group">
                    <summary class="list-none text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                      <i class="fas fa-filter mr-1 text-gray-400 group-hover:text-indigo-500"></i>
                      查看查询条件
                      <i class="fas fa-chevron-down ml-1 text-[10px] text-gray-400 group-open:rotate-180 transition"></i>
                    </summary>
                    <div class="mt-2 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 text-xs">
                      <div v-if="r.query_criteria_text" class="whitespace-pre-wrap text-gray-700 leading-relaxed">{{ r.query_criteria_text }}</div>
                      <div v-else class="text-gray-400">无特殊过滤条件（默认全量）</div>
                      <div class="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <div class="text-[10px] text-gray-500 font-mono truncate max-w-[200px]" :title="'SQL签名: ' + r.sql_hash">
                          <i class="fas fa-fingerprint mr-1"></i>hash: {{ r.sql_hash?.slice(0, 16) }}...
                        </div>
                      </div>
                    </div>
                  </details>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {{ r.exported_by_name?.[0] || '?' }}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-800">{{ r.exported_by_name }}</div>
                      <div class="text-[10px] text-gray-500">{{ r.exported_by_dept || '-' }} · {{ r.exported_from_ip }}</div>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <div class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs">
                    <i class="fas fa-download"></i>
                    <span>{{ r.download_count || 0 }}次</span>
                  </div>
                </td>
                <td class="text-center">
                  <span v-if="!r.is_available || r.is_expired" class="badge badge-gray">已过期</span>
                  <span v-else class="badge badge-green">可下载</span>
                </td>
                <td>
                  <a v-if="r.is_available && !r.is_expired"
                     :href="route('admin.export.download', r.id)"
                     class="btn-primary text-xs !py-1 !px-3 inline-flex items-center" target="_blank">
                    <i class="fas fa-file-download mr-1"></i>下载
                  </a>
                  <span v-else class="text-xs text-gray-400 cursor-not-allowed" title="文件已超过30天保留期">
                    不可用
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="records.links && records.links.length > 3" class="mt-4 flex justify-center">
          <nav class="flex gap-1">
            <a v-for="link in records.links" :key="link.url || Math.random()"
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
import { reactive, ref, watch } from 'vue';

const props = defineProps(['events', 'filters', 'records', 'stats', 'export_types']);

const localFilters = reactive({ ...props.filters });
const mineOnly = ref(props.filters.mine_only ? '1' : '0');

watch(mineOnly, () => {
  localFilters.mine_only = mineOnly.value;
});

function typeBadge(t) {
  return {
    registrations: 'badge-blue',
    summary: 'badge-green',
    attendance: 'badge-purple',
  }[t] || 'badge-gray';
}

function applyFilters() {
  router.visit(route('admin.export.history'), { data: localFilters, preserveState: true });
}
</script>
