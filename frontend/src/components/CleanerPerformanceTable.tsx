import React, { useMemo, useState } from 'react';
import { CleanerPerformance } from '../types';

interface Props {
  data: CleanerPerformance[];
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
};

type RankTab = 'vip' | 'normal';

export default function CleanerPerformanceTable({ data }: Props) {
  const [tab, setTab] = useState<RankTab>('normal');

  const vipSorted = useMemo(() => {
    return [...data]
      .filter(c => c.vip_orders > 0)
      .sort((a, b) => {
        const ra = a.avg_duration_vip ?? 999;
        const rb = b.avg_duration_vip ?? 999;
        if (ra !== rb) return ra - rb;
        return (a.rework_rate_vip ?? 0) - (b.rework_rate_vip ?? 0);
      });
  }, [data]);

  const normalSorted = useMemo(() => {
    return [...data]
      .filter(c => c.normal_orders > 0)
      .sort((a, b) => {
        const ra = a.avg_duration_normal ?? 999;
        const rb = b.avg_duration_normal ?? 999;
        if (ra !== rb) return ra - rb;
        return (a.rework_rate_normal ?? 0) - (b.rework_rate_normal ?? 0);
      });
  }, [data]);

  const displayList = tab === 'vip' ? vipSorted : normalSorted;

  const renderRankBadge = (idx: number) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      height: 24,
      borderRadius: '50%',
      fontSize: 12,
      fontWeight: 700,
      background: idx === 0 ? 'var(--accent-green)' : idx === 1 ? 'var(--accent-blue)' : idx === 2 ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
      color: idx < 3 ? '#fff' : 'var(--text-secondary)',
    }}>
      {idx + 1}
    </span>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          className={`btn ${tab === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('normal')}
        >
          🏠 普通房排名
        </button>
        <button
          className={`btn ${tab === 'vip' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('vip')}
          style={{ background: tab === 'vip' ? 'var(--accent-yellow)' : undefined, borderColor: tab === 'vip' ? 'var(--accent-yellow)' : undefined }}
        >
          ⭐ VIP房排名
        </button>
      </div>

      <div className="table-container performance-table">
        <table>
          <thead>
            <tr>
              <th>排名</th>
              <th>保洁员</th>
              <th>班次</th>
              {tab === 'vip' ? (
                <>
                  <th>VIP工单数</th>
                  <th>VIP平均时长</th>
                  <th>VIP返工率</th>
                </>
              ) : (
                <>
                  <th>普通工单数</th>
                  <th>普通平均时长</th>
                  <th>普通返工率</th>
                </>
              )}
              <th>总工单</th>
              <th>交接转出时长</th>
              <th>接手转入时长</th>
              <th>平均返工距查房</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((c, idx) => (
              <tr key={c.cleaner_id}>
                <td>{renderRankBadge(idx)}</td>
                <td style={{ fontWeight: 600 }}>{c.cleaner_name}</td>
                <td>{SHIFT_LABELS[c.shift] || c.shift}</td>
                {tab === 'vip' ? (
                  <>
                    <td style={{ color: 'var(--accent-yellow)' }}>{c.vip_orders}</td>
                    <td style={{ color: 'var(--accent-yellow)' }}>
                      {c.avg_duration_vip ?? '-'}min
                    </td>
                    <td style={{
                      color: (c.rework_rate_vip || 0) > 20 ? 'var(--accent-red)' : 'var(--accent-yellow)',
                    }}>
                      {c.rework_rate_vip ?? '-'}%
                    </td>
                  </>
                ) : (
                  <>
                    <td>{c.normal_orders}</td>
                    <td>{c.avg_duration_normal ?? '-'}min</td>
                    <td style={{ color: (c.rework_rate_normal || 0) > 20 ? 'var(--accent-red)' : 'inherit' }}>
                      {c.rework_rate_normal ?? '-'}%
                    </td>
                  </>
                )}
                <td>{c.total_orders}</td>
                <td style={{ color: c.handover_from_duration_total ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {c.handover_from_duration_total ? `${c.handover_from_duration_total}min` : '-'}
                </td>
                <td style={{ color: c.handover_to_duration_total ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                  {c.handover_to_duration_total ? `${c.handover_to_duration_total}min` : '-'}
                </td>
                <td style={{ color: (c.avg_minutes_after_inspection || 0) > 30 ? 'var(--accent-orange)' : 'inherit' }}>
                  {c.avg_minutes_after_inspection ?? '-'}min
                </td>
              </tr>
            ))}
            {displayList.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
