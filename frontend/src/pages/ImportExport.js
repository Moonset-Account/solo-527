import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  message,
  Upload,
  Select,
  Row,
  Col,
  Progress,
  Alert,
} from 'antd';
import {
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ieAPI } from '../services/api';

const { Option } = Select;

function ImportExport() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportEntity, setExportEntity] = useState('members');
  const [importEntity, setImportEntity] = useState('members');

  const entityLabels = {
    members: '会员',
    films: '影片',
    screenings: '场次',
    bookings: '报名',
    guests: '嘉宾',
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await ieAPI.listTasks();
      setTasks(res.data);
    } catch (error) {
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      message.loading('正在导出...', 0);
      const res = await ieAPI.export(exportEntity);
      message.destroy();
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entityLabels[exportEntity]}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('导出成功');
      loadTasks();
    } catch (error) {
      message.destroy();
      message.error('导出失败');
    }
  };

  const handleImport = async (file) => {
    try {
      message.loading('正在导入...', 0);
      await ieAPI.import(importEntity, file);
      message.destroy();
      message.success('导入任务已提交，请稍后查看结果');
      loadTasks();
    } catch (error) {
      message.destroy();
      message.error('导入失败');
    }
    return false;
  };

  const columns = [
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type) => {
        const colors = { export: 'blue', import: 'green' };
        const icons = { export: <ExportOutlined />, import: <ImportOutlined /> };
        return (
          <Tag color={colors[type]} icon={icons[type]}>
            {type === 'export' ? '导出' : '导入'}
          </Tag>
        );
      },
    },
    {
      title: '数据类型',
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (type) => entityLabels[type] || type,
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const statusConfig = {
          pending: { color: 'orange', label: '等待中' },
          processing: { color: 'blue', label: '处理中' },
          completed: { color: 'green', label: '已完成' },
          failed: { color: 'red', label: '失败' },
        };
        const config = statusConfig[status] || { color: 'default', label: status };
        return (
          <Space>
            <Tag color={config.color}>{config.label}</Tag>
            {status === 'processing' && record.progress !== undefined && (
              <Progress percent={record.progress} size="small" style={{ width: 100 }} />
            )}
          </Space>
        );
      },
    },
    {
      title: '记录数',
      dataIndex: 'total_count',
      key: 'total_count',
      render: (count, record) => (
        <span>
          {record.processed_count || 0} / {count || '-'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'completed' && record.task_type === 'export' && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadFile(record.file_path)}
            >
              下载
            </Button>
          )}
          {record.status === 'failed' && record.error_message && (
            <Button type="link" size="small" onClick={() => message.error(record.error_message)}>
              查看错误
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleDownloadFile = (filePath) => {
    message.info('文件下载功能需要配置静态文件服务');
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="数据导入导出说明"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>支持 Excel (.xlsx) 格式的批量导入导出</li>
              <li>导入前请先下载模板，按照模板格式填写数据</li>
              <li>大型文件导入会在后台处理，请在任务列表中查看进度</li>
            </ul>
          }
          type="info"
          showIcon
        />

        <Row gutter={16}>
          <Col span={12}>
            <Card title="数据导出" extra={<ExportOutlined />}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>选择导出数据类型：</div>
                  <Select
                    value={exportEntity}
                    onChange={setExportEntity}
                    style={{ width: '100%' }}
                  >
                    {Object.entries(entityLabels).map(([key, label]) => (
                      <Option key={key} value={key}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  block
                >
                  导出 {entityLabels[exportEntity]} 数据
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="数据导入" extra={<ImportOutlined />}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>选择导入数据类型：</div>
                  <Select
                    value={importEntity}
                    onChange={setImportEntity}
                    style={{ width: '100%' }}
                  >
                    {Object.entries(entityLabels).map(([key, label]) => (
                      <Option key={key} value={key}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </div>
                <Upload
                  beforeUpload={(file) => handleImport(file)}
                  showUploadList={false}
                  accept=".xlsx,.xls"
                >
                  <Button icon={<UploadOutlined />} block>
                    选择文件导入 {entityLabels[importEntity]}
                  </Button>
                </Upload>
                <div style={{ color: '#999', fontSize: 12 }}>
                  支持 .xlsx, .xls 格式，单文件不超过 10MB
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card
          title="任务列表"
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadTasks} loading={loading}>
              刷新
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>
    </div>
  );
}

export default ImportExport;
