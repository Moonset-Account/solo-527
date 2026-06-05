import { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Card, List, Tag, Button, Select, Space, 
  Spin, Empty, Pagination, Avatar 
} from 'antd';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { appointmentsApi } from '../api';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待确认' },
  confirmed: { color: 'blue', text: '已确认' },
  in_progress: { color: 'green', text: '进行中' },
  completed: { color: 'gray', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
};

const AppointmentList = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [pageSize] = useState(10);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data, isLoading, refetch } = useQuery(
    ['appointments', page, status],
    () => appointmentsApi.list({
      page,
      per_page: pageSize,
      status,
    })
  );

  const renderItem = (appointment: any) => {
    const config = statusConfig[appointment.status] || { color: 'default', text: appointment.status };
    const otherParty = user?.role === 'student' ? appointment.mentor : appointment.student;
    const otherName = otherParty?.user?.name || '未知';
    
    return (
      <List.Item
        actions={[
          <Button type="link" onClick={() => navigate(`/appointments/${appointment.id}`)}>
            查看详情
          </Button>
        ]}
        className="hover:bg-gray-50"
      >
        <List.Item.Meta
          avatar={<Avatar size={48}>{otherName[0]}</Avatar>}
          title={
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{appointment.title}</span>
              <Tag color={config.color}>{config.text}</Tag>
            </div>
          }
          description={
            <div className="space-y-1">
              <div className="text-gray-600">
                <CalendarOutlined className="mr-2" />
                {dayjs(appointment.time_slot?.start_time).format('YYYY-MM-DD HH:mm')}
                {' - '}
                {dayjs(appointment.time_slot?.end_time).format('HH:mm')}
              </div>
              <div className="text-gray-500 text-sm">
                {user?.role === 'student' ? '导师' : '学生'}: {otherName}
              </div>
              {appointment.contact_unlocked && (
                <Tag color="green" size="small">联系方式已开放</Tag>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="space-y-4">
      <Card size="small">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <Space wrap>
            <span className="text-gray-500">状态筛选:</span>
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
            >
              {Object.entries(statusConfig).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Space>
          {user?.role === 'student' && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/appointments/create')}
            >
              新建预约
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : data?.data?.items?.length === 0 ? (
        <Card>
          <Empty 
            description="暂无预约记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {user?.role === 'student' && (
              <Button type="primary" onClick={() => navigate('/mentors')}>
                去寻找导师
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <>
          <Card styles={{ body: { padding: 0 } }}>
            <List
              dataSource={data?.data?.items}
              renderItem={renderItem}
              bordered={false}
              split
            />
          </Card>
          
          <div className="flex justify-center">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={data?.data?.total || 0}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentList;
