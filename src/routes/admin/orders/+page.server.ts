import { mockOrders } from '$lib/mock-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  let orders = mockOrders;

  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        orders = json.data;
      }
    }
  } catch {}

  return {
    orders
  };
};
