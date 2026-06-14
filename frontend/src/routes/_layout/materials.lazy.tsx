import { createFileRoute } from '@tanstack/react-router';
import MaterialsPage from '@/pages/materials';

export const Route = createFileRoute('/_layout/materials')({
  component: MaterialsPage,
});
