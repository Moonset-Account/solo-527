export const load = async ({ url }) => {
  const role = (url.searchParams.get('role') as 'host' | 'operator') || 'host';
  return { role };
};
