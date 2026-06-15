import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Timeline,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Table,
  Space,
  Divider,
  Row,
  Col,
  message,
  Tabs,
  Steps,
  Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import {
  orderApi,
  equipmentApi,
  qualityApi,
  storeApi
} from '@/services/api';
import {
  OrderDetailDto,
  ProductionProgressDto,
  UpdateProductionProgressDto,
  ProductionStatus,
  EquipmentDto,
  CreateQualityInspectionDto,
  CreateQualityIssueDto,
  InspectionResult,
  QualityIssueStatus,
  OrderStatus
} from '@/types';
import {
  formatDate,
  formatCurrency,
  getStatusText,
  getStatusColor,
  getProductionStatusText,
  getProductionStatusColor
} from '@/utils/format';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState<EquipmentDto[]>([]);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<ProductionProgressDto | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  const [progressForm] = Form.useForm();
  const [inspectionForm] = Form.useForm();
  const [issueForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadOrderDetail(parseInt(id));
      loadEquipments();
    }
  }, [id]);

  const loadOrderDetail = async (orderId: number) => {
    setLoading(true);
    try {
      const response = await orderApi.getDetail(orderId);
      setOrder(response.data);
    } catch (error) {
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipments = async () => {
    try {
      const response = await equipmentApi.getList();
      setEquipments(response.data);
    } catch (error) {
      console.error('加载设备列表失败', error);
    }
  };

  const handleUpdateProgress = async (values: any) => {
    if (!selectedProgress) return;
    
    const updateData: UpdateProductionProgressDto = {
      id: selectedProgress.id,
      status: values.status,
      startTime: values.startTime ? values.startTime.toISOString() : null,
      endTime: values.endTime ? values.endTime.toISOString() : null,
      operator: values.operator,
      remarks: values.remarks,
      equipmentId: values.equipmentId
    };

    try {
      await orderApi.updateProgress(updateData);
      message.success('生产进度更新成功');
      setProgressModalVisible(false);
      progressForm.resetFields();
      if (id) loadOrderDetail(parseInt(id));
    } catch (error) {
      message.error('更新生产进度失败');
    }
  };

  const handleCreateInspection = async (values: any) => {
    if (!order) return;

    const inspectionData: CreateQualityInspectionDto = {
      orderId: order.id,
      inspector: values.inspector,
      inspectionDate: values.inspectionDate.toISOString(),
      result: values.result,
      inspectedQuantity: values.inspectedQuantity,
      passedQuantity: values.passedQuantity,
      failedQuantity: values.failedQuantity,
      checkItems: values.checkItems,
      remarks: values.remarks
    };

    try {
      const response = await qualityApi.createInspection(inspectionData);
      message.success('质检记录创建成功');
      setInspectionModalVisible(false);
      inspectionForm.resetFields();
      
      if (values.result === InspectionResult.Fail || values.result === InspectionResult.PartialPass) {
        setSelectedInspectionId(response.data.id);
        setIssueModalVisible(true);
      } else if (id) {
        loadOrderDetail(parseInt(id));
      }
    } catch (error) {
      message.error('创建质检记录失败');
    }
  };

  const handleCreateIssue = async (values: any) => {
    if (!selectedInspectionId) return;

    const issueData: CreateQualityIssueDto = {
      qualityInspectionId: selectedInspectionId,
      affectedScope: values.affectedScope,
      issueDescription: values.issueDescription,
      rootCause: values.rootCause,
      handlingPath: values.handlingPath,
      correctiveAction: values.correctiveAction,
      preventiveAction: values.preventiveAction,
      reviewNotes: values.reviewNotes,
      status: values.status,
      handler: values.handler,
      reviewer: values.reviewer
    };

    try {
      await qualityApi.createIssue(issueData);
      message.success('质检问题记录成功');
      setIssueModalVisible(false);
      issueForm.resetFields();
      setSelectedInspectionId(null);
      if (id) loadOrderDetail(parseInt(id));
    } catch (error) {
      message.error('记录质检问题失败');
    }
  };

  const openProgressModal = (progress: ProductionProgressDto) => {
    setSelectedProgress(progress);
    progressForm.setFieldsValue({
      status: progress.status,
      startTime: progress.startTime ? dayjs(progress.startTime) : null,
      endTime: progress.endTime ? dayjs(progress.endTime) : null,
      operator: progress.operator,
      remarks: progress.remarks,
      equipmentId: progress.equipmentId
    });
    setProgressModalVisible(true);
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    const progresses = [...order.productionProgresses].sort((a, b) => a.id - b.id);
    const completedIndex = progresses.findIndex(p => p.status !== ProductionStatus.Completed && p.status !== ProductionStatus.Skipped);
    return completedIndex === -1 ? progresses.length : completedIndex;
  };

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: '基本信息',
      children: order && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="订单信息" bordered={false}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单编号">{order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getStatusColor(order.status)}>{getStatusText(order.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="门店">{order.storeName}</Descriptions.Item>
              <Descriptions.Item label="客户">{order.customerName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{order.customerPhone}</Descriptions.Item>
              <Descriptions.Item label="产品名称">{order.productName}</Descriptions.Item>
              <Descriptions.Item label="规格">{order.specifications}</Descriptions.Item>
              <Descriptions.Item label="数量">{order.quantity} {order.unit}</Descriptions.Item>
              <Descriptions.Item label="单价">{formatCurrency(order.unitPrice)}</Descriptions.Item>
              <Descriptions.Item label="总金额">{formatCurrency(order.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="下单日期">{formatDate(order.orderDate)}</Descriptions.Item>
              <Descriptions.Item label="交付日期">{formatDate(order.deliveryDate)}</Descriptions.Item>
              <Descriptions.Item label="材质要求">{order.materialRequirements}</Descriptions.Item>
              <Descriptions.Item label="特殊要求">{order.specialRequirements}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{order.remarks || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="交付跟踪" bordered={false} extra={
            <Button type="primary" size="small" icon={<SettingOutlined />}>
              维护交付
            </Button>
          }>
            {order.deliveryTrackings.length > 0 ? (
              <Timeline>
                {order.deliveryTrackings.map((track) => (
                  <Timeline.Item key={track.id}>
                    <Space>
                      <Tag>{track.status}</Tag>
                      <span>{formatDate(track.createdAt)}</span>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      {track.scheduledDeliveryDate && (
                        <div>预计交付: {formatDate(track.scheduledDeliveryDate)}</div>
                      )}
                      {track.actualDeliveryDate && (
                        <div>实际交付: {formatDate(track.actualDeliveryDate)}</div>
                      )}
                      {track.deliveryMethod && <div>配送方式: {track.deliveryMethod}</div>}
                      {track.trackingNo && <div>物流单号: {track.trackingNo}</div>}
                      {track.receiver && <div>收件人: {track.receiver} ({track.receiverPhone})</div>}
                      {track.remarks && <div>备注: {track.remarks}</div>}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无交付记录
              </div>
            )}
          </Card>
        </Space>
      )
    },
    {
      key: '2',
      label: '生产进度',
      children: order && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="生产流程" bordered={false}>
            <Steps
              direction="vertical"
              current={getCurrentStep()}
              items={order.productionProgresses
                .sort((a, b) => a.id - b.id)
                .map((progress) => ({
                  title: (
                    <Space>
                      {progress.productionNodeName}
                      <Tag color={getProductionStatusColor(progress.status)}>
                        {getProductionStatusText(progress.status)}
                      </Tag>
                      {progress.equipmentName && (
                        <Tag color="blue">设备: {progress.equipmentName}</Tag>
                      )}
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openProgressModal(progress)}
                      >
                        维护
                      </Button>
                    </Space>
                  ),
                  description: (
                    <div>
                      {progress.startTime && (
                        <div>开始时间: {formatDate(progress.startTime)}</div>
                      )}
                      {progress.endTime && (
                        <div>结束时间: {formatDate(progress.endTime)}</div>
                      )}
                      {progress.operator && (
                        <div>操作人员: {progress.operator}</div>
                      )}
                      {progress.remarks && (
                        <div>备注: {progress.remarks}</div>
                      )}
                    </div>
                  ),
                  status: progress.status === ProductionStatus.Completed ? 'finish' :
                          progress.status === ProductionStatus.InProgress ? 'process' :
                          progress.status === ProductionStatus.Skipped ? 'finish' : 'wait'
                }))}
            />
          </Card>

          <Card title="设备分配" bordered={false}>
            {order.equipmentAssignments.length > 0 ? (
              <Table
                size="small"
                dataSource={order.equipmentAssignments}
                rowKey="id"
                pagination={false}
              >
                <Table.Column title="设备名称" dataIndex="equipmentName" />
                <Table.Column title="生产节点" dataIndex="productionNodeName" />
                <Table.Column title="分配时间" dataIndex="assignTime" render={formatDate} />
                <Table.Column title="释放时间" dataIndex="releaseTime" render={(t) => t ? formatDate(t) : '-'} />
                <Table.Column title="操作人员" dataIndex="operator" />
              </Table>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无设备分配记录
              </div>
            )}
          </Card>
        </Space>
      )
    },
    {
      key: '3',
      label: '质检记录',
      children: order && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card 
            title="质检记录" 
            bordered={false}
            extra={
              <Button type="primary" onClick={() => setInspectionModalVisible(true)}>
                新增质检
              </Button>
            }
          >
            {order.qualityInspections.length > 0 ? (
              <Table
                size="small"
                dataSource={order.qualityInspections}
                rowKey="id"
                expandable={{
                  expandedRowRender: (record) => (
                    record.qualityIssue ? (
                      <Card size="small" title="质检问题详情" type="inner">
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="影响范围">{record.qualityIssue.affectedScope}</Descriptions.Item>
                          <Descriptions.Item label="问题状态">
                            <Tag color={record.qualityIssue.status === QualityIssueStatus.Closed ? 'green' : 'orange'}>
                              {record.qualityIssue.status}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="问题描述" span={2}>{record.qualityIssue.issueDescription}</Descriptions.Item>
                          <Descriptions.Item label="根本原因" span={2}>{record.qualityIssue.rootCause}</Descriptions.Item>
                          <Descriptions.Item label="处理路径" span={2}>{record.qualityIssue.handlingPath}</Descriptions.Item>
                          <Descriptions.Item label="纠正措施" span={2}>{record.qualityIssue.correctiveAction}</Descriptions.Item>
                          <Descriptions.Item label="预防措施" span={2}>{record.qualityIssue.preventiveAction}</Descriptions.Item>
                          <Descriptions.Item label="复盘备注" span={2}>{record.qualityIssue.reviewNotes}</Descriptions.Item>
                          <Descriptions.Item label="处理人">{record.qualityIssue.handler}</Descriptions.Item>
                          <Descriptions.Item label="审核人">{record.qualityIssue.reviewer}</Descriptions.Item>
                        </Descriptions>
                      </Card>
                    ) : null
                  )
                }}
              >
                <Table.Column title="质检日期" dataIndex="inspectionDate" render={formatDate} />
                <Table.Column title="检验员" dataIndex="inspector" />
                <Table.Column 
                  title="结果" 
                  dataIndex="result" 
                  render={(result) => (
                    <Tag color={
                      result === InspectionResult.Pass ? 'green' :
                      result === InspectionResult.Fail ? 'red' :
                      result === InspectionResult.PartialPass ? 'orange' : 'default'
                    }>
                      {result === InspectionResult.Pass ? '合格' :
                       result === InspectionResult.Fail ? '不合格' :
                       result === InspectionResult.PartialPass ? '部分合格' : '待检'}
                    </Tag>
                  )}
                />
                <Table.Column title="抽检数量" dataIndex="inspectedQuantity" />
                <Table.Column title="合格数量" dataIndex="passedQuantity" />
                <Table.Column title="不合格数量" dataIndex="failedQuantity" />
                <Table.Column title="备注" dataIndex="remarks" />
              </Table>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无质检记录
              </div>
            )}
          </Card>
        </Space>
      )
    }
  ];

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading={loading}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            {loading ? '加载中...' : '订单不存在'}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        bordered={false}
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
              返回
            </Button>
            <span>订单详情 - {order.orderNo}</span>
            <Tag color={getStatusColor(order.status)}>{getStatusText(order.status)}</Tag>
          </Space>
        }
      >
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Card>

      <Modal
        title="维护生产进度"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={progressForm}
          layout="vertical"
          onFinish={handleUpdateProgress}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="生产状态"
                rules={[{ required: true, message: '请选择生产状态' }]}
              >
                <Select>
                  <Option value={ProductionStatus.NotStarted}>未开始</Option>
                  <Option value={ProductionStatus.InProgress}>进行中</Option>
                  <Option value={ProductionStatus.Paused}>已暂停</Option>
                  <Option value={ProductionStatus.Completed}>已完成</Option>
                  <Option value={ProductionStatus.Skipped}>已跳过</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="equipmentId"
                label="分配设备"
              >
                <Select placeholder="选择设备">
                  {equipments.map(eq => (
                    <Option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.status === 'Idle' ? '空闲' : eq.status})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="operator" label="操作人员">
            <Input placeholder="请输入操作人员" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setProgressModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增质检记录"
        open={inspectionModalVisible}
        onCancel={() => setInspectionModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={inspectionForm}
          layout="vertical"
          onFinish={handleCreateInspection}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inspector"
                label="检验员"
                rules={[{ required: true, message: '请输入检验员' }]}
              >
                <Input placeholder="请输入检验员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inspectionDate"
                label="质检日期"
                rules={[{ required: true, message: '请选择质检日期' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="result"
                label="质检结果"
                rules={[{ required: true, message: '请选择质检结果' }]}
              >
                <Select>
                  <Option value={InspectionResult.Pass}>合格</Option>
                  <Option value={InspectionResult.Fail}>不合格</Option>
                  <Option value={InspectionResult.PartialPass}>部分合格</Option>
                  <Option value={InspectionResult.Pending}>待检</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="inspectedQuantity"
                label="抽检数量"
                rules={[{ required: true, message: '请输入抽检数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="passedQuantity"
                label="合格数量"
                rules={[{ required: true, message: '请输入合格数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="failedQuantity"
            label="不合格数量"
            rules={[{ required: true, message: '请输入不合格数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="checkItems" label="检测项目">
            <TextArea rows={2} placeholder="请输入检测项目" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setInspectionModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="记录质检问题（不合格处理）"
        open={issueModalVisible}
        onCancel={() => {
          setIssueModalVisible(false);
          issueForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={issueForm}
          layout="vertical"
          onFinish={handleCreateIssue}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="问题状态"
                rules={[{ required: true, message: '请选择问题状态' }]}
                initialValue={QualityIssueStatus.Open}
              >
                <Select>
                  <Option value={QualityIssueStatus.Open}>待处理</Option>
                  <Option value={QualityIssueStatus.Investigating}>调查中</Option>
                  <Option value={QualityIssueStatus.Handling}>处理中</Option>
                  <Option value={QualityIssueStatus.Reviewed}>已审核</Option>
                  <Option value={QualityIssueStatus.Closed}>已关闭</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="affectedScope"
                label="影响范围"
                rules={[{ required: true, message: '请输入影响范围' }]}
              >
                <Input placeholder="如：整批、部分批次、单张等" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="handler"
                label="处理人"
                rules={[{ required: true, message: '请输入处理人' }]}
              >
                <Input placeholder="请输入处理人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reviewer"
                label="审核人"
                rules={[{ required: true, message: '请输入审核人' }]}
              >
                <Input placeholder="请输入审核人" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="issueDescription"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={3} placeholder="请详细描述发现的质量问题" />
          </Form.Item>
          <Form.Item
            name="rootCause"
            label="根本原因"
            rules={[{ required: true, message: '请输入根本原因' }]}
          >
            <TextArea rows={3} placeholder="请分析问题产生的根本原因" />
          </Form.Item>
          <Form.Item
            name="handlingPath"
            label="处理路径"
            rules={[{ required: true, message: '请输入处理路径' }]}
          >
            <TextArea rows={3} placeholder="请描述采取的处理步骤和路径（如：返工、报废、特采等）" />
          </Form.Item>
          <Form.Item
            name="correctiveAction"
            label="纠正措施"
            rules={[{ required: true, message: '请输入纠正措施' }]}
          >
            <TextArea rows={3} placeholder="请描述针对此问题的纠正措施" />
          </Form.Item>
          <Form.Item
            name="preventiveAction"
            label="预防措施"
            rules={[{ required: true, message: '请输入预防措施' }]}
          >
            <TextArea rows={3} placeholder="请描述防止类似问题再次发生的预防措施" />
          </Form.Item>
          <Form.Item
            name="reviewNotes"
            label="复盘备注"
            rules={[{ required: true, message: '请输入复盘备注' }]}
          >
            <TextArea rows={3} placeholder="请输入复盘总结和经验教训" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存问题记录</Button>
              <Button onClick={() => {
                setIssueModalVisible(false);
                issueForm.resetFields();
                if (id) loadOrderDetail(parseInt(id));
              }}>
                暂不记录
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetail;
