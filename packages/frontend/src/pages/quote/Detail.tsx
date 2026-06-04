import { useState } from 'react';
import { Descriptions, Card, Space, Button, Tag, Divider, Table, Statistic, Row, Col, message, Modal, Input } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { quoteService } from '../../services/quoteService';
import { Quote, QuoteStatus, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusColors: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: 'default',
  [QuoteStatus.PENDING_APPROVAL]: 'orange',
  [QuoteStatus.APPROVED]: 'success',
  [QuoteStatus.REJECTED]: 'error',
  [QuoteStatus.SENT_TO_CUSTOMER]: 'cyan',
  [QuoteStatus.ACCEPTED]: 'green',
  [QuoteStatus.DECLINED]: 'red',
  [QuoteStatus.OBSOLETE]: 'default',
};

const statusText: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: '草稿',
  [QuoteStatus.PENDING_APPROVAL]: '待审批',
  [QuoteStatus.APPROVED]: '已通过',
  [QuoteStatus.REJECTED]: '已拒绝',
  [QuoteStatus.SENT_TO_CUSTOMER]: '已发送',
  [QuoteStatus.ACCEPTED]: '已接受',
  [QuoteStatus.DECLINED]: '已拒绝',
  [QuoteStatus.OBSOLETE]: '已废弃',
};

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [newVersionModalVisible, setNewVersionModalVisible] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');

  const { data: quote, isLoading } = useQuery(
    ['quote', id],
    () => quoteService.getById(id!),
    { enabled: !!id }
  );

  const approveMutation = useMutation((comments?: string) => quoteService.approve(id!, comments), {
    onSuccess: () => {
      message.success('已通过审批');
      queryClient.invalidateQueries(['quote', id]);
    },
  });

  const rejectMutation = useMutation((comments: string) => quoteService.reject(id!, comments), {
    onSuccess: () => {
      message.success('已拒绝');
      queryClient.invalidateQueries(['quote', id]);
      setRejectModalVisible(false);
    },
  });

  const sendMutation = useMutation(() => quoteService.sendToCustomer(id!), {
    onSuccess: () => {
      message.success('已发送给客户');
      queryClient.invalidateQueries(['quote', id]);
    },
  });

  const newVersionMutation = useMutation((desc: string) => quoteService.createNewVersion(id!, desc), {
    onSuccess: () => {
      message.success('已创建新版本');
      queryClient.invalidateQueries(['quote', id]);
      setNewVersionModalVisible(false);
      navigate(`/quotes/${id}/edit`);
    },
  });

  const isSupervisor = [UserRole.ADMIN, UserRole.SUPERVISOR].includes(user?.role as UserRole);
  const isSalesOrPM = [UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER].includes(user?.role as UserRole);

  if (isLoading) return <div>加载中...</div>;
  if (!quote?.data) return <div>报价单不存在</div>;

  const q = quote.data;

  const itemColumns = [
    { title: '项目', dataIndex: 'name', key: 'name' },
    { title: '数量/天数', dataIndex: 'qty', key: 'qty' },
    { title: '单价', dataIndex: 'price', key: 'price', render: (p: number) => `¥${p?.toLocaleString() || 0}` },
    { title: '小计', dataIndex: 'total', key: 'total', render: (p: number) => `¥${p?.toLocaleString() || 0}` },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotes')}>
          返回列表
        </Button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>报价详情</span>
        <Tag color={statusColors[q.status]}>{statusText[q.status]}</Tag>
        <Tag>v{q.version}</Tag>
      </Space>

      <Row gutter={24}>
        <Col span={18}>
          <Card title="基本信息">
            <Descriptions column={2}>
              <Descriptions.Item label="行程名称">{q.itineraryName}</Descriptions.Item>
              <Descriptions.Item label="关联需求">
                {q.requirement?.customerName} - {q.requirement?.destination}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">
                {q.travelStartDate ? dayjs(q.travelStartDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束日期">
                {q.travelEndDate ? dayjs(q.travelEndDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批人">{q.approvedBy?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批时间">
                {q.approvedAt ? dayjs(q.approvedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              {q.approvalComments && (
                <Descriptions.Item label="审批意见" span={2}>
                  {q.approvalComments}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {q.hotels && q.hotels.length > 0 && (
            <Card title="酒店" style={{ marginTop: 16 }}>
              <Table
                dataSource={q.hotels.map((h, i) => ({
                  key: i,
                  name: h.name,
                  qty: `${h.nights}晚`,
                  price: h.costPerNight,
                  total: h.totalCost,
                  supplier: h.supplier,
                }))}
                columns={itemColumns}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {q.transportation && q.transportation.length > 0 && (
            <Card title="交通" style={{ marginTop: 16 }}>
              <Table
                dataSource={q.transportation.map((t, i) => ({
                  key: i,
                  name: `${t.type} - ${t.description} (${t.vehicleType})`,
                  qty: `${t.days}天`,
                  price: t.costPerDay,
                  total: t.totalCost,
                  supplier: t.supplier,
                }))}
                columns={itemColumns}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {q.tickets && q.tickets.length > 0 && (
            <Card title="门票" style={{ marginTop: 16 }}>
              <Table
                dataSource={q.tickets.map((t, i) => ({
                  key: i,
                  name: t.attraction,
                  qty: `${t.quantity}张`,
                  price: t.costPerTicket,
                  total: t.totalCost,
                  supplier: t.supplier,
                }))}
                columns={itemColumns}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {q.remarks && (
            <Card title="备注" style={{ marginTop: 16 }}>
              <p>{q.remarks}</p>
            </Card>
          )}
        </Col>

        <Col span={6}>
          <Card title="费用汇总">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic title="总成本" value={q.totalCost} prefix="¥" />
              <Statistic title="服务费(毛利)" value={q.serviceFee} prefix="¥" />
              <Divider style={{ margin: '12px 0' }} />
              <Statistic title="总价" value={q.totalPrice} prefix="¥" />
              <Statistic
                title="毛利率"
                value={q.profitMargin}
                suffix="%"
                valueStyle={{ color: q.profitMargin < 10 ? '#fa8c16' : '#3f8600' }}
              />
            </Space>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              {[QuoteStatus.DRAFT, QuoteStatus.REJECTED].includes(q.status) && isSalesOrPM && (
                <>
                  <Button type="primary" block onClick={() => navigate(`/quotes/${id}/edit`)}>
                    <EditOutlined /> 编辑报价
                  </Button>
                  <Button type="primary" block danger={q.profitMargin < 10} onClick={() => navigate(`/quotes/${id}/edit`)}>
                    提交审批
                  </Button>
                </>
              )}

              {q.status === QuoteStatus.PENDING_APPROVAL && isSupervisor && (
                <>
                  <Button type="primary" block onClick={() => approveMutation.mutate()}>
                    <CheckCircleOutlined /> 通过审批
                  </Button>
                  <Button danger block onClick={() => setRejectModalVisible(true)}>
                    <CloseCircleOutlined /> 拒绝
                  </Button>
                </>
              )}

              {q.status === QuoteStatus.APPROVED && isSalesOrPM && (
                <Button type="primary" block onClick={() => sendMutation.mutate()}>
                  <SendOutlined /> 发送给客户
                </Button>
              )}

              {q.status !== QuoteStatus.DRAFT && (
                <Button block onClick={() => setNewVersionModalVisible(true)}>
                  创建新版本
                </Button>
              )}

              {q.version > 1 && (
                <Button block onClick={() => navigate(`/quotes/${id}/compare`)}>
                  版本对比
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={() => rejectMutation.mutate(rejectReason)}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={rejectMutation.isLoading}
      >
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
        />
      </Modal>

      <Modal
        title="创建新版本"
        open={newVersionModalVisible}
        onOk={() => newVersionMutation.mutate(versionDescription)}
        onCancel={() => setNewVersionModalVisible(false)}
        confirmLoading={newVersionMutation.isLoading}
      >
        <TextArea
          rows={3}
          value={versionDescription}
          onChange={(e) => setVersionDescription(e.target.value)}
          placeholder="请描述新版本变更内容"
        />
      </Modal>
    </div>
  );
}
