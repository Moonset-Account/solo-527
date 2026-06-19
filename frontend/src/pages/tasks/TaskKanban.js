import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Input, Select, message, Tag, Space, Badge, List } from 'antd';
import { PlusOutlined, UserOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { tasksAPI } from '../../services/api';
import { formatDateTime, getTaskTypeText, getPriorityBadge, handleApiError } from '../../utils/helpers';
import DataExportButton from '../../components/DataExportButton';
import ProcessRecordList from '../../components/ProcessRecordList';

const { Option } = Select;

const TaskKanban = () => {
  const [loading, setLoading] = useState(false);
  const [kanbanData, setKanbanData] = useState({ todo: [], in_progress: [], done: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [processRecords, setProcessRecords] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchKanbanData();
  }, []);

  const fetchKanbanData = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.kanban();
      setKanbanData(response.data || { todo: [], in_progress: [], done: [] });
    } catch (error) {
      message.error(handleApiError(error, '加载任务看板失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleViewDetail = async (task) => {
    setSelectedTask(task);
    try {
      const response = await tasksAPI.getProcessRecords(task.id);
      setProcessRecords(response.data.results || response.data || []);
    } catch (error) {
      setProcessRecords([]);
    }
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (task, action) => {
    try {
      if (action === 'start') {
        await tasksAPI.start(task.id);
      } else if (action === 'complete') {
        Modal.confirm({
          title: '完成任务',
          content: (
            <Form form={form} layout="vertical">
              <Form.Item 
                name="result" 
                label="处理结果" 
                rules={[{ required: true, message: '请输入处理结果' }]}
              >
                <Input.TextArea rows={3} placeholder="请输入处理结果" />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="请输入备注信息" />
              </Form.Item>
            </Form>
          ),
          onOk: async () => {
            try {
              const values = await form.validateFields();
              await tasksAPI.complete(task.id, values);
              message.success('任务已完成');
              fetchKanbanData();
            } catch (error) {
              message.error(handleApiError(error, '完成任务失败'));
              return Promise.reject();
            }
          },
        });
        return;
      }
      message.success('状态更新成功');
      fetchKanbanData();
    } catch (error) {
      message.error(handleApiError(error, '状态更新失败'));
    }
  };

  const handleSubmit = async (values) => {
    try {
      await tasksAPI.create(values);
      message.success('创建成功');
      setModalVisible(false);
      fetchKanbanData();
    } catch (error) {
      message.error(handleApiError(error, '创建失败'));
    }
  };

  const taskTypes = [
    { value: 'patrol', label: '巡逻任务' },
    { value: 'assistance', label: '帮扶任务' },
    { value: 'voting', label: '投票任务' },
    { value: 'meeting', label: '会议任务' },
    { value: 'inspection', label: '检查任务' },
    { value: 'maintenance', label: '维修任务' },
    { value: 'complaint', label: '投诉处理' },
    { value: 'suggestion', label: '建议处理' },
    { value: 'qualification_exception', label: '资格异常处理' },
  ];

  const columns = [
    { key: 'todo', title: '待处理', color: '#1890ff', icon: <ClockCircleOutlined /> },
    { key: 'in_progress', title: '进行中', color: '#fa8c16', icon: <ExclamationCircleOutlined /> },
    { key: 'done', title: '已完成', color: '#52c41a', icon: <CheckCircleOutlined /> },
  ];

  const renderTaskCard = (task) => {
    const priority = getPriorityBadge(task.priority);
    return (
      <div 
        key={task.id} 
        className={`kanban-card priority-${task.priority}`}
        onClick={() => handleViewDetail(task)}
      >
        <div className="card-title">{task.title}</div>
        <div style={{ marginBottom: 8 }}>
          <Tag color={task.task_type === 'qualification_exception' ? 'red' : 'blue'}>
            {getTaskTypeText(task.task_type)}
          </Tag>
          <Tag color={priority.class.replace('priority-', '') === 'high' ? 'red' : priority.class.replace('priority-', '') === 'medium' ? 'orange' : 'green'}>
            {priority.text}优先级
          </Tag>
        </div>
        {task.description && (
          <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
            {task.description.substring(0, 50)}...
          </div>
        )}
        <div className="card-meta">
          <span>
            <UserOutlined style={{ marginRight: 4 }} />
            {task.assignee_name || '未分配'}
          </span>
          <span>{formatDateTime(task.due_date, 'MM-DD HH:mm')}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>任务看板</h2>
        </Col>
        <Col>
          <Space>
            <DataExportButton exportAPI={tasksAPI.export} filename="任务列表.xlsx" />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增任务
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {columns.map(column => (
          <Col xs={24} md={8} key={column.key}>
            <div className="kanban-column">
              <div className="kanban-column-title" style={{ color: column.color }}>
                <Badge 
                  count={kanbanData[column.key]?.length || 0} 
                  style={{ backgroundColor: column.color, marginRight: 8 }}
                />
                {column.icon} {column.title}
              </div>
              {kanbanData[column.key]?.map(task => renderTaskCard(task))}
              {kanbanData[column.key]?.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无任务
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>

      <Modal
        title="新增任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="task_type" label="任务类型" rules={[{ required: true, message: '请选择任务类型' }]}>
                <Select placeholder="请选择任务类型">
                  {taskTypes.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
                <Select placeholder="请选择优先级">
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignee" label="处理人">
                <Input placeholder="请输入处理人ID" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="due_date" label="截止时间">
                <Input type="datetime-local" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          selectedTask && selectedTask.status === 'todo' ? (
            <Button type="primary" onClick={() => handleStatusChange(selectedTask, 'start')}>
              开始任务
            </Button>
          ) : selectedTask && selectedTask.status === 'in_progress' ? (
            <Button type="primary" onClick={() => handleStatusChange(selectedTask, 'complete')}>
              完成任务
            </Button>
          ) : null
        }
        width={600}
      >
        {selectedTask && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>任务标题</div>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{selectedTask.title}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>任务类型</div>
                <Tag color={selectedTask.task_type === 'qualification_exception' ? 'red' : 'blue'}>
                  {getTaskTypeText(selectedTask.task_type)}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>优先级</div>
                <Tag color={selectedTask.priority === 'high' ? 'red' : selectedTask.priority === 'medium' ? 'orange' : 'green'}>
                  {getPriorityBadge(selectedTask.priority).text}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>状态</div>
                <Tag className={`status-${selectedTask.status}`}>
                  {selectedTask.status === 'todo' ? '待处理' : selectedTask.status === 'in_progress' ? '进行中' : '已完成'}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>处理人</div>
                <div>{selectedTask.assignee_name || '未分配'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>截止时间</div>
                <div>{formatDateTime(selectedTask.due_date)}</div>
              </Col>
            </Row>
            {selectedTask.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', marginBottom: 4 }}>任务描述</div>
                <div>{selectedTask.description}</div>
              </div>
            )}
            {selectedTask.related_resident && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', marginBottom: 4 }}>关联居民</div>
                <div>{selectedTask.related_resident_name || selectedTask.related_resident}</div>
              </div>
            )}
            {selectedTask.qualification_exception_detail && (
              <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', borderRadius: 4 }}>
                <div style={{ color: '#ff4d4f', marginBottom: 4, fontWeight: 'bold' }}>
                  <ExclamationCircleOutlined /> 资格异常详情
                </div>
                <div>{selectedTask.qualification_exception_detail}</div>
              </div>
            )}
            <div>
              <div style={{ color: '#999', marginBottom: 8, fontWeight: 'bold' }}>处理记录</div>
              <ProcessRecordList records={processRecords} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskKanban;
