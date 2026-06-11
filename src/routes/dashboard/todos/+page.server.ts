import { mockTodos } from '$lib/mock-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  let todos = mockTodos;

  try {
    const res = await fetch('/api/todos');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        todos = json.data;
      }
    }
  } catch {}

  return {
    todos
  };
};
