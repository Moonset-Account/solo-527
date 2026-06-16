import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDate, formatDateTime, adoptionStatusLabels, adoptionStatusColors, housingTypeLabels, recordTypeLabels } from '~/utils/formatters';

const fieldLabelMap: Record<string, string> = {
  applicantName: '申请人姓名',
  applicantPhone: '联系电话',
  applicantIdCard: '身份证号',
  applicantEmail: '电子邮箱',
  applicantAddress: '居住地址',
  housingType: '住房类型',
  hasPetExperience: '养宠经验',
  currentPets: '现有宠物',
  familyMembers: '家庭成员数',
  hasChildren: '是否有孩子',
  workSchedule: '工作时间',
  monthlyBudget: '月度预算',
  adoptionReason: '领养原因',
  'emergencyContact.name': '紧急联系人姓名',
  'emergencyContact.phone': '紧急联系人电话',
  'emergencyContact.relationship': '紧急联系人关系',
  veterinaryInfo: '兽医信息',
};

export default function AdoptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [flowRecords, setFlowRecords] = useState<any[]>([]);
  const [visitRecords, setVisitRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    reviewComments: '',
    rejectionReason: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, flowRes, visitRes] = await Promise.all([
        api.get(`/adoptions/${id}`),
        api.get('/flow-records', { params: { relatedId: id, recordType: 'adoption_application', pageSize: 50 } }),
        api.get('/visits', { params: { applicationId: id, pageSize: 20 } }),
      ]);
      
      setApplication((appRes as any).data);
      setFlowRecords((flowRes as any).data || []);
      setVisitRecords((visitRes as any).data || []);
    } catch (error) {
      console.error('Load adoption detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/adoptions/${id}/submit`);
      alert('提交成功');
      loadData();
    } catch (error: any) {
      alert(error.message || '提交失败');
    }
  };

  const handleReview = async () => {
    try {
      await api.post(`/adoptions/${id}/review`, reviewForm);
      alert('审核完成');
      setShowReviewModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message || '审核失败');
    }
  };

  const handleComplete = async () => {
    if (!confirm('确定要完成领养吗？')) return;
    try {
      await api.post(`/adoptions/${id}/complete`);
      alert('领养已完成');
      loadData();
    } catch (error: any) {
      alert(error.message || '操作失败');
    }
  };

  if (loading) {
    return <div className="card card-body">加载中...</div>;
  }

  if (!application) {
    return <div className="card card-body">申请不存在</div>;
  }

  const canSubmit = application.status === 'draft';
  const canReview = application.status === 'submitted' || application.status === 'under_review';
  const canComplete = application.status === 'approved';

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← 返回</button>
            <div>
              <h3 style={{ margin: 0 }}>{application.applicantName}</h3>
              <div className="text-sm text-muted">{application.applicationNo}</div>
            </div>
            <span className={`badge badge-${adoptionStatusColors[application.status]} badge-lg`}>
              {adoptionStatusLabels[application.status]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canSubmit && (
              <button className="btn btn-primary btn-sm" onClick={handleSubmit}>提交审核</button>
            )}
            {canReview && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowReviewModal(true)}>审核</button>
            )}
            {canComplete && (
              <button className="btn btn-success btn-sm" onClick={handleComplete}>完成领养</button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/adoptions/${id}/edit`)}>编辑</button>
          </div>
        </div>

        <div className="tabs" style={{ padding: '0 1.25rem', margin: 0 }}>
          <div
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            申请资料
          </div>
          <div
            className={`tab ${activeTab === 'pet' ? 'active' : ''}`}
            onClick={() => setActiveTab('pet')}
          >
            宠物信息
          </div>
          <div
            className={`tab ${activeTab === 'visits' ? 'active' : ''}`}
            onClick={() => setActiveTab('visits')}
          >
            回访记录 ({visitRecords.length})
          </div>
          <div
            className={`tab ${activeTab === 'flow' ? 'active' : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            流转记录 ({flowRecords.length})
          </div>
        </div>

        <div className="card-body">
          {activeTab === 'info' && (
            <div>
              {application.missingFields && application.missingFields.length > 0 && (
                <div className="alert alert-warning">
                  <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                    资料不完整，缺失 {application.missingFields.length} 项：
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {application.missingFields.map((field: string) => (
                      <span key={field} className="badge badge-warning">
                        {fieldLabelMap[field] || field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>基本信息</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }} className="detail-grid">
                <InfoRow label="申请人姓名" value={application.applicantName} />
                <InfoRow label="联系电话" value={application.applicantPhone} />
                <InfoRow label="身份证号" value={application.applicantIdCard} />
                <InfoRow label="电子邮箱" value={application.applicantEmail} />
                <InfoRow label="居住地址" value={application.applicantAddress} full />
                <InfoRow label="住房类型" value={housingTypeLabels[application.housingType] || application.housingType} />
                <InfoRow label="有无养宠经验" value={application.hasPetExperience ? '有' : '无'} />
                <InfoRow label="家庭成员数" value={application.familyMembers ? `${application.familyMembers}人` : '-'} />
                <InfoRow label="是否有孩子" value={application.hasChildren ? '是' : '否'} />
                <InfoRow label="工作时间" value={application.workSchedule} />
                <InfoRow label="月度预算" value={application.monthlyBudget ? `¥${application.monthlyBudget}` : '-'} />
              </div>

              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>紧急联系人</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }} className="detail-grid">
                <InfoRow label="姓名" value={application.emergencyContact?.name} />
                <InfoRow label="电话" value={application.emergencyContact?.phone} />
                <InfoRow label="关系" value={application.emergencyContact?.relationship} />
              </div>

              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>其他信息</h4>
              <div style={{ marginBottom: '1rem' }}>
                <div className="text-sm text-muted mb-2">领养原因</div>
                <p className="text-sm">{application.adoptionReason || '未填写'}</p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div className="text-sm text-muted mb-2">现有宠物</div>
                <p className="text-sm">{application.currentPets || '无'}</p>
              </div>
              <div>
                <div className="text-sm text-muted mb-2">兽医信息</div>
                <p className="text-sm">{application.veterinaryInfo || '未填写'}</p>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>分配信息</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }} className="detail-grid">
                  <InfoRow label="训练师" value={application.trainerName || '未分配'} />
                  <InfoRow label="审核人" value={application.reviewerName || '未审核'} />
                  <InfoRow label="提交时间" value={formatDateTime(application.submittedAt)} />
                </div>
              </div>

              {application.reviewComments && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <div className="text-sm text-muted mb-2">审核意见</div>
                  <p className="text-sm">{application.reviewComments}</p>
                </div>
              )}

              {application.rejectionReason && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', color: '#dc2626' }}>
                  <div className="text-sm font-medium mb-2">拒绝原因</div>
                  <p className="text-sm">{application.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pet' && application.petId && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="detail-grid">
                <div className="card" style={{ padding: '1rem' }}>
                  <div className="font-medium mb-2">{application.petId.name}</div>
                  <div className="text-sm text-muted">{application.petNo}</div>
                  <div className="text-sm mt-2">品种：{application.petId.breed || '-'}</div>
                  <div className="text-sm">状态：{application.petId.status}</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm mt-4" onClick={() => navigate(`/pets/${application.petId._id}`)}>
                查看宠物档案
              </button>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              {visitRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏠</div>
                  <div className="empty-state-text">暂无回访记录</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {visitRecords.map((visit) => (
                    <div key={visit._id} className="card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="font-medium">
                            {visit.visitType === 'first_week' ? '首周回访' :
                             visit.visitType === 'first_month' ? '首月回访' :
                             visit.visitType === 'quarterly' ? '季度回访' :
                             visit.visitType === 'random' ? '随机回访' : '投诉回访'}
                          </div>
                          <div className="text-sm text-muted mt-1">
                            {formatDate(visit.visitDate)} · 回访人：{visit.visitorName || '-'}
                          </div>
                        </div>
                        <span className={`badge badge-${visit.overallStatus === 'excellent' || visit.overallStatus === 'good' ? 'success' : visit.overallStatus === 'needs_attention' ? 'warning' : 'info'}`}>
                          {visit.overallStatus === 'excellent' ? '优秀' :
                           visit.overallStatus === 'good' ? '良好' :
                           visit.overallStatus === 'average' ? '一般' :
                           visit.overallStatus === 'poor' ? '较差' : '需关注'}
                        </span>
                      </div>
                      {visit.problems && (
                        <div className="text-sm mt-2">
                          <span className="text-muted">问题：</span>{visit.problems}
                        </div>
                      )}
                      {visit.suggestions && (
                        <div className="text-sm mt-1">
                          <span className="text-muted">建议：</span>{visit.suggestions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'flow' && (
            <div>
              {flowRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📜</div>
                  <div className="empty-state-text">暂无流转记录</div>
                </div>
              ) : (
                <div className="timeline">
                  {flowRecords.map((record) => (
                    <div key={record._id} className="timeline-item">
                      <div className="timeline-header">
                        <span className="timeline-title">{record.actionLabel}</span>
                        <span className="timeline-time">{formatDateTime(record.createdAt)}</span>
                      </div>
                      <div className="timeline-content">
                        <div style={{ marginBottom: '0.5rem' }}>{record.description}</div>
                        {record.changedFields && record.changedFields.length > 0 && (
                          <div className="text-sm">
                            <span className="text-muted">变更字段：</span>
                            {record.changedFields.map((f: string) => fieldLabelMap[f] || f).join('、')}
                          </div>
                        )}
                        <div className="text-sm text-muted mt-2">
                          操作人：{record.operatorName}
                          ({record.operatorRole === 'admin' ? '管理员' : record.operatorRole === 'trainer' ? '训练师' : '审核员'})
                        </div>
                        
                        {record.beforeData && record.afterData && record.changedFields?.length > 0 && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #d1d5db' }}>
                            <div className="text-xs text-muted mb-2">详细变更</div>
                            {record.changedFields.map((field: string) => {
                              let beforeVal = record.beforeData[field];
                              let afterVal = record.afterData[field];
                              if (typeof beforeVal === 'object') beforeVal = JSON.stringify(beforeVal);
                              if (typeof afterVal === 'object') afterVal = JSON.stringify(afterVal);
                              if (field === 'status') {
                                beforeVal = adoptionStatusLabels[beforeVal as string] || beforeVal;
                                afterVal = adoptionStatusLabels[afterVal as string] || afterVal;
                              }
                              return (
                                <div key={field} className="diff-item">
                                  <div className="diff-label">{fieldLabelMap[field] || field}</div>
                                  <div className="diff-values">
                                    <span className="diff-before">{beforeVal || '空'}</span>
                                    <span className="diff-arrow">→</span>
                                    <span className="diff-after">{afterVal || '空'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">审核申请</span>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">审核结果</label>
                <select
                  className="form-control"
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="under_review">标记为审核中</option>
                  <option value="approved">审核通过</option>
                  <option value="rejected">审核拒绝</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">审核意见</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={reviewForm.reviewComments}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, reviewComments: e.target.value }))}
                  placeholder="请输入审核意见"
                />
              </div>
              {reviewForm.status === 'rejected' && (
                <div className="form-group">
                  <label className="form-label">拒绝原因</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={reviewForm.rejectionReason}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                    placeholder="请输入拒绝原因"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReview}>确认</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value, full = false }: { label: string; value: any; full?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', gridColumn: full ? '1 / -1' : undefined }}>
      <span className="text-muted">{label}</span>
      <span style={{ textAlign: 'right' }}>{value === null || value === undefined || value === '' ? '-' : value}</span>
    </div>
  );
}
