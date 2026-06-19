import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Input, Select, DatePicker, Space, Card,
  Statistic, Row, Col, message,
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { logApi } from '../../services/api';
import type { OperationLog } from '../../types';

const { RangePicker } = DatePicker;

function OperationLogs() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [module, setModule] = useState<string | undefined>();
  const [operation, setOperation] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState<boolean | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await logApi.list({
        page, pageSize, keyword, module, operation, isSuccess,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      if (res.success && res.data) {
        setList(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]);

  const handleSearch = () => { setPage(1); fetchData(); };

  const handleExport = async () => {
    try {
      const blob: any = await logApi.export({
        keyword, module, operation, isSuccess,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `operation_logs_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch { }
  };

  const successCount = list.filter((l) => l.isSuccess).length;
  const failCount = list.length - successCount;

  const columns = [
    { title: '操作时间', dataIndex: 'operatedAt', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { title: '操作人', dataIndex: 'userName', width: 100 },
    { title: '角色', dataIndex: 'userRole', width: 120 },
    { title: '模块', dataIndex: 'module', width: 100 },
    { title: '操作', dataIndex: 'operation', width: 100 },
    { title: '目标类型', dataIndex: 'targetType', width: 100, render: (v: string) => v || '-' },
    { title: '目标名称', dataIndex: 'targetName', render: (v: string) => v || '-' },
    { title: 'IP地址', dataIndex: 'ipAddress', width: 130 },
    {
      title: '结果', dataIndex: 'isSuccess', width: 80,
      render: (v: boolean) => v
        ? <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
        : <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>,
    },
    { title: '错误信息', dataIndex: 'errorMessage', render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="总操作数" value={total} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="成功" value={successCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="失败" value={failCount} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="middle" wrap>
          <Input placeholder="搜索操作人/目标" prefix={<SearchOutlined />} allowClear style={{ width: 220 }}
            value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
          <Select placeholder="模块" allowClear style={{ width: 140 }} value={module} onChange={(v) => { setModule(v); setPage(1); }}
            options={[
              { value: '认证', label: '认证' },
              { value: '房源管理', label: '房源管理' },
              { value: '看房预约', label: '看房预约' },
              { value: '爽约管理', label: '爽约管理' },
              { value: '合同管理', label: '合同管理' },
              { value: '账单管理', label: '账单管理' },
              { value: '订单管理', label: '订单管理' },
              { value: '系统', label: '系统' },
            ]} />
          <Select placeholder="结果" allowClear style={{ width: 120 }} value={isSuccess === undefined ? undefined : String(isSuccess)}
            onChange={(v) => setIsSuccess(v === undefined ? undefined : v === 'true')}
            options={[{ value: 'true', label: '成功' }, { value: 'false', label: '失败' }]} />
          <RangePicker value={dateRange} onChange={setDateRange as any} showTime />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1400 }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
}

export default OperationLogs;
