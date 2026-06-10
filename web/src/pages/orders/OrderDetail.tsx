import React, { useState, useEffect, useCallback } from 'react';
import {
  Descriptions,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Card,
  Steps,
  Dropdown,
  Empty,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type {
  Order,
  OrderStatus,
  ProgressStatus,
  InspectionResult,
  ShortageStatus,
  ImpactLevel,
  OrderProcess,
  DeliveryRequirement,
  ProductionProgress,
  QualityInspection,
  MaterialShortage,
  MaterialCost,
} from '@/types';
import {
  statusMap,
  urgentLevelMap,
  progressStatusMap,
  inspectionResultMap,
  shortageStatusMap,
  impactLevelMap,
} from '@/types';
import {
  getOrder,
  getStatusTransitionActions,
  executeStatusTransition,
  exportOrders,
} from '@/api';
import OrderForm from './OrderForm';

const statusColorMap: Record<OrderStatus, string> = {
  pending: 'default',
  confirmed: 'processing',
  in_production: 'blue',
  quality_check: 'cyan',
  completed: 'success',
  cancelled: 'error',
};

const progressColorMap: Record<ProgressStatus, string> = {
  pending: 'default',
  in_progress: 'processing',
  completed: 'success',
  paused: 'warning',
  delayed: 'orange',
  skipped: 'default',
  cancelled: 'error',
};

const progressStepStatus: Record<ProgressStatus, 'wait' | 'process' | 'finish' | 'error'> = {
  pending: 'wait',
  in_progress: 'process',
  completed: 'finish',
  paused: 'wait',
  delayed: 'process',
  skipped: 'finish',
  cancelled: 'error',
};

const inspectionColorMap: Record<InspectionResult, string> = {
  passed: 'success',
  failed: 'error',
  partial: 'warning',
  pending: 'default',
};

const shortageColorMap: Record<ShortageStatus, string> = {
  open: 'error',
  in_progress: 'processing',
  resolved: 'success',
  closed: 'default',
};

const impactColorMap: Record<ImpactLevel, string> = {
  low: 'default',
  medium: 'warning',
  high: 'orange',
  critical: 'error',
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const orderId = id || '';

  const fetchDetail = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await getOrder(orderId);
      setOrder(res);
    } catch (error) {
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusTransition = async (action: string) => {
    if (!order) return;
    setActionLoading(action);
    try {
      await executeStatusTransition(order.id, action);
      message.success('状态更新成功');
      fetchDetail();
    } catch (error) {
      message.error('状态更新失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    if (!order) return;
    try {
      await exportOrders({ id: order.id, orderNo: order.orderNo }, '管理员', 'admin');
      message.success('导出成功，正在下载文件...');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const renderStatusActions = () => {
    if (!order) return null;
    const actions = getStatusTransitionActions(order.status);
    if (actions.length === 0) return null;

    return (
      <>
        {actions.slice(0, 2).map((action) => (
          <Button
            key={action.key}
            type={action.danger ? 'default' : 'primary'}
            danger={action.danger}
            loading={actionLoading === action.key}
            onClick={() => handleStatusTransition(action.key)}
          >
            {action.label}
          </Button>
        ))}
        {actions.length > 2 && (
          <Dropdown
            menu={{
              items: actions.slice(2).map((action) => ({
                key: action.key,
                label: action.label,
                danger: action.danger,
                onClick: () => handleStatusTransition(action.key),
              })),
            }}
          >
            <Button>更多操作</Button>
          </Dropdown>
        )}
      </>
    );
  };

  const renderProgressSteps = () => {
    if (!order?.productionProgress?.length) {
      return <Empty description="暂无生产进度" style={{ padding: 24 }} />;
    }
    const sorted = [...order.productionProgress].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    return (
      <Steps
        direction="vertical"
        size="small"
        current={sorted.findIndex((p) => p.status === 'in_progress') >= 0
          ? sorted.findIndex((p) => p.status === 'in_progress')
          : sorted.filter((p) => p.status === 'completed').length
        }
        items={sorted.map((p) => ({
          title: (
            <Space>
              <span>{p.nodeName}</span>
              <Tag color={progressColorMap[p.status]}>{progressStatusMap[p.status]}</Tag>
            </Space>
          ),
          description: (
            <div style={{ fontSize: 12, color: '#999' }}>
              {p.startTime && `开始: ${dayjs(p.startTime).format('YYYY-MM-DD HH:mm')}`}
              {p.endTime && ` | 完成: ${dayjs(p.endTime).format('YYYY-MM-DD HH:mm')}`}
              {p.plannedQuantity != null && ` | 计划: ${p.plannedQuantity}`}
              {p.completedQuantity != null && ` / 完成: ${p.completedQuantity}`}
              {p.defectQuantity != null && p.defectQuantity > 0 && ` / 不良: ${p.defectQuantity}`}
            </div>
          ),
          status: progressStepStatus[p.status],
        }))}
      />
    );
  };

  const processColumns: ColumnsType<OrderProcess> = [
    { title: '序号', dataIndex: 'sortOrder', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '工艺名称', dataIndex: 'processName', width: 150 },
    { title: '说明', dataIndex: 'processRequirement', ellipsis: true },
    {
      title: '参数',
      dataIndex: 'processParams',
      render: (v: any) => (v ? JSON.stringify(v) : '-'),
      ellipsis: true,
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
  ];

  const deliveryColumns: ColumnsType<DeliveryRequirement> = [
    { title: '序号', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '类型', dataIndex: 'requirementType', width: 120 },
    { title: '要求内容', dataIndex: 'requirementContent', ellipsis: true },
    {
      title: '是否强制',
      dataIndex: 'isMandatory',
      width: 100,
      render: (v: boolean) => (v ? <Tag color="red">是</Tag> : <Tag>否</Tag>),
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
  ];

  const progressColumns: ColumnsType<ProductionProgress> = [
    { title: '序号', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '节点名称', dataIndex: 'nodeName', width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: ProgressStatus) => (
        <Tag color={progressColorMap[s]}>{progressStatusMap[s]}</Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 160,
      render: (v: string | Date | undefined) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 160,
      render: (v: string | Date | undefined) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    { title: '计划数量', dataIndex: 'plannedQuantity', width: 90 },
    { title: '完成数量', dataIndex: 'completedQuantity', width: 90 },
    { title: '不良数量', dataIndex: 'defectQuantity', width: 90 },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
  ];

  const inspectionColumns: ColumnsType<QualityInspection> = [
    { title: '序号', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '检验类型', dataIndex: 'inspectionType', width: 120 },
    { title: '检验项目', dataIndex: 'inspectionItem', width: 150 },
    { title: '抽检数', dataIndex: 'inspectedQuantity', width: 80 },
    { title: '合格数', dataIndex: 'passedQuantity', width: 80 },
    { title: '不合格数', dataIndex: 'failedQuantity', width: 80 },
    {
      title: '合格率',
      dataIndex: 'passRate',
      width: 90,
      render: (v: number | undefined) => (v != null ? `${Number(v).toFixed(1)}%` : '-'),
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 100,
      render: (r: InspectionResult) => (
        <Tag color={inspectionColorMap[r]}>{inspectionResultMap[r]}</Tag>
      ),
    },
    { title: '检验员', dataIndex: 'inspector', width: 100 },
    {
      title: '检验时间',
      dataIndex: 'inspectionTime',
      width: 160,
      render: (v: string | Date | undefined) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    { title: '不良描述', dataIndex: 'defectDescription', ellipsis: true },
  ];

  const shortageColumns: ColumnsType<MaterialShortage> = [
    { title: '序号', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '物料名称', dataIndex: 'materialName', width: 140 },
    { title: '规格', dataIndex: 'materialSpec', width: 140 },
    { title: '需求数量', dataIndex: 'requiredQuantity', width: 100 },
    { title: '可用数量', dataIndex: 'availableQuantity', width: 100 },
    { title: '缺料数量', dataIndex: 'shortageQuantity', width: 100 },
    {
      title: '影响级别',
      dataIndex: 'impactLevel',
      width: 100,
      render: (l: ImpactLevel) => (
        <Tag color={impactColorMap[l]}>{impactLevelMap[l]}</Tag>
      ),
    },
    { title: '责任人', dataIndex: 'responsiblePerson', width: 100 },
    { title: '影响范围', dataIndex: 'impactScope', ellipsis: true },
    { title: '解决路径', dataIndex: 'resolutionPath', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: ShortageStatus) => (
        <Tag color={shortageColorMap[s]}>{shortageStatusMap[s]}</Tag>
      ),
    },
  ];

  const costColumns: ColumnsType<MaterialCost> = [
    { title: '序号', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '物料名称', dataIndex: 'materialName', width: 140 },
    { title: '规格', dataIndex: 'materialSpec', width: 140 },
    { title: '用量', dataIndex: 'quantityUsed', width: 100, render: (v: number, r: MaterialCost) => `${v}${r.unit || ''}` },
    { title: '单价', dataIndex: 'unitCost', width: 100, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '总成本', dataIndex: 'totalCost', width: 120, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    {
      title: '成本日期',
      dataIndex: 'costDate',
      width: 120,
      render: (v: string | Date | undefined) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
  ];

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!order) {
    return <Empty description="订单不存在" style={{ padding: 100 }} />;
  }

  const totalCost = order.materialCosts?.reduce((sum, c) => sum + Number(c.totalCost || 0), 0) || 0;

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
              返回
            </Button>
            <span>订单详情 - {order.orderNo}</span>
            <Tag color={statusColorMap[order.status]}>{statusMap[order.status]}</Tag>
            {order.urgentLevel > 0 && (
              <Tag color="orange">紧急程度: {urgentLevelMap[order.urgentLevel]}</Tag>
            )}
          </Space>
        }
        extra={
          <Space wrap>
            {renderStatusActions()}
            <Button
              icon={<EditOutlined />}
              disabled={order.status === 'completed' || order.status === 'cancelled'}
              onClick={() => setEditModalOpen(true)}
            >
              编辑
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="客户名称">
            {order.customer?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="业务员">
            {order.salesperson?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="产品名称">{order.productName}</Descriptions.Item>
          <Descriptions.Item label="产品规格">{order.productSpec || '-'}</Descriptions.Item>
          <Descriptions.Item label="数量">
            {order.quantity}{order.unit || ''}
          </Descriptions.Item>
          <Descriptions.Item label="单价">
            {order.unitPrice != null ? `¥${Number(order.unitPrice).toFixed(2)}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="总金额">
            {order.totalAmount != null ? `¥${Number(order.totalAmount).toFixed(2)}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="下单日期">
            {dayjs(order.orderDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="交货日期">
            {dayjs(order.deliveryDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="送货地址">
            {order.deliveryAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="紧急程度" span={3}>
            {urgentLevelMap[order.urgentLevel] || '普通'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>
            {order.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="生产进度" style={{ marginBottom: 16 }}>
        {renderProgressSteps()}
      </Card>

      <Card>
        <Tabs
          items={[
            {
              key: 'processes',
              label: `工艺信息 (${order.processes?.length || 0})`,
              children: (
                <Table<OrderProcess>
                  rowKey="id"
                  size="small"
                  columns={processColumns}
                  dataSource={order.processes || []}
                  pagination={false}
                  locale={{ emptyText: '暂无工艺信息' }}
                />
              ),
            },
            {
              key: 'delivery',
              label: `交付要求 (${order.deliveryRequirements?.length || 0})`,
              children: (
                <Table<DeliveryRequirement>
                  rowKey="id"
                  size="small"
                  columns={deliveryColumns}
                  dataSource={order.deliveryRequirements || []}
                  pagination={false}
                  locale={{ emptyText: '暂无交付要求' }}
                />
              ),
            },
            {
              key: 'progress',
              label: `生产进度明细 (${order.productionProgress?.length || 0})`,
              children: (
                <Table<ProductionProgress>
                  rowKey="id"
                  size="small"
                  columns={progressColumns}
                  dataSource={[...(order.productionProgress || [])].sort(
                    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
                  )}
                  scroll={{ x: 1200 }}
                  pagination={false}
                  locale={{ emptyText: '暂无生产进度明细' }}
                />
              ),
            },
            {
              key: 'quality',
              label: `质检记录 (${order.qualityInspections?.length || 0})`,
              children: (
                <Table<QualityInspection>
                  rowKey="id"
                  size="small"
                  columns={inspectionColumns}
                  dataSource={order.qualityInspections || []}
                  scroll={{ x: 1400 }}
                  pagination={false}
                  locale={{ emptyText: '暂无质检记录' }}
                />
              ),
            },
            {
              key: 'shortage',
              label: `缺料记录 (${order.materialShortages?.length || 0})`,
              children: (
                <Table<MaterialShortage>
                  rowKey="id"
                  size="small"
                  columns={shortageColumns}
                  dataSource={order.materialShortages || []}
                  scroll={{ x: 1600 }}
                  pagination={false}
                  locale={{ emptyText: '暂无缺料记录' }}
                />
              ),
            },
            {
              key: 'cost',
              label: `耗材成本 (${order.materialCosts?.length || 0}) 总计: ¥${totalCost.toFixed(2)}`,
              children: (
                <Table<MaterialCost>
                  rowKey="id"
                  size="small"
                  columns={costColumns}
                  dataSource={order.materialCosts || []}
                  scroll={{ x: 1200 }}
                  pagination={false}
                  locale={{ emptyText: '暂无耗材成本记录' }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="编辑订单"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        width={1000}
        destroyOnClose
        footer={null}
      >
        <OrderForm
          initialData={order}
          onSuccess={() => {
            setEditModalOpen(false);
            fetchDetail();
          }}
          onCancel={() => setEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default OrderDetail;
