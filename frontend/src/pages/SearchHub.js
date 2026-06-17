import React, { useState } from 'react';
import {
  Tabs, Input, Select, DatePicker, Button, Space, Table, Tag, Card, Row, Col, Image, List, Descriptions, message
} from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SearchHub = () => {
  const [activeTab, setActiveTab] = useState('photos');
  const [photoList, setPhotoList] = useState([]);
  const [repairList, setRepairList] = useState([]);
  const [materialListList, setMaterialListList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.project) params.project = filters.project;

      if (activeTab === 'photos') {
        const res = await api.get('/projects/photos/', { params });
        setPhotoList(res.data.results || res.data);
      } else if (activeTab === 'repairs') {
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        const res = await api.get('/repairs/', { params });
        setRepairList(res.data.results || res.data);
      } else if (activeTab === 'materials') {
        if (filters.is_approved !== undefined) params.is_approved = filters.is_approved;
        const res = await api.get('/materials/lists/', { params });
        setMaterialListList(res.data.results || res.data);
      }
    } catch (err) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    message.success('正在生成导出文件...');
  };

  const photoColumns = [
    { title: '项目', dataIndex: ['project', 'code'], key: 'proj_code', render: (v, r) => r.project?.code },
    { title: '项目名称', dataIndex: ['project', 'name'], key: 'proj_name', render: (v, r) => r.project?.name },
    { title: '照片', dataIndex: 'image', key: 'image', render: (v) => <Image src={v} width={80} height={60} style={{ objectFit: 'cover' }} /> },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '描述', dataIndex: 'description', key: 'desc' },
    { title: '上传人', dataIndex: 'uploaded_by_name', key: 'uploader' },
    { title: '上传时间', dataIndex: 'created_at', key: 'time', render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  const repairColumns = [
    { title: '单号', dataIndex: 'code', key: 'code' },
    { title: '项目', dataIndex: 'project_name', key: 'proj' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'category_display', key: 'cat' },
    {
      title: '优先级', dataIndex: 'priority', key: 'p',
      render: (v, r) => {
        const colors = { low: 'green', medium: 'orange', high: 'red', urgent: 'magenta' };
        return <Tag color={colors[v]}>{r.priority_display}</Tag>;
      }
    },
    {
      title: '状态', dataIndex: 'status', key: 's',
      render: (v, r) => {
        const colors = { pending: 'orange', assigned: 'blue', in_progress: 'processing', completed: 'green', cancelled: 'default' };
        return <Tag color={colors[v]}>{r.status_display}</Tag>;
      }
    },
    { title: '报修人', dataIndex: 'reporter_name', key: 'reporter' },
    { title: '处理人', dataIndex: 'assigned_to_name', key: 'assignee' },
    { title: '费用', dataIndex: 'total_cost', key: 'cost', render: v => v ? `¥${v}` : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'time', render: v => dayjs(v).format('MM-DD HH:mm') },
  ];

  const materialListColumns = [
    { title: '项目', dataIndex: 'project_name', key: 'proj' },
    { title: '清单名称', dataIndex: 'name', key: 'name' },
    { title: '明细数', dataIndex: 'item_count', key: 'cnt' },
    { title: '总金额', dataIndex: 'total_amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
    {
      title: '状态', dataIndex: 'is_approved', key: 'status',
      render: v => v ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>
    },
    { title: '创建人', dataIndex: 'created_by_name', key: 'user' },
    { title: '创建时间', dataIndex: 'created_at', key: 'time', render: v => dayjs(v).format('YYYY-MM-DD') },
  ];

  const FilterBar = ({ children }) => (
    <Card style={{ marginBottom: 16 }}>
      <Space wrap>
        <Input
          placeholder="搜索关键词"
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          allowClear
        />
        {children}
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
          查询
        </Button>
        <Button icon={<DownloadOutlined />} onClick={exportData}>导出</Button>
      </Space>
    </Card>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">综合查询</h2>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'photos',
              label: '现场照片查询',
              children: (
                <>
                  <FilterBar>
                    <RangePicker onChange={(v) => setFilters({ ...filters, dateRange: v })} />
                  </FilterBar>
                  <Table
                    columns={photoColumns}
                    dataSource={photoList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            },
            {
              key: 'repairs',
              label: '售后报修查询',
              children: (
                <>
                  <FilterBar>
                    <Select
                      placeholder="状态"
                      allowClear
                      style={{ width: 130 }}
                      value={filters.status}
                      onChange={(v) => setFilters({ ...filters, status: v })}
                      options={[
                        { value: 'pending', label: '待处理' },
                        { value: 'assigned', label: '已派单' },
                        { value: 'in_progress', label: '处理中' },
                        { value: 'completed', label: '已完成' },
                      ]}
                    />
                    <Select
                      placeholder="优先级"
                      allowClear
                      style={{ width: 130 }}
                      value={filters.priority}
                      onChange={(v) => setFilters({ ...filters, priority: v })}
                      options={[
                        { value: 'low', label: '低' },
                        { value: 'medium', label: '中' },
                        { value: 'high', label: '高' },
                        { value: 'urgent', label: '紧急' },
                      ]}
                    />
                    <RangePicker onChange={(v) => setFilters({ ...filters, dateRange: v })} />
                  </FilterBar>
                  <Table
                    columns={repairColumns}
                    dataSource={repairList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            },
            {
              key: 'materials',
              label: '材料清单筛选',
              children: (
                <>
                  <FilterBar>
                    <Select
                      placeholder="确认状态"
                      allowClear
                      style={{ width: 130 }}
                      value={filters.is_approved}
                      onChange={(v) => setFilters({ ...filters, is_approved: v })}
                      options={[
                        { value: true, label: '已确认' },
                        { value: false, label: '待确认' },
                      ]}
                    />
                  </FilterBar>
                  <Table
                    columns={materialListColumns}
                    dataSource={materialListList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default SearchHub;
