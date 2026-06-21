<template>
  <Layout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">数据导出中心</h1>
        <p class="mt-1 text-sm text-gray-500">报表自动记录查询口径、导出人信息，避免数据对不上</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
              <button v-for="(cfg, key) in exportTypes" :key="key"
                      @click="currentType = key"
                      :class="['px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                               currentType === key
                               ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                               : 'bg-gray-100 text-gray-700 hover:bg-gray-200']">
                <i :class="cfg.icon + ' mr-2'"></i>{{ cfg.label }}
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1.5 text-gray-700">选择活动</label>
                <select v-model="form.event_id" class="input-base">
                  <option :value="null">全部活动</option>
                  <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                </select>
              </div>
              <div v-if="currentType === 'attendance'">
                <label class="block text-sm font-medium mb-1.5 text-gray-700">选择场次</label>
                <select v-model="form.session_id" class="input-base">
                  <option :value="null">全部场次</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5 text-gray-700">开始日期</label>
                <input type="date" v-model="form.start_date" class="input-base">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5 text-gray-700">结束日期</label>
                <input type="date" v-model="form.end_date" class="input-base">
              </div>

              <template v-if="currentType === 'registrations'">
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-gray-700">转化阶段</label>
                  <select v-model="form.conversion_stage" class="input-base">
                    <option :value="null">全部阶段</option>
                    <option value="inquiry">01-咨询</option>
                    <option value="registered">02-已报名</option>
                    <option value="confirmed">03-已确认</option>
                    <option value="paid">04-已付款</option>
                    <option value="ticket_sent">05-已发票</option>
                    <option value="lost">06-流失</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-gray-700">报名状态</label>
                  <select v-model="form.registration_status" class="input-base">
                    <option :value="null">全部状态</option>
                    <option value="pending">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已拒绝</option>
                    <option value="cancelled">已取消</option>
                    <option value="refunded">已退款</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-gray-700">到场状态</label>
                  <select v-model="form.attendance_status" class="input-base">
                    <option :value="null">全部</option>
                    <option value="not_arrived">未到场</option>
                    <option value="arrived">已到场</option>
                    <option value="no_show">缺席</option>
                    <option value="leave_early">早退</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-gray-700">来源渠道</label>
                  <input v-model="form.source_channel" placeholder="如：企业微信、官网" class="input-base">
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-1.5 text-gray-700">质量等级</label>
                  <div class="flex flex-wrap gap-2">
                    <label v-for="(cfg, lv) in ['S','A','B','C','D']" :key="lv"
                           class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition"
                           :class="form.quality_level === lv ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'">
                      <input type="radio" :value="lv" v-model="form.quality_level" class="hidden">
                      <span class="w-2 h-2 rounded-full" :style="{background: qualityColor(lv)}"></span>
                      {{ lv }}级
                    </label>
                    <label class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer text-sm transition"
                           :class="!form.quality_level ? 'border-indigo-400 bg-indigo-50' : ''">
                      <input type="radio" :value="null" v-model="form.quality_level" class="hidden">
                      全部等级
                    </label>
                  </div>
                </div>
              </template>
            </div>

            <div class="mt-6">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-gray-700">导出字段</label>
                <div class="flex gap-2 text-xs">
                  <button @click="selectAllColumns" class="text-indigo-600 hover:text-indigo-800 font-medium">全选</button>
                  <span class="text-gray-300">|</span>
                  <button @click="clearColumns" class="text-gray-500 hover:text-gray-700 font-medium">清空</button>
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100 max-h-48 overflow-y-auto">
                <label v-for="col in currentColumns" :key="col.key" class="flex items-center gap-2 text-sm cursor-pointer hover:text-indigo-600 py-1">
                  <input type="checkbox" :value="col.key" v-model="form.export_columns" class="rounded text-indigo-600">
                  {{ col.label }}
                </label>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
              <button @click="submitExport" :disabled="exporting" class="btn-primary !px-6 !py-2.5">
                <i v-if="exporting" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-file-download mr-2"></i>
                立即导出
              </button>
              <router-link :to="route('admin.export.history')" class="text-sm text-gray-600 hover:text-indigo-600 transition">
                <i class="fas fa-history mr-1"></i>查看导出历史 →
              </router-link>
              <span class="text-xs text-gray-400 ml-auto">
                <i class="fas fa-shield-alt mr-1"></i>
                导出文件将记录：查询条件、导出人、导出时间、数据签名
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <h4 class="font-semibold text-indigo-900 mb-3 flex items-center">
              <i class="fas fa-info-circle mr-2"></i>导出溯源说明
            </h4>
            <div class="space-y-3 text-sm text-indigo-800/80">
              <div class="flex items-start gap-2">
                <i class="fas fa-check-circle mt-0.5 text-green-500 shrink-0"></i>
                <div>下载的报表文件头自动包含「查询口径、导出人、部门、IP、时间、签名」6项元数据</div>
              </div>
              <div class="flex items-start gap-2">
                <i class="fas fa-check-circle mt-0.5 text-green-500 shrink-0"></i>
                <div>每次导出生成唯一SQL哈希签名，可用于核验两次导出是否同口径</div>
              </div>
              <div class="flex items-start gap-2">
                <i class="fas fa-check-circle mt-0.5 text-green-500 shrink-0"></i>
                <div>导出历史保留90天，记录下载次数，防止报表被私自篡改</div>
              </div>
              <div class="flex items-start gap-2">
                <i class="fas fa-check-circle mt-0.5 text-green-500 shrink-0"></i>
                <div>导出人姓名/部门为快照存储，用户离职后仍可追溯</div>
              </div>
            </div>
          </div>

          <div class="card">
            <h4 class="font-semibold text-gray-900 mb-4">报表类型说明</h4>
            <div class="space-y-3">
              <div class="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div class="font-medium text-blue-800 text-sm">📋 报名明细表</div>
                <div class="text-xs text-blue-700/70 mt-1">含报名人信息、来源渠道、转化状态、质量评分等完整字段</div>
              </div>
              <div class="p-3 rounded-xl bg-green-50 border border-green-100">
                <div class="font-medium text-green-800 text-sm">📊 汇总统计表</div>
                <div class="text-xs text-green-700/70 mt-1">按日期/场次维度的转化漏斗、到场率等KPI数据</div>
              </div>
              <div class="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <div class="font-medium text-purple-800 text-sm">🎫 到场签到表</div>
                <div class="text-xs text-purple-700/70 mt-1">含签到时间、签到方式、场次座位、反馈评分等数据</div>
              </div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <h4 class="font-semibold text-amber-900 mb-2 flex items-center">
              <i class="fas fa-lightbulb mr-2"></i>数据不一致排查
            </h4>
            <p class="text-sm text-amber-800/80">
              当两次报表数字对不上时，请在「导出历史」中对比：
            </p>
            <ol class="mt-2 space-y-1 text-xs text-amber-800/70 list-decimal ml-4">
              <li>查询条件（日期/状态/活动等）是否一致</li>
              <li>导出时间，数据是否有后期更新</li>
              <li>sql_hash签名，完全相同说明口径一致</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/Components/Layout.vue';
import { router } from '@inertiajs/vue3';
import { reactive, computed, ref } from 'vue';

const props = defineProps(['events', 'selectedEventId', 'export_types', 'export_columns']);

const QUALITY_COLORS = {
  S: '#9333ea', A: '#2563eb', B: '#16a34a', C: '#ca8a04', D: '#dc2626'
};

const exportTypes = {
  registrations: { label: '报名明细表', icon: 'fas fa-clipboard-list' },
  summary: { label: '汇总统计表', icon: 'fas fa-chart-line' },
  attendance: { label: '到场签到表', icon: 'fas fa-user-check' },
};

const currentType = ref('registrations');
const exporting = ref(false);

const form = reactive({
  event_id: props.selectedEventId || null,
  session_id: null,
  start_date: null,
  end_date: null,
  conversion_stage: null,
  registration_status: null,
  attendance_status: null,
  source_channel: null,
  quality_level: null,
  export_columns: [],
});

const currentColumns = computed(() => props.export_columns[currentType.value] || []);

function qualityColor(lv) { return QUALITY_COLORS[lv] || '#666'; }

function selectAllColumns() {
  form.export_columns = currentColumns.value.map(c => c.key);
}

function clearColumns() {
  form.export_columns = [];
}

function submitExport() {
  exporting.value = true;
  const routeMap = {
    registrations: 'admin.export.registrations',
    summary: 'admin.export.summary',
    attendance: 'admin.export.attendance',
  };
  router.post(route(routeMap[currentType.value]), { ...form }, {
    onFinish: () => { exporting.value = false; },
    onSuccess: () => { if (form.export_columns.length === 0) { /* ignore */ } },
  });
}
</script>
