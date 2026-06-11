<script lang="ts">
  import '../app.css';
  import { currentUser } from '$lib/stores';
  import { mockUsers } from '$lib/mock-data';
  import type { User } from '$lib/types';

  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';

  $: pathname = $page.url.pathname;
  $: showSidebar = pathname !== '/login' && pathname !== '/';
</script>

<svelte:head>
  <title>播客交付台</title>
</svelte:head>

{#if showSidebar}
  <div class="min-h-screen bg-cream">
    <Sidebar />
    <main class="ml-64 min-h-screen">
      <slot />
    </main>
  </div>
{:else}
  <slot />
{/if}
