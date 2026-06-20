<script lang="ts">
  import '../app.css';
  import Navbar from '$components/Navbar.svelte';
  import { page } from '$app/stores';

  let path = $derived($page.url.pathname);
  let showNavbar = $derived(!path.startsWith('/api/'));
</script>

<svelte:head>
  <title>试剂库存数据登记站</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="科研实验室试剂库存管理、安全合规追踪系统" />
</svelte:head>

{#if showNavbar}
  <Navbar />
{/if}

<main class="min-h-[calc(100vh-4rem)]">
  <slot />
</main>

{#if showNavbar}
  <footer class="bg-white border-t border-gray-200 py-6 mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-sm text-gray-500">
          © 2024 试剂库存数据登记站 - 安全合规 · 高效管理
        </p>
        <p class="text-xs text-gray-400">
          SvelteKit · Tailwind CSS · Drizzle ORM · PostgreSQL
        </p>
      </div>
    </div>
  </footer>
{/if}
