<template>
  <Layout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">退款申请审核</h1>
          <p class="mt-1 text-sm text-gray-500">完整审批流 · 记录操作人 · 自动关联报名状态</p>
        </div>
        <select v-model="filters.event_id" @change="applyFilters" class="input-base w-64">
          <option :value="null">全部活动</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div class="stat-card border-l-4 border-gray-400">
          <div class="text-sm text-gray-500">总申请</div>
          <div class="mt-2 text-2xl font-bold">{{ stats.total }}</div>
        </div>
        <div class="stat-card border-l-4 border-yellow-500">
          <div class="text-sm text-yellow-700">待审核</div>
          <div class="mt-2 text-2xl font-bold text-yellow-600">{{ stats.pending }}</div>
        </div>
        <div class="stat-card border-l-4 border-blue-500">
          <div class="text-sm text-blue-700">已通过</div>
          <div class="mt-2 text-2xl font-bold text-blue-600">{{ stats.approved }}</div>
        </div>
        <div class="stat-card border-l-4 border-indigo-500">
          <div class="text-sm text-indigo-700">处理中</div>
          <div class="mt-2 text-2xl font-bold text-indigo-600">{{ stats.processing }}</div>
        </div>
        <div class="stat-card border-l-4 border-green-500">
          <div class="text-sm text-green-700">已完成</div>
          <div class="mt-2 text-2xl font-bold text-green-600">{{ stats.completed }}</div>
        </div>
        <div class="stat-card bg-gradient-to-br from-rose-50 to-red-50">
          <div class="text-sm text-rose-700">累计退款额</div>
          <div class="mt-2 text-2xl font-bold text-rose-600">¥{{ stats.total_amount?.toLocaleString() }}</div>
        </div>
      </div>

      <div class="card">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div v-for="(cfg, key) in quickFilters" :key="key"
               @click="setFilter('status', filters.status === key ? null : key)"
               :class="['px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all',
                 filters.status === key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' :
                 'bg-gray-100 text-gray-700 hover:bg-gray-200']">
            {{ cfg.label }}
            <span :class="['ml-1.5 text-xs', filters.status === key ? 'text-indigo-200' : 'text-gray-500']">({{ cfg.count }})</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table-base">
            <thead>
              <tr>
              <th>退款单号</th>
              <th>报名信息</th>
              <th>金额</th>
              <th>退款原因</th>
              <th>状态</th>
              <th>审核/处理</th>
              <th>申请人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in refunds.data" :key="r.id">
              <td class="text-xs font-mono text-indigo-600">{{ r.refund_no }}</td>
              <td>
                <div class="font-medium">{{ r.registrant_name }}</div>
                <div class="text-xs text-gray-500">{{ r.registration_no }} · {{ r.registrant_phone }}</div>
                <div class="text-xs text-gray-400">{{ r.event_name }}</div>
              </td>
              <td>
                <div class="font-semibold text-rose-600">¥{{ r.requested_amount?.toLocaleString() }}</div>
                <div class="text-xs text-gray-500">实退 ¥{{ (r.actual_amount || r.requested_amount)?.toLocaleString() }}</div>
                <div class="text-xs text-gray-400">已付 ¥{{ r.paid_amount?.toLocaleString() }}</div>
              </td>
              <td class="text-sm text-gray-700 max-w-[200px]">{{ r.reason }}</td>
              <td><span class="badge" :class="statusBadge(r.status)">{{ r.status_text }}</span></td>
              <td>
                <div v-if="r.reviewer_name" class="text-sm">
                <div>审核: {{ r.reviewer_name }}</div>
                <div class="text-xs text-gray-500">{{ r.reviewed_at }}</div>
                </div>
                <div v-if="r.processor_name" class="text-sm mt-1 pt-1 border-t border-gray-100">
                <div>处理: {{ r.processor_name }}</div>
                <div class="text-xs text-gray-500">{{ r.completed_at }}</div>
                </div>
                <div v-if="!r.reviewer_name && !r.processor_name" class="text-xs text-gray-400">暂无</div>
              </td>
              <td>
                <div class="text-sm">{{ r.creator_name || '系统' }}</div>
                <div class="text-xs text-gray-500">{{ r.created_at }}</div>
              </td>
              <td>
                <div v-if="r.status === 'pending'" class="flex gap-1">
                  <button @click="openProcessModal(r, 'approve')" class="btn-primary text-xs !py-1 !px-2">审核</button>
                </div>
                <div v-else-if="r.status === 'approved'" class="flex gap-1">
                  <button @click="openProcessModal(r, 'process')" class="btn-secondary text-xs !py-1 !px-2">执行退款</button>
                </div>
                <div v-else-if="r.status === 'processing'" class="flex gap-1">
                  <button @click="openProcessModal(r, 'complete')" class="btn-green text-xs !py-1 !px-2">标记完成</button>
                </div>
                <div v-else class="text-xs text-gray-400">—</div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <div v-if="refunds.links && refunds.links.length > 3" class="mt-4 flex justify-center">
          <nav class="flex gap-1">
            <a v-for="link in refunds.links" :key="link.url || Math.random()"
               @click="link.url && router.visit(link.url, { preserveScroll: true })"
               :class="['px-3 py-1.5 text-sm rounded border transition',
                        link.active ? 'bg-indigo-600 text-white border-indigo-600' :
                        link.url ? 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 cursor-pointer' :
                        'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed']"
               v-html="link.label.replace('&laquo;', '←').replace('&raquo;', '→')"></a>
          </nav>
        </div>
      </div>

      <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold text-lg">{{ modalTitle }}</h3>
            <button @click="showModal=false" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="p-4 rounded-xl bg-gray-50">
              <div class="text-sm text-gray-600">
                <span class="text-gray-400">退款单号：</span>{{ currentRefund?.refund_no }}
              </div>
              <div class="text-sm text-gray-600 mt-1">
                <span class="text-gray-400">申请人：</span>{{ currentRefund?.registrant_name }} · 申请 ¥{{ currentRefund?.requested_amount?.toLocaleString() }}
              </div>
            </div>
            <div v-if="currentAction === 'approve'" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">实退金额</label>
                <input type="number" v-model.number="form.actual_amount" class="input-base w-full" :placeholder="currentRefund?.requested_amount">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">审核备注</label>
                <textarea v-model="form.note" rows="3" class="input-base w-full" placeholder="通过或驳回原因..."></textarea>
              </div>
              <div class="flex gap-2">
                <button @click="submitAction('approve')" class="btn-primary flex-1">通过</button>
                <button @click="submitAction('reject')" class="btn-red flex-1">驳回</button>
              </div>
            </div>
            <div v-else-if="currentAction === 'process'" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">退款方式</label>
                <select v-model="form.refund_method" class="input-base w-full">
                <option value="">请选择</option>
                <option value="original">原路退回</option>
                <option value="bank_transfer">银行转账</option>
                <option value="alipay">支付宝</option>
                <option value="wechat">微信</option>
                <option value="cash">现金</option>
              </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">处理说明</label>
                <textarea v-model="form.note" rows="2" class="input-base w-full"></textarea>
              </div>
              <button @click="submitAction('process')" class="btn-primary w-full">开始执行退款</button>
            </div>
            <div v-else-if="currentAction === 'complete'" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">完成备注</label>
                <textarea v-model="form.note" rows="2" class="input-base w-full" placeholder="退款流水号等信息..."></textarea>
              </div>
              <button @click="submitAction('complete')" class="btn-green w-full">确认完成退款</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/Components/Layout.vue';
import { router } from '@inertiajs/vue3';
import { reactive, computed, computed as vueComputed } from 'vue';

const props = defineProps(['events', 'filters', 'refunds', 'stats', 'statuses']);

const localFilters = reactive({ ...props.filters });
const showModal = reactive(false);
const currentRefund = reactive(null);
const currentAction = reactive(null);
const form = reactive({ note: '', actual_amount: null, refund_method: '' });

const quickFilters = vueComputed(() => ({
  pending: { label: '待审核', count: props.stats.pending },
  approved: { label: '已通过', count: props.stats.approved },
  processing: { label: '处理中', count: props.stats.processing },
  completed: { label: '已完成', count: props.stats.completed },
  rejected: { label: '已拒绝', count: props.stats.rejected },
}));

const modalTitle = vueComputed(() => {
  const map = {
    approve: '审核退款申请',
    process: '执行退款',
    complete: '完成退款'
  };
  return map[currentAction.value] || '处理';
});

function applyFilters() {
  router.visit(route('admin.config.refunds.index'), { data: localFilters, preserveState: true });
}

function setFilter(key, val) {
  localFilters[key] = val;
  applyFilters();
}

function statusBadge(s) {
  return {
    pending: 'badge-yellow',
    approved: 'badge-blue',
    processing: 'badge-indigo',
    completed: 'badge-green',
    rejected: 'badge-red',
    cancelled: 'badge-gray',
  }[s] || 'badge-gray';
}

function openProcessModal(r, action) {
  Object.assign(currentRefund, r);
  currentAction.value = action;
  form.note = '';
  form.actual_amount = r.requested_amount;
  form.refund_method = '';
  showModal.value = true;
}

function submitAction(action) {
  router.post(route('admin.config.refunds.process', currentRefund.value.id), {
    action,
    ...form
  }, {
    onSuccess: () => { showModal.value = false; }
  });
}
</script>
