import { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Empty, Spin, Row, Col, Image } from 'antd';
import type { Child, DailyRecord } from '@/types';
import { getChildren } from '@/api/children';
import { getDailyRecords } from '@/api/records';

const moodMap: Record<string, string> = { happy: '开心', calm: '平静', fussy: '烦躁', crying: '哭闹' };
const appetiteMap: Record<string, string> = { good: '好', normal: '一般', poor: '差' };

export default function MyChild() {
  const [childList, setChildList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getChildren({ is_active: true })
      .then((res) => {
        setChildList(res.results);
        if (res.results.length > 0) {
          setSelectedChild(res.results[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    getDailyRecords({ child: selectedChild.id, page_size: 10 })
      .then((res) => setRecords(res.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedChild]);

  if (childList.length === 0) {
    return (
      <div>
        <h2 style={{ marginBottom: 16 }}>我的孩子</h2>
        <Empty description="暂无关联的幼儿信息" />
      </div>
    );
  }

  const child = selectedChild || childList[0];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>我的孩子</h2>

      {childList.length > 1 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          {childList.map((c) => (
            <Tag
              key={c.id}
              color={c.id === child.id ? 'blue' : undefined}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedChild(c)}
            >
              {c.name}
            </Tag>
          ))}
        </div>
      )}

      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="姓名">{child.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{child.gender === 'M' ? '男' : '女'}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{child.birth_date}</Descriptions.Item>
          <Descriptions.Item label="班级">{child.class_group_name || '未分配'}</Descriptions.Item>
          <Descriptions.Item label="入园日期">{child.enrollment_date}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={child.is_active ? 'green' : 'red'}>{child.is_active ? '在园' : '停园'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="过敏信息">{child.allergies || '无'}</Descriptions.Item>
          <Descriptions.Item label="医疗备注">{child.medical_notes || '无'}</Descriptions.Item>
          <Descriptions.Item label="紧急联系人">{child.emergency_contact || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="紧急联系电话">{child.emergency_phone || '未设置'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="每日记录" style={{ marginBottom: 24 }}>
        <Spin spinning={loading}>
          {records.length === 0 ? (
            <Empty description="暂无每日记录" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {records.map((r) => (
                <Card
                  key={r.id}
                  size="small"
                  style={{
                    borderLeft: `4px solid ${r.mood === 'happy' ? '#52c41a' : r.mood === 'sick' ? '#ff4d4f' : '#1890ff'}`,
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {r.date} — 情绪: {moodMap[r.mood] || r.mood} | 食欲: {appetiteMap[r.appetite] || r.appetite}
                  </div>
                  {r.nap_start && <div>午睡: {r.nap_start} - {r.nap_end}（质量: {r.nap_quality || '-'}）</div>}
                  {r.breakfast && <div>早餐: {r.breakfast}</div>}
                  {r.lunch && <div>午餐: {r.lunch}</div>}
                  {r.activities && <div>活动: {r.activities}</div>}
                  {r.notes && <div style={{ color: '#999' }}>备注: {r.notes}</div>}
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </Card>

      <Card title="成长照片">
        {records.flatMap((r) => r.photos).length === 0 ? (
          <Empty description="暂无成长照片" />
        ) : (
          <Row gutter={[12, 12]}>
            {records.flatMap((r) =>
              r.photos.map((p) => (
                <Col key={p.id} xs={8} sm={6} md={4}>
                  <Image
                    src={p.image}
                    alt={p.caption || '成长照片'}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                    fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIiBmb250LXNpemU9IjE0Ij7ml6DnvKnnlaXlm748L3RleHQ+PC9zdmc+"
                  />
                </Col>
              )),
            )}
          </Row>
        )}
      </Card>
    </div>
  );
}
