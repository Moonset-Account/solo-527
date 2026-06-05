'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types';

const roleDashboard: Record<UserRole, string> = {
  admin: '/admin',
  captain: '/captain',
  referee: '/referee',
  viewer: '/standings',
};

export default function RegisterPage() {
  const router = useRouter();
  const { hydrate } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('captain');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '注册失败');
      }
      router.push('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#1B5E20] rounded-full flex items-center justify-center mb-4">
              <UserPlus size={32} className="text-[#F9A825]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1B5E20]">注册账号</h1>
            <p className="text-sm text-gray-500 mt-1">加入业余联赛管理系统</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#D32F2F] px-4 py-3 rounded-lg mb-6 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="姓名" placeholder="请输入姓名" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-[38px] text-gray-400" />
              <Input label="邮箱" type="email" placeholder="请输入邮箱" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-[38px] text-gray-400" />
              <Input label="密码" type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10" />
            </div>
            <Select
              label="角色"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: 'captain', label: '领队' },
                { value: 'referee', label: '裁判' },
              ]}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              注册
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              已有账号？{' '}
              <Link href="/login" className="text-[#1B5E20] font-medium hover:underline">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
