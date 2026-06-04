import { useState } from 'react';
import { Descriptions, Card, Space, Button, Tag, Divider, message, Modal, Select } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { requirementService } from '../../services/requirementService';
import { quoteService } from '../../services/quoteService';
import { CustomerRequirement, RequirementStatus, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { Option } = Select;

const statusColors: Record<RequirementStatus, string> = {
  [RequirementStatus.DRAFT]: 'default',
  [RequirementStatus.SUBMITTED]: 'blue',
  [RequirementStatus.IN_PROGRESS]: 'processing',
  [RequirementStatus.QUOTED]: 'cyan',
  [RequirementStatus.CONFIRMED]: 'success',
  [RequirementStatus.CANCELLED]: 'error',
};

const statusText: Record<RequirementStatus, string> = {
  [RequirementStatus.DRAFT]: '草稿',
  [RequirementStatus.SUBMITTED]: '已提交',
  [RequirementStatus.IN_PROGRESS]: '处理中',
  [RequirementStatus.QUOTED]: '已报价',
  [RequirementStatus.CONFIRMED]: '已确认',
  [RequirementStatus.CANCELLED]: '已取消',
};

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const { data: requirement, isLoading } = useQuery(
    ['requirement', id],
    () => requirementService.getById(id!),
    { enabled: !!id }
  );

  const submitMutation = useMutation(() => requirementService.submit(id!), {
    onSuccess: () => {
      message.success('需求已提交');
      queryClient.invalidateQueries(['requirement', id]);
    },
    onError: () => message.error('提交失败'),
  });

  const createQuoteMutation = useMutation(() => quoteService.create(id!), {
    onSuccess: (response) => {
      message.success('报价单已创建');
      navigate(`/quotes/${response.data.id}/edit`);
    },
    onError: () => message.error('创建报价单失败'),
  });

  const assignMutation = useMutation((userId: string) => requirementService.assign(id!, userId), {
    onSuccess: () => {
      message.success('分配成功');
      setAssignModalVisible(false);
      queryClient.invalidateQueries(['requirement', id]);
    },
    onError: () => message.error('分配失败'),
  });

  const canEdit = requirement?.data.status === RequirementStatus.DRAFT;
  const canSubmit = requirement?.data.status === RequirementStatus.DRAFT;
  const canCreateQuote = [RequirementStatus.IN_PROGRESS, RequirementStatus.SUBMITTED].includes(
    requirement?.data.status as RequirementStatus
  );
  const canAssign = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.PRODUCT_MANAGER].includes(
    user?.role as UserRole
  );

  if (isLoading) return <div>加载中...</div>;
  if (!requirement?.data) return <div>需求不存在</div>;

  const req = requirement.data;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/requirements')}>
          返回列表
        </Button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>需求详情</span>
        <Tag color={statusColors[req.status]}>{statusText[req.status]}</Tag>
      </Space>

      <Card>
        <Descriptions title="客户信息" bordered column={2}>
          <Descriptions.Item label="客户姓名">{req.customerName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{req.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{req.customerEmail || '-'}</Descriptions.Item>
          <Descriptions.Item label="公司名称">{req.customerCompany || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Descriptions title="行程信息" bordered column={2}>
          <Descriptions.Item label="出行类型">{req.tripType}</Descriptions.Item>
          <Descriptions.Item label="目的地">{req.destination}</Descriptions.Item>
          <Descriptions.Item label="总人数">{req.travelerCount}人</Descriptions.Item>
          <Descriptions.Item label="成人/儿童">{req.adultCount} / {req.childCount}</Descriptions.Item>
          <Descriptions.Item label="预计出发日期">
            {req.startDate ? dayjs(req.startDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="行程天数">{req.durationDays}天</Descriptions.Item>
          <Descriptions.Item label="预算范围" span={2}>
            {req.budgetRangeMin && req.budgetRangeMax
              ? `¥${req.budgetRangeMin.toLocaleString()} - ¥${req.budgetRangeMax.toLocaleString()}`
              : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Descriptions title="详细需求" bordered column={1}>
          <Descriptions.Item label="酒店要求">{req.hotelRequirements || '-'}</Descriptions.Item>
          <Descriptions.Item label="交通需求">{req.transportationNeeds || '-'}</Descriptions.Item>
          <Descriptions.Item label="想去的景点">{req.attractions || '-'}</Descriptions.Item>
          <Descriptions.Item label="餐饮偏好">{req.diningPreferences || '-'}</Descriptions.Item>
          <Descriptions.Item label="特殊要求">{req.specialRequirements || '-'}</Descriptions.Item>
          <Descriptions.Item label="内部备注">{req.internalNotes || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Descriptions title="其他信息" bordered column={2}>
          <Descriptions.Item label="负责人">{req.assignedTo?.name || '未分配'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(req.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Space>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/requirements/${id}/edit`)}>
              编辑
            </Button>
          )}
          {canSubmit && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => submitMutation.mutate()}>
              提交需求
            </Button>
          )}
          {canAssign && (
            <Button onClick={() => setAssignModalVisible(true)}>分配负责人</Button>
          )}
          {canCreateQuote && (
            <Button type="primary" onClick={() => createQuoteMutation.mutate()}>
              创建报价单
            </Button>
          )}
          {req.quotes && req.quotes.length > 0 && (
            <Button onClick={() => navigate(`/quotes?requirementId=${id}`)}>
              查看报价单 ({req.quotes.length})
            </Button>
          )}
        </Space>
      </Card>

      <Modal
        title="分配负责人"
        open={assignModalVisible}
        onOk={() => assignMutation.mutate(selectedUserId)}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={assignMutation.isLoading}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="请选择负责人"
          value={selectedUserId}
          onChange={setSelectedUserId}
        >
          <Option value="user1">产品经理小李</Option>
          <Option value="user2">产品经理小王</Option>
        </Select>
      </Modal>
    </div>
  );
}
