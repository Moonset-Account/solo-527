<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle, MessageSquare } from 'lucide-vue-next';
import { formatDateTime } from '../../utils/desensitize';

interface AbnormalEvent {
  id: string;
  level: 'critical' | 'warning' | 'info';
  time: string;
  description: string;
  hasRemark: boolean;
  gateName: string;
  enterpriseName: string;
}

const props = defineProps<{
  events: AbnormalEvent[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', event: AbnormalEvent): void;
}>();

const levelConfig = {
  critical: { label: '严重', class: 'tag-critical', dot: 'bg-[var(--color-danger)]' },
  warning: { label: '警告', class: 'tag-warning', dot: 'bg-[var(--color-warning)]' },
  info: { label: '提示', class: 'tag-info', dot: 'bg-[var(--color-accent-light)]' },
};

const criticalCount = computed(() => props.events.filter(e => e.level === 'critical').length);
</script>

<template>
  <div class="glass-card p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-5 h-5 text-[var(--color-warning)]" />
        <h3 class="text-base font-semibold">异常事件</h3>
        <span v-if="criticalCount > 0" class="tag tag-critical pulse-dot">
          {{ criticalCount }} 条严重
        </span>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-16 bg-[var(--color-bg-dark)] rounded"></div>
      </div>
    </div>

    <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
      <div
        v-for="event in events"
        :key="event.id"
        class="p-3 rounded cursor-pointer transition-all hover:bg-[var(--color-bg-dark)] border border-transparent hover:border-[var(--color-border)]"
        @click="emit('select', event)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-2 flex-1 min-w-0">
            <span class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" :class="levelConfig[event.level].dot" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm truncate">{{ event.description }}</span>
                <span class="tag flex-shrink-0" :class="levelConfig[event.level].class">
                  {{ levelConfig[event.level].label }}
                </span>
              </div>
              <div class="text-xs text-[var(--color-text-muted)] flex items-center gap-3">
                <span>{{ formatDateTime(event.time) }}</span>
                <span>{{ event.gateName }}</span>
                <span class="truncate">{{ event.enterpriseName }}</span>
              </div>
            </div>
          </div>
          <MessageSquare v-if="event.hasRemark" class="w-4 h-4 text-[var(--color-accent-light)] flex-shrink-0" />
        </div>
      </div>

      <div v-if="events.length === 0" class="text-center py-8 text-[var(--color-text-muted)] text-sm">
        暂无异常事件
      </div>
    </div>
  </div>
</template>
