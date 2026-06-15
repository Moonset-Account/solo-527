<script lang="ts">
	interface WorkItem {
		work: {
			id: string;
			technicianId: string;
			title: string;
			images: string[];
			description: string | null;
			tags: string[] | null;
			isPublished: boolean;
			publishedAt: string | null;
			createdAt: string;
		};
		technician: {
			id: string;
			name: string;
			avatar: string | null;
		} | null;
	}

	interface CommentItem {
		comment: {
			id: string;
			authorName: string | null;
			content: string;
			rating: number | null;
			createdAt: string;
		};
		customer: { id: string; name: string } | null;
	}

	let works = $state<WorkItem[]>([]);
	let comments = $state<CommentItem[]>([]);
	let loading = $state(true);
	let selectedTag = $state('全部');
	let selectedWork = $state<WorkItem | null>(null);
	let carouselIndex = $state(0);
	let loadingComments = $state(false);
	let likeMap = $state<Record<string, number>>({});

	$effect(() => {
		loadWorks();
	});

	async function loadWorks() {
		try {
			const res = await fetch('/api/works?published=true');
			if (res.ok) {
				works = await res.json();
				const map: Record<string, number> = {};
				for (const item of works) {
					let hash = 0;
					for (let i = 0; i < item.work.id.length; i++) {
						hash = ((hash << 5) - hash + item.work.id.charCodeAt(i)) | 0;
					}
					map[item.work.id] = Math.abs(hash % 50) + 10;
				}
				likeMap = map;
			}
		} catch (e) {
			console.error('Failed to load works', e);
		} finally {
			loading = false;
		}
	}

	let allTags = $derived.by(() => {
		const tagSet = new Set<string>();
		for (const item of works) {
			if (item.work.tags) {
				for (const tag of item.work.tags) {
					tagSet.add(tag);
				}
			}
		}
		return ['全部', ...Array.from(tagSet)];
	});

	let filteredWorks = $derived.by(() => {
		if (selectedTag === '全部') return works;
		return works.filter((item) => item.work.tags?.includes(selectedTag));
	});

	function openDetail(item: WorkItem) {
		selectedWork = item;
		carouselIndex = 0;
		loadComments(item.work.id);
	}

	function closeDetail() {
		selectedWork = null;
		comments = [];
		carouselIndex = 0;
	}

	async function loadComments(workId: string) {
		loadingComments = true;
		try {
			const res = await fetch(`/api/comments?workId=${workId}`);
			if (res.ok) {
				const data = await res.json();
				comments = data.filter((c: CommentItem) => c.comment);
			}
		} catch (e) {
			console.error('Failed to load comments', e);
		} finally {
			loadingComments = false;
		}
	}

	function getWorkImage(item: WorkItem): string {
		if (item.work.images && item.work.images.length > 0) {
			return item.work.images[0];
		}
		const prompt = encodeURIComponent(`${item.work.title} nail art design pink elegant`);
		return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`;
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	function renderStars(rating: number | null): string {
		if (!rating) return '';
		return '★'.repeat(rating) + '☆'.repeat(5 - rating);
	}

	let commentFormOpen = $state(false);
	let commentAuthor = $state('');
	let commentRating = $state(5);
	let commentContent = $state('');
	let commentSubmitting = $state(false);
	let commentSubmitMsg = $state('');

	function openCommentForm() {
		commentFormOpen = true;
		commentSubmitMsg = '';
	}

	function closeCommentForm() {
		commentFormOpen = false;
		commentAuthor = '';
		commentRating = 5;
		commentContent = '';
	}

	async function submitComment() {
		if (!selectedWork || !commentContent.trim() || !commentAuthor.trim()) return;
		commentSubmitting = true;
		commentSubmitMsg = '';
		try {
			const res = await fetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					workId: selectedWork.work.id,
					authorName: commentAuthor.trim(),
					content: commentContent.trim(),
					rating: commentRating
				})
			});
			if (res.ok) {
				commentSubmitMsg = '评论提交成功，等待审核后显示';
				setTimeout(() => {
					closeCommentForm();
				}, 1500);
			} else {
				commentSubmitMsg = '提交失败，请重试';
			}
		} catch (e) {
			console.error(e);
			commentSubmitMsg = '提交失败，请重试';
		} finally {
			commentSubmitting = false;
		}
	}
</script>

<section class="relative overflow-hidden">
	<div class="relative h-[50vh] min-h-[320px] max-h-[500px]">
		<img
			src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20nail%20salon%20interior%20pink%20gold%20luxury%20modern&image_size=landscape_16_9"
			alt="Miss Rose 美甲美睫"
			class="w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
		<div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
			<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
				🌹 Miss Rose 美甲美睫
			</h1>
			<p class="text-lg md:text-xl text-white/90 mb-8 max-w-2xl drop-shadow-md">
				指尖上的艺术，为您绽放独特之美
			</p>
			<a
				href="/booking"
				class="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300"
			>
				立即预约
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
				</svg>
			</a>
		</div>
	</div>
</section>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<div class="text-center mb-10">
		<h2 class="text-3xl font-bold text-gray-900 mb-2">作品展示</h2>
		<p class="text-gray-500">每一件作品，都是用心雕琢的艺术</p>
	</div>

	{#if allTags.length > 1}
		<div class="flex flex-wrap justify-center gap-2 mb-8">
			{#each allTags as tag}
				<button
					onclick={() => (selectedTag = tag)}
					class="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 {selectedTag === tag
						? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md shadow-primary/25'
						: 'bg-white text-gray-600 border border-pink-200 hover:border-primary hover:text-primary'}"
				>
					{tag}
				</button>
			{/each}
		</div>
	{/if}

	{#if loading}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each Array(6) as _}
				<div class="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
					<div class="aspect-square bg-pink-100"></div>
					<div class="p-4 space-y-3">
						<div class="h-4 bg-pink-100 rounded w-3/4"></div>
						<div class="h-3 bg-pink-50 rounded w-1/2"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredWorks.length === 0}
		<div class="text-center py-20">
			<span class="text-6xl mb-4 block">💅</span>
			<p class="text-gray-400 text-lg">暂无作品，敬请期待</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredWorks as item (item.work.id)}
				<button
					onclick={() => openDetail(item)}
					class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
				>
					<div class="aspect-square overflow-hidden relative">
						<img
							src={getWorkImage(item)}
							alt={item.work.title}
							class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
							loading="lazy"
						/>
						{#if item.work.tags && item.work.tags.length > 0}
							<div class="absolute top-3 left-3 flex flex-wrap gap-1">
								{#each item.work.tags.slice(0, 2) as tag}
									<span class="px-2 py-0.5 rounded-full bg-white/90 text-xs font-medium text-primary backdrop-blur-sm">
										{tag}
									</span>
								{/each}
							</div>
						{/if}
					</div>
					<div class="p-4">
						<h3 class="font-semibold text-gray-900 mb-2 truncate">{item.work.title}</h3>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								{#if item.technician?.avatar}
									<img src={item.technician.avatar} alt={item.technician.name} class="w-6 h-6 rounded-full object-cover" />
								{:else}
									<div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold">
										{item.technician?.name?.[0] ?? '?'}
									</div>
								{/if}
								<span class="text-sm text-gray-500">{item.technician?.name ?? '未知'}</span>
							</div>
							<div class="flex items-center gap-1 text-pink-400">
								<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
									<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
								</svg>
								<span class="text-xs">{likeMap[item.work.id] ?? 0}</span>
							</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</section>

{#if selectedWork}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" role="button" aria-label="关闭" onclick={closeDetail}></div>
		<div class="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
			<button
				onclick={closeDetail}
				aria-label="关闭详情"
				class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:text-primary hover:bg-white transition-colors"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<div class="overflow-y-auto">
				<div class="relative bg-gray-100">
					{#if selectedWork.work.images && selectedWork.work.images.length > 0}
						<div class="relative aspect-[4/3]">
							<img
								src={selectedWork.work.images[carouselIndex]}
								alt={selectedWork.work.title}
								class="w-full h-full object-cover"
							/>
							{#if selectedWork.work.images.length > 1}
								{#if carouselIndex > 0}
									<button
										onclick={() => (carouselIndex = carouselIndex - 1)}
										aria-label="上一张"
										class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
									>
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
									</button>
								{/if}
								{#if carouselIndex < selectedWork.work.images.length - 1}
									<button
										onclick={() => (carouselIndex = carouselIndex + 1)}
										aria-label="下一张"
										class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
									>
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
									</button>
								{/if}
								<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
									{#each selectedWork.work.images as _, i}
										<button
											onclick={() => (carouselIndex = i)}
											aria-label="查看第{i + 1}张图片"
											class="w-2 h-2 rounded-full transition-all {carouselIndex === i ? 'bg-white w-6' : 'bg-white/50'}"
										></button>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100">
							<span class="text-6xl">💅</span>
						</div>
					{/if}
				</div>

				<div class="p-6">
					<div class="flex items-start justify-between mb-4">
						<div>
							<h2 class="text-xl font-bold text-gray-900 mb-1">{selectedWork.work.title}</h2>
							<div class="flex items-center gap-2 text-sm text-gray-500">
								{#if selectedWork.technician?.avatar}
									<img src={selectedWork.technician.avatar} alt="" class="w-5 h-5 rounded-full object-cover" />
								{/if}
								<span>{selectedWork.technician?.name ?? '未知'}</span>
								<span>·</span>
								<span>{formatDate(selectedWork.work.publishedAt ?? selectedWork.work.createdAt)}</span>
							</div>
						</div>
					</div>

					{#if selectedWork.work.tags && selectedWork.work.tags.length > 0}
						<div class="flex flex-wrap gap-1.5 mb-4">
							{#each selectedWork.work.tags as tag}
								<span class="px-2.5 py-1 rounded-full bg-pink-50 text-primary text-xs font-medium">{tag}</span>
							{/each}
						</div>
					{/if}

					{#if selectedWork.work.description}
						<p class="text-gray-600 leading-relaxed mb-6">{selectedWork.work.description}</p>
					{/if}

					<div class="border-t border-pink-100 pt-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold text-gray-900">
								评论 ({comments.length})
							</h3>
							{#if !commentFormOpen}
								<button
									onclick={openCommentForm}
									class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all"
								>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
									发表评论
								</button>
							{/if}
						</div>

						{#if commentFormOpen}
							<div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-5 mb-6 border border-pink-200/50">
								<div class="flex items-start justify-between mb-4">
									<h4 class="font-semibold text-gray-800">发表您的评论</h4>
									<button
										onclick={closeCommentForm}
										class="text-gray-400 hover:text-gray-600 transition-colors"
										aria-label="关闭"
									>
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
									</button>
								</div>
								<div class="space-y-4">
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1.5">您的昵称 <span class="text-red-400">*</span></label>
											<input
												type="text"
												bind:value={commentAuthor}
												placeholder="请输入昵称"
												class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
											/>
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1.5">评分</label>
											<div class="flex items-center gap-1 h-[42px] px-2">
												{#each [1, 2, 3, 4, 5] as star}
													<button
														type="button"
														onclick={() => (commentRating = star)}
														class="text-2xl transition-transform hover:scale-110 {star <= commentRating ? 'text-amber-400' : 'text-gray-300'}"
														aria-label={`${star}星`}
													>
														★
													</button>
												{/each}
												<span class="ml-2 text-sm text-gray-500">{commentRating}/5</span>
											</div>
										</div>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1.5">评论内容 <span class="text-red-400">*</span></label>
										<textarea
											bind:value={commentContent}
											rows="3"
											placeholder="分享您对这件作品的看法..."
											class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
										></textarea>
									</div>
									{#if commentSubmitMsg}
										<p class="text-sm {commentSubmitMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}">{commentSubmitMsg}</p>
									{/if}
									<div class="flex items-center justify-end gap-3">
										<button
											onclick={closeCommentForm}
											class="px-5 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-white hover:text-gray-800 transition-all"
										>
											取消
										</button>
										<button
											onclick={submitComment}
											disabled={commentSubmitting || !commentAuthor.trim() || !commentContent.trim()}
											class="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
										>
											{commentSubmitting ? '提交中...' : '提交评论'}
										</button>
									</div>
								</div>
							</div>
						{/if}

						{#if loadingComments}
							<div class="space-y-3">
								{#each Array(2) as _}
									<div class="animate-pulse">
										<div class="h-3 bg-pink-50 rounded w-1/4 mb-2"></div>
										<div class="h-3 bg-pink-50 rounded w-full"></div>
									</div>
								{/each}
							</div>
						{:else if comments.length === 0}
							<p class="text-gray-400 text-sm text-center py-4">暂无评论</p>
						{:else}
							<div class="space-y-4">
								{#each comments as item}
									<div class="bg-pink-50/50 rounded-xl p-4">
										<div class="flex items-center justify-between mb-2">
											<div class="flex items-center gap-2">
												<div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold">
													{(item.comment.authorName ?? item.customer?.name ?? '?')[0]}
												</div>
												<span class="text-sm font-medium text-gray-700">{item.comment.authorName ?? item.customer?.name ?? '匿名'}</span>
											</div>
											{#if item.comment.rating}
												<span class="text-amber-400 text-sm">{renderStars(item.comment.rating)}</span>
											{/if}
										</div>
										<p class="text-sm text-gray-600">{item.comment.content}</p>
										<p class="text-xs text-gray-400 mt-2">{formatDate(item.comment.createdAt)}</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
