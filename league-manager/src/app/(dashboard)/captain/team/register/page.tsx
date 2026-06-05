'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/auth';

type Step = 1 | 2 | 3;

export default function TeamRegisterPage() {
  const router = useRouter();
  const { authHeaders } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [teamName, setTeamName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [players, setPlayers] = useState<{ name: string; jerseyNumber: string; position: string }[]>([
    { name: '', jerseyNumber: '', position: '' },
  ]);

  const addPlayer = () => {
    setPlayers([...players, { name: '', jerseyNumber: '', position: '' }]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: string, value: string) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  const canNext = () => {
    if (step === 1) return teamName.trim() && contact.trim() && phone.trim();
    if (step === 2) return players.some((p) => p.name.trim());
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: teamName,
          contact,
          phone,
          players: players.filter((p) => p.name.trim()),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '注册失败');
      }
      router.push('/captain/team');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: '球队信息' },
    { num: 2, label: '球员名单' },
    { num: 3, label: '确认提交' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">球队报名</h1>

        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s.num ? 'bg-[#1B5E20] text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? <CheckCircle size={16} /> : s.num}
                </div>
                <span className={`text-sm font-medium ${step >= s.num ? 'text-[#1B5E20]' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-[#1B5E20]' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">填写球队信息</h2>
              <Input label="球队名称" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="请输入球队名称" required />
              <Input label="领队姓名" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="请输入领队姓名" required />
              <Input label="联系电话" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入联系电话" required />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">添加球员</h2>
              {players.map((p, i) => (
                <div key={i} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Input label="姓名" value={p.name} onChange={(e) => updatePlayer(i, 'name', e.target.value)} placeholder="球员姓名" />
                  </div>
                  <div className="w-24">
                    <Input label="号码" value={p.jerseyNumber} onChange={(e) => updatePlayer(i, 'jerseyNumber', e.target.value)} placeholder="10" />
                  </div>
                  <div className="w-28">
                    <Select
                      label="位置"
                      value={p.position}
                      onChange={(e) => updatePlayer(i, 'position', e.target.value)}
                      options={[
                        { value: '', label: '选择' },
                        { value: 'GK', label: '门将' },
                        { value: 'DEF', label: '后卫' },
                        { value: 'MID', label: '中场' },
                        { value: 'FWD', label: '前锋' },
                      ]}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removePlayer(i)}
                    disabled={players.length <= 1}
                    className="mb-0.5"
                  >
                    删除
                  </Button>
                </div>
              ))}
              <Button variant="ghost" onClick={addPlayer}>+ 添加球员</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">确认信息</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="text-gray-500">球队名称:</span> <span className="font-medium">{teamName}</span></p>
                <p><span className="text-gray-500">领队:</span> <span className="font-medium">{contact}</span></p>
                <p><span className="text-gray-500">联系电话:</span> <span className="font-medium">{phone}</span></p>
                <p><span className="text-gray-500">球员人数:</span> <span className="font-medium">{players.filter((p) => p.name.trim()).length} 人</span></p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 text-left">姓名</th>
                      <th className="py-2 text-left">号码</th>
                      <th className="py-2 text-left">位置</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.filter((p) => p.name.trim()).map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2">{p.jerseyNumber || '-'}</td>
                        <td className="py-2">{p.position || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-[#D32F2F]">{error}</div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep((step - 1) as Step)}>
                <ArrowLeft size={16} className="mr-1" /> 上一步
              </Button>
            ) : <div />}
            {step < 3 ? (
              <Button onClick={() => setStep((step + 1) as Step)} disabled={!canNext()}>
                下一步 <ArrowRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting}>
                <Send size={16} className="mr-1" /> 提交报名
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
