import { json } from '@sveltejs/kit';
import { getHeatmapData } from '$lib/server/duckdb';

export async function GET({ url }) {
  const filters = {};
  
  const anchorIds = url.searchParams.get('anchorIds');
  if (anchorIds) filters.anchorIds = anchorIds.split(',');
  
  const productIds = url.searchParams.get('productIds');
  if (productIds) filters.productIds = productIds.split(',');
  
  const timeSlots = url.searchParams.get('timeSlots');
  if (timeSlots) filters.timeSlots = timeSlots.split(',');
  
  const activityIds = url.searchParams.get('activityIds');
  if (activityIds) filters.activityIds = activityIds.split(',');
  
  const productType = url.searchParams.get('productType');
  if (productType) filters.productType = productType;
  
  const sources = url.searchParams.get('sources');
  if (sources) filters.sources = sources.split(',');
  
  const data = await getHeatmapData(filters);
  return json(data);
}
