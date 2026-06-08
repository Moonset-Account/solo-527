<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>网课学习路径分析</title>
	<meta name="description" content="教研运营学习路径仪表盘" />
</svelte:head>

{@render children()}
