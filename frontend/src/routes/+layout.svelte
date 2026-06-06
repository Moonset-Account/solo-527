<script>
	import { auth } from '$stores/auth';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let showMenu = false;

	$: isLoginPage = $page.url.pathname === '/login';
	$: user = $auth.user;
	$: isDispatcher = user?.role === 'dispatcher' || user?.role === 'admin';
	$: isNurse = user?.role === 'nurse';
	$: isAdmin = user?.role === 'admin';
	$: isAuthenticated = !!$auth.token;

	function logout() {
		auth.logout();
		if (browser) {
			goto('/login');
		}
	}

	onMount(() => {
		if (browser && !isLoginPage && !isAuthenticated) {
			goto('/login');
		}
	});

	$: if (browser && !isLoginPage && !isAuthenticated) {
		goto('/login');
	}
</script>

{#if isLoginPage}
	<slot />
{:else}
	<div class="min-h-screen bg-gray-50">
		<nav class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between h-16">
					<div class="flex items-center">
						<div class="flex-shrink-0 flex items-center">
							<span class="text-xl font-bold text-blue-600">❄️ 冷链箱周转管理系统</span>
						</div>
						<div class="hidden sm:ml-10 sm:flex sm:space-x-8">
							<a href="/tasks" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
								任务列表
							</a>
							{#if isDispatcher}
								<a href="/tasks/new" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
									创建任务
								</a>
							{/if}
						</div>
					</div>
					<div class="flex items-center">
						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-600">
								{user?.name}
								<span class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
									{user?.role === 'admin' ? '管理员' : user?.role === 'dispatcher' ? '调度员' : '护士'}
								</span>
							</span>
							<button on:click={logout} class="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-100">
								退出登录
							</button>
						</div>
					</div>
				</div>
			</div>
		</nav>

		<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<slot />
		</main>
	</div>
{/if}
