import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { User } from '../types';
import { userApi } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface EventFilterProps {
  onFilter: (filters: any) => void;
  showTypeFilter?: boolean;
}

const EventFilter: React.FC<EventFilterProps> = ({ onFilter, showTypeFilter = true }) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userApi.getUsers() as any;
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSearch = (values: any) => {
    const filters: any = {};
    
    if (values.status) filters.status = values.status;
    if (values.assigneeId) filters.assigneeId = values.assigneeId;
    if (values.shift) filters.shift = values.shift;
    if (values.gridArea) filters.gridArea = values.gridArea;
    if (values.dateRange) {
      filters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      filters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    onFilter(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <div className="filter-section">
      <Form form={form} layout="inline" onFinish={handleSearch}>
        <Row gutter={16} style={{ width: '100%' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="status" label="状态">
              <Select placeholder="全部状态" allowClear>
                <Select.Option value="pending">待处理</Select.Option>
                <Select.Option value="processing">处理中</Select.Option>
                <Select.Option value="reviewing">复查中</Select.Option>
                <Select.Option value="voting">投票中</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="closed">已关闭</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="assigneeId" label="负责人">
              <Select placeholder="全部负责人" allowClear showSearch optionFilterProp="children">
                {users.map(user => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.name} ({user.role === 'manager' ? '管理员' : user.role === 'worker' ? '网格员' : '居民'})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="shift" label="班次">
              <Select placeholder="全部班次" allowClear>
                <Select.Option value="morning">早班 (8:00-16:00)</Select.Option>
                <Select.Option value="afternoon">中班 (16:00-24:00)</Select.Option>
                <Select.Option value="night">晚班 (0:00-8:00)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="gridArea" label="网格区域">
              <Select placeholder="全部区域" allowClear>
                <Select.Option value="grid1">第一网格</Select.Option>
                <Select.Option value="grid2">第二网格</Select.Option>
                <Select.Option value="grid3">第三网格</Select.Option>
                <Select.Option value="grid4">第四网格</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={16} lg={12}>
            <Form.Item name="dateRange" label="创建时间">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8} lg={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default EventFilter;
