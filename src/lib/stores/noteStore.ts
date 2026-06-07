import { writable, derived } from 'svelte/store';
import type { Note, DimensionType } from '@/lib/types';

const STORAGE_KEY = 'csbot_analytics_notes';

function loadNotes(): Note[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function saveNotes(notes: Note[]) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

const initialNotes = loadNotes();

function createNoteStore() {
	const { subscribe, set, update } = writable<Note[]>(initialNotes);

	return {
		subscribe,
		addNote: (dimension: DimensionType, dimensionValue: string, content: string) => {
			const note: Note = {
				id: `note_${Date.now()}`,
				dimension,
				dimensionValue,
				content,
				createdAt: Date.now(),
				createdBy: '当前用户'
			};
			update((notes) => {
				const updated = [...notes, note];
				saveNotes(updated);
				return updated;
			});
			return note;
		},
		deleteNote: (id: string) => {
			update((notes) => {
				const updated = notes.filter((n) => n.id !== id);
				saveNotes(updated);
				return updated;
			});
		},
		getNotesForDimension: (dimension: DimensionType, dimensionValue: string) => {
			return derived({ subscribe }, ($notes) =>
				$notes.filter((n) => n.dimension === dimension && n.dimensionValue === dimensionValue)
			);
		},
		hasNote: (dimension: DimensionType, dimensionValue: string) => {
			return derived({ subscribe }, ($notes) =>
				$notes.some((n) => n.dimension === dimension && n.dimensionValue === dimensionValue)
			);
		}
	};
}

export const noteStore = createNoteStore();
