<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMenu() {
		mobileMenuOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Miss Rose 美甲美睫</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-rose-50">
	<nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<a href="/" class="flex items-center gap-2 group" onclick={closeMenu}>
					<span class="text-2xl">🌹</span>
					<span class="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
						Miss Rose 美甲美睫
					</span>
				</a>

				<div class="hidden md:flex items-center gap-1">
					<a href="/" class="px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-primary hover:bg-pink-50 transition-all duration-200">
						作品展示
					</a>
					<a href="/booking" class="px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-primary hover:bg-pink-50 transition-all duration-200">
						在线预约
					</a>
				</div>

				<a href="/booking" class="hidden md:inline-flex items-center gap-1 px-5 py-2 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-200">
					立即预约
				</a>

				<button onclick={toggleMenu} class="md:hidden p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-pink-50 transition-colors">
					{#if mobileMenuOpen}
						<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{:else}
						<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-pink-100 bg-white/95 backdrop-blur-md">
				<div class="px-4 py-3 space-y-1">
					<a href="/" onclick={closeMenu} class="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-primary hover:bg-pink-50 transition-colors">
						作品展示
					</a>
					<a href="/booking" onclick={closeMenu} class="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-primary hover:bg-pink-50 transition-colors">
						在线预约
					</a>
					<a href="/booking" onclick={closeMenu} class="block mt-2 text-center px-4 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-semibold">
						立即预约
					</a>
				</div>
			</div>
		{/if}
	</nav>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div>
					<div class="flex items-center gap-2 mb-4">
						<span class="text-2xl">🌹</span>
						<span class="text-lg font-bold">Miss Rose 美甲美睫</span>
					</div>
					<p class="text-gray-400 text-sm leading-relaxed">
						专注美甲美睫艺术，为您打造指尖上的精致与优雅。
					</p>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-accent uppercase tracking-wider mb-4">联系方式</h3>
					<ul class="space-y-2 text-sm text-gray-400">
						<li class="flex items-center gap-2">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
							400-888-6666
						</li>
						<li class="flex items-center gap-2">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
							上海市静安区南京西路1688号
						</li>
						<li class="flex items-center gap-2">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							营业时间：10:00 - 21:00
						</li>
					</ul>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-accent uppercase tracking-wider mb-4">关注我们</h3>
					<p class="text-sm text-gray-400 mb-3">扫码关注小红书，获取最新作品与优惠</p>
					<div class="flex gap-3">
						<span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-primary/30 transition-colors cursor-pointer text-sm">小红书</span>
						<span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-primary/30 transition-colors cursor-pointer text-sm">抖音</span>
					</div>
				</div>
			</div>
			<div class="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
				© 2024 Miss Rose 美甲美睫. All rights reserved.
			</div>
		</div>
	</footer>
</div>
