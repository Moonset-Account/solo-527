import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Descriptions, Modal, Button, Space, message, Empty, Alert as AntAlert } from 'antd';
import dayjs from 'dayjs';
import { referenceApi } from '../api';

function StrategyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsError, setVersionsError] = useState('');
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await referenceApi.getStrategies(false);
      const list = res.data?.data;
      setData(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('加载策略列表失败:', e);
      setErrorMsg(e.response?.data?.message || e.message || '加载策略列表失败');
      setData([]);
    }
    setLoading(false);
  };

  const showDetail = async (record) => {
    setCurrent(record);
    setVersions([]);
    setVersionsError('');
    setVersionsLoading(true);
    setDetailVisible(true);
    try {
      const res = await referenceApi.getStrategyVersions(record.strategyCode);
      const list = res.data?.data;
      setVersions(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('加载策略版本失败:', e);
      setVersionsError(e.response?.data?.message || e.message || '加载策略版本失败');
      setVersions([]);
    }
    setVersionsLoading(false);
  };

  const columns = [
    { title: '策略名称', dataIndex: 'strategyName', width: 160, render: v => v || '-' },
    { title: '策略编码', dataIndex: 'strategyCode', width: 180, render: v => v || '-' },
    { title: '当前版本', dataIndex: 'version', width: 100, render: v => v || '-' },
    { title: '策略类型', dataIndex: 'strategyType', width: 100, render: v => v || '-' },
    { title: '关联告警类型', dataIndex: 'alertType', width: 150, render: v => v || '-' },
    { title: '阈值', dataIndex: 'thresholdValue', width: 100, render: v => v != null ? v : '-' },
    { title: '持续(分钟)', dataIndex: 'durationMinutes', width: 100, render: v => v != null ? v : '-' },
    {
      title: '状态', dataIndex: 'isActive', width: 100,
      render: v => v === true ? <Tag color="green">生效中</Tag> : v === false ? <Tag color="gray">已停用</Tag> : '-'
    },
    { title: '创建人', dataIndex: 'createBy', width: 100, render: v => v || '-' },
    { title: '更新时间', dataIndex: 'updateTime', width: 180, render: v => v || '-' },
    {
      title: '操作', width: 100,
      render: (_, r) => <Button type="link" size="small" onClick={() => showDetail(r)}>版本详情</Button>
    }
  ];

  return (
    <div>
      <div className="page-title">策略版本</div>

      {errorMsg && (
        <AntAlert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          message="策略列表加载异常"
          description={errorMsg}
        />
      )}

      <Card className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: errorMsg
              ? <Empty description="暂无数据（接口异常）" />
              : <Empty description="暂无策略数据" />
          }}
        />
      </Card>

      <Modal
        title={`策略版本详情 - ${current?.strategyName || ''}`}
        open={detailVisible}
        width={800}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        onCancel={() => setDetailVisible(false)}
        destroyOnClose
      >
        {current && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="策略编码">{current.strategyCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前版本">{current.version || '-'}</Descriptions.Item>
              <Descriptions.Item label="策略类型">{current.strategyType || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联告警">{current.alertType || '-'}</Descriptions.Item>
              <Descriptions.Item label="阈值">{current.thresholdValue != null ? current.thresholdValue : '-'}</Descriptions.Item>
              <Descriptions.Item label="持续时间">{current.durationMinutes != null ? `${current.durationMinutes} 分钟` : '-'}</Descriptions.Item>
              <Descriptions.Item label="生效时间">{current.effectiveTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{current.description || '-'}</Descriptions.Item>
            </Descriptions>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>历史版本</div>
            {versionsError && (
              <AntAlert
                style={{ marginBottom: 12 }}
                type="error"
                showIcon
                message="策略版本加载异常"
                description={versionsError}
              />
            )}
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              loading={versionsLoading}
              columns={[
                { title: '版本号', dataIndex: 'version', width: 120, render: v => v || '-' },
                {
                  title: '状态', dataIndex: 'isActive', width: 100,
                  render: v => v === true ? <Tag color="green">当前版本</Tag> : v === false ? <Tag color="default">历史</Tag> : '-'
                },
                { title: '更新时间', dataIndex: 'updateTime', render: v => v || '-' }
              ]}
              dataSource={versions}
              locale={{
                emptyText: versionsError
                  ? <Empty description="暂无版本数据（接口异常）" />
                  : <Empty description="暂无历史版本" />
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}

export default StrategyPage;
