import { useEffect, useState } from 'react';
import { Table, Card, Select, DatePicker, Space, Tag, Button, Modal, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { OperationLogDto } from '../../types';

const OperationTypeMap: Record<string, string> = {
  ParentNotification: '家长通知',
  ScheduleChange: '课表变更',
  WorkFeedback: '作品反馈',
  HoursDeduction: '课时扣减',
  LeaveApproval: '请假审批',
  ClassAdjustment: '班级调整',
  FeedbackReply: '反馈回复',
  BatchOperation: '批量操作'
};

const EntityTypeMap: Record<string, string> = {
  Class: '班级',
  Schedule: '课表',
  Attendance: '考勤',
  LeaveRecord: '请假记录',
  WorkFeedback: '作品反馈',
  HomeSchoolFeedback: '家校反馈',
  StudentClass: '学生班级关联',
  HoursWarning: '课时预警'
};

export default function AdminOperationLogs() {
  const [data, setData] = useState<OperationLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: '',
    operationType: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<OperationLogDto | null>(null);

  const loadData = () => {
    setLoading(true);
    const params: any = {};
    if (filters.entityType) params.entityType = filters.entityType;
    if (filters.operationType) params.type = filters.operationType;
    if (filters.dateRange) {
      params.startDate = filters.dateRange[0].startOf('day').toISOString();
      params.endDate = filters.dateRange[1].endOf('day').toISOString();
    }
    api.operationLogs.list(params).then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const typeColor: Record<string, string> = {
    ParentNotification: 'blue', ScheduleChange: 'orange', WorkFeedback: 'green',
    HoursDeduction: 'purple', LeaveApproval: 'cyan', ClassAdjustment: 'magenta',
    FeedbackReply: 'geekblue', BatchOperation: 'volcano'
  };

  const columns = [
    { title: '操作时间', key: 'time', render: (_: any, r: OperationLogDto) =>
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss')
    },
    { title: '操作类型', dataIndex: 'operationType', key: 'type', render: (v: string) =>
      <Tag color={typeColor[v] || 'default'}>{OperationTypeMap[v] || v}</Tag>
    },
    { title: '操作人', dataIndex: 'operatorName', key: 'operator' },
    { title: '数据类型', dataIndex: 'entityType', key: 'entity', render: (v: string) =>
      EntityTypeMap[v] || v
    },
    { title: '数据ID', dataIndex: 'entityId', key: 'entityId', render: (v?: number) => v || '-' },
    { title: '变更说明', dataIndex: 'changeDescription', key: 'desc', ellipsis: true },
    {
      title: '操作', key: 'action', render: (_: any, r: OperationLogDto) => (
        <Button size="small" type="link" onClick={() => { setCurrent(r); setDetailOpen(true); }}>
          查看详情
        </Button>
      )
    }
  ];

  const entityTypes = Object.entries(EntityTypeMap).map(([value, label]) => ({ value, label }));
  const operationTypes = Object.entries(OperationTypeMap).map(([value, label]) => ({ value, label }));

  return (
    <div>
      <div className="page-title">操作记录</div>
      <Card className="card-shadow">
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="数据类型"
            allowClear
            style={{ width: 140 }}
            value={filters.entityType || undefined}
            onChange={(v) => setFilters({ ...filters, entityType: v || '' })}
            options={entityTypes}
          />
          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 140 }}
            value={filters.operationType || undefined}
            onChange={(v) => setFilters({ ...filters, operationType: v || '' })}
            options={operationTypes}
          />
          <DatePicker.RangePicker
            value={filters.dateRange as any}
            onChange={(v) => setFilters({ ...filters, dateRange: v as any })}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>查询</Button>
          <Button onClick={() => {
            setFilters({ entityType: '', operationType: '', dateRange: null });
            setTimeout(loadData, 0);
          }}>重置</Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal title="操作详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={640}>
        {current && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="操作时间">{dayjs(current.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="操作类型">{OperationTypeMap[current.operationType] || current.operationType}</Descriptions.Item>
              <Descriptions.Item label="操作人">{current.operatorName}</Descriptions.Item>
              <Descriptions.Item label="数据类型">{EntityTypeMap[current.entityType] || current.entityType}</Descriptions.Item>
              <Descriptions.Item label="数据ID" span={2}>{current.entityId || '-'}</Descriptions.Item>
              <Descriptions.Item label="变更说明" span={2}>{current.changeDescription}</Descriptions.Item>
            </Descriptions>
            {current.beforeData && (
              <Card size="small" title="变更前数据" style={{ marginBottom: 12 }}>
                <pre style={{ margin: 0, fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 150, overflow: 'auto' }}>
                  {JSON.stringify(JSON.parse(current.beforeData), null, 2)}
                </pre>
              </Card>
            )}
            {current.afterData && (
              <Card size="small" title="变更后数据">
                <pre style={{ margin: 0, fontSize: 12, background: '#f0fff4', padding: 8, borderRadius: 4, maxHeight: 150, overflow: 'auto' }}>
                  {JSON.stringify(JSON.parse(current.afterData), null, 2)}
                </pre>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
