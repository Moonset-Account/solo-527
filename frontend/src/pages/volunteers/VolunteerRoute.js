import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Modal, Form, message, Tag, Row, Col, Tabs, Card, List } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { volunteersAPI } from '../../services/api';
import { formatDate, formatDateTime, handleApiError } from '../../utils/helpers';
import DataExportButton from '../../components/DataExportButton';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const VolunteerRoute = () => {
  const [activeTab, setActiveTab] = useState('routes');
  const [routesLoading, setRoutesLoading] = useState(false);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [routePagination, setRoutePagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [volunteerPagination, setVolunteerPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [assignmentPagination, setAssignmentPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [volunteerModalVisible, setVolunteerModalVisible] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [routeForm] = Form.useForm();
  const [volunteerForm] = Form.useForm();
  const [assignmentForm] = Form.useForm();

  useEffect(() => {
    if (activeTab === 'routes') fetchRoutes();
    if (activeTab === 'volunteers') fetchVolunteers();
    if (activeTab === 'assignments') fetchAssignments();
  }, [activeTab, routePagination.current, routePagination.pageSize, volunteerPagination.current, volunteerPagination.pageSize, assignmentPagination.current, assignmentPagination.pageSize]);

  const fetchRoutes = async () => {
    setRoutesLoading(true);
    try {
      const params = {
        page: routePagination.current,
        page_size: routePagination.pageSize,
      };
      const response = await volunteersAPI.routes.list(params);
      setRoutes(response.data.results || []);
      setRoutePagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载路线失败'));
    } finally {
      setRoutesLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    setVolunteersLoading(true);
    try {
      const params = {
        page: volunteerPagination.current,
        page_size: volunteerPagination.pageSize,
      };
      const response = await volunteersAPI.list(params);
      setVolunteers(response.data.results || []);
      setVolunteerPagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载志愿者失败'));
    } finally {
      setVolunteersLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const params = {
        page: assignmentPagination.current,
        page_size: assignmentPagination.pageSize,
      };
      const response = await volunteersAPI.assignments.list(params);
      setAssignments(response.data.results || []);
      setAssignmentPagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载排班失败'));
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleAddRoute = () => {
    setEditingRoute(null);
    routeForm.resetFields();
    setRouteModalVisible(true);
  };

  const handleEditRoute = (record) => {
    setEditingRoute(record);
    routeForm.setFieldsValue(record);
    setRouteModalVisible(true);
  };

  const handleDeleteRoute = async (id) => {
    try {
      await volunteersAPI.routes.delete(id);
      message.success('删除成功');
      fetchRoutes();
    } catch (error) {
      message.error(handleApiError(error, '删除失败'));
    }
  };

  const handleRouteSubmit = async (values) => {
    try {
      if (editingRoute) {
        await volunteersAPI.routes.update(editingRoute.id, values);
        message.success('更新成功');
      } else {
        await volunteersAPI.routes.create(values);
        message.success('创建成功');
      }
      setRouteModalVisible(false);
      fetchRoutes();
    } catch (error) {
      message.error(handleApiError(error, editingRoute ? '更新失败' : '创建失败'));
    }
  };

  const handleAddVolunteer = () => {
    setEditingVolunteer(null);
    volunteerForm.resetFields();
    setVolunteerModalVisible(true);
  };

  const handleEditVolunteer = (record) => {
    setEditingVolunteer(record);
    volunteerForm.setFieldsValue(record);
    setVolunteerModalVisible(true);
  };

  const handleDeleteVolunteer = async (id) => {
    try {
      await volunteersAPI.delete(id);
      message.success('删除成功');
      fetchVolunteers();
    } catch (error) {
      message.error(handleApiError(error, '删除失败'));
    }
  };

  const handleVolunteerSubmit = async (values) => {
    try {
      if (editingVolunteer) {
        await volunteersAPI.update(editingVolunteer.id, values);
        message.success('更新成功');
      } else {
        await volunteersAPI.create(values);
        message.success('创建成功');
      }
      setVolunteerModalVisible(false);
      fetchVolunteers();
    } catch (error) {
      message.error(handleApiError(error, editingVolunteer ? '更新失败' : '创建失败'));
    }
  };

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    assignmentForm.resetFields();
    setAssignmentModalVisible(true);
  };

  const handleEditAssignment = (record) => {
    setEditingAssignment(record);
    assignmentForm.setFieldsValue({
      volunteer: record.volunteer_id,
      route: record.route_id,
      date: record.scheduled_date || record.date || null,
      time_slot: record.time_slot || '',
      status: record.status || 'pending',
      notes: record.notes || '',
    });
    setAssignmentModalVisible(true);
  };

  const handleDeleteAssignment = async (id) => {
    try {
      await volunteersAPI.assignments.delete(id);
      message.success('删除成功');
      fetchAssignments();
    } catch (error) {
      message.error(handleApiError(error, '删除失败'));
    }
  };

  const handleAssignmentSubmit = async (values) => {
    try {
      const parseTimeSlot = (slot) => {
        if (!slot) return { start: null, end: null };
        const parts = slot.split('-');
        return {
          start: parts[0] ? parts[0].trim() + ':00' : null,
          end: parts[1] ? parts[1].trim() + ':00' : null,
        };
      };
      const times = parseTimeSlot(values.time_slot);
      const submitData = {
        volunteer_id: values.volunteer,
        route_id: values.route,
        scheduled_date: values.date,
        scheduled_start_time: times.start,
        scheduled_end_time: times.end,
        status: values.status || 'pending',
        notes: values.notes || '',
      };
      if (editingAssignment) {
        await volunteersAPI.assignments.update(editingAssignment.id, submitData);
        message.success('更新成功');
      } else {
        await volunteersAPI.assignments.create(submitData);
        message.success('创建成功');
      }
      setAssignmentModalVisible(false);
      assignmentForm.resetFields();
      fetchAssignments();
    } catch (error) {
      message.error(handleApiError(error, editingAssignment ? '更新失败' : '创建失败'));
    }
  };

  const routeColumns = [
    {
      title: '路线名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: '途经地点',
      dataIndex: 'waypoints',
      key: 'waypoints',
      render: (text) => text ? text.join(' → ') : '-',
    },
    {
      title: '预计时长(分钟)',
      dataIndex: 'estimated_duration',
      key: 'estimated_duration',
    },
    {
      title: '里程(公里)',
      dataIndex: 'distance',
      key: 'distance',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditRoute(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRoute(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const volunteerColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '技能特长',
      dataIndex: 'skills',
      key: 'skills',
      render: (text) => text ? text.join('、') : '-',
    },
    {
      title: '服务时长(小时)',
      dataIndex: 'total_service_hours',
      key: 'total_service_hours',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (text) => (
        <Tag color={text ? 'green' : 'red'}>
          {text ? '活跃' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditVolunteer(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteVolunteer(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const assignmentColumns = [
    {
      title: '志愿者',
      dataIndex: 'volunteer_name',
      key: 'volunteer_name',
    },
    {
      title: '路线',
      dataIndex: 'route_name',
      key: 'route_name',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: formatDate,
    },
    {
      title: '时间段',
      dataIndex: 'time_slot',
      key: 'time_slot',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const colors = { pending: 'orange', completed: 'green', cancelled: 'red' };
        const labels = { pending: '待执行', completed: '已完成', cancelled: '已取消' };
        return <Tag color={colors[text]}>{labels[text]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditAssignment(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteAssignment(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>志愿者路线管理</h2>
        </Col>
        <Col>
          <DataExportButton exportAPI={volunteersAPI.export} filename="志愿者数据.xlsx" />
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="路线管理" key="routes">
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Col>
                <Search
                  placeholder="搜索路线名称"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="middle"
                  style={{ width: 300 }}
                  onSearch={() => fetchRoutes()}
                />
              </Col>
              <Col>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoute}>
                  新增路线
                </Button>
              </Col>
            </Row>

            <Table
              columns={routeColumns}
              dataSource={routes}
              rowKey="id"
              loading={routesLoading}
              pagination={{
                ...routePagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              onChange={(page, pageSize) => setRoutePagination(prev => ({ ...prev, current: page, pageSize }))}
            />
          </TabPane>

          <TabPane tab="志愿者管理" key="volunteers">
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Col>
                <Search
                  placeholder="搜索志愿者姓名、电话"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="middle"
                  style={{ width: 300 }}
                  onSearch={() => fetchVolunteers()}
                />
              </Col>
              <Col>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVolunteer}>
                  新增志愿者
                </Button>
              </Col>
            </Row>

            <Table
              columns={volunteerColumns}
              dataSource={volunteers}
              rowKey="id"
              loading={volunteersLoading}
              pagination={{
                ...volunteerPagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              onChange={(page, pageSize) => setVolunteerPagination(prev => ({ ...prev, current: page, pageSize }))}
            />
          </TabPane>

          <TabPane tab="排班管理" key="assignments">
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Col>
                <Search
                  placeholder="搜索志愿者、路线"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="middle"
                  style={{ width: 300 }}
                  onSearch={() => fetchAssignments()}
                />
              </Col>
              <Col>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAssignment}>
                  新增排班
                </Button>
              </Col>
            </Row>

            <Table
              columns={assignmentColumns}
              dataSource={assignments}
              rowKey="id"
              loading={assignmentsLoading}
              pagination={{
                ...assignmentPagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              onChange={(page, pageSize) => setAssignmentPagination(prev => ({ ...prev, current: page, pageSize }))}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingRoute ? '编辑路线' : '新增路线'}
        open={routeModalVisible}
        onCancel={() => setRouteModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={routeForm} layout="vertical" onFinish={handleRouteSubmit}>
          <Form.Item name="name" label="路线名称" rules={[{ required: true, message: '请输入路线名称' }]}>
            <Input placeholder="请输入路线名称" />
          </Form.Item>
          <Form.Item name="area" label="负责区域" rules={[{ required: true, message: '请输入负责区域' }]}>
            <Input placeholder="请输入负责区域" />
          </Form.Item>
          <Form.Item name="waypoints" label="途经地点（用逗号分隔）">
            <Input.TextArea rows={2} placeholder="例如：北门,1号楼,2号楼,南门" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="estimated_duration" label="预计时长(分钟)">
                <Input type="number" placeholder="请输入预计时长" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="distance" label="里程(公里)">
                <Input type="number" step="0.1" placeholder="请输入里程" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="路线描述">
            <Input.TextArea rows={3} placeholder="请输入路线描述" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setRouteModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingRoute ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingVolunteer ? '编辑志愿者' : '新增志愿者'}
        open={volunteerModalVisible}
        onCancel={() => setVolunteerModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={volunteerForm} layout="vertical" onFinish={handleVolunteerSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="skills" label="技能特长（用逗号分隔）">
            <Input.TextArea rows={2} placeholder="例如：巡逻,急救,维修" />
          </Form.Item>
          <Form.Item name="is_active" label="状态" valuePropName="checked">
            <Select defaultValue={true}>
              <Option value={true}>活跃</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setVolunteerModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingVolunteer ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingAssignment ? '编辑排班' : '新增排班'}
        open={assignmentModalVisible}
        onCancel={() => setAssignmentModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={assignmentForm} layout="vertical" onFinish={handleAssignmentSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="volunteer" label="志愿者" rules={[{ required: true, message: '请选择志愿者' }]}>
                <Select placeholder="请选择志愿者">
                  {volunteers.map(v => (
                    <Option key={v.id} value={v.id}>{v.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="route" label="路线" rules={[{ required: true, message: '请选择路线' }]}>
                <Select placeholder="请选择路线">
                  {routes.map(r => (
                    <Option key={r.id} value={r.id}>{r.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="time_slot" label="时间段" rules={[{ required: true, message: '请输入时间段' }]}>
                <Input placeholder="例如：09:00-12:00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态">
            <Select defaultValue="pending">
              <Option value="pending">待执行</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setAssignmentModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingAssignment ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VolunteerRoute;
