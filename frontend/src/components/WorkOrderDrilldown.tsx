import React, { useState } from 'react';
import { WorkOrderDetail, FloorHeatmapCell, CleanerInfo } from '../types';

interface Props {
  orders: WorkOrderDetail[];
  cleaners: CleanerInfo[];
  triggeredBy?: FloorHeatmapCell | null;
  onClose: () => void;
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
};

export default function WorkOrderDrilldown({ orders, cleaners, triggeredBy, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const statusTag = (status: string) => {
    const map: Record<string, string> = {
      completed: 'tag-clean',
      rework: 'tag-rework',
      assigned: 'tag-dirty',
      in_progress: 'tag-cleaning',
      inspected: 'tag-inspected',
    };
    return <span className={`tag ${map[status] || 'tag-dirty'}`}>{status}</span>;
  };

  return (
    <div className="card drilldown-section">
      <div className="card-header">
        <h3>
          📋 工单明细下钻
          {triggeredBy && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              · 筛选：{triggeredBy.room_number} / {triggeredBy.floor}F
            </span>
          )}
        </h3>
        <button className="btn btn-secondary" onClick={onClose}>关闭</button>
      </div>
      <div className="card-body">
        <div className="table-container" style={{ maxHeight: 480, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>工单号</th>
                <th>房号</th>
                <th>楼层</th>
                <th>房型</th>
                <th>VIP</th>
                <th>延迟退房</th>
                <th>保洁员</th>
                <th>班次</th>
                <th>状态</th>
                <th>清洁时长</th>
                <th>返工次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td>{o.order_number}</td>
                    <td>{o.room_number}</td>
                    <td>{o.floor}F</td>
                    <td>{o.room_type}</td>
                    <td>{o.is_vip ? <span className="tag tag-vip">VIP</span> : '-'}</td>
                    <td>{o.is_late_checkout ? <span className="tag tag-late">延迟</span> : '-'}</td>
                    <td>{o.cleaner_name}</td>
                    <td>{SHIFT_LABELS[o.shift] || o.shift}</td>
                    <td>{statusTag(o.status)}</td>
                    <td>{o.cleaning_duration ? `${o.cleaning_duration}min` : '-'}</td>
                    <td style={{ color: o.reworks.length > 0 ? 'var(--accent-red)' : 'inherit' }}>
                      {o.reworks.length}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: 11 }}
                        onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                      >
                        {expandedId === o.id ? '收起' : '展开'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === o.id && (
                    <tr>
                      <td colSpan={12} className="expand-row">
                        <div className="expand-content">
                          {o.reworks.length > 0 && (
                            <>
                              <div className="sub-title">🔍 返工记录</div>
                              {o.reworks.map((r, idx) => (
                                <div key={r.id} style={{ marginBottom: 6, paddingLeft: 12 }}>
                                  <span style={{ color: 'var(--accent-red)' }}>
                                    返工{idx + 1}：{r.reason}
                                  </span>
                                  {r.missing_item && (
                                    <span style={{ color: 'var(--accent-orange)', marginLeft: 8 }}>
                                      用品缺失：{r.missing_item}
                                    </span>
                                  )}
                                  {r.minutes_after_inspection != null && (
                                    <span style={{ color: 'var(--accent-purple)', marginLeft: 8 }}>
                                      距查房：{r.minutes_after_inspection}min
                                    </span>
                                  )}
                                  {r.reassigned_cleaner_name && (
                                    <span style={{ color: 'var(--accent-cyan)', marginLeft: 8 }}>
                                      重派：{r.reassigned_cleaner_name}
                                    </span>
                                  )}
                                  {r.rework_duration && (
                                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                      返工耗时：{r.rework_duration}min
                                    </span>
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                          {o.handovers.length > 0 && (
                            <>
                              <div className="sub-title">🔄 换班交接</div>
                              {o.handovers.map(h => (
                                <div key={h.id} style={{ marginBottom: 6, paddingLeft: 12 }}>
                                  <span style={{ color: 'var(--accent-cyan)' }}>
                                    {h.from_cleaner_name} → {h.to_cleaner_name}
                                  </span>
                                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                    交接时间：{h.handover_time ? new Date(h.handover_time).toLocaleString('zh-CN') : '-'}
                                  </span>
                                  <span style={{ color: 'var(--accent-blue)', marginLeft: 8 }}>
                                    责任拆分：{h.from_cleaner_name} {h.from_duration}min + {h.to_cleaner_name} {h.to_duration}min
                                  </span>
                                  {h.note && (
                                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                      备注：{h.note}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                          {o.reworks.length === 0 && o.handovers.length === 0 && (
                            <div style={{ color: 'var(--text-muted)' }}>无返工/换班记录</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
