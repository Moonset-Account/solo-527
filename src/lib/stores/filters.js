import { writable, derived } from 'svelte/store';

export const filters = writable({
  anchorIds: [],
  productIds: [],
  timeSlots: [],
  activityIds: [],
  sources: [],
  productType: null
});

export const filterQueryString = derived(filters, ($filters) => {
  const params = new URLSearchParams();
  if ($filters.anchorIds.length > 0) params.set('anchorIds', $filters.anchorIds.join(','));
  if ($filters.productIds.length > 0) params.set('productIds', $filters.productIds.join(','));
  if ($filters.timeSlots.length > 0) params.set('timeSlots', $filters.timeSlots.join(','));
  if ($filters.activityIds.length > 0) params.set('activityIds', $filters.activityIds.join(','));
  if ($filters.sources.length > 0) params.set('sources', $filters.sources.join(','));
  if ($filters.productType) params.set('productType', $filters.productType);
  return params.toString();
});

export function updateFilters(newFilters) {
  filters.update(current => ({ ...current, ...newFilters }));
}

export function resetFilters() {
  filters.set({
    anchorIds: [],
    productIds: [],
    timeSlots: [],
    activityIds: [],
    sources: [],
    productType: null
  });
}
