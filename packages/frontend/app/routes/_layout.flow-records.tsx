import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDateTime, recordTypeLabels, actionLabels } from '~/utils/formatters';

const fieldLabelMap: Record<string, string> = {
  name: '姓名',
  petNo: '宠物编号',
  species: '物种',
  breed: '品种',
  gender: '性别',
  status: '状态',
  healthStatus: '健康状态',
  weight: '体重',
  applicantName: '申请人姓名',
  applicantPhone: '联系电话',
  applicantAddress: '居住地址',
  housingType: '住房类型',
  trainerId: '训练师',
  trainerName: '训练师',
  reviewerId: '审核人',
  reviewerName: '审核人',
  reviewComments: '审核意见',
  rejectionReason: '拒绝原因',
};

export default function FlowRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    recordType: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadRecords();
  }, [page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const result: any = await api.get('/flow-records', {
        params: { page, pageSize: 20, ...filters },
      });
      setRecords(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Load flow records error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadRecords();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-item">
          <label>记录类型：</label>
          <select value={filters.recordType} onChange={(e) => handleFilterChange('recordType', e.target.value)}>
            <option value="">全部</option>
            <option value="pet_profile">宠物档案</option>
            <option value="adoption_application">领养申请</option>
            <option value="training_record">训练记录</option>
            <option value="visit_record">回访记录</option>
          </select>
        </div>
        <div className="filter-item">
          <label>操作类型：</label>
          <select value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)}>
            <option value="">全部</option>
            <option value="create">创建</option>
            <option value="update">更新</option>
            <option value="status_change">状态变更</option>
            <option value="submit">提交</option>
            <option value="review">审核</option>
            <option value="complete">完成</option>
          </select>
        </div>
        <div className="filter-item">
          <label>开始日期：</label>
          <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
        </div>
        <div className="filter-item">
          <label>结束日期：</label>
          <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        <button className="btn btn-secondary" onClick={() => { setFilters({ recordType: '', action: '', startDate: '', endDate: '' }); setPage(1); setTimeout(loadRecords, 0); }}>重置</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <div className="empty-state-text">暂无流转记录</div>
            </div>
          ) : (
            <>
              <div className="timeline" style={{ padding: '1.25rem', paddingLeft: '2.5rem' }}>
                {records.map((record) => (
                  <div key={record._id} className="timeline-item">
                    <div className="timeline-header" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(record._id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <span className="timeline-title">{record.actionLabel}</span>
                        <span className="badge badge-primary">{recordTypeLabels[record.recordType]}</span>
                        {record.relatedNo && <span className="text-sm text-muted">{record.relatedNo}</span>}
                      </div>
                      <span className="timeline-time">{formatDateTime(record.createdAt)}</span>
                    </div>
                    <div className="timeline-content">
                      <div style={{ marginBottom: '0.5rem' }}>{record.description}</div>
                      <div className="text-sm text-muted">
                        操作人：{record.operatorName}（{record.operatorRole === 'admin' ? '管理员' : record.operatorRole === 'trainer' ? '训练师' : '审核员'}）
                      </div>
                      
                      {expandedId === record._id && record.changedFields && record.changedFields.length > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #d1d5db' }}>
                          <div className="text-xs text-muted mb-2">变更详情（点击收起）</div>
                          {record.changedFields.map((field: string) => {
                            let beforeVal = record.beforeData?.[field];
                            let afterVal = record.afterData?.[field];
                            if (typeof beforeVal === 'object' && beforeVal !== null) {
                              beforeVal = JSON.stringify(beforeVal);
                            }
                            if (typeof afterVal === 'object' && afterVal !== null) {
                              afterVal = JSON.stringify(afterVal);
                            }
                            if (beforeVal === undefined || beforeVal === null) beforeVal = '（空）';
                            if (afterVal === undefined || afterVal === null) afterVal = '（空）';
                            
                            return (
                              <div key={field} className="diff-item">
                                <div className="diff-label">{fieldLabelMap[field] || field}</div>
                                <div className="diff-values">
                                  <span className="diff-before">{String(beforeVal)}</span>
                                  <span className="diff-arrow">→</span>
                                  <span className="diff-after">{String(afterVal)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {!expandedId && record.changedFields && record.changedFields.length > 0 && (
                        <div className="text-sm text-primary mt-2" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(record._id)}>
                          查看 {record.changedFields.length} 项变更详情 ▼
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pagination">
                <div className="pagination-info">
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div className="pagination-buttons">
                  <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    上一页
                  </button>
                  <button className="pagination-btn active">{page}</button>
                  <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
