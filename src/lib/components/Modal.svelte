<script lang="ts">
  export let open: boolean;
  export let title: string;
  export let description = '';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let onClose: () => void = () => {};
  export let footer = false;

  import { X } from 'lucide-svelte';

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
      on:click={onClose}
    />
    <div
      class="relative bg-white rounded-2xl shadow-2xl w-full {sizeClasses[size]} animate-fade-in-up"
    >
      <div class="flex items-start justify-between p-6 border-b border-navy-100">
        <div>
          <h3 class="font-display text-lg text-navy-900">{title}</h3>
          {#if description}
            <p class="text-sm text-navy-500 mt-1">{description}</p>
          {/if}
        </div>
        <button
          on:click={onClose}
          class="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition"
          aria-label="关闭"
        >
          <X class="w-4 h-4" stroke-width={1.8} />
        </button>
      </div>
      <div class="p-6">
        <slot />
      </div>
      {#if footer}
        <div class="flex items-center justify-end gap-2 p-6 pt-0">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
