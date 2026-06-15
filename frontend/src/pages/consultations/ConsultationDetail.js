import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Divider,
  Row,
  Col,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchConsultationDetail,
  fetchTreatmentItems,
  addTreatmentItem,
  removeTreatmentItem,
  clearConsultationDetail,
} from '../../store/slices/consultationsSlice';
import dayjs from 'dayjs';

const { Option } = Select;

const ConsultationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { consultationDetail, treatmentItems, detailLoading } = useSelector(state => state.consultations);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [itemForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchConsultationDetail(id));
    dispatch(fetchTreatmentItems());
    return () => dispatch(clearConsultationDetail());
  }, [dispatch, id]);

  const getTypeText = (type) => {
    const types = {
      initial: '初诊咨询', followup: '复诊咨询', treatment: '方案咨询',
      price: '价格咨询', other: '其他'
    };
    return types[type] || type;
  };

  const getIntentionText = (level) => {
    const levels = { high: '高意向', medium: '中意向', low: '低意向', none: '无意向' };
    return levels[level] || level;
  };

  const getIntentionColor = (level) => {
    const colors = { high: 'green', medium: 'gold', low: 'red', none: 'default' };
    return colors[level] || 'default';
  };

  const handleAddItem = async (values) => {
    const result = await dispatch(addTreatmentItem({ id, data: values }));
    if (addTreatmentItem.fulfilled.match(result)) {
      message.success('添加成功');
      setItemModalVisible(false);
      itemForm.resetFields();
      dispatch(fetchConsultationDetail(id));
    }
  };

  const handleRemoveItem = async (itemId) => {
    const result = await dispatch(removeTreatmentItem({ consultationId: id, itemId }));
    if (removeTreatmentItem.fulfilled.match(result)) {
      message.success('删除成功');
      dispatch(fetchConsultationDetail(id));
    }
  };

  const itemColumns = [
    { title: '项目名称', dataIndex: 'treatment_item_name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${Number(price).toFixed(2)}`,
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '折扣', dataIndex: 'discount', key: 'discount', render: (d) => `${d}%` },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (price) => `¥${Number(price).toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  if (detailLoading || !consultationDetail) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  const totalAmount = consultationDetail.treatment_items?.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0
  ) || 0;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Button icon={<EditOutlined />} type="primary">
          编辑
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setItemModalVisible(true)}>
          添加治疗项目
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="客户姓名">
                {consultationDetail.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="咨询类型">
                <Tag>{getTypeText(consultationDetail.consultation_type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="意向等级">
                <Tag color={getIntentionColor(consultationDetail.intention_level)}>
                  {getIntentionText(consultationDetail.intention_level)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="咨询时长">
                {consultationDetail.duration_minutes} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="咨询医生">
                {consultationDetail.consultation_doctor_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="咨询师">
                {consultationDetail.consultant_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(consultationDetail.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="诊疗信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="主诉">
                {consultationDetail.chief_complaint || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="牙科病史">
                {consultationDetail.dental_history || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="口腔检查">
                {consultationDetail.oral_examination || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="诊断结果">
                {consultationDetail.diagnosis || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="治疗方案">
                {consultationDetail.treatment_plan || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="患者顾虑">
                {consultationDetail.patient_concerns || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下一步行动">
                {consultationDetail.next_action || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title="治疗项目"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setItemModalVisible(true)}>
                添加项目
              </Button>
            }
          >
            <Table
              columns={itemColumns}
              dataSource={consultationDetail.treatment_items || []}
              rowKey="id"
              pagination={false}
              size="small"
              footer={() => (
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  总计：¥{totalAmount.toFixed(2)}
                </div>
              )}
            />
            {(!consultationDetail.treatment_items || consultationDetail.treatment_items.length === 0) && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无治疗项目
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="费用概览" style={{ marginBottom: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="预估价格">
                ¥{Number(consultationDetail.estimated_price).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="项目总计">
                <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: 18 }}>
                  ¥{totalAmount.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="下次复诊" style={{ marginBottom: 16 }}>
            {consultationDetail.next_consultation_at ? (
              <div>
                <div style={{ color: '#1890ff', fontSize: 16, fontWeight: 'bold' }}>
                  {dayjs(consultationDetail.next_consultation_at).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            ) : (
              <div style={{ color: '#999' }}>暂未安排</div>
            )}
          </Card>

          <Card title="附件" extra={<Button size="small" icon={<PlusOutlined />}>上传</Button>}>
            <List
              size="small"
              dataSource={consultationDetail.attachments || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<FileTextOutlined />}
                    title={<a>{item.file_name}</a>}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
            {(!consultationDetail.attachments || consultationDetail.attachments.length === 0) && (
              <div style={{ textAlign: 'center', color: '#999', padding: 10 }}>
                暂无附件
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加治疗项目"
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleAddItem}>
          <Form.Item
            name="treatment_item_id"
            label="治疗项目"
            rules={[{ required: true, message: '请选择治疗项目' }]}
          >
            <Select placeholder="请选择">
              {treatmentItems.filter(item => item.is_active).map(item => (
                <Option key={item.id} value={item.id}>
                  {item.name} - ¥{item.price}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
            initialValue={1}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="discount"
            label="折扣(%)"
            initialValue={0}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <InputNumber />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConsultationDetail;
