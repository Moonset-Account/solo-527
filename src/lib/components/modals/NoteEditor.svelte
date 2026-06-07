<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import type { DimensionType, Note } from '@/lib/types';
	import { noteStore } from '@/lib/stores/noteStore';
	import { X, Send } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let dimension: DimensionType;
	export let dimensionValue: string;

	let newNote = '';
	let notes: Note[] = [];
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		unsubscribe = noteStore.subscribe((allNotes) => {
			notes = allNotes.filter(
				(n) => n.dimension === dimension && n.dimensionValue === dimensionValue
			);
		});
	});

	onDestroy(() => {
		unsubscribe?.();
	});

	function addNote() {
		if (!newNote.trim()) return;
		noteStore.addNote(dimension, dimensionValue, newNote.trim());
		newNote = '';
	}

	function deleteNote(id: string) {
		noteStore.deleteNote(id);
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString('zh-CN');
	}
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-xl shadow-xl w-full max-w-lg animate-scale-in">
		<div class="flex items-center justify-between p-4 border-b border-slate-200">
			<h3 class="text-lg font-semibold text-slate-900">
				添加备注 - {dimensionValue}
			</h3>
			<button
				class="text-slate-400 hover:text-slate-600 p-1"
				onclick={() => dispatch('close')}
			>
				<X class="w-5 h-5" />
			</button>
		</div>

		<div class="p-4">
			<div class="flex gap-2 mb-4">
				<textarea
					bind:value={newNote}
					placeholder="输入备注内容..."
					class="input flex-1 min-h-[80px] resize-none"
					onkeydown={(e) => {
						if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
							addNote();
						}
					}}
				/>
				<button
					class="btn btn-primary self-end flex items-center gap-1"
					onclick={addNote}
					disabled={!newNote.trim()}
				>
					<Send class="w-4 h-4" />
					发送
				</button>
			</div>

			<div class="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
				{#if notes.length === 0}
					<p class="text-center text-slate-400 py-6">暂无备注</p>
				{:else}
					{#each notes as note}
						<div class="bg-slate-50 rounded-lg p-3">
							<div class="flex items-start justify-between mb-2">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-slate-700">{note.createdBy}</span>
									<span class="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
								</div>
								<button
									class="text-slate-400 hover:text-red-500 text-xs"
									onclick={() => deleteNote(note.id)}
								>
									删除
								</button>
							</div>
							<p class="text-sm text-slate-600">{note.content}</p>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
