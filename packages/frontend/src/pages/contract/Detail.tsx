import { useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Typography,
  Divider,
  List,
  Modal,
  Input,
  message,
  Steps,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { contractService } from '../../services/contractService';
import { ContractStatus, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusColors: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: 'default',
  [ContractStatus.PENDING_APPROVAL]: 'orange',
  [ContractStatus.APPROVED]: 'success',
  [ContractStatus.REJECTED]: 'error',
  [ContractStatus.SIGNED]: 'green',
  [ContractStatus.CANCELLED]: 'default',
};

const statusText: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: '草稿',
  [ContractStatus.PENDING_APPROVAL]: '待审批',
  [ContractStatus.APPROVED]: '已通过',
  [ContractStatus.REJECTED]: '已拒绝',
  [ContractStatus.SIGNED]: '已签署',
  [ContractStatus.CANCELLED]: '已取消',
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useQuery(['contract', id], () => contractService.getById(id!), {
    enabled: !!id,
  });

  const contract = data?.data;

  const submitMutation = useMutation(() => contractService.submitForApproval(id!), {
    onSuccess: () => {
      message.success('已提交审批');
      queryClient.invalidateQueries(['contract', id]);
    },
  });

  const approveMutation = useMutation(() => contractService.approve(id!), {
    onSuccess: () => {
      message.success('已通过审批');
      queryClient.invalidateQueries(['contract', id]);
    },
  });

  const rejectMutation = useMutation(() => contractService.reject(id!, rejectReason), {
    onSuccess: () => {
      message.success('已拒绝');
      setRejectModalOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries(['contract', id]);
    },
  });

  const signMutation = useMutation(() => contractService.markSigned(id!, dayjs().toISOString()), {
    onSuccess: () => {
      message.success('合同已签署');
      queryClient.invalidateQueries(['contract', id]);
    },
  });

  const cancelMutation = useMutation(() => contractService.cancel(id!, cancelReason), {
    onSuccess: () => {
      message.success('合同已取消');
      setCancelModalOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries(['contract', id]);
    },
  });

  const canApprove = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE].includes(
    user?.role as UserRole
  );
  const canEdit = [ContractStatus.DRAFT, ContractStatus.REJECTED].includes(contract?.status!);
  const canSign = contract?.status === ContractStatus.APPROVED;

  const getStepStatus = (status: ContractStatus) => {
    if (status === ContractStatus.REJECTED || status === ContractStatus.CANCELLED) return 'error';
    return 'finish';
  };

  const getCurrentStep = (status: ContractStatus) => {
    const steps = [
      ContractStatus.DRAFT,
      ContractStatus.PENDING_APPROVAL,
      ContractStatus.APPROVED,
      ContractStatus.SIGNED,
    ];
    return steps.indexOf(status);
  };

  if (isLoading) return <div>加载中...</div>;
  if (!contract) return <div>合同不存在</div>;

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Space>
            <Button onClick={() => navigate('/contracts')}>返回列表</Button>
            <Title level={4} style={{ margin: 0 }}>
              合同详情
            </Title>
          </Space>
          <Space>
            {canEdit && (
              <Button type="primary" onClick={() => submitMutation.mutate()}>
                提交审批
              </Button>
            )}
            {contract.status === ContractStatus.PENDING_APPROVAL && canApprove && (
              <>
                <Button type="primary" onClick={() => approveMutation.mutate()}>
                  通过
                </Button>
                <Button danger onClick={() => setRejectModalOpen(true)}>
                  拒绝
                </Button>
              </>
            )}
            {canSign && (
              <Button type="primary" onClick={() => signMutation.mutate()}>
                标记已签署
              </Button>
            )}
            {[ContractStatus.DRAFT, ContractStatus.PENDING_APPROVAL].includes(contract.status) && (
              <Button danger onClick={() => setCancelModalOpen(true)}>
                取消合同
              </Button>
            )}
          </Space>
        </div>

        <div style={{ marginBottom: 32 }}>
          <Steps current={getCurrentStep(contract.status)} status={getStepStatus(contract.status)}>
            <Steps.Step title="创建" description="合同草稿" />
            <Steps.Step title="审批" description="主管审核" />
            <Steps.Step title="通过" description="审核通过" />
            <Steps.Step title="签署" description="客户签署" />
          </Steps>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="合同编号">{contract.contractNumber}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColors[contract.status]}>{statusText[contract.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="客户名称">{contract.customerName}</Descriptions.Item>
          <Descriptions.Item label="关联报价">
            <a onClick={() => navigate(`/quotes/${contract.quoteId}`)}>
              {contract.quote?.itineraryName || '查看'}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="合同金额">
            <Text strong style={{ fontSize: 16 }}>
              ¥{contract.quote?.totalPrice.toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(contract.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">付款节点</Divider>

        <List
          bordered
          dataSource={contract.paymentTerms || []}
          renderItem={(term: any) => (
            <List.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>{term.description}</span>
                <Space>
                  <Tag>{term.percentage}%</Tag>
                  <Text strong>¥{term.amount.toLocaleString()}</Text>
                  <Tag color={term.status === 'paid' ? 'success' : 'default'}>
                    {term.status === 'paid' ? '已付款' : '待付款'}
                  </Tag>
                </Space>
              </Space>
            </List.Item>
          )}
        />

        {contract.approvalComments && (
          <>
            <Divider orientation="left">审批意见</Divider>
            <Card type="inner" size="small">
              {contract.approvalComments}
            </Card>
          </>
        )}
      </Card>

      <Modal
        title="拒绝合同"
        open={rejectModalOpen}
        onOk={() => rejectMutation.mutate()}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={rejectMutation.isLoading}
      >
        <TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Modal
        title="取消合同"
        open={cancelModalOpen}
        onOk={() => cancelMutation.mutate()}
        onCancel={() => setCancelModalOpen(false)}
        confirmLoading={cancelMutation.isLoading}
      >
        <TextArea
          rows={4}
          placeholder="请输入取消原因"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
