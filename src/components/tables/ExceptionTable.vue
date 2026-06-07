<script setup lang="ts">
import { ref, computed } from 'vue';
import { MessageSquare, ChevronLeft, ChevronRight, Edit3, Check, X } from 'lucide-vue-next';
import type { ExceptionItem } from '../../utils/api';
import { desensitizePlate, desensitizeIdCard, formatDateTime } from '../../utils/desensitize';
import { api } from '../../utils/api';

const props = defineProps<{
  data: ExceptionItem[];
  total: number;
  loading?: boolean;
  page: number;
  pageSize: number;
}>();

const emit = defineEmits<{
  (e: 'pageChange', page: number): void;
}>();

const editingId = ref<string | null>(null);
const editValue = ref('');

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));

const levelConfig = {
  critical: { label: '严重', class: 'tag-critical' },
  warning: { label: '警告', class: 'tag-warning' },
  info: { label: '提示', class: 'tag-info' },
};

function startEdit(item: ExceptionItem) {
  editingId.value = item.id;
  editValue.value = item.remark || '';
}

async function saveEdit(item: ExceptionItem) {
  try {
    await api.updateRemark(item.id, editValue.value);
    item.remark = editValue.value;
    editingId.value = null;
  } catch (e) {
    console.error('Failed to save remark', e);
  }
}

function cancelEdit() {
  editingId.value = null;
  editValue.value = '';
}
</script>

<template>
  <div class="glass-card p-5 h-full flex flex-col">
    <h3 class="text-base font-semibold mb-4 flex items-center gap-2">
      <MessageSquare class="w-5 h-5 text-[var(--color-warning)]" />
      <span>异常放行明细</span>
      <span class="tag tag-warning">{{ total }} 条</span>
    </h3>

    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-[var(--color-bg-medium)] z-10">
          <tr class="text-[var(--color-text-secondary)] text-left border-b border-[var(--color-border)]">
            <th class="py-3 px-2 font-medium">时间</th>
            <th class="py-3 px-2 font-medium">车牌</th>
            <th class="py-3 px-2 font-medium">证件号</th>
            <th class="py-3 px-2 font-medium">访客类型</th>
            <th class="py-3 px-2 font-medium">入口/车道</th>
            <th class="py-3 px-2 font-medium">被访企业</th>
            <th class="py-3 px-2 font-medium">异常原因</th>
            <th class="py-3 px-2 font-medium">级别</th>
            <th class="py-3 px-2 font-medium">操作员</th>
            <th class="py-3 px-2 font-medium">备注</th>
          </tr>
        </thead>
        <tbody v-if="!loading">
          <tr
            v-for="item in data"
            :key="item.id"
            class="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-dark)] transition-colors"
          >
            <td class="py-3 px-2 text-[var(--color-text-secondary)] whitespace-nowrap">
              {{ formatDateTime(item.time) }}
            </td>
            <td class="py-3 px-2 font-mono text-xs whitespace-nowrap">
              {{ desensitizePlate(item.plateNumber) }}
            </td>
            <td class="py-3 px-2 font-mono text-xs whitespace-nowrap">
              {{ desensitizeIdCard(item.idCard) }}
            </td>
            <td class="py-3 px-2 whitespace-nowrap">{{ item.visitorType }}</td>
            <td class="py-3 px-2 whitespace-nowrap">
              <div>{{ item.gateName }}</div>
              <div class="text-xs text-[var(--color-text-muted)]">{{ item.lane }}</div>
            </td>
            <td class="py-3 px-2 whitespace-nowrap max-w-[120px] truncate" :title="item.enterpriseName">
              {{ item.enterpriseName }}
            </td>
            <td class="py-3 px-2 max-w-[140px] truncate" :title="item.reason">
              {{ item.reason }}
            </td>
            <td class="py-3 px-2">
              <span class="tag" :class="levelConfig[item.level].class">
                {{ levelConfig[item.level].label }}
              </span>
            </td>
            <td class="py-3 px-2 text-[var(--color-text-secondary)] whitespace-nowrap">
              {{ item.operator || '-' }}
            </td>
            <td class="py-3 px-2">
              <div v-if="editingId === item.id" class="flex items-center gap-1">
                <input
                  v-model="editValue"
                  class="bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded px-2 py-1 text-xs w-28 focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder="输入备注"
                  @keyup.enter="saveEdit(item)"
                />
                <button class="p-1 text-[var(--color-success)]" @click="saveEdit(item)">
                  <Check class="w-4 h-4" />
                </button>
                <button class="p-1 text-[var(--color-text-muted)]" @click="cancelEdit">
                  <X class="w-4 h-4" />
                </button>
              </div>
              <div v-else class="flex items-center gap-1 group">
                <span v-if="item.remark" class="text-xs text-[var(--color-warning)] truncate max-w-[100px]">
                  {{ item.remark }}
                </span>
                <span v-else class="text-xs text-[var(--color-text-muted)]">-</span>
                <button
                  class="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="startEdit(item)"
                >
                  <Edit3 class="w-3 h-3 text-[var(--color-accent-light)]" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="data.length === 0">
            <td colspan="10" class="py-12 text-center text-[var(--color-text-muted)]">
              暂无异常记录
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="i in 5" :key="i">
            <td v-for="j in 10" :key="j" class="py-4 px-2">
              <div class="h-4 bg-[var(--color-bg-dark)] animate-pulse rounded"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
      <div class="text-xs text-[var(--color-text-muted)]">
        共 {{ total }} 条记录，第 {{ page }} / {{ totalPages || 1 }} 页
      </div>
      <div class="flex items-center gap-2">
        <button
          class="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
          :disabled="page <= 1"
          @click="emit('pageChange', page - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-sm text-[var(--color-text-secondary)]">{{ page }}</span>
        <button
          class="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
          :disabled="page >= totalPages"
          @click="emit('pageChange', page + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
