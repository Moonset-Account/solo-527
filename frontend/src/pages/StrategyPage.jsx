import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Switch, Descriptions, Modal, Button, Space, message } from 'antd';
import dayjs from 'dayjs';
import { referenceApi } from '../api';

function StrategyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await referenceApi.getStrategies(false);
      setData(res.data.data || generateMockData());
    } catch (e) {
      setData(generateMockData());
    }
    setLoading(false);
  };

  const generateMockData = () => {
    const names = ['过压保护策略', '过流保护策略', '削峰填谷策略', '负载均衡策略', '功率因数策略', '通讯检测策略'];
    const codes = ['VOLTAGE_THRESHOLD', 'CURRENT_LIMIT', 'PEAK_SHAVING', 'LOAD_BALANCE', 'PF_CONTROL', 'COMM_CHECK'];
    return names.map((n, i) => ({
      id: i + 1,
      strategyName: n,
      strategyCode: codes[i],
      version: `v1.${i}.${Math.floor(Math.random() * 5)}`,
      strategyType: ['阈值类', '限流类', '优化类', '均衡类', '控制类', '检测类'][i],
      alertType: ['OVER_VOLTAGE', 'OVER_CURRENT', 'PEAK_ALERT', 'LOAD_UNBALANCE', 'PF_LOW', 'COMM_FAIL'][i],
      thresholdValue: (220 + i * 25).toFixed(2),
      durationMinutes: [5, 10, 15, 30, 60, 120][i],
      description: `${n}的详细描述说明`,
      isActive: i < 4,
      effectiveTime: dayjs().subtract(i, 'month').format('YYYY-MM-DD HH:mm:ss'),
      createBy: 'admin',
      createTime: dayjs().subtract(i + 1, 'month').format('YYYY-MM-DD HH:mm:ss'),
      updateTime: dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss')
    }));
  };

  const showDetail = async (record) => {
    setCurrent(record);
    try {
      const res = await referenceApi.getStrategyVersions(record.strategyCode);
      setVersions(res.data.data || []);
    } catch (e) {
      setVersions(Array.from({ length: 3 }, (_, i) => ({
        id: i,
        version: `v1.${record.id - 1}.${i}`,
        isActive: i === 0,
        updateTime: dayjs().subtract(i, 'month').format('YYYY-MM-DD HH:mm:ss')
      })));
    }
    setDetailVisible(true);
  };

  const columns = [
    { title: '策略名称', dataIndex: 'strategyName', width: 160 },
    { title: '策略编码', dataIndex: 'strategyCode', width: 180 },
    { title: '当前版本', dataIndex: 'version', width: 100 },
    { title: '策略类型', dataIndex: 'strategyType', width: 100 },
    { title: '关联告警类型', dataIndex: 'alertType', width: 150 },
    { title: '阈值', dataIndex: 'thresholdValue', width: 100 },
    { title: '持续(分钟)', dataIndex: 'durationMinutes', width: 100 },
    {
      title: '状态', dataIndex: 'isActive', width: 100,
      render: v => v ? <Tag color="green">生效中</Tag> : <Tag color="gray">已停用</Tag>
    },
    { title: '创建人', dataIndex: 'createBy', width: 100 },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    {
      title: '操作', width: 100,
      render: (_, r) => <Button type="link" size="small" onClick={() => showDetail(r)}>版本详情</Button>
    }
  ];

  return (
    <div>
      <div className="page-title">策略版本</div>
      <Card className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`策略版本详情 - ${current?.strategyName || ''}`}
        open={detailVisible}
        width={800}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        onCancel={() => setDetailVisible(false)}
      >
        {current && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="策略编码">{current.strategyCode}</Descriptions.Item>
              <Descriptions.Item label="当前版本">{current.version}</Descriptions.Item>
              <Descriptions.Item label="策略类型">{current.strategyType}</Descriptions.Item>
              <Descriptions.Item label="关联告警">{current.alertType}</Descriptions.Item>
              <Descriptions.Item label="阈值">{current.thresholdValue}</Descriptions.Item>
              <Descriptions.Item label="持续时间">{current.durationMinutes} 分钟</Descriptions.Item>
              <Descriptions.Item label="生效时间">{current.effectiveTime}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{current.description}</Descriptions.Item>
            </Descriptions>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>历史版本</div>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              columns={[
                { title: '版本号', dataIndex: 'version', width: 120 },
                {
                  title: '状态', dataIndex: 'isActive', width: 100,
                  render: v => v ? <Tag color="green">当前版本</Tag> : <Tag color="default">历史</Tag>
                },
                { title: '更新时间', dataIndex: 'updateTime' }
              ]}
              dataSource={versions}
            />
          </>
        )}
      </Modal>
    </div>
  );
}

export default StrategyPage;
