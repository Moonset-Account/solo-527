import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Descriptions, Modal, message } from 'antd';
import { CalendarOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentApi } from '../../services/api';
import { appointmentStatusLabels, appointmentStatusColors } from '../../utils/enums';
import type { Appointment } from '../../types';
import { AppointmentStatus } from '../../types';

function MyAppointments() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Appointment[]>([]);
  const [detail, setDetail] = useState<Appointment | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.list({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        setList(res.data.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { title: '预约编号', dataIndex: 'appointmentNo', width: 160 },
    { title: '房源', dataIndex: 'spaceName' },
    { title: '看房日期', dataIndex: 'viewingDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD'), width: 120 },
    { title: '时间段', render: (_: any, r: Appointment) => `${r.startTime.substring(0, 5)}-${r.endTime.substring(0, 5)}`, width: 100 },
    { title: '跟进顾问', dataIndex: 'consultantName', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: AppointmentStatus) => <Tag color={appointmentStatusColors[v]}>{appointmentStatusLabels[v]}</Tag>,
    },
    {
      title: '操作', width: 120,
      render: (_: any, r: Appointment) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>
          <CalendarOutlined /> 我的看房预约
        </h2>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="预约详情"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={600}
      >
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="预约编号">{detail.appointmentNo}</Descriptions.Item>
            <Descriptions.Item label="房源">{detail.spaceName}</Descriptions.Item>
            <Descriptions.Item label="看房时间">
              {dayjs(detail.viewingDate).format('YYYY-MM-DD')} {detail.startTime.substring(0, 5)}-{detail.endTime.substring(0, 5)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={appointmentStatusColors[detail.status]}>{appointmentStatusLabels[detail.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="跟进顾问">{detail.consultantName || '暂未分配'}</Descriptions.Item>
            <Descriptions.Item label="备注">{detail.remarks || '-'}</Descriptions.Item>
            <Descriptions.Item label="需求">{detail.requirements || '-'}</Descriptions.Item>
            {detail.followUps.length > 0 && (
              <Descriptions.Item label="跟进记录">
                {detail.followUps.map((f) => (
                  <div key={f.id} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {f.consultantName} · {dayjs(f.followUpTime).format('YYYY-MM-DD HH:mm')} · {f.followUpType}
                    </div>
                    <div>{f.content}</div>
                    {f.nextStep && <div style={{ color: '#1677ff' }}>下一步：{f.nextStep}</div>}
                  </div>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default MyAppointments;
