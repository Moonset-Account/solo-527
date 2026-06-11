<script lang="ts">
  import { goto } from '$app/navigation';
  import { Radio } from 'lucide-svelte';

  const loginAs = (role: 'host' | 'operator') => {
    // 简易模拟登录
    const params = new URLSearchParams({ role });
    goto(`/dashboard?${params.toString()}`);
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 relative overflow-hidden">
  <div
    class="absolute inset-0 opacity-30"
    style="background-image: radial-gradient(circle at 20% 30%, rgba(212,165,116,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(74,157,124,0.15), transparent 40%)"
  ></div>

  <div class="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
    <div class="flex flex-col items-center text-center mb-10">
      <div
        class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 flex items-center justify-center shadow-xl mb-5"
      >
        <Radio class="w-8 h-8 text-white" stroke-width={2} />
      </div>
      <h1 class="font-display text-4xl text-white tracking-tight">播客交付台</h1>
      <p class="mt-2 text-navy-300 text-sm">独立播客作品交付与运营管理平台</p>
    </div>

    <div class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
      <h2 class="font-display text-xl text-navy-900 mb-1">选择角色登录</h2>
      <p class="text-sm text-navy-500 mb-6">Demo 版本，点击下方按钮直接进入</p>

      <div class="space-y-3">
        <button
          on:click={() => loginAs('host')}
          class="w-full group relative overflow-hidden rounded-xl bg-navy-700 text-white p-4 text-left hover:bg-navy-800 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold">播客主理人</p>
              <p class="text-xs text-navy-200 mt-0.5">查看会员、处理待办、管理异常池</p>
            </div>
            <span
              class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm group-hover:bg-white/20 transition"
              >→</span
            >
          </div>
        </button>

        <button
          on:click={() => loginAs('operator')}
          class="w-full group relative overflow-hidden rounded-xl border border-navy-200 bg-white text-navy-900 p-4 text-left hover:bg-navy-50 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold">运营负责人</p>
              <p class="text-xs text-navy-500 mt-0.5">订单管理、交付节点、留存预警</p>
            </div>
            <span
              class="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-sm text-navy-700 group-hover:bg-navy-200 transition"
              >→</span
            >
          </div>
        </button>
      </div>

      <p class="mt-6 text-center text-xs text-navy-400">
        v0.1.0 · 播客作品交付台 Demo
      </p>
    </div>
  </div>
</div>
