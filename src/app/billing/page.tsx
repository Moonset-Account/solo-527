import BillingClientView from './billing-client-view';
import { getBillingPageData, DEFAULT_USER_ID, getChangeLogs } from '@/lib/services';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const data = await getBillingPageData(DEFAULT_USER_ID);
  const changeLogs = data.subscription?.id
    ? await getChangeLogs(data.subscription.id)
    : [];

  return (
    <BillingClientView
      initialInvoices={data.invoices}
      stats={data.stats}
      subscription={data.subscription}
      changeLogs={changeLogs.slice(0, 5)}
    />
  );
}
