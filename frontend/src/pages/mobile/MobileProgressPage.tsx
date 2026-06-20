import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, Toast, TextArea, Avatar } from 'antd-mobile';
import { ApprovalProgress, ApprovalStep } from '../../types';
import { contractApi, approvalApi } from '../../api';
import { contractStatusMap, urgencyMap, approvalStatusMap, formatDate } from '../../store';
import { LeftOutline, PhoneFill } from 'antd-mobile-icons';
const SmsOutline = () => <span>✉️</span>;
const Spin: any = ({ children }) => children;

interface Props {
  contractId: string;
}

export default function MobileProgressPage({ contractId }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApprovalProgress | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [opinion, setOpinion] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myTask, setMyTask] = useState<ApprovalStep | null>(null);

  const fetchData = async () => {
    if (!contractId) return;
    try {
      const res = await contractApi.getApprovalProgress(contractId) as unknown as ApprovalProgress;
      setData(res);
      const currentPending = res.steps.find((s) => {
        const isPending = s.status === 'pending';
        const isMine = window.location.pathname.includes('/m/approval');
        return isPending;
      });
      setMyTask(currentPending || null);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '加载失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [contractId]);

  const progressPercent = useMemo(() => {
    if (!data) return 0;
    if (data.totalSteps === 0) return 100;
    const done = data.steps.filter((s) => s.status === 'approved' || s.status === 'skipped' || s.status === 'transferred').length;
    return Math.round((done / data.totalSteps) * 100);
  }, [data]);

  const handleApprove = async () => {
    if (!myTask) return;
    setSubmitting(true);
    try {
      await approvalApi.approve(myTask.id, opinion);
      Toast.show({ icon: 'success', content: '审批通过' });
      setActionVisible(false);
      setOpinion('');
      fetchData();
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!myTask || !rejectReason.trim()) {
      Toast.show({ content: '请填写退回原因' });
      return;
    }
    setSubmitting(true);
    try {
      await approvalApi.reject(myTask.id, rejectReason.trim(), opinion);
      Toast.show({ icon: 'success', content: '已退回' });
      setActionVisible(false);
      setOpinion('');
      setRejectReason('');
      fetchData();
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const callApprover = (phone?: string) => {
    if (phone) window.location.href = `tel:${phone}`;
    else Toast.show({ content: '暂无手机号' });
  };

  const sendSms = (phone?: string) => {
    if (phone) window.location.href = `sms:${phone}`;
    else Toast.show({ content: '暂无手机号' });
  };

  if (loading && !data) {
    return (
      <div className="mobile-progress-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spin color="#1677ff" size={32} />
        <div style={{ marginLeft: 12, color: '#1677ff' }}>加载审批进度...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mobile-empty">
        <div style={{ fontSize: 60, marginBottom: 16 }}>📄</div>
        <div>暂无数据</div>
        <Button style={{ marginTop: 24 }} onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  const statusInfo = contractStatusMap[data.contract.status];
  const urgencyInfo = urgencyMap[data.contract.urgency];

  return (
    <div className="mobile-progress-page">
      <div className="mobile-progress-hero">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', fontSize: 20, marginRight: 12 }}>
            ←
          </div>
          <div style={{ flex: 1 }}>
            <div className="mobile-progress-hero-no">{data.contract.contractNo}</div>
            <div className="mobile-progress-hero-title">{data.contract.title}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span className="tag" style={{ background: statusInfo.color + '22', color: statusInfo.color, border: `1px solid ${statusInfo.color}44` }}>
            {statusInfo.label}
          </span>
          <span className="tag" style={{ background: urgencyInfo.color + '22', color: urgencyInfo.color, border: `1px solid ${urgencyInfo.color}44` }}>
            {urgencyInfo.label}
          </span>
          <span className="tag" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            进度 {progressPercent}%
          </span>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 8,
          height: 8,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'white',
            borderRadius: 8,
            transition: 'width 0.5s',
          }} />
        </div>

        <div className="mobile-progress-stats">
          <div className="mobile-progress-stat">
            <span className="mobile-progress-stat-label">当前步骤</span>
            <span className="mobile-progress-stat-value">第 {data.currentStep || data.totalSteps}/{data.totalSteps} 步</span>
          </div>
          <div className="mobile-progress-stat">
            <span className="mobile-progress-stat-label">申请人</span>
            <span className="mobile-progress-stat-value">{data.contract.applicant?.realName || '-'}</span>
          </div>
          <div className="mobile-progress-stat">
            <span className="mobile-progress-stat-label">提交时间</span>
            <span className="mobile-progress-stat-value">{formatDate(data.contract.createdAt, 'MM-DD HH:mm')}</span>
          </div>
        </div>
      </div>

      <div className="mobile-stepper-wrapper">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>审批流程</div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
          共 {data.totalSteps} 个节点，{data.currentStep > 0 ? `当前第 ${data.currentStep} 步` : data.currentStep === 0 ? '已全部完成' : '等待开始'}
        </div>

        {data.steps.map((step, idx) => {
          const isDone = step.status === 'approved' || step.status === 'skipped' || step.status === 'transferred';
          const isRejected = step.status === 'rejected' || step.status === 'returned';
          const isActive = step.status === 'pending';
          const dotClass = isDone ? 'done' : isActive ? 'active' : isRejected ? 'rejected' : 'pending';
          const statusInfo = approvalStatusMap[step.status] || { label: step.status, color: '#8c8c8c' };

          return (
            <div className="mobile-step" key={step.id}>
              <div className={`mobile-step-dot ${dotClass}`}>
                {isDone ? '✓' : (idx + 1)}
              </div>
              <div className="mobile-step-content">
                <div className="mobile-step-header">
                  <span className="mobile-step-name">{step.nodeName}</span>
                  <span
                    className="mobile-step-status"
                    style={{ background: statusInfo.color + '22', color: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {step.approver && (
                  <div className="mobile-step-approver">
                    <div className="mobile-step-avatar">
                      {step.approver.realName?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#1f1f1f' }}>{step.approver.realName}</div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {isActive && <span style={{ color: '#1677ff' }}>处理中...</span>}
                        {step.approvedAt && `耗时 ${step.durationHours || 0}h`}
                        {step.transferredTo && ` → 转交 ${step.transferredTo.realName}`}
                      </div>
                    </div>
                    {step.approver.phone && isActive && (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span onClick={() => callApprover(step.approver?.phone)} style={{ fontSize: 20, color: '#52c41a' }}>📞</span>
                        <span onClick={() => sendSms(step.approver?.phone)} style={{ fontSize: 20, color: '#1677ff' }}>💬</span>
                      </div>
                    )}
                  </div>
                )}

                {step.opinion && !step.rejectionReason && (
                  <div className="mobile-step-opinion">
                    💬 {step.opinion}
                  </div>
                )}
                {step.rejectionReason && (
                  <div className="mobile-step-reason">
                    ❌ 退回原因：{step.rejectionReason}
                    {step.opinion && step.opinion !== step.rejectionReason && (
                      <div style={{ marginTop: 6, color: '#8c8c8c' }}>备注：{step.opinion}</div>
                    )}
                  </div>
                )}

                <div className="mobile-step-time">
                  {isActive
                    ? `待审批 · 分配于 ${formatDate(step.createdAt, 'MM-DD HH:mm')}`
                    : step.approvedAt
                      ? `${formatDate(step.approvedAt, 'YYYY-MM-DD HH:mm')} 处理`
                      : `分配 ${formatDate(step.createdAt, 'MM-DD HH:mm')}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mobile-info-section">
        <div className="section-title" style={{ margin: '4px 0 0', borderLeft: 'none', paddingLeft: 0 }}>合同信息</div>
        <div className="mobile-info-row">
          <div className="mobile-info-label">合同编号</div>
          <div className="mobile-info-value" style={{ fontWeight: 600 }}>{data.contract.contractNo}</div>
        </div>
        <div className="mobile-info-row">
          <div className="mobile-info-label">合同标题</div>
          <div className="mobile-info-value">{data.contract.title}</div>
        </div>
      </div>

      {myTask && (
        <div className="mobile-actions-row">
          <Button block color="danger" size="large" onClick={() => { setActionType('reject'); setActionVisible(true); }}>
            退回
          </Button>
          <Button block color="primary" size="large" onClick={() => { setActionType('approve'); setActionVisible(true); }}>
            通过
          </Button>
        </div>
      )}

      <Dialog
        visible={actionVisible}
        title={actionType === 'approve' ? '审批通过' : '退回申请'}
        content={
          <div style={{ padding: '8px 0' }}>
            {actionType === 'reject' && (
              <TextArea
                placeholder="请填写退回原因（必填）"
                value={rejectReason}
                onChange={setRejectReason}
                rows={3}
                style={{ marginBottom: 12 }}
              />
            )}
            <TextArea
              placeholder="审批意见（选填）"
              value={opinion}
              onChange={setOpinion}
              rows={3}
            />
          </div>
        }
        closeOnAction
        onClose={() => setActionVisible(false)}
        actions={[
          [
            {
              key: 'cancel',
              text: '取消',
              onClick: () => setActionVisible(false),
            },
            {
              key: 'confirm',
              text: actionType === 'approve' ? '确认通过' : '确认退回',
              bold: true,
              disabled: submitting,
              onClick: actionType === 'approve' ? handleApprove : handleReject,
            },
          ],
        ]}
      />
    </div>
  );
}
