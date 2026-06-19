'use client';

import { AppShell } from './AppShell';

export default function ShellProvider({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
