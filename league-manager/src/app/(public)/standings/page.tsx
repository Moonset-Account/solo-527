'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import type { IStanding, ISeason, ITeam } from '@/types';

interface StandingWithTeam extends IStanding {
  teamName?: string;
}

export default function PublicStandingsPage() {
  const [seasons, setSeasons] = useState<ISeason[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [standings, setStandings] = useState<StandingWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await fetch('/api/seasons');
        if (res.ok) {
          const data = await res.json();
          setSeasons(data.data || []);
          if (data.data?.length > 0) {
            const active = data.data.find((s: ISeason) => s.status === 'active');
            setSeasonId(active?._id || data.data[0]._id);
          }
        }
      } catch {}
    };
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    const fetchStandings = async () => {
      setLoading(true);
      try {
        const [standingsRes, teamsRes] = await Promise.all([
          fetch(`/api/standings?seasonId=${seasonId}`),
          fetch('/api/teams?status=approved'),
        ]);
        let standingList: StandingWithTeam[] = [];
        if (standingsRes.ok) {
          const data = await standingsRes.json();
          standingList = data.data || [];
        }
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          const teamMap: Record<string, string> = {};
          (teamsData.data || []).forEach((t: ITeam) => { teamMap[t._id] = t.name; });
          standingList = standingList.map((s) => ({ ...s, teamName: teamMap[s.teamId] || s.teamId }));
        }
        standingList.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
        setStandings(standingList);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [seasonId]);

  const rankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900 font-bold';
    if (rank === 2) return 'bg-gray-300 text-gray-700 font-bold';
    if (rank === 3) return 'bg-amber-600 text-white font-bold';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1B5E20] text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Trophy size={24} className="text-[#F9A825]" />
            <span className="font-bold text-lg">业余联赛管理系统</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/schedule" className="text-sm text-white/80 hover:text-white">赛程</Link>
            <Link href="/login" className="text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30">登录</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Medal size={24} className="text-[#F9A825]" /> 积分榜
          </h1>
          <div className="w-48">
            <Select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              options={seasons.map((s) => ({ value: s._id, label: s.name }))}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : standings.length === 0 ? (
          <EmptyState title="暂无积分数据" />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1B5E20] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase w-16">排名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">球队</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-12">赛</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-12">胜</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-12">平</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-12">负</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-12">进</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-12">失</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-12">净</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-16">积分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standings.map((s, i) => {
                  const rank = i + 1;
                  const gd = s.goalsFor - s.goalsAgainst;
                  return (
                    <tr key={s._id} className={`hover:bg-gray-50 ${rank <= 3 ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${rankStyle(rank)}`}>
                          {rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.teamName || s.teamId}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{s.played}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{s.won}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{s.drawn}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{s.lost}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{s.goalsFor}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{s.goalsAgainst}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium">{gd > 0 ? `+${gd}` : gd}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-[#1B5E20] text-lg">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-gray-400">
        © 2024 业余联赛管理系统
      </footer>
    </div>
  );
}
