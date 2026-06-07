import React, { useMemo } from 'react';
import { CleanerPerformance } from '../types';

interface Props {
  data: CleanerPerformance[];
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
};

export default function CleanerPerformanceTable({ data }: Props) {
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => (a.rework_rate || 0) - (b.rework_rate || 0));
  }, [data]);

  return (
    <div className="table-container performance-table">
      <table>
        <thead>
          <tr>
            <th>排名</th>
            <th>保洁员</th>
            <th>班次</th>
            <th>总工单</th>
            <th>平均时长</th>
            <th>VIP平均时长</th>
            <th>普通平均时长</th>
            <th>返工次数</th>
            <th>总返工率</th>
            <th>VIP返工率</th>
            <th>普通返工率</th>
            <th>换班次数</th>
            <th>平均返工距查房</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, idx) => (
            <tr key={c.cleaner_id}>
              <td>
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
              </td>
              <td style={{ fontWeight: 600 }}>{c.cleaner_name}</td>
              <td>{SHIFT_LABELS[c.shift] || c.shift}</td>
              <td>{c.total_orders}</td>
              <td>{c.avg_duration ?? '-'}min</td>
              <td style={{ color: 'var(--accent-yellow)' }}>{c.avg_duration_vip ?? '-'}min</td>
              <td>{c.avg_duration_normal ?? '-'}min</td>
              <td style={{ color: c.rework_count > 0 ? 'var(--accent-red)' : 'inherit' }}>{c.rework_count}</td>
              <td style={{ color: (c.rework_rate || 0) > 20 ? 'var(--accent-red)' : 'inherit' }}>
                {c.rework_rate ?? '-'}%
              </td>
              <td style={{ color: 'var(--accent-yellow)' }}>{c.rework_rate_vip ?? '-'}%</td>
              <td>{c.rework_rate_normal ?? '-'}%</td>
              <td>{c.handover_count}</td>
              <td style={{ color: (c.avg_minutes_after_inspection || 0) > 30 ? 'var(--accent-orange)' : 'inherit' }}>
                {c.avg_minutes_after_inspection ?? '-'}min
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
