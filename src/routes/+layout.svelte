<script lang="ts">
	import '../routes/layout.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { Heart } from 'lucide-svelte';
</script>

<div class="min-h-screen flex flex-col bg-background">
	<Navbar />
	<main class="flex-1">
		<slot />
	</main>
	<footer class="bg-white border-t border-border mt-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
				<div class="md:col-span-2">
					<div class="flex items-center gap-2 mb-4">
						<div class="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
							<Heart class="w-5 h-5 text-white" />
						</div>
						<span class="font-display text-xl font-semibold text-text-primary">志愿服务管理系统</span>
					</div>
					<p class="text-text-secondary text-sm max-w-md">
						致力于为志愿者活动提供高效、便捷的管理平台，让志愿服务更有温度。
					</p>
				</div>
				<div>
					<h4 class="font-display font-semibold text-text-primary mb-4">快速链接</h4>
					<ul class="space-y-2 text-sm">
						<li><a href="/" class="text-text-secondary hover:text-primary transition-colors">活动项目</a></li>
						<li><a href="/my-records" class="text-text-secondary hover:text-primary transition-colors">我的记录</a></li>
						<li><a href="/admin" class="text-text-secondary hover:text-primary transition-colors">管理后台</a></li>
					</ul>
				</div>
				<div>
					<h4 class="font-display font-semibold text-text-primary mb-4">联系我们</h4>
					<ul class="space-y-2 text-sm text-text-secondary">
						<li>邮箱：volunteer@example.com</li>
						<li>电话：400-123-4567</li>
						<li>地址：北京市朝阳区志愿者大厦</li>
					</ul>
				</div>
			</div>
			<div class="border-t border-border-light mt-8 pt-8 text-center text-sm text-text-muted">
				© 2025 志愿服务管理系统. 用爱传递温暖.
			</div>
		</div>
	</footer>
	<ToastContainer />
</div>
