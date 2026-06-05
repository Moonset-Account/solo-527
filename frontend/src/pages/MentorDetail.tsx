import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Tag, Avatar, Button, Space, Tabs, 
  List, Rate, Spin, Empty
} from 'antd';
import { 
  ArrowLeftOutlined, CalendarOutlined
} from '@ant-design/icons';
import { mentorsApi } from '../api';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

const MentorDetail = () => {
  const { id } = useParams();
  const mentorId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: mentor, isLoading } = useQuery(
    ['mentor', mentorId],
    () => mentorsApi.get(mentorId),
    { enabled: !!mentorId }
  );

  const { data: feedbacks } = useQuery(
    ['mentor-feedbacks', mentorId],
    () => mentorsApi.getFeedbacks(mentorId, { per_page: 10 }),
    { enabled: !!mentorId }
  );

  const { data: timeSlots } = useQuery(
    ['mentor-slots', mentorId],
    () => mentorsApi.getTimeSlots(mentorId),
    { enabled: !!mentorId }
  );

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  const m = mentor?.data;
  if (!m) return <Empty description="导师不存在" />;

  const tabItems: any = [
    {
      key: 'info',
      label: '导师介绍',
      children: (
        <div className="space-y-4">
          <Card size="small" title="个人简介">
            <p className="text-gray-600">{m.bio || '暂无简介'}</p>
          </Card>
          
          <Card size="small" title="擅长领域">
            <Space wrap>
              {m.expertise_areas?.map((area: string, idx: number) => (
                <Tag key={idx} color="green">{area}</Tag>
              ))}
            </Space>
          </Card>

          <Card size="small" title="行业标签">
            <Space wrap>
              {m.industry_tags?.map((tag: string, idx: number) => (
                <Tag key={idx} color="blue">{tag}</Tag>
              ))}
            </Space>
          </Card>

          <Card size="small" title="教育背景">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="毕业院校">{m.school}</Descriptions.Item>
              <Descriptions.Item label="院系">{m.department}</Descriptions.Item>
              <Descriptions.Item label="专业">{m.major}</Descriptions.Item>
              <Descriptions.Item label="毕业年份">{m.graduation_year}年</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ),
    },
    {
      key: 'slots',
      label: '可预约时段',
      children: (
        <Card size="small">
          {timeSlots?.data?.length === 0 ? (
            <Empty description="暂无可用时段" />
          ) : (
            <List
              dataSource={timeSlots?.data?.slice(0, 10)}
              renderItem={(slot: any) => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small"
                      disabled={slot.is_booked}
                      onClick={() => {
                        if (user?.role === 'student') {
                          navigate(`/appointments/create?mentorId=${mentorId}&slotId=${slot.id}`);
                        }
                      }}
                    >
                      {slot.is_booked ? '已预约' : '预约'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={dayjs(slot.start_time).format('YYYY-MM-DD HH:mm')}
                    description={`至 ${dayjs(slot.end_time).format('HH:mm')}`}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'feedback',
      label: `评价 (${feedbacks?.data?.total || 0})`,
      children: (
        <Card size="small">
          {feedbacks?.data?.items?.length === 0 ? (
            <Empty description="暂无评价" />
          ) : (
            <List
              dataSource={feedbacks?.data?.items}
              renderItem={(fb: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{fb.student?.user?.name?.[0] || 'S'}</Avatar>}
                    title={
                      <Space>
                        <span>{fb.student?.user?.name || '匿名用户'}</span>
                        <Rate disabled value={fb.student_rating} />
                      </Space>
                    }
                    description={
                      <div>
                        <p className="text-gray-600">{fb.student_comment}</p>
                        <span className="text-gray-400 text-xs">
                          {dayjs(fb.student_submitted_at).format('YYYY-MM-DD')}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
      >
        返回
      </Button>

      <Card>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Avatar size={100} src={m.user.avatar_url}>
              {m.user.name?.[0]}
            </Avatar>
            <div className="mt-4 text-center md:text-left">
              <h2 className="text-xl font-bold">{m.user.name}</h2>
              <p className="text-gray-500">{m.current_position}</p>
              <p className="text-gray-500">{m.current_company}</p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-500">
                  ★ {m.average_rating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-gray-400 text-sm">评分</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{m.total_meetings}</div>
                <div className="text-gray-400 text-sm">咨询次数</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{m.years_of_experience}</div>
                <div className="text-gray-400 text-sm">工作年限</div>
              </div>
            </div>
            {user?.role === 'student' && (
              <Button 
                type="primary" 
                size="large" 
                icon={<CalendarOutlined />}
                className="mt-6 w-full md:w-auto"
                onClick={() => navigate(`/appointments/create?mentorId=${mentorId}`)}
              >
                立即预约
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default MentorDetail;
