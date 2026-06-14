import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/dashboard')({
  beforeLoad: () => {},
});

export default function DashboardIndex() {
  return <DashboardPage />;
}

import DashboardPage from '@/pages/dashboard';
