import PricingClientView from './pricing-client-view';
import {
  getPlans,
  getSubscriptionByUser,
  getInvoicesByUser,
  getChangeLogs,
  isUsingMock,
  DEFAULT_USER_ID,
} from '@/lib/services';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const [plans, subscription, invoiceData] = await Promise.all([
    getPlans('ACTIVE'),
    getSubscriptionByUser(DEFAULT_USER_ID),
    getInvoicesByUser(DEFAULT_USER_ID, { page: 1, pageSize: 3 }),
  ]);

  const changeLogs = subscription?.id
    ? await getChangeLogs(subscription.id)
    : [];
  const recentChange = changeLogs[0] || null;
  const latestInvoice = invoiceData.invoices[0] || null;
  const mockMode = isUsingMock();

  return (
    <PricingClientView
      initialPlans={plans}
      initialSubscription={subscription}
      initialLatestInvoice={latestInvoice}
      initialRecentChange={recentChange}
      mockMode={mockMode}
    />
  );
}
