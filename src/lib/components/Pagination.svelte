<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  export let page: number = 1;
  export let totalPages: number = 1;
  export let total: number = 0;
  export let pageSize: number = 20;

  const dispatch = createEventDispatcher<{ change: number }>();

  let pages: number[] = [];

  $: startItem = total > 0 ? (page - 1) * pageSize + 1 : 0;
  $: endItem = Math.min(page * pageSize, total);

  $: {
    const result: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    pages = result;
  }

  function changePage(p: number) {
    if (p >= 1 && p <= totalPages) {
      page = p;
      dispatch('change', page);
    }
  }
</script>

<div class="flex items-center justify-between">
  <p class="text-sm text-slate-500">
    显示 {startItem} - {endItem} 条，共 {total} 条
  </p>
  
  <div class="flex items-center gap-1">
    <button 
      class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      disabled={page <= 1}
      on:click={() => changePage(page - 1)}
    >
      <ChevronLeft class="w-4 h-4 text-slate-600" />
    </button>

    {#if pages[0] > 1}
      <button 
        class="w-9 h-9 text-sm rounded-lg hover:bg-slate-100 transition-colors"
        on:click={() => changePage(1)}
      >
        1
      </button>
      {#if pages[0] > 2}
        <span class="px-2 text-slate-400">...</span>
      {/if}
    {/if}

    {#each pages as p}
      <button 
        class="w-9 h-9 text-sm rounded-lg transition-colors"
        class:bg-primary-600={p === page}
        class:text-white={p === page}
        class:hover:bg-slate-100={p !== page}
        on:click={() => changePage(p)}
      >
        {p}
      </button>
    {/each}

    {#if pages[pages.length - 1] < totalPages}
      {#if pages[pages.length - 1] < totalPages - 1}
        <span class="px-2 text-slate-400">...</span>
      {/if}
      <button 
        class="w-9 h-9 text-sm rounded-lg hover:bg-slate-100 transition-colors"
        on:click={() => changePage(totalPages)}
      >
        {totalPages}
      </button>
    {/if}

    <button 
      class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      disabled={page >= totalPages}
      on:click={() => changePage(page + 1)}
    >
      <ChevronRight class="w-4 h-4 text-slate-600" />
    </button>
  </div>
</div>
