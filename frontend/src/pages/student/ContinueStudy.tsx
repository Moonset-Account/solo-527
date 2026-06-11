import React, { useEffect, useState } from 'react';
import { List, Card, Progress, Button, Tag, Input, Select, Space, Typography, message, Modal } from 'antd';
import { PlayCircleOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { learningApi } from '@/api';
import { STATUS_MAP } from '@/utils/constants';
import { SearchFilterValues } from '@/components/SearchFilter';
import OperationPanel from '@/components/OperationPanel';
import dayjs from 'dayjs';

const { Title } = Typography;

const ContinueStudy: React.FC = () => {
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [studyModal, setStudyModal] = useState<any>(null);
  const [studyHours, setStudyHours] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await learningApi.list({
        keyword,
        status,
        pageNum,
        pageSize: 10,
      });
      setProgress(result.records || []);
      setTotal(result.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, status, pageNum]);

  const handleStudy = async () => {
    if (!studyModal) return;
    try {
      await learningApi.updateProgress(studyModal.id, { hours: studyHours });
      message.success(`已记录 ${studyHours} 学时`);
      setStudyModal(null);
      setStudyHours(1);
      loadData();
    } catch (e) {
      // handled
    }
  };

  const handleOpenPanel = (item: any) => {
    setSelectedItem(item);
    setPanelOpen(true);
  };

  return (
    <div>
      <Title level={3}>继续学习</Title>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder="状态"
          value={status}
          onChange={setStatus}
          style={{ width: 160 }}
          allowClear
          options={[
            { label: '学习中', value: 'IN_PROGRESS' },
            { label: '已完成', value: 'COMPLETED' },
          ]}
        />
      </Space>

      <Card>
        <List
          loading={loading}
          dataSource={progress}
          pagination={{
            current: pageNum,
            pageSize: 10,
            total,
            onChange: setPageNum,
          }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => setStudyModal(item)}
                  disabled={item.status === 'COMPLETED'}
                >
                  学习
                </Button>,
                <Button onClick={() => handleOpenPanel(item)}>详情</Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>课程 #{item.courseId}</span>
                    <Tag color={STATUS_MAP[item.status]?.color}>
                      {STATUS_MAP[item.status]?.text}
                    </Tag>
                    {item.classId && <Tag color="blue">班级 #{item.classId}</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <Progress percent={Number(item.completionRate || 0)} style={{ margin: '8px 0' }} />
                    <Space>
                      <span>
                        <ClockCircleOutlined /> 已学 {item.consumedHours || 0} / {item.totalHours || 0} 小时
                      </span>
                      <span>完成 {item.completedLessons || 0} 节课</span>
                      {item.lastStudyAt && (
                        <span>上次: {dayjs(item.lastStudyAt).format('YYYY-MM-DD HH:mm')}</span>
                      )}
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="记录学习"
        open={!!studyModal}
        onCancel={() => setStudyModal(null)}
        onOk={handleStudy}
      >
        <p>课程 #{studyModal?.courseId}</p>
        <Space>
          <span>本次学习时长:</span>
          <Input
            type="number"
            min={0.5}
            step={0.5}
            value={studyHours}
            onChange={(e) => setStudyHours(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <span>小时</span>
        </Space>
      </Modal>

      <OperationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        bizType="PROGRESS"
        bizId={selectedItem?.id}
        title={`学习进度 #${selectedItem?.id}`}
      />
    </div>
  );
};

export default ContinueStudy;
