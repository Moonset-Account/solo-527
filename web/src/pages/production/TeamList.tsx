import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Form,
  Select,
  Input,
  InputNumber,
  Switch,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Team, TeamType, PaginationParams } from '@/types';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from '@/api/production';

const teamTypeMap: Record<TeamType, string> = {
  printing: '印刷班组',
  cutting: '裁切班组',
  binding: '装订班组',
  packaging: '包装班组',
  quality: '质检班组',
  maintenance: '维修班组',
};

const teamTypeColorMap: Record<TeamType, string> = {
  printing: 'blue',
  cutting: 'cyan',
  binding: 'geekblue',
  packaging: 'green',
  quality: 'gold',
  maintenance: 'purple',
};

const TeamList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<PaginationParams & { teamType?: TeamType; isActive?: boolean }>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTeams({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取班组列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async (values: any) => {
    setQueryParams(values);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({});
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleAdd = () => {
    setEditingTeam(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      memberCount: 0,
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: Team) => {
    setEditingTeam(record);
    form.setFieldsValue({
      ...record,
      members: record.members ? JSON.stringify(record.members, null, 2) : '',
      capacityConfig: record.capacityConfig ? JSON.stringify(record.capacityConfig, null, 2) : '',
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeam(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = { ...values };
      if (submitData.members) {
        try {
          submitData.members = JSON.parse(submitData.members);
        } catch {
          message.error('成员JSON格式错误');
          return;
        }
      } else {
        delete submitData.members;
      }
      if (submitData.capacityConfig) {
        try {
          submitData.capacityConfig = JSON.parse(submitData.capacityConfig);
        } catch {
          message.error('产能配置JSON格式错误');
          return;
        }
      } else {
        delete submitData.capacityConfig;
      }
      if (editingTeam) {
        await updateTeam(editingTeam.id, submitData);
        message.success('更新成功');
      } else {
        await createTeam(submitData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingTeam(null);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(editingTeam ? '更新失败' : '创建失败');
    }
  };

  const columns: ColumnsType<Team> = [
    {
      title: '班组名称',
      dataIndex: 'teamName',
      key: 'teamName',
      width: 140,
    },
    {
      title: '班组编码',
      dataIndex: 'teamCode',
      key: 'teamCode',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'teamType',
      key: 'teamType',
      width: 110,
      render: (type: TeamType) => (
        <Tag color={teamTypeColorMap[type]}>{teamTypeMap[type]}</Tag>
      ),
    },
    {
      title: '组长',
      dataIndex: 'teamLeader',
      key: 'teamLeader',
      width: 100,
      render: (val: string) => val ? (
        <Space>
          <UserOutlined />
          {val}
        </Space>
      ) : '-',
    },
    {
      title: '组长电话',
      dataIndex: 'leaderPhone',
      key: 'leaderPhone',
      width: 130,
      render: (val: string) => val ? (
        <Space>
          <PhoneOutlined />
          {val}
        </Space>
      ) : '-',
    },
    {
      title: '人数',
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 80,
      render: (val: number) => val ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: Team) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该班组？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="teamType" label="班组类型">
                <Select
                  placeholder="请选择班组类型"
                  options={Object.entries(teamTypeMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="isActive" label="启用状态">
                <Select
                  placeholder="请选择状态"
                  options={[
                    { value: true, label: '启用' },
                    { value: false, label: '禁用' },
                  ]}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="班组名称/编码" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Col>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增班组</Button>
        </Space>
      </div>

      <Table<Team>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingTeam ? '编辑班组' : '新增班组'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamName"
                label="班组名称"
                rules={[{ required: true, message: '请输入班组名称' }]}
              >
                <Input placeholder="请输入班组名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamCode"
                label="班组编码"
                rules={[{ required: true, message: '请输入班组编码' }]}
              >
                <Input placeholder="请输入班组编码" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamType"
                label="班组类型"
                rules={[{ required: true, message: '请选择班组类型' }]}
              >
                <Select
                  placeholder="请选择班组类型"
                  options={Object.entries(teamTypeMap).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="memberCount"
                label="人数"
                rules={[{ required: true, message: '请输入人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入人数" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamLeader"
                label="组长"
              >
                <Input placeholder="请输入组长姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="leaderPhone"
                label="组长电话"
              >
                <Input placeholder="请输入组长电话" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="isActive"
                label="是否启用"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="members"
                label="成员列表(JSON数组)"
              >
                <Input.TextArea rows={4} placeholder='[{"name": "张三", "role": "机长"}, {"name": "李四", "role": "助手"}]' />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="capacityConfig"
                label="产能配置(JSON)"
              >
                <Input.TextArea rows={4} placeholder='{"dailyCapacity": 5000, "unit": "张", "efficiency": 0.95}' />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamList;
