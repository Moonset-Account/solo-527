<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';

	let loading = true;
	let notifications = [];

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const res = await api.getNotifications();
			notifications = res.list;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function markRead(id) {
		try {
			await api.markNotificationRead(id);
			const n = notifications.find(x => x.id === id);
			if (n) n.is_read = true;
		} catch (e) {
			console.error(e);
		}
	}

	function getIcon(type) {
		const icons = {
			system: '🔔',
			application: '📋',
			violation: '⚠️',
			review: '✅'
		};
		return icons[type] || '🔔';
	}
</script>

<div class="page">
	<div class="page-header">
		<h2>通知中心</h2>
	</div>

	<div class="card">
		{#if loading}
			<div class="loading">加载中...</div>
		{:else}
			<div class="notification-list">
				{#each notifications as n}
					<div class="notification-item {n.is_read ? 'read' : 'unread'}" on:click={() => markRead(n.id)}>
						<div class="icon">{getIcon(n.type)}</div>
						<div class="content">
							<div class="title">{n.title}</div>
							<div class="desc">{n.content}</div>
							<div class="time">{new Date(n.created_at).toLocaleString('zh-CN')}</div>
						</div>
						{#if !n.is_read}
							<div class="dot"></div>
						{/if}
					</div>
				{/each}
				{#if notifications.length === 0}
					<div class="empty">暂无通知</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.page { padding: 0; }
	.page-header h2 { font-size: 22px; margin-bottom: 20px; color: #1f2937; }
	.card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		overflow: hidden;
	}
	.loading { text-align: center; padding: 60px 0; color: #9ca3af; }
	.notification-list { max-height: 600px; overflow-y: auto; }
	.notification-item {
		display: flex;
		gap: 14px;
		padding: 16px 20px;
		border-bottom: 1px solid #f3f4f6;
		cursor: pointer;
		transition: background 0.2s;
		position: relative;
	}
	.notification-item:hover { background: #f9fafb; }
	.notification-item.read { opacity: 0.6; }
	.notification-item .icon {
		font-size: 24px;
		flex-shrink: 0;
	}
	.notification-item .content { flex: 1; }
	.notification-item .title {
		font-size: 14px;
		font-weight: 500;
		color: #1f2937;
		margin-bottom: 4px;
	}
	.notification-item .desc {
		font-size: 13px;
		color: #6b7280;
		line-height: 1.5;
	}
	.notification-item .time {
		font-size: 12px;
		color: #9ca3af;
		margin-top: 6px;
	}
	.notification-item .dot {
		width: 8px;
		height: 8px;
		background: #ef4444;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 6px;
	}
	.empty { text-align: center; color: #9ca3af; padding: 60px 0; }
</style>
