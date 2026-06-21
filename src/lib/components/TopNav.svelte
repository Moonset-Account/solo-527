<script lang="ts">
  import { Bell, Search, Menu, User } from 'lucide-svelte';

  export let onToggleSidebar: () => void;
</script>

<header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
  <div class="flex items-center gap-4">
    <button 
      class="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
      on:click={onToggleSidebar}
    >
      <Menu class="w-5 h-5 text-slate-600" />
    </button>
    
    <div class="relative hidden md:block">
      <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input 
        type="text" 
        placeholder="搜索指标、异常..." 
        class="input pl-10 w-80 bg-slate-50"
      />
    </div>
  </div>

  <div class="flex items-center gap-3">
    <button class="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
      <Bell class="w-5 h-5 text-slate-600" />
      <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
    </button>
    
    <div class="flex items-center gap-3 pl-3 border-l border-slate-200">
      <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
        <User class="w-4 h-4 text-primary-600" />
      </div>
      <div class="hidden md:block">
        <div class="text-sm font-medium text-slate-900">运营负责人</div>
        <div class="text-xs text-slate-500">admin@example.com</div>
      </div>
    </div>
  </div>
</header>
