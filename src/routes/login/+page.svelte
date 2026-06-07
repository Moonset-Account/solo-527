<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { Truck, Lock, User } from 'lucide-svelte';

	let username = 'admin';
	let password = 'admin123';
	let loading = false;

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;

		setTimeout(() => {
			userStore.set({
				id: 'u001',
				username: 'admin',
				role: 'admin',
				fullName: '运营管理员',
				email: 'admin@coldchain.com',
				isActive: true,
				createdAt: new Date()
			});
			showToast('登录成功，欢迎使用冷链温控追踪分析系统', 'success');
			loading = false;
			goto('/dashboard');
		}, 800);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
			<div class="bg-primary-500 px-8 py-10 text-center">
				<div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<Truck class="w-8 h-8 text-white" />
				</div>
				<h1 class="text-2xl font-bold text-white">冷链温控追踪分析系统</h1>
				<p class="text-primary-100 mt-2">Cold Chain Temperature Tracking Analytics</p>
			</div>

			<div class="p-8">
				<form on:submit={handleLogin} class="space-y-5">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">用户名</label>
						<div class="relative">
							<User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
							<input
								type="text"
								class="input pl-10"
								placeholder="请输入用户名"
								bind:value={username}
								required
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">密码</label>
						<div class="relative">
							<Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
							<input
								type="password"
								class="input pl-10"
								placeholder="请输入密码"
								bind:value={password}
								required
							/>
						</div>
					</div>

					<button
						type="submit"
						class="w-full btn btn-primary py-3"
						disabled={loading}
					>
						{#if loading}
							<span class="inline-flex items-center gap-2">
								<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								登录中...
							</span>
						{:else}
							登录系统
						{/if}
					</button>
				</form>

				<p class="text-center text-xs text-slate-400 mt-6">
					演示账号: admin / admin123
				</p>
			</div>
		</div>

		<p class="text-center text-primary-200 text-xs mt-6">
			Cold Chain Analytics Platform © 2024
		</p>
	</div>
</div>
