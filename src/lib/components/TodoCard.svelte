<script lang="ts">
  import { FileText, Calendar, TestTube, Clock, User, ChevronRight } from 'lucide-svelte';
  import StatusBadge from './StatusBadge.svelte';
  import type { TodoItem, TodoType } from '$types';
  import { todoTypeMap, formatDateShort, getPriorityBadge } from '$utils/format';

  const {
    todo,
    onComplete,
    onProcess
  } = $props<{
    todo: TodoItem;
    onComplete?: ((id: string) => void);
    onProcess?: ((id: string) => void);
  }>();

  const iconComponents: Record<string, typeof FileText> = {
    FileText,
    Calendar,
    TestTube
  };

  let typeConfig = $derived(todoTypeMap[todo.type as TodoType]);
  let IconComponent = $derived(iconComponents[typeConfig?.icon || 'FileText']);
  let priorityConfig = $derived(getPriorityBadge(todo.priority));
  let isCompleted = $derived(todo.status === 'completed');
  let isProcessing = $derived(todo.status === 'processing');
</script>

<div
  class="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-200 transition-all duration-300 cursor-pointer animate-fade-in {isCompleted ? 'opacity-60' : ''}"
>
  <div class="flex items-start gap-4">
    <div
      class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center {typeConfig?.color} group-hover:scale-110 transition-transform duration-300"
    >
      {#if IconComponent}
        {@const Icon = IconComponent}
        <Icon class="w-6 h-6" />
      {/if}
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="text-xs font-medium text-gray-500">{typeConfig?.label}</span>
        <span class="px-2 py-0.5 text-xs font-medium rounded-full {priorityConfig.color}">
          {priorityConfig.label}
        </span>
      </div>

      <h3 class="text-base font-semibold text-gray-900 mb-1.5 line-clamp-1">
        {todo.title}
      </h3>

      {#if todo.description}
        <p class="text-sm text-gray-500 mb-3 line-clamp-2">
          {todo.description}
        </p>
      {/if}

      <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <div class="flex items-center gap-1">
          <User class="w-3.5 h-3.5" />
          <span>{todo.assignee}</span>
        </div>
        <div class="flex items-center gap-1">
          <Clock class="w-3.5 h-3.5" />
          <span>截止: {formatDateShort(todo.dueDate)}</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <StatusBadge value={todo.status} size="sm" />

        <div class="flex items-center gap-2">
          {#if !isCompleted && !isProcessing && onProcess}
            <button
              onclick={(e) => { e.stopPropagation(); onProcess?.(todo.id); }}
              class="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              开始处理
            </button>
          {/if}
          {#if isProcessing && onComplete}
            <button
              onclick={(e) => { e.stopPropagation(); onComplete?.(todo.id); }}
              class="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              完成
            </button>
          {/if}
          <ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  </div>
</div>
