<script lang="ts">
  import '../app.css';
  import Sidebar from '$components/Sidebar.svelte';
  import TopNav from '$components/TopNav.svelte';
  import { page } from '$app/stores';

  let showSidebar = true;

  $: currentPath = $page.url.pathname;
  $: isAdminRoute = currentPath.startsWith('/admin');
</script>

<div class="min-h-screen bg-slate-50">
  {#if !currentPath.startsWith('/login')}
    <div class="flex min-h-screen">
      <Sidebar {showSidebar} {currentPath} {isAdminRoute} />
      
      <div class="flex-1 flex flex-col min-w-0">
        <TopNav onToggleSidebar={() => showSidebar = !showSidebar} />
        
        <main class="flex-1 p-6 overflow-auto">
          <slot />
        </main>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</div>
