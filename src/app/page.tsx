'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  MapPin, 
  ChevronRight,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
import { useStandingStore } from '@/store/standings';

export default function HomePage() {
  const { matches, fetchMatches } = useScheduleStore();
  const { standings, fetchStandings } = useStandingStore();

  useEffect(() => {
    fetchMatches();
    fetchStandings();
  }, [fetchMatches, fetchStandings]);

  const upcomingMatches = matches
    .filter(m => m.status === 'SCHEDULED')
    .slice(0, 3);

  const recentMatches = matches
    .filter(m => m.status === 'FINISHED')
    .slice(0, 3);

  const topStandings = standings.slice(0, 5);

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-hero text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6 animate-slide-up">
              <Zap className="w-4 h-4 text-accent" />
              <span>2024赛季火热进行中</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 animate-slide-up stagger-1 leading-tight">
              城市篮球联赛
              <span className="block text-accent">管理系统</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 animate-slide-up stagger-2">
              专业的业余体育联赛管理平台，让球队报名、赛程编排、比分录入、积分榜统计更加公开透明
            </p>
            <div className="flex flex-wrap gap-4 animate-slide-up stagger-3">
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                <Calendar className="w-5 h-5" />
                查看赛程
              </Link>
              <Link
                href="/standings"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all border border-white/20"
              >
                <BarChart3 className="w-5 h-5" />
                积分榜
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="球队管理"
              description="在线报名、队员管理、阵容锁定、审核流程"
              color="primary"
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="赛程编排"
              description="自动生成赛程、灵活调整、场馆调度、裁判安排"
              color="secondary"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="数据统计"
              description="实时比分录入、自动计算积分榜、技术统计分析"
              color="accent"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  即将开赛
                </h2>
                <Link href="/schedule" className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1">
                  查看全部 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match, index) => (
                    <MatchCard key={match._id} match={match} index={index} />
                  ))
                ) : (
                  <EmptyState title="暂无赛程" description="敬请期待新赛季的精彩对决" />
                )}
              </div>

              {recentMatches.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-10 mb-6">
                    <h2 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-accent" />
                      最新赛果
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {recentMatches.map((match, index) => (
                      <MatchCard key={match._id} match={match} index={index} showScore />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                  积分榜
                </h2>
                <Link href="/standings" className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1">
                  查看全部 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-secondary/5 text-xs font-medium text-text-secondary border-b border-border">
                  <div className="col-span-1">排名</div>
                  <div className="col-span-7">球队</div>
                  <div className="col-span-2 text-center">场次</div>
                  <div className="col-span-2 text-center">积分</div>
                </div>
                {topStandings.length > 0 ? (
                  topStandings.map((standing, index) => (
                    <div
                      key={standing._id}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm border-b border-border last:border-0 hover:bg-surface-hover transition-colors ${
                        index < 3 ? 'bg-accent/5' : ''
                      }`}
                    >
                      <div className="col-span-1">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-accent text-secondary-dark' :
                          index === 1 ? 'bg-text-muted text-white' :
                          index === 2 ? 'bg-primary/80 text-white' :
                          'bg-border text-text-secondary'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="col-span-7 font-medium text-text-primary truncate">
                        {(standing.teamId as any)?.name || '-'}
                      </div>
                      <div className="col-span-2 text-center text-text-secondary">{standing.played}</div>
                      <div className="col-span-2 text-center font-bold text-primary">{standing.points}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-text-secondary text-sm">
                    暂无积分数据
                  </div>
                )}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-text-primary">核心规则</h3>
                </div>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    比赛开始前1小时阵容自动锁定，无法修改
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    比赛结束后24小时内可提交申诉
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    胜2分、平1分、负0分
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: 'primary' | 'secondary' | 'accent';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-secondary-dark',
  };

  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border card-hover">
      <div className={`inline-flex p-3 rounded-xl ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold font-display text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
}

function MatchCard({ match, index, showScore = false }: { 
  match: any; 
  index: number;
  showScore?: boolean;
}) {
  const homeTeam = match.homeTeamId || {};
  const awayTeam = match.awayTeamId || {};
  const venue = match.venueId || {};

  return (
    <div 
      className="bg-surface p-5 rounded-xl border border-border card-hover animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          match.status === 'LIVE' ? 'bg-success/10 text-success' :
          match.status === 'FINISHED' ? 'bg-secondary/10 text-secondary' :
          'bg-primary/10 text-primary'
        }`}>
          {match.status === 'LIVE' ? '进行中' : 
           match.status === 'FINISHED' ? '已结束' : 
           match.status === 'SCHEDULED' ? '即将开始' : match.status}
        </span>
        <span className="text-xs text-text-secondary">第 {match.round} 轮</span>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="font-bold text-text-primary text-lg mb-1">{homeTeam.name || '主队'}</div>
          <div className="text-xs text-text-secondary">{homeTeam.city || ''}</div>
        </div>
        
        <div className="flex flex-col items-center px-4">
          {showScore ? (
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold font-display text-primary">{match.homeScore || 0}</span>
              <span className="text-text-muted text-xl">:</span>
              <span className="text-3xl font-bold font-display text-secondary">{match.awayScore || 0}</span>
            </div>
          ) : (
            <div className="text-xl font-bold font-display text-text-muted">VS</div>
          )}
        </div>
        
        <div className="flex-1 text-center">
          <div className="font-bold text-text-primary text-lg mb-1">{awayTeam.name || '客队'}</div>
          <div className="text-xs text-text-secondary">{awayTeam.city || ''}</div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {new Date(match.startTime).toLocaleString('zh-CN', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {venue.name || '待定'}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-surface p-12 rounded-xl border border-border text-center">
      <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
      <h3 className="font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}
