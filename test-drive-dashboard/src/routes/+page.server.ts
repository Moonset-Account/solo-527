import type { PageServerLoad } from './$types.js';
import { getFilterOptions, getFunnelData, getCancellationDetails, getSalesLoad, getConversionData } from '$lib/server/services.js';

export const load: PageServerLoad = async () => {
  const filterOptions = await getFilterOptions();
  const funnelData = await getFunnelData({});
  const cancellationData = await getCancellationDetails({});
  const salesLoadData = await getSalesLoad({});
  const conversionData = await getConversionData({});

  return {
    filterOptions,
    initialData: {
      funnel: funnelData,
      cancellation: cancellationData,
      salesLoad: salesLoadData,
      conversion: conversionData
    }
  };
};
