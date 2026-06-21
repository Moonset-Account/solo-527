<template>
  <Layout>
    <div class="space-y-6">
      <div>
      <h1 class="text-2xl font-bold text-gray-900">操作日志</h1>
      <p class="mt-1 text-sm text-gray-500">全链路审计 · 属性变更对比 · 操作人全程溯源</p>
    </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card">
          <div class="text-sm text-gray-500">总操作数</div>
          <div class="mt-2 text-2xl font-bold">{{ stats.total }}</div>
        </div>
        <div class="stat-card border-l-4 border-indigo-500">
          <div class="text-sm text-gray-500">今日</div>
          <div class="mt-2 text-2xl font-bold text-indigo-600">{{ stats.today }}</div>
        </div>
        <div class="stat-card border-l-4 border-green-500">
          <div class="text-sm text-gray-500">本周</div>
          <div class="mt-2 text-2xl font-bold text-green-600">{{ stats.this_week }}</div>
        </div>
      </div>

      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <select v-model="filters.log_name" @change="applyFilters" class="input-base text-sm">
            <option :value="null">全部模块</option>
            <option v-for="ln in log_names" :key="ln" :value="ln">{{ logNameLabel(ln) }}</option>
          </select>
          <select v-model="filters.causer_id" @change="applyFilters" class="input-base text-sm">
            <option :value="null">全部操作人</option>
            <option v-for="u in causers" :key="u.id" :value="u.id">{{ u.name }} ({{ u.department || '-' }})</option>
          </select>
          <input v-model="filters.keyword" @keyup.enter="applyFilters" placeholder="搜索描述..." class="input-base text-sm">
          <input type="date" v-model="filters.start_date" @change="applyFilters" class="input-base text-sm">
          <input type="date" v-model="filters.end_date" @change="applyFilters" class="input-base text-sm">
        </div>

        <div class="overflow-x-auto">
          <table class="table-base text-sm">
            <thead>
              <tr>
                <th>时间</th>
                <th>模块</th>
                <th>操作描述</th>
                <th>操作人</th>
                <th>变更详情</th>
                <th>请求信息</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in logs.data" :key="l.id" class="align-top">
                <td class="whitespace-nowrap">
                  <div class="font-mono text-xs text-gray-500">{{ l.created_at }}</div>
                </td>
                <td>
                  <span class="badge" :class="logBadge(l.log_name)">{{ logNameLabel(l.log_name) }}</span>
                  <div v-if="l.subject_type" class="text-xs text-gray-400 mt-1">
                    {{ l.subject_type }}#{{ l.subject_id }}
                  </div>
                </td>
                <td class="font-medium text-gray-800 max-w-xs">{{ l.description }}</td>
                <td>
                  <div class="text-sm font-medium text-gray-700">{{ l.causer_name || '系统' }}</div>
                  <div class="text-xs text-gray-400">ID: {{ l.causer_id || '-' }}</div>
                </td>
                <td class="max-w-sm">
                  <template v-if="l.has_changes">
                    <details class="cursor-pointer group">
                      <summary class="list-none text-xs font-medium text-indigo-600 hover:text-indigo-800">
                        查看变更 ({{ Object.keys(l.changes || {}).length }} 项) <span class="group-open:hidden">▸</span><span class="hidden group-open:inline">▾</span>
                      </summary>
                      <div class="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
                        <div v-for="(ch, field in l.changes" :key="field" class="p-2 rounded-lg bg-gray-50 text-xs border border-gray-100">
                          <div class="font-mono text-gray-600 mb-1 font-semibold">{{ field }}</div>
                          <div class="flex gap-2 items-start">
                            <div class="flex-1 p-1.5 rounded bg-red-50 text-red-700 line-through break-all max-w-[45%]" v-if="ch.old !== undefined && ch.old !== null">
                              <div class="text-[10px] text-red-500 mb-0.5">旧值:</div>
                              {{ formatVal(ch.old) }}
                            </div>
                            <span class="text-gray-400 text-sm mt-2">→</span>
                            <div class="flex-1 p-1.5 rounded bg-green-50 text-green-700 break-all max-w-[45%]" v-if="ch.new !== undefined && ch.new !== null">
                              <div class="text-[10px] text-green-500 mb-0.5">新值:</div>
                              {{ formatVal(ch.new) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </template>
                  <span v-else class="text-xs text-gray-400">无属性变更</span>
                </td>
                <td class="text-xs">
                  <div v-if="l.method" class="flex items-center gap-1">
                    <span :class="['px-1.5 py-0.5 rounded font-bold',
                      l.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                      l.method === 'POST' ? 'bg-green-100 text-green-700' :
                      l.method === 'PUT' || l.method === 'PATCH' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    ]">{{ l.method }}</span>
                  </div>
                  <div v-if="l.ip" class="text-gray-500 mt-1 font-mono">{{ l.ip }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="logs.links && logs.links.length > 3" class="mt-4 flex justify-center">
          <nav class="flex gap-1">
            <a v-for="link in logs.links" :key="link.url || Math.random()"
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
import { reactive } from 'vue';

const props = defineProps(['filters', 'logs', 'log_names', 'causers', 'stats']);

const localFilters = reactive({ ...props.filters });

const LOG_NAME_MAP = {
  system_config: '系统配置',
  event_session: '场次管理',
  event_seat: '座位管理',
  refund_request: '退款申请',
  registration: '报名记录',
  duplicate_seat: '重复占座',
  export_record: '数据导出',
  attendance_feedback: '到场反馈',
  user: '用户管理',
  login: '登录登出',
};

function logNameLabel(n) { return LOG_NAME_MAP[n] || n || '其他'; }

function logBadge(n) {
  return {
    system_config: 'badge-indigo',
    event_session: 'badge-blue',
    event_seat: 'badge-purple',
    refund_request: 'badge-red',
    registration: 'badge-green',
    duplicate_seat: 'badge-yellow',
    export_record: 'badge-amber',
    attendance_feedback: 'badge-cyan',
  }[n] || 'badge-gray';
}

function formatVal(v) {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? '是' : '否';
  return String(v);
}

function applyFilters() {
  router.visit(route('admin.config.logs.index'), { data: localFilters, preserveState: true });
}
</script>
