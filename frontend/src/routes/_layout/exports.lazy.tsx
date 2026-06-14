import { createFileRoute } from '@tanstack/react-router';
import ExportsPage from '@/pages/exports';

export const Route = createFileRoute('/_layout/exports')({
  component: ExportsPage,
});
