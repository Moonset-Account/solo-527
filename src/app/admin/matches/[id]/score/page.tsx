'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Save,
  Hash,
  User,
  ChevronUp,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface PlayerStat {
  playerId: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
  minutesPlayed: number;
  isStarter: boolean;
}

interface MatchInfo {
  _id: string;
  homeTeamName: string;
  awayTeamName: string;
  round: number;
  startTime: Date;
  venueName: string;
}

const mockMatch: MatchInfo = {
  _id: 'm1',
  homeTeamName: '猛虎队',
  awayTeamName: '飞鹰队',
  round: 1,
  startTime: new Date('2024-01-20T19:00:00'),
  venueName: '首都体育馆',
};

const mockHomePlayers: PlayerStat[] = [
  { playerId: 'hp1', teamId: 'home_team_id', name: '张小明', jerseyNumber: 1, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'hp2', teamId: 'home_team_id', name: '李大伟', jerseyNumber: 3, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'hp3', teamId: 'home_team_id', name: '王强', jerseyNumber: 5, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'hp4', teamId: 'home_team_id', name: '赵磊', jerseyNumber: 7, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'hp5', teamId: 'home_team_id', name: '孙浩', jerseyNumber: 11, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'hp6', teamId: 'home_team_id', name: '周杰', jerseyNumber: 9, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: false },
  { playerId: 'hp7', teamId: 'home_team_id', name: '吴涛', jerseyNumber: 13, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: false },
];

const mockAwayPlayers: PlayerStat[] = [
  { playerId: 'ap1', teamId: 'away_team_id', name: '陈华', jerseyNumber: 2, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'ap2', teamId: 'away_team_id', name: '林峰', jerseyNumber: 4, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'ap3', teamId: 'away_team_id', name: '黄强', jerseyNumber: 6, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'ap4', teamId: 'away_team_id', name: '杨勇', jerseyNumber: 8, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'ap5', teamId: 'away_team_id', name: '周明', jerseyNumber: 10, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: true },
  { playerId: 'ap6', teamId: 'away_team_id', name: '吴亮', jerseyNumber: 12, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, turnovers: 0, minutesPlayed: 0, isStarter: false },
];

const statFields = [
  { key: 'points', label: '得分' },
  { key: 'rebounds', label: '篮板' },
  { key: 'assists', label: '助攻' },
  { key: 'steals', label: '抢断' },
  { key: 'blocks', label: '盖帽' },
  { key: 'fouls', label: '犯规' },
  { key: 'turnovers', label: '失误' },
];

export default function MatchScorePage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<MatchInfo>(mockMatch);
  const [homeScore, setHomeScore] = useState({ total: 0, q1: 0, q2: 0, q3: 0, q4: 0 });
  const [awayScore, setAwayScore] = useState({ total: 0, q1: 0, q2: 0, q3: 0, q4: 0 });
  const [homePlayers, setHomePlayers] = useState<PlayerStat[]>(mockHomePlayers);
  const [awayPlayers, setAwayPlayers] = useState<PlayerStat[]>(mockAwayPlayers);
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');

  useEffect(() => {
    fetchMatchData();
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMatch(data.data);
      }
    } catch (error) {
      console.error('获取比赛信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerStat = (
    team: 'home' | 'away',
    playerId: string,
    field: keyof PlayerStat,
    value: number
  ) => {
    const setPlayers = team === 'home' ? setHomePlayers : setAwayPlayers;
    setPlayers((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, [field]: value } : p))
    );
  };

  const incrementStat = (
    team: 'home' | 'away',
    playerId: string,
    field: keyof PlayerStat
  ) => {
    const players = team === 'home' ? homePlayers : awayPlayers;
    const player = players.find((p) => p.playerId === playerId);
    if (player) {
      const currentValue = (player[field] as number) || 0;
      let maxValue = Infinity;
      if (field === 'fouls') maxValue = 6;
      if (field === 'minutesPlayed') maxValue = 48;
      updatePlayerStat(team, playerId, field, Math.min(currentValue + 1, maxValue));
    }
  };

  const decrementStat = (
    team: 'home' | 'away',
    playerId: string,
    field: keyof PlayerStat
  ) => {
    const players = team === 'home' ? homePlayers : awayPlayers;
    const player = players.find((p) => p.playerId === playerId);
    if (player) {
      const currentValue = (player[field] as number) || 0;
      updatePlayerStat(team, playerId, field, Math.max(currentValue - 1, 0));
    }
  };

  const calculateTotalFromQuarters = (quarters: { q1: number; q2: number; q3: number; q4: number }) => {
    return quarters.q1 + quarters.q2 + quarters.q3 + quarters.q4;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const homeTotal = calculateTotalFromQuarters(homeScore);
      const awayTotal = calculateTotalFromQuarters(awayScore);

      await fetch(`/api/matches/${matchId}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: homeTotal,
          awayScore: awayTotal,
          quarterScores: [
            [homeScore.q1, awayScore.q1],
            [homeScore.q2, awayScore.q2],
            [homeScore.q3, awayScore.q3],
            [homeScore.q4, awayScore.q4],
          ],
          status: 'FINISHED',
        }),
      });

      const allStats = [...homePlayers, ...awayPlayers].map(p => ({
        playerId: p.playerId,
        teamId: p.teamId,
        points: p.points,
        rebounds: p.rebounds,
        assists: p.assists,
        steals: p.steals,
        blocks: p.blocks,
        fouls: p.fouls,
        turnovers: p.turnovers,
        minutesPlayed: p.minutesPlayed,
        isStarter: p.isStarter,
      }));

      await fetch(`/api/matches/${matchId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allStats),
      });

      router.push('/admin');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="skeleton h-8 w-1/3 mx-auto mb-6 rounded" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="skeleton h-20 rounded-lg" />
            <div className="skeleton h-20 rounded-lg" />
            <div className="skeleton h-20 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回管理后台
        </Link>
        <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
          <Trophy className="w-8 h-8 text-secondary" />
          比分录入
        </h1>
      </div>

      <div className="bg-gradient-hero rounded-xl p-6 text-white mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-white/70 text-sm mb-1">第{match.round}轮</p>
            <h2 className="text-2xl font-bold">
              {match.homeTeamName} vs {match.awayTeamName}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(match.startTime).toLocaleDateString('zh-CN')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {match.venueName}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h3 className="font-bold text-text-primary mb-4">四节比分</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-sm font-medium text-text-secondary">球队</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-text-secondary">第1节</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-text-secondary">第2节</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-text-secondary">第3节</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-text-secondary">第4节</th>
                <th className="text-center py-2 px-3 text-sm font-bold text-text-primary">总分</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 px-3">
                  <span className="font-medium text-text-primary">{match.homeTeamName}</span>
                </td>
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                  <td key={q} className="py-3 px-3">
                    <input
                      type="number"
                      min="0"
                      value={homeScore[q]}
                      onChange={(e) =>
                        setHomeScore((prev) => ({
                          ...prev,
                          [q]: parseInt(e.target.value) || 0,
                          total: calculateTotalFromQuarters({
                            ...prev,
                            [q]: parseInt(e.target.value) || 0,
                          }),
                        }))
                      }
                      className="w-14 px-2 py-1.5 text-center bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                  </td>
                ))}
                <td className="py-3 px-3 text-center">
                  <span className="text-xl font-bold text-primary">
                    {calculateTotalFromQuarters(homeScore)}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="font-medium text-text-primary">{match.awayTeamName}</span>
                </td>
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                  <td key={q} className="py-3 px-3">
                    <input
                      type="number"
                      min="0"
                      value={awayScore[q]}
                      onChange={(e) =>
                        setAwayScore((prev) => ({
                          ...prev,
                          [q]: parseInt(e.target.value) || 0,
                          total: calculateTotalFromQuarters({
                            ...prev,
                            [q]: parseInt(e.target.value) || 0,
                          }),
                        }))
                      }
                      className="w-14 px-2 py-1.5 text-center bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                  </td>
                ))}
                <td className="py-3 px-3 text-center">
                  <span className="text-xl font-bold text-secondary">
                    {calculateTotalFromQuarters(awayScore)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === 'home'
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {match.homeTeamName} 技术统计
            {activeTab === 'home' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('away')}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === 'away'
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {match.awayTeamName} 技术统计
            {activeTab === 'away' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-surface-hover border-b border-border">
                <th className="text-left py-3 px-3 text-sm font-medium text-text-secondary sticky left-0 bg-surface-hover z-10">球员</th>
                {statFields.map((field) => (
                  <th key={field.key} className="text-center py-3 px-2 text-sm font-medium text-text-secondary">
                    {field.label}
                  </th>
                ))}
                <th className="text-center py-3 px-2 text-sm font-medium text-text-secondary">
                  分钟
                </th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'home' ? homePlayers : awayPlayers).map((player) => (
                <tr key={player.playerId} className="border-b border-border last:border-b-0">
                  <td className="py-2 px-3 sticky left-0 bg-surface">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                        {player.jerseyNumber}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-text-primary">
                          {player.name}
                        </span>
                        {player.isStarter && (
                          <span className="ml-1.5 text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium">
                            首发
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {statFields.map((field) => (
                    <td key={field.key} className="py-2 px-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() =>
                            decrementStat(
                              activeTab,
                              player.playerId,
                              field.key as keyof PlayerStat
                            )
                          }
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover text-text-muted"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-text-primary">
                          {player[field.key as keyof PlayerStat] as number}
                        </span>
                        <button
                          onClick={() =>
                            incrementStat(
                              activeTab,
                              player.playerId,
                              field.key as keyof PlayerStat
                            )
                          }
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover text-text-muted"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  ))}
                  <td className="py-2 px-2">
                    <div className="flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        max="48"
                        value={player.minutesPlayed}
                        onChange={(e) =>
                          updatePlayerStat(
                            activeTab,
                            player.playerId,
                            'minutesPlayed',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-12 px-1.5 py-1 text-center bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 sticky bottom-6 z-10">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
        >
          取消
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存并完成'}
        </button>
      </div>
    </div>
  );
}
