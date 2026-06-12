import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Input, Select, Table, Button, Tag, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportApi } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const typeMap = {
  PEAK: { color: 'blue', text: '能耗峰值' },
  ALERT: { color: 'orange', text: '告警记录' },
  READING: { color: 'green', text: '采集数据' },
  STATISTICS: { color: 'purple', text: '统计报表' }
};

const statusMap = {
  SUCCESS: { color: 'green', text: '成功' },
  FAILED: { color: 'red', text: '失败' },
  PROCESSING: { color: 'blue', text: '处理中' }
};

function ExportHistoryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operator, setOperator] = useState('');
  const [timeRange, setTimeRange] = useState();
  const [exportType, setExportType] = useState();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await exportApi.search({
        operator: operator || undefined,
        startTime: timeRange?.[0]?.toISOString(),
        endTime: timeRange?.[1]?.toISOString(),
        exportType: exportType || undefined
      });
      setData(res.data.data?.content || generateMockData());
    } catch (e) {
      setData(generateMockData());
    }
    setLoading(false);
  };

  const generateMockData = () => {
    const types = ['PEAK', 'ALERT', 'READING', 'STATISTICS'];
    const operators = ['admin', '张三', '李四', '王五', '赵六'];
    const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED', 'PROCESSING'];
    return Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      exportNo: `EXP${20240000 + i}`,
      exportType: types[i % 4],
      fileName: `export_${types[i % 4].toLowerCase()}_${dayjs().subtract(i, 'day').format('YYYYMMDD')}.csv`,
      operator: operators[i % 5],
      area: `${String.fromCharCode(65 + (i % 4))}区`,
      exportTime: dayjs().subtract(i, 'day').subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      recordCount: 50 + Math.floor(Math.random() * 500),
      status: statuses[i % 5]
    }));
  };

  const columns = [
    { title: '导出编号', dataIndex: 'exportNo', width: 140 },
    {
      title: '导出类型', dataIndex: 'exportType', width: 120,
      render: v => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text}</Tag>
    },
    { title: '文件名', dataIndex: 'fileName', width: 280 },
    { title: '区域', dataIndex: 'area', width: 80 },
    { title: '操作者', dataIndex: 'operator', width: 100 },
    { title: '导出行数', dataIndex: 'recordCount', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag>
    },
    { title: '生成时间', dataIndex: 'exportTime', width: 180 },
    {
      title: '操作', width: 100,
      render: () => (
        <Space>
          <Button type="link" size="small" onClick={() => message.success('正在下载...')}>下载</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-title">导出历史</div>

      <Card className="filter-bar">
        <Space wrap>
          <Input
            placeholder="搜索操作者"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={operator}
            onChange={e => setOperator(e.target.value)}
            allowClear
          />
          <RangePicker showTime value={timeRange} onChange={setTimeRange} />
          <Select placeholder="导出类型" style={{ width: 160 }} allowClear value={exportType} onChange={setExportType}>
            <Option value="PEAK">能耗峰值</Option>
            <Option value="ALERT">告警记录</Option>
            <Option value="READING">采集数据</Option>
            <Option value="STATISTICS">统计报表</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>搜索</Button>
        </Space>
      </Card>

      <Card className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
        />
      </Card>
    </div>
  );
}

export default ExportHistoryPage;
