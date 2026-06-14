import { createFileRoute } from '@tanstack/react-router';
import TimelinePage from '@/pages/timeline';

export const Route = createFileRoute('/_layout/timeline')({
  component: TimelinePage,
});
