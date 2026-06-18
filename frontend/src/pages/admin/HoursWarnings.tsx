import { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, message, Space } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { HoursWarningDto } from '../../types';

export default function AdminWarnings() {
  const [data, setData] = useState<HoursWarningDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadData = () => {
    setLoading(true);
    const onlyUnnotified = filter === 'unnotified';
    const onlyActive = filter === 'active' || filter === 'unnotified';
    api.hoursWarnings.list(onlyUnnotified).then((res: any) => {
      let result = res as HoursWarningDto[];
      if (onlyActive && filter === 'active') {
        result = result.filter(w => !w.resolved);
      }
      setData(result);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [filter]);

  const handleResolve = async (id: number) => {
    try {
      await api.hoursWarnings.resolve(id);
      message.success('已标记为已处理');
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const columns = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '剩余课时', dataIndex: 'remainingHours', key: 'remainingHours', render: (v: number) =>
      <span style={{
        color: v <= 2 ? '#ff4d4f' : v <= 5 ? '#fa8c16' : '#52c41a',
        fontWeight: 600, fontSize: 16
      }}>
        {v} 课时
      </span>
    },
    { title: '预警阈值', dataIndex: 'thresholdHours', key: 'threshold', render: (v: number) => `${v}课时` },
    { title: '通知顾问', dataIndex: 'notifiedAdvisor', key: 'notified', render: (v: boolean) =>
      v ? <Tag color="green">已通知 {''}</Tag> : <Tag color="red">未通知</Tag>
    },
    { title: '负责顾问', dataIndex: 'advisorName', key: 'advisor' },
    { title: '通知时间', dataIndex: 'notifiedAt', key: 'notifiedAt', render: (v?: string) =>
      v ? dayjs(v).format('MM-DD HH:mm') : '-'
    },
    { title: '状态', dataIndex: 'resolved', key: 'resolved', render: (v: boolean) =>
      v ? <Tag color="default">已处理</Tag> : <Tag color="red">待处理</Tag>
    },
    { title: '预警时间', key: 'createdAt', render: (_: any, r: HoursWarningDto) =>
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作', key: 'action', render: (_: any, r: HoursWarningDto) =>
        !r.resolved ? (
          <Button size="small" icon={<CheckCircleOutlined />} type="primary" onClick={() => handleResolve(r.id)}>
            标记已处理
          </Button>
        ) : null
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>课时不足预警</div>
        <Space>
          <Button.Group>
            <Button type={filter === 'all' ? 'primary' : 'default'} onClick={() => setFilter('all')}>全部</Button>
            <Button type={filter === 'active' ? 'primary' : 'default'} onClick={() => setFilter('active')}>待处理</Button>
            <Button type={filter === 'unnotified' ? 'primary' : 'default'} onClick={() => setFilter('unnotified')}>未通知顾问</Button>
          </Button.Group>
        </Space>
      </div>
      <Card className="card-shadow">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
