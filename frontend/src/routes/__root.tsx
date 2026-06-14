import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RootRoute,
});

function RootRoute() {
  return <Outlet />;
}
