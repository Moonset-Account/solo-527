import { mockExceptions } from '$lib/mock-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  let exceptions = mockExceptions;

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
    exceptions
  };
};
