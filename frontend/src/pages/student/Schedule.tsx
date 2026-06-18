import { useEffect, useState } from 'react';
import { Table, Card, DatePicker, Tag, Button, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { api } from '../../api';
import { ScheduleDto, ScheduleStatusMap } from '../../types';

export default function StudentSchedule() {
  const [data, setData] = useState<ScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('week'), dayjs().endOf('week')]);

  const loadData = () => {
    setLoading(true);
    api.schedules.my({
      startDate: range[0].startOf('day').toISOString(),
      endDate: range[1].endOf('day').toISOString()
    }).then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    {
      title: '日期',
      key: 'date',
      render: (_: any, r: ScheduleDto) => dayjs(r.startTime).format('YYYY-MM-DD ddd')
    },
    {
      title: '时间',
      key: 'time',
      render: (_: any, r: ScheduleDto) =>
        `${dayjs(r.startTime).format('HH:mm')} - ${dayjs(r.endTime).format('HH:mm')}`
    },
    { title: '课程', dataIndex: 'className', key: 'className' },
    { title: '老师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '教室', dataIndex: 'classroom', key: 'classroom' },
    { title: '课时', dataIndex: 'durationHours', key: 'durationHours', render: (h: number) => `${h}课时` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colorMap: Record<string, string> = {
          Scheduled: 'blue', Completed: 'green', Cancelled: 'red', Rescheduled: 'orange'
        };
        return <Tag color={colorMap[s]}>{ScheduleStatusMap[s as keyof typeof ScheduleStatusMap]}</Tag>;
      }
    }
  ];

  const presets = [
    { label: '本周', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
    { label: '下周', value: [dayjs().add(1, 'week').startOf('week'), dayjs().add(1, 'week').endOf('week')] },
    { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] }
  ];

  return (
    <div>
      <div className="page-title">我的课表</div>
      <Card className="card-shadow">
        <Space style={{ marginBottom: 16 }}>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [Dayjs, Dayjs])}
            presets={presets}
          />
          <Button type="primary" icon={<CalendarOutlined />} onClick={loadData}>
            查询
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
