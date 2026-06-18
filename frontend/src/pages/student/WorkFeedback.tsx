import { useEffect, useState } from 'react';
import { Card, List, Rate, Tag, Descriptions, Empty } from 'antd';
import dayjs from 'dayjs';
import { api } from '../../api';
import { WorkFeedbackDto } from '../../types';

export default function StudentWorkFeedback() {
  const [data, setData] = useState<WorkFeedbackDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.feedbacks.myWorkFeedbacks().then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-title">作品反馈</div>
      {data.length === 0 && !loading ? (
        <Empty description="暂无作品反馈" />
      ) : (
        <List
          loading={loading}
          dataSource={data}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Card className="card-shadow" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: 8 }}>{item.workTitle}</h3>
                    <div style={{ marginBottom: 8, color: '#8c8c8c', fontSize: 13 }}>
                      {item.className} · {dayjs(item.scheduleDate).format('YYYY-MM-DD')} · 老师：{item.teacherName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Rate disabled value={item.score / 20} count={5} style={{ fontSize: 16 }} />
                    <div style={{ marginTop: 4, fontWeight: 600, color: '#1677ff' }}>{item.score}分</div>
                  </div>
                </div>
                <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                  <Descriptions.Item label="老师评语">
                    <span style={{ whiteSpace: 'pre-wrap' }}>{item.feedback}</span>
                  </Descriptions.Item>
                  {item.suggestions && (
                    <Descriptions.Item label="改进建议">
                      <span style={{ whiteSpace: 'pre-wrap' }}>{item.suggestions}</span>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                <div style={{ marginTop: 12 }}>
                  {item.parentNotified ? (
                    <Tag color="green">已通知家长</Tag>
                  ) : (
                    <Tag color="gray">未通知</Tag>
                  )}
                  <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }}>
                    {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
