import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import StatusTag from '@/components/ui/StatusTag';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { applicationApi } from '@/api';
import { useAppStore } from '@/store';
import { RequisitionApplication } from '@/types';
import { formatDateTime } from '@/utils';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useAppStore((state) => state.user);
  const [loading, setLoading] = React.useState(true);
  const [application, setApplication] = React.useState<RequisitionApplication | null>(null);
  const [auditModalOpen, setAuditModalOpen] = React.useState(false);
  const [auditAction, setAuditAction] = React.useState<'approve' | 'reject'>('approve');
  const [auditRemark, setAuditRemark] = React.useState('');
  const [auditLoading, setAuditLoading] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const data = await applicationApi.getById(id!);
      setApplication(data);
    } catch (error) {
      console.error('Failed to fetch application:', error);
      showToast({ type: 'error', message: '获取申请详情失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!application) return;

    setAuditLoading(true);
    try {
      await applicationApi.approve(application.id, {
        approved: auditAction === 'approve',
        remark: auditRemark,
      });
      showToast({ type: 'success', message: auditAction === 'approve' ? '审核通过成功' : '审核驳回成功' });
      setAuditModalOpen(false);
      fetchApplication();
    } catch (error) {
      console.error('Failed to audit application:', error);
      showToast({ type: 'error', message: '审核操作失败，请重试' });
    } finally {
      setAuditLoading(false);
    }
  };

  const openAuditModal = (action: 'approve' | 'reject') => {
    setAuditAction(action);
    setAuditRemark('');
    setAuditModalOpen(true);
  };

  if (loading) {
    return <Loading />;
  }

  if (!application) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate('/application')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
        <div className="text-center py-12 text-neutral-500">申请不存在</div>
      </div>
    );
  }

  const infoItems = [
    { label: '申请编号', value: application.id },
    { label: '申请人', value: application.applicantName },
    { label: '申请时间', value: formatDateTime(application.createdAt) },
    { label: '更新时间', value: formatDateTime(application.updatedAt) },
    { label: '预约使用日期', value: application.scheduledDate || '-' },
    { label: '状态', value: <StatusTag status={application.status} /> },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate('/application')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">申请详情</h1>
            <p className="mt-1 text-sm text-neutral-500">查看领用申请的详细信息</p>
          </div>
          {user?.role === 'ADMIN' && application.status === 'PENDING' && (
            <div className="flex gap-3">
              <Button variant="danger" onClick={() => openAuditModal('reject')}>
                <XCircle className="w-4 h-4 mr-2" />
                驳回
              </Button>
              <Button onClick={() => openAuditModal('approve')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                通过
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>基本信息</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 gap-4">
                {infoItems.map((item, index) => (
                  <div key={index}>
                    <p className="text-xs text-neutral-500 mb-1">{item.label}</p>
                    <p className="text-sm text-neutral-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>试剂信息</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">试剂名称</p>
                  <p className="text-sm font-medium text-neutral-900">{application.reagentName}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">领用数量</p>
                  <p className="text-sm font-medium text-neutral-900">{application.quantity} 瓶</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">使用目的</p>
                  <p className="text-sm font-medium text-neutral-900">{application.purpose}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">实验名称</p>
                  <p className="text-sm font-medium text-neutral-900">{application.experimentName}</p>
                </div>
              </div>
              {application.rejectReason && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-danger-600 font-medium">驳回原因</p>
                      <p className="text-sm text-danger-700">{application.rejectReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>审批历史</Card.Title>
            </Card.Header>
            <Card.Content>
              {application.auditLog && application.auditLog.length > 0 ? (
                <div className="space-y-4">
                  {application.auditLog.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 pb-4 border-b border-neutral-100 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-neutral-900">{log.operatorName}</span>
                          <Badge variant={log.action === 'UPDATE' ? 'primary' : 'neutral'}>
                            {log.action}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mb-1">{formatDateTime(log.timestamp)}</p>
                        {log.newValue && (
                          <p className="text-sm text-neutral-700">{log.newValue}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">暂无审批历史</div>
              )}
            </Card.Content>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>当前状态</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center">
                <StatusTag status={application.status} className="text-base px-4 py-1" />
                <p className="mt-4 text-sm text-neutral-600">
                  {application.status === 'PENDING' && '等待管理员审核'}
                  {application.status === 'APPROVED' && '申请已通过，等待排期'}
                  {application.status === 'SCHEDULED' && '已安排使用时间'}
                  {application.status === 'COMPLETED' && '领用已完成'}
                  {application.status === 'REJECTED' && '申请已被驳回'}
                  {application.status === 'DRAFT' && '草稿状态'}
                </p>
              </div>
            </Card.Content>
          </Card>

          {user?.role === 'ADMIN' && application.status === 'PENDING' && (
            <Card>
              <Card.Header>
                <Card.Title>审核操作</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => openAuditModal('approve')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    通过申请
                  </Button>
                  <Button className="w-full" variant="danger" onClick={() => openAuditModal('reject')}>
                    <XCircle className="w-4 h-4 mr-2" />
                    驳回申请
                  </Button>
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title={auditAction === 'approve' ? '审核通过' : '审核驳回'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAuditModalOpen(false)} disabled={auditLoading}>
              取消
            </Button>
            <Button
              variant={auditAction === 'approve' ? 'primary' : 'danger'}
              onClick={handleAudit}
              loading={auditLoading}
            >
              确认{auditAction === 'approve' ? '通过' : '驳回'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            您确定要{auditAction === 'approve' ? '通过' : '驳回'}这份申请吗？
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              审核意见 {auditAction === 'reject' && <span className="text-danger-500">*</span>}
            </label>
            <Textarea
              placeholder={auditAction === 'approve' ? '请输入审核意见（可选）' : '请输入驳回原因'}
              value={auditRemark}
              onChange={(e) => setAuditRemark(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
