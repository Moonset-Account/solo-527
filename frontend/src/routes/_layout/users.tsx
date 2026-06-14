import { createFileRoute } from '@tanstack/react-router';
import UsersPage from '@/pages/users';

export const Route = createFileRoute('/_layout/users')({
  component: UsersPage,
});
