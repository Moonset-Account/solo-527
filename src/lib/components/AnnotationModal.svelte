<script lang="ts">
	import { X, Send } from 'lucide-svelte';
	import { insertAnnotation } from '$lib/duckdb-service';

	let { taskId, onClose }: { taskId: string; onClose: () => void } = $props();
	let content = $state('');
	let author = $state('园林主管');
	let saving = $state(false);
	let notes: { id: string; content: string; author: string; created_at: string }[] = $state([]);
	let loaded = $state(false);

	async function save() {
		if (!content.trim()) return;
		saving = true;
		try {
			await insertAnnotation(taskId, content.trim(), author.trim());
			notes.unshift({
				id: `A${Date.now()}`,
				content: content.trim(),
				author: author.trim(),
				created_at: new Date().toISOString()
			});
			content = '';
		} finally {
			saving = false;
		}
	}

	async function loadNotes() {
		const { queryAnnotations } = await import('$lib/duckdb-service');
		notes = (await queryAnnotations(taskId)).map((n: any) => ({
			id: n.id,
			content: n.content,
			author: n.author,
			created_at: n.created_at?.toString() || ''
		}));
		loaded = true;
	}

	$effect(() => {
		if (taskId && !loaded) loadNotes();
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
	}
</script>

{#if taskId}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick={onClose}>
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between p-4 border-b border-gray-100">
				<div>
					<h3 class="text-sm font-semibold text-[#1B4332]">人工备注</h3>
					<p class="text-xs text-gray-400 mt-0.5">任务编号: {taskId}</p>
				</div>
				<button onclick={onClose} class="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
					<X size={18} class="text-gray-500" />
				</button>
			</div>

			<div class="p-4 space-y-3 max-h-60 overflow-y-auto">
				{#if notes.length === 0}
					<p class="text-xs text-gray-400 text-center py-4">暂无备注</p>
				{:else}
					{#each notes as note}
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="flex items-center justify-between mb-1">
								<span class="text-xs font-medium text-gray-700">{note.author}</span>
								<span class="text-[10px] text-gray-400">{note.created_at.slice(0, 16)}</span>
							</div>
							<p class="text-xs text-gray-600">{note.content}</p>
						</div>
					{/each}
				{/if}
			</div>

			<div class="p-4 border-t border-gray-100">
				<input
					type="text"
					bind:value={author}
					placeholder="备注人"
					class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mb-2"
				/>
				<div class="flex gap-2">
					<textarea
						bind:value={content}
						onkeydown={handleKeydown}
						placeholder="输入备注内容（Ctrl+Enter 保存）"
						class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none h-16"
					></textarea>
					<button
						onclick={save}
						disabled={saving || !content.trim()}
						class="px-4 py-2 bg-[#1B4332] text-white rounded-lg text-xs font-medium hover:bg-[#40916C] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
					>
						<Send size={12} />
						保存
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
