import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Form,
  Select,
  Input,
  Switch,
  Row,
  Col,
  Tabs,
  InputNumber,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import type {
  SystemConfig,
  ConfigCategory,
  FieldType,
  SystemConfigQueryParams,
} from '@/types';
import {
  getConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  refreshConfigs,
} from '@/api';

const { TextArea } = Input;

const categoryMap: Record<ConfigCategory, string> = {
  order: '订单',
  production: '生产',
  quality: '质检',
  material: '耗材',
  team: '班组',
  delivery: '交付',
  export: '导出',
  other: '其他',
};

const fieldTypeMap: Record<FieldType, string> = {
  string: '字符串',
  number: '数字',
  boolean: '布尔',
  date: '日期',
  datetime: '日期时间',
  select: '单选',
  multiselect: '多选',
  textarea: '文本域',
};

const fieldTypeColorMap: Record<FieldType, string> = {
  string: 'blue',
  number: 'cyan',
  boolean: 'green',
  date: 'purple',
  datetime: 'magenta',
  select: 'orange',
  multiselect: 'gold',
  textarea: 'geekblue',
};

const SystemConfigsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SystemConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('order');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SystemConfig | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: SystemConfigQueryParams = {
        category: activeCategory,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const res = await getConfigs(params);
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取配置列表失败');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveCategory(key as ConfigCategory);
    setPagination({ current: 1, pageSize: 10 });
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      category: activeCategory,
      fieldType: 'string',
      isActive: true,
      sortOrder: 0,
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: SystemConfig) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      await refreshConfigs();
      message.success('缓存刷新成功');
    } catch (error) {
      message.error('缓存刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
      };

      if (editingRecord) {
        await updateConfig(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await createConfig(submitData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleActive = async (record: SystemConfig, checked: boolean) => {
    try {
      await updateConfig(record.id, { isActive: checked });
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const renderConfigValue = (record: SystemConfig) => {
    const value = record.configValue;
    const defaultValue = record.defaultValue;
    if (value == null || value === '') return defaultValue || '-';

    switch (record.fieldType) {
      case 'boolean':
        return value === 'true' ? (
          <Tag color="green">是</Tag>
        ) : (
          <Tag color="default">否</Tag>
        );
      case 'date':
        return dayjs(value).format('YYYY-MM-DD');
      case 'datetime':
        return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
      case 'select':
      case 'multiselect': {
        try {
          const options = record.fieldOptions || {};
          const valueMap: Record<string, string> = options as Record<string, string>;
          if (record.fieldType === 'multiselect') {
            const values = value.split(',');
            return values.map((v) => (
              <Tag key={v} color="blue" style={{ margin: 2 }}>
                {valueMap[v] || v}
              </Tag>
            ));
          }
          return <Tag color="blue">{valueMap[value] || value}</Tag>;
        } catch {
          return value;
        }
      }
      case 'textarea':
        return (
          <span style={{ whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {value}
          </span>
        );
      default:
        return value;
    }
  };

  const renderFormField = (type: FieldType, name: string, label: string) => {
    switch (type) {
      case 'boolean':
        return (
          <Form.Item name={name} label={label} valuePropName="checked">
            <Switch />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item name={name} label={label}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        );
      case 'date':
        return (
          <Form.Item name={name} label={label}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        );
      case 'datetime':
        return (
          <Form.Item name={name} label={label}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        );
      case 'textarea':
        return (
          <Form.Item name={name} label={label}>
            <TextArea rows={3} />
          </Form.Item>
        );
      default:
        return (
          <Form.Item name={name} label={label}>
            <Input />
          </Form.Item>
        );
    }
  };

  const columns: ColumnsType<SystemConfig> = [
    {
      title: '配置键名',
      dataIndex: 'configKey',
      key: 'configKey',
      width: 180,
      fixed: 'left',
      render: (val: string) => <code>{val}</code>,
    },
    {
      title: '配置名称',
      dataIndex: 'configName',
      key: 'configName',
      width: 160,
    },
    {
      title: '字段类型',
      dataIndex: 'fieldType',
      key: 'fieldType',
      width: 100,
      render: (type: FieldType) => (
        <Tag color={fieldTypeColorMap[type]}>{fieldTypeMap[type]}</Tag>
      ),
    },
    {
      title: '配置值',
      dataIndex: 'configValue',
      key: 'configValue',
      width: 200,
      render: (_: any, record: SystemConfig) => renderConfigValue(record),
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 150,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 70,
    },
    {
      title: '启用',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 70,
      render: (val: boolean, record: SystemConfig) => (
        <Switch
          checked={val}
          size="small"
          disabled={record.isSystem}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: SystemConfig) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            danger
            icon={<DeleteOutlined />}
            disabled={record.isSystem}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems: TabsProps['items'] = (Object.keys(categoryMap) as ConfigCategory[]).map(
    (key) => ({
      key,
      label: categoryMap[key],
    })
  );

  const currentFieldType = Form.useWatch('fieldType', form) as FieldType | undefined;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          activeKey={activeCategory}
          onChange={handleTabChange}
          items={tabItems}
          style={{ marginBottom: 0 }}
        />
        <Space>
          <Button
            icon={<SyncOutlined spin={refreshing} />}
            onClick={handleRefreshCache}
          >
            刷新缓存
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增配置
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </Space>
      </div>

      <Table<SystemConfig>
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
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingRecord ? '编辑系统配置' : '新增系统配置'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={handleFormSubmit}
        width={720}
        destroyOnClose
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="configKey"
                label="配置键名"
                rules={[{ required: true, message: '请输入配置键名' }]}
              >
                <Input placeholder="例如：order.default_status" disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="configName"
                label="配置名称"
                rules={[{ required: true, message: '请输入配置名称' }]}
              >
                <Input placeholder="请输入配置名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  placeholder="请选择分类"
                  options={Object.entries(categoryMap).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fieldType"
                label="字段类型"
                rules={[{ required: true, message: '请选择字段类型' }]}
              >
                <Select
                  placeholder="请选择字段类型"
                  options={Object.entries(fieldTypeMap).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              {renderFormField(currentFieldType || 'string', 'configValue', '配置值')}
            </Col>
            <Col xs={24} sm={12}>
              {renderFormField(currentFieldType || 'string', 'defaultValue', '默认值')}
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="isActive" label="启用" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="fieldOptions" label="字段选项 (JSON)">
                <TextArea
                  rows={2}
                  placeholder='例如：{"option1": "选项1", "option2": "选项2"}'
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="validationRules" label="验证规则 (JSON)">
                <TextArea
                  rows={2}
                  placeholder='例如：{"required": true, "max": 100}'
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="thresholdConfig" label="阈值配置 (JSON)">
                <TextArea
                  rows={2}
                  placeholder='例如：{"warning": 80, "critical": 100}'
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="描述">
                <TextArea rows={2} placeholder="请输入配置描述" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemConfigsPage;
