import React, { useState, useEffect } from 'react';
import { Descriptions, Card, Row, Col, Tag, Button, Modal, Form, Input, message, List, Space } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { residentsAPI } from '../../services/api';
import { formatDate, formatDateTime, getHouseholdTypeText, handleApiError } from '../../utils/helpers';
import ProcessRecordList from '../../components/ProcessRecordList';

const ResidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resident, setResident] = useState(null);
  const [processRecords, setProcessRecords] = useState([]);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detailRes, recordsRes] = await Promise.all([
        residentsAPI.detail(id),
        residentsAPI.getProcessRecords(id),
      ]);
      setResident(detailRes.data);
      setProcessRecords(recordsRes.data.results || recordsRes.data || []);
    } catch (error) {
      message.error(handleApiError(error, '加载居民详情失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (values) => {
    try {
      await residentsAPI.addProcessRecord(id, values);
      message.success('添加记录成功');
      setRecordModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '添加记录失败'));
    }
  };

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }

  if (!resident) {
    return <div>未找到居民信息</div>;
  }

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/residents')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title="居民基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="姓名">{resident.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{resident.gender === 'male' ? '男' : '女'}</Descriptions.Item>
          <Descriptions.Item label="身份证号">{resident.id_card}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{resident.phone}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{formatDate(resident.birth_date)}</Descriptions.Item>
          <Descriptions.Item label="登记日期">{formatDate(resident.registration_date)}</Descriptions.Item>
          <Descriptions.Item label="楼号门牌号" span={2}>{resident.address}</Descriptions.Item>
          <Descriptions.Item label="家庭类型">
            <Tag>{getHouseholdTypeText(resident.household_type)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="投票资格">
            <Tag color={resident.voting_eligibility ? 'green' : 'red'}>
              {resident.voting_eligibility ? '有资格' : '无资格'}
            </Tag>
          </Descriptions.Item>
          {resident.eligibility_exception_reason && (
            <Descriptions.Item label="资格异常原因" span={2}>
              {resident.eligibility_exception_reason}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="备注" span={2}>{resident.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {resident.household_members && resident.household_members.length > 0 && (
        <Card title="家庭成员" style={{ marginBottom: 16 }}>
          <List
            dataSource={resident.household_members}
            renderItem={(member) => (
              <List.Item>
                <List.Item.Meta
                  title={member.name}
                  description={
                    <Space>
                      <span>关系：{member.relation}</span>
                      <span>身份证：{member.id_card}</span>
                      <span>联系电话：{member.phone || '-'}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card 
        title="处理记录" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setRecordModalVisible(true)}
          >
            添加记录
          </Button>
        }
      >
        <ProcessRecordList records={processRecords} />
      </Card>

      <Modal
        title="添加处理记录"
        open={recordModalVisible}
        onCancel={() => setRecordModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddRecord}>
          <Form.Item 
            name="content" 
            label="处理内容" 
            rules={[{ required: true, message: '请输入处理内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入处理内容" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setRecordModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ResidentDetail;
