'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
};

const defaultUser: CurrentUser = {
  id: 'user-1',
  name: '张法务',
  email: 'legal@example.com',
  role: 'LEGAL_MANAGER',
  roleLabel: '法务负责人',
};

const UserContext = createContext<{
  user: CurrentUser;
  setUser: (user: CurrentUser) => void;
}>({
  user: defaultUser,
  setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(defaultUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}
