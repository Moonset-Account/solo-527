'use client';

import { useState, useEffect } from 'react';
import { CurrentUser, getMockUsers, getCurrentUser, setCurrentUser, getUserRoleLabel } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export default function UserSwitcher() {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentUserState(getCurrentUser());
  }, []);

  const handleSwitchUser = (userId: string) => {
    setCurrentUser(userId);
    setCurrentUserState(getCurrentUser());
    setIsOpen(false);
    window.location.reload();
  };

  if (!currentUser) return null;

  const mockUsers = getMockUsers();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm hover:text-primary-600 transition-colors"
      >
        <div className="text-right">
          <p className="font-medium text-gray-700">{currentUser.name}</p>
          <p className="text-xs text-gray-500">{getUserRoleLabel(currentUser.role)}</p>
        </div>
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-primary-600 font-medium text-sm">
            {currentUser.name.charAt(0)}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <p className="text-xs font-medium text-gray-500">切换用户身份（演示用）</p>
            </div>
            <div className="py-1">
              {mockUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSwitchUser(user.id)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                    currentUser.id === user.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`badge ${
                    user.role === 'ADMIN' ? 'badge-danger' :
                    user.role === 'RECEPTIONIST' ? 'badge-info' : 'badge-secondary'
                  }`}>
                    {getUserRoleLabel(user.role as UserRole)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
