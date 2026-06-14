import { createFileRoute } from '@tanstack/react-router';
import ReworksPage from '@/pages/reworks';

export const Route = createFileRoute('/_layout/reworks')({
  component: ReworksPage,
});
