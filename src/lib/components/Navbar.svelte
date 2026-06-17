<script lang="ts">
	import { page } from '$app/stores';
	import { auth, hasRole } from '$lib/stores/auth';
	import { toast } from '$lib/stores/toast';
	import { Heart, LayoutDashboard, User, LogIn, LogOut, Menu, X, ClipboardList } from 'lucide-svelte';
	import { getCurrentUser } from '$lib/mock/service';

	let mobileMenuOpen = $state(false);
	$effect(() => {
		auth.login(getCurrentUser());
	});

	async function handleLogout() {
		auth.logout();
		toast.success('已退出登录');
		mobileMenuOpen = false;
	}

	const navLinks = [
		{ href: '/', label: '活动项目', icon: Heart, public: true },
		{ href: '/my-records', label: '我的记录', icon: ClipboardList, public: false },
		{ href: '/admin', label: '管理后台', icon: LayoutDashboard, public: false, role: 'manager' }
	];
</script>

<nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<a href="/" class="flex items-center gap-2 group">
				<div class="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
					<Heart class="w-5 h-5 text-white" />
				</div>
				<span class="font-display text-xl font-semibold text-text-primary">志愿服务</span>
			</a>

			<div class="hidden md:flex items-center gap-1">
				{#each navLinks as link}
					{#if link.public || ($auth.isAuthenticated && (!link.role || hasRole($auth.user?.role || '', link.role)))}
						<a
							href={link.href}
							class="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all duration-fast hover:bg-surface-alt {
								$page.url.pathname === link.href
									? 'bg-primary/10 text-primary'
									: 'text-text-secondary hover:text-text-primary'
							}"
						>
							{@const LinkIcon = link.icon}
							<LinkIcon class="w-4 h-4" />
							{link.label}
						</a>
					{/if}
				{/each}
			</div>

			<div class="hidden md:flex items-center gap-3">
				{#if $auth.isAuthenticated}
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
							<User class="w-4 h-4 text-secondary" />
						</div>
						<span class="text-sm font-medium text-text-primary">{$auth.user?.name}</span>
						<button
							onclick={handleLogout}
							class="btn btn-ghost text-sm !px-2 !py-1.5"
							title="退出登录"
						>
							<LogOut class="w-4 h-4" />
						</button>
					</div>
				{:else}
					<a href="/login" class="btn btn-primary text-sm">
						<LogIn class="w-4 h-4" />
						登录
					</a>
				{/if}
			</div>

			<button
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="md:hidden p-2 rounded-lg hover:bg-surface-alt transition-colors"
			>
				{#if mobileMenuOpen}
					<X class="w-5 h-5 text-text-primary" />
				{:else}
					<Menu class="w-5 h-5 text-text-primary" />
				{/if}
			</button>
		</div>
	</div>

	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-border animate-fade-in">
			<div class="px-4 py-3 space-y-1">
				{#each navLinks as link}
					{#if link.public || ($auth.isAuthenticated && (!link.role || hasRole($auth.user?.role || '', link.role)))}
						<a
							href={link.href}
							onclick={() => (mobileMenuOpen = false)}
							class="flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors {
								$page.url.pathname === link.href
									? 'bg-primary/10 text-primary'
									: 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
							}"
						>
							{@const MobileLinkIcon = link.icon}
							<MobileLinkIcon class="w-4 h-4" />
							{link.label}
						</a>
					{/if}
				{/each}
				<div class="pt-2 border-t border-border">
					{#if $auth.isAuthenticated}
						<div class="flex items-center justify-between px-3 py-2">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
									<User class="w-4 h-4 text-secondary" />
								</div>
								<span class="text-sm font-medium text-text-primary">{$auth.user?.name}</span>
							</div>
							<button on:click={handleLogout} class="btn btn-ghost text-sm">
								<LogOut class="w-4 h-4" />
								退出
							</button>
						</div>
					{:else}
						<a href="/login" on:click={() => (mobileMenuOpen = false)} class="btn btn-primary w-full">
							<LogIn class="w-4 h-4" />
							登录
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</nav>
