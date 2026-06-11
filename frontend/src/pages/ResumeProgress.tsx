import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Timeline, Modal, Typography, Empty } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../api/resume';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ResumeProgress: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);

  useEffect(() => {
    loadResumes();
  }, [user?.id]);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const res = await resumeApi.getMyResumes();
      if (res.success) {
        setResumes(res.data);
      }
    } catch (error) {
      console.error('Failed to load resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (resume: any) => {
    setSelectedResume(resume);
    try {
      const logsRes = await resumeApi.getStatusLogs(resume.id);
      if (logsRes.success) {
        setStatusLogs(logsRes.data);
      }
    } catch (error) {
      console.error('Failed to load status logs:', error);
    }
    setDetailModal(true);
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    submitted: { label: '已提交', color: 'blue' },
    screening: { label: '筛选中', color: 'orange' },
    written_test: { label: '笔试中', color: 'purple' },
    interview: { label: '面试中', color: 'cyan' },
    offer: { label: '已发Offer', color: 'green' },
    rejected: { label: '已拒绝', color: 'red' },
    hired: { label: '已入职', color: 'success' },
  };

  const statusOrder = ['submitted', 'screening', 'written_test', 'interview', 'offer', 'hired'];

  const columns = [
    {
      title: '应聘岗位',
      dataIndex: 'positionApplied',
      key: 'positionApplied',
      render: (text: string) => text || '未填写',
    },
    {
      title: '招聘周期',
      dataIndex: 'recruiterCycle',
      key: 'recruiterCycle',
      render: (text: string) => text || '未指定',
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '综合评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      render: (score: number) => score || '待评分',
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            查看进度
          </Button>
        </Space>
      ),
    },
  ];

  const getCurrentStepIndex = (status: string) => {
    if (status === 'rejected') return statusOrder.indexOf('screening');
    return statusOrder.indexOf(status);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>简历进度查询</Title>
        <Button type="primary" onClick={() => navigate('/resume/submit')}>
          投递新简历
        </Button>
      </div>

      {resumes.length === 0 ? (
        <Empty
          description="暂无简历投递记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/resume/submit')}>
            立即投递
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={resumes}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      )}

      <Modal
        title="简历进度详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedResume && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <p><Text strong>应聘岗位：</Text>{selectedResume.positionApplied || '未填写'}</p>
              <p><Text strong>招聘周期：</Text>{selectedResume.recruiterCycle || '未指定'}</p>
              <p><Text strong>当前状态：</Text>
                <Tag color={statusMap[selectedResume.status]?.color}>
                  {statusMap[selectedResume.status]?.label}
                </Tag>
              </p>
              <p><Text strong>提交时间：</Text>{dayjs(selectedResume.createdAt).format('YYYY-MM-DD HH:mm')}</p>
            </div>

            <Title level={5}>进度时间线</Title>
            <Timeline
              items={statusLogs
                .slice()
                .reverse()
                .map((log: any) => ({
                  color: statusMap[log.toStatus]?.color || 'blue',
                  children: (
                    <div>
                      <p style={{ marginBottom: 4 }}>
                        <Text strong>{statusMap[log.toStatus]?.label || log.toStatus}</Text>
                      </p>
                      <p style={{ marginBottom: 4, color: '#666' }}>
                        操作人：{log.operatorName}
                      </p>
                      {log.reason && (
                        <p style={{ color: '#999', fontSize: 12 }}>原因：{log.reason}</p>
                      )}
                      <p style={{ color: '#999', fontSize: 12 }}>
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}
                      </p>
                    </div>
                  ),
                }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResumeProgress;
