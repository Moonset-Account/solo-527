import { writable, derived } from 'svelte/store';
import type { User } from './types';
import { mockUsers } from './mock-data';

export const currentUser = writable<User>(mockUsers[0]);

export const currentRole = derived(currentUser, (u) => u.role);
