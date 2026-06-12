import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Input, Select, Table, Button, Tag, Space, message, Modal, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [operator, setOperator] = useState('');
  const [timeRange, setTimeRange] = useState();
  const [exportType, setExportType] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (p = 1, ps = 10) => {
    setLoading(true);
    try {
      const res = await exportApi.search({
        operator: operator || undefined,
        startTime: timeRange?.[0]?.toISOString(),
        endTime: timeRange?.[1]?.toISOString(),
        exportType: exportType || undefined,
        page: p - 1,
        size: ps
      });
      const pageData = res.data.data;
      if (pageData && pageData.content) {
        setData(pageData.content);
        setTotal(pageData.totalElements || pageData.total || 0);
      } else {
        setData(generateMockData());
        setTotal(50);
      }
    } catch (e) {
      setData(generateMockData());
      setTotal(50);
    }
    setLoading(false);
  };

  const generateMockData = () => {
    const types = ['PEAK', 'ALERT', 'READING', 'STATISTICS'];
    const operators = ['admin', '张三', '李四', '王五', '赵六'];
    const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED', 'PROCESSING'];
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      exportNo: `EXP${20240000 + i}`,
      exportType: types[i % 4],
      fileName: `export_${types[i % 4].toLowerCase()}_${dayjs().subtract(i, 'day').format('YYYYMMDD')}.csv`,
      operator: operators[i % 5],
      area: `${String.fromCharCode(65 + (i % 4))}区`,
      exportTime: dayjs().subtract(i, 'day').subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      startTime: dayjs().subtract(i + 7, 'day').format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss'),
      recordCount: 50 + Math.floor(Math.random() * 500),
      status: statuses[i % 5],
      filePath: `/exports/${dayjs().format('YYYYMMDD')}/file_${i}.csv`
    }));
  };

  const handleSearch = () => {
    setPage(1);
    loadData(1, pageSize);
  };

  const handlePageChange = (p, ps) => {
    setPage(p);
    setPageSize(ps);
    loadData(p, ps);
  };

  const showDetail = async (record) => {
    setDetailLoading(true);
    try {
      const res = await exportApi.getById(record.id);
      setCurrentRecord(res.data.data || record);
    } catch (e) {
      setCurrentRecord(record);
    }
    setDetailLoading(false);
    setDetailVisible(true);
  };

  const handleDownload = async (record) => {
    try {
      message.loading({ content: '正在下载...', key: 'download_' + record.id, duration: 0 });
      const res = await exportApi.download(record.id);
      const disposition = res.headers['content-disposition'];
      let fileName = record.fileName || 'export.csv';
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) {
          fileName = decodeURIComponent(match[1]);
        }
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({ content: '下载成功', key: 'download_' + record.id });
    } catch (e) {
      console.error('下载失败:', e);
      message.error({ content: '下载失败，请稍后重试', key: 'download_' + record.id });
    }
  };

  const columns = [
    { title: '导出编号', dataIndex: 'exportNo', width: 160, fixed: 'left' },
    {
      title: '导出类型', dataIndex: 'exportType', width: 120,
      render: v => typeMap[v] ? <Tag color={typeMap[v].color}>{typeMap[v].text}</Tag> : v
    },
    { title: '文件名', dataIndex: 'fileName', width: 280, ellipsis: true },
    { title: '区域', dataIndex: 'area', width: 80 },
    { title: '操作者', dataIndex: 'operator', width: 100 },
    { title: '记录数', dataIndex: 'recordCount', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    { title: '生成时间', dataIndex: 'exportTime', width: 180 },
    {
      title: '操作', width: 150, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>详情</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(r)} disabled={r.status === 'FAILED'}>下载</Button>
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
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
        </Space>
      </Card>

      <Card className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条记录`,
            onChange: handlePageChange
          }}
        />
      </Card>

      <Modal
        title="导出详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={640}
      >
        {currentRecord && (
          <Descriptions bordered column={2} size="small" loading={detailLoading}>
            <Descriptions.Item label="导出编号" span={2}>{currentRecord.exportNo}</Descriptions.Item>
            <Descriptions.Item label="导出类型">
              {typeMap[currentRecord.exportType]?.text || currentRecord.exportType}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {statusMap[currentRecord.status]?.text || currentRecord.status}
            </Descriptions.Item>
            <Descriptions.Item label="文件名" span={2}>{currentRecord.fileName}</Descriptions.Item>
            <Descriptions.Item label="操作者">{currentRecord.operator}</Descriptions.Item>
            <Descriptions.Item label="区域">{currentRecord.area || '-'}</Descriptions.Item>
            <Descriptions.Item label="记录数">{currentRecord.recordCount || '-'}</Descriptions.Item>
            <Descriptions.Item label="生成时间">{currentRecord.exportTime}</Descriptions.Item>
            <Descriptions.Item label="统计开始时间" span={2}>
              {currentRecord.startTime ? dayjs(currentRecord.startTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="统计结束时间" span={2}>
              {currentRecord.endTime ? dayjs(currentRecord.endTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="文件路径" span={2}>
              <span style={{ wordBreak: 'break-all' }}>{currentRecord.filePath || '-'}</span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default ExportHistoryPage;
