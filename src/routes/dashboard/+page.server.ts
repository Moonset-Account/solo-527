import { error } from '@sveltejs/kit';
import { mockUsers, mockSubscriptions, mockTodos, mockExceptions } from '$lib/mock-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  let users = mockUsers;
  let subscriptions = mockSubscriptions;
  let todos = mockTodos;
  let exceptions = mockExceptions;

  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        users = json.data;
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/subscriptions');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        subscriptions = json.data;
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/todos');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        todos = json.data;
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/exceptions');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        exceptions = json.data;
      }
    }
  } catch {}

  return {
    users,
    subscriptions,
    todos,
    exceptions
  };
};
