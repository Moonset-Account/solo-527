import { createFileRoute } from '@tanstack/react-router';
import WorkOrdersPage from '@/pages/work-orders';

export const Route = createFileRoute('/_layout/work-orders')({
  component: WorkOrdersPage,
});
