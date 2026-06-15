import React, { useEffect } from 'react';
import { Table, Card, Select, Input, DatePicker, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOperationLogs } from '../../store/slices/commonSlice';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OperationLogs = () => {
  const dispatch = useDispatch();
  const { operationLogs, loading } = useSelector(state => state.common);

  useEffect(() => {
    dispatch(fetchOperationLogs({ page_size: 50 }));
  }, [dispatch]);

  const getActionColor = (action) => {
    const colors = {
      create: 'green',
      update: 'blue',
      delete: 'red',
      status_change: 'purple',
      approval: 'gold',
      assign: 'cyan',
      followup: 'magenta',
      other: 'default',
    };
    return colors[action] || 'default';
  };

  const getActionText = (action) => {
    const texts = {
      create: '创建',
      update: '更新',
      delete: '删除',
      status_change: '状态变更',
      approval: '审批',
      assign: '分配',
      followup: '跟进',
      other: '其他',
    };
    return texts[action] || action;
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
    },
    {
      title: '操作人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {getActionText(action)}
        </Tag>
      ),
    },
    {
      title: '对象类型',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 100,
      render: (name) => name || '-',
    },
    {
      title: '对象ID',
      dataIndex: 'object_id',
      key: 'object_id',
      width: 80,
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索操作描述"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
          />
          <Select placeholder="操作类型" allowClear style={{ width: 150 }}>
            <Option value="create">创建</Option>
            <Option value="update">更新</Option>
            <Option value="delete">删除</Option>
            <Option value="status_change">状态变更</Option>
            <Option value="approval">审批</Option>
            <Option value="assign">分配</Option>
            <Option value="followup">跟进</Option>
          </Select>
          <Select placeholder="对象类型" allowClear style={{ width: 150 }}>
            <Option value="lead">线索</Option>
            <Option value="customer">客户</Option>
            <Option value="contract">合同</Option>
            <Option value="consultationrecord">咨询记录</Option>
          </Select>
          <RangePicker />
        </Space>
      </Card>

      <Card title="操作日志">
        <Table
          columns={columns}
          dataSource={operationLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
};

export default OperationLogs;
