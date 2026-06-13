import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, DatePicker, Select, Button, Table, Modal, Form, Input,
  Tag, Space, Statistic, message, Empty, Alert as AntAlert
} from 'antd';
import { Line } from '@ant-design/charts';
import { ReloadOutlined, ExportOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { alertApi, energyApi } from '../api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const alertStatusMap = {
  PENDING: { color: 'default', text: '待处理' },
  ASSIGNED: { color: 'blue', text: '已分派' },
  PROCESSING: { color: 'orange', text: '处理中' },
  RESOLVED: { color: 'green', text: '已解决' },
  CLOSED: { color: 'gray', text: '已关闭' }
};

const alertLevelMap = {
  LOW: { color: 'green', text: '低' },
  MEDIUM: { color: 'orange', text: '中' },
  HIGH: { color: 'red', text: '高' },
  CRITICAL: { color: 'magenta', text: '严重' }
};

function DispatchPage() {
  const [timeRange, setTimeRange] = useState([dayjs().subtract(24, 'hour'), dayjs()]);
  const [status, setStatus] = useState();
  const [assignee, setAssignee] = useState();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState();
  const [chartData, setChartData] = useState([]);
  const [abnormalData, setAbnormalData] = useState([]);
  const [alertStats, setAlertStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [chartError, setChartError] = useState('');
  const [tableError, setTableError] = useState('');

  const [assignModal, setAssignModal] = useState(false);
  const [handleModal, setHandleModal] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [assignForm] = Form.useForm();
  const [handleForm] = Form.useForm();

  useEffect(() => {
    loadAreas();
    loadStats();
    loadData();
  }, []);

  const loadAreas = async () => {
    try {
      const res = await energyApi.getAreas();
      setAreas(res.data?.data || []);
    } catch (e) {
      console.warn('加载区域失败:', e);
      setAreas([]);
    }
  };

  const loadStats = async () => {
    try {
      const res = await alertApi.getStats();
      setAlertStats(res.data?.data || {});
    } catch (e) {
      console.warn('加载告警统计失败:', e);
      setAlertStats({});
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    setChartError('');
    setTableError('');

    try {
      const curveRes = await energyApi.getCurve({
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        area: selectedArea || undefined,
        granularity: 'hour'
      });
      const curveData = curveRes.data?.data;
      if (Array.isArray(curveData)) {
        setChartData(curveData.map(d => ({
          time: dayjs(d.time).format('MM-DD HH:mm'),
          value: Number(d.value) || 0
        })));
      } else {
        setChartData([]);
      }
    } catch (e) {
      console.error('加载能耗曲线失败:', e);
      setChartError(e.response?.data?.message || e.message || '加载能耗曲线失败');
      setChartData([]);
    }

    try {
      const abnormalRes = await alertApi.getAbnormal({
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        status: status || undefined,
        assignee: assignee || undefined
      });
      const abnormal = abnormalRes.data?.data;
      setAbnormalData(Array.isArray(abnormal) ? abnormal : []);
    } catch (e) {
      console.error('加载告警列表失败:', e);
      setTableError(e.response?.data?.message || e.message || '加载告警列表失败');
      setAbnormalData([]);
    }

    if (chartError || tableError) {
      setErrorMsg('部分数据加载异常');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      message.loading({ content: '正在导出...', key: 'export', duration: 0 });
      const res = await energyApi.exportPeaks({
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        area: selectedArea || undefined
      });
      const disposition = res.headers?.['content-disposition'];
      let fileName = 'peak_export.csv';
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) {
          try { fileName = decodeURIComponent(match[1]); } catch (_) { fileName = match[1]; }
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
      message.success({ content: '导出成功', key: 'export' });
    } catch (e) {
      console.error('导出失败:', e);
      message.error({ content: e.response?.data?.message || '导出失败，请稍后重试', key: 'export' });
    }
  };

  const handleAssign = (record) => {
    setCurrentAlert(record);
    assignForm.resetFields();
    setAssignModal(true);
  };

  const submitAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      await alertApi.assign({ alertId: currentAlert.id, ...values });
      message.success('分派成功');
      setAssignModal(false);
      loadData();
      loadStats();
    } catch (e) {
      message.error(e.response?.data?.message || '分派失败');
    }
  };

  const handleProcess = (record) => {
    setCurrentAlert(record);
    handleForm.resetFields();
    setHandleModal(true);
  };

  const submitHandle = async () => {
    try {
      const values = await handleForm.validateFields();
      await alertApi.handle({ alertId: currentAlert.id, handler: '当前用户', ...values });
      message.success('处理完成');
      setHandleModal(false);
      loadData();
      loadStats();
    } catch (e) {
      message.error(e.response?.data?.message || '处理失败');
    }
  };

  const chartConfig = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    smooth: true,
    point: { size: 3 },
    color: '#1677ff',
    yAxis: { title: { text: '功率(kW)' } },
    xAxis: { title: { text: '时间' } }
  };

  const columns = [
    { title: '告警编号', dataIndex: 'alertNo', width: 120 },
    { title: '区域', dataIndex: 'area', width: 80 },
    { title: '电表', dataIndex: 'meterName', width: 120 },
    { title: '告警内容', dataIndex: 'alertContent' },
    {
      title: '级别', dataIndex: 'alertLevel', width: 80,
      render: v => alertLevelMap[v] ? <Tag color={alertLevelMap[v].color}>{alertLevelMap[v].text}</Tag> : (v || '-')
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => alertStatusMap[v] ? <Tag color={alertStatusMap[v].color}>{alertStatusMap[v].text}</Tag> : (v || '-')
    },
    { title: '责任人', dataIndex: 'assignee', width: 100, render: v => v || '-' },
    { title: '告警时间', dataIndex: 'alertTime', width: 170, render: v => v || '-' },
    {
      title: '操作', width: 180,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleAssign(r)} disabled={r.status === 'RESOLVED' || r.status === 'CLOSED'}>分派</Button>
          <Button type="link" size="small" onClick={() => handleProcess(r)} disabled={r.status === 'RESOLVED' || r.status === 'CLOSED'}>处理</Button>
        </Space>
      )
    }
  ];

  const renderStatValue = (v) => (v != null ? v : '-');

  return (
    <div>
      <div className="page-title">调度台</div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card className="stat-card"><div className="stat-value">{renderStatValue(alertStats.pending)}</div><div className="stat-label">待处理告警</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#1677ff' }}>{renderStatValue(alertStats.assigned)}</div><div className="stat-label">已分派</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#fa8c16' }}>{renderStatValue(alertStats.processing)}</div><div className="stat-label">处理中</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#52c41a' }}>{renderStatValue(alertStats.resolved)}</div><div className="stat-label">已解决</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#722ed1' }}>{renderStatValue(alertStats.total)}</div><div className="stat-label">告警总数</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#eb2f96' }}>{areas.length}</div><div className="stat-label">覆盖区域</div></Card></Col>
      </Row>

      <Card className="filter-bar">
        <Space wrap>
          <RangePicker showTime value={timeRange} onChange={setTimeRange} />
          <Select placeholder="告警状态" style={{ width: 140 }} allowClear value={status} onChange={setStatus}>
            <Select.Option value="PENDING">待处理</Select.Option>
            <Select.Option value="ASSIGNED">已分派</Select.Option>
            <Select.Option value="PROCESSING">处理中</Select.Option>
            <Select.Option value="RESOLVED">已解决</Select.Option>
          </Select>
          <Select placeholder="责任人" style={{ width: 140 }} allowClear value={assignee} onChange={setAssignee}>
            <Select.Option value="张三">张三</Select.Option>
            <Select.Option value="李四">李四</Select.Option>
            <Select.Option value="王五">王五</Select.Option>
            <Select.Option value="赵六">赵六</Select.Option>
          </Select>
          <Select placeholder="区域" style={{ width: 140 }} allowClear value={selectedArea} onChange={setSelectedArea}>
            {areas.map(a => <Select.Option key={a} value={a}>{a}</Select.Option>)}
          </Select>
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>查询</Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出峰值</Button>
        </Space>
      </Card>

      {errorMsg && (
        <AntAlert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="部分数据加载异常"
          description={`图表: ${chartError || '正常'} | 告警: ${tableError || '正常'}`}
        />
      )}

      <Row gutter={16}>
        <Col span={24}>
          <Card className="chart-card" title="能耗曲线">
            {chartData.length > 0 ? (
              <Line {...chartConfig} height={320} />
            ) : (
              chartError
                ? <div style={{ padding: '40px 0' }}>
                    <AntAlert type="error" showIcon message="能耗曲线加载异常" description={chartError} />
                  </div>
                : <Empty description="当前时段无能耗数据" style={{ padding: '80px 0' }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card className="table-card" title="异常表计 / 告警列表">
            {tableError && abnormalData.length === 0 ? (
              <AntAlert
                style={{ marginBottom: 16 }}
                type="error"
                showIcon
                message="告警列表加载异常"
                description={tableError}
              />
            ) : null}
            <Table
              rowKey="id"
              columns={columns}
              dataSource={abnormalData}
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: tableError
                  ? <Empty description="暂无数据（接口异常）" />
                  : <Empty description={<span><WarningOutlined style={{ marginRight: 4 }} />当前筛选条件下无告警</span>} />
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal title="分派告警" open={assignModal} onOk={submitAssign} onCancel={() => setAssignModal(false)} destroyOnClose>
        <Form form={assignForm} layout="vertical">
          <Form.Item label="责任人" name="assignee" rules={[{ required: true, message: '请选择责任人' }]}>
            <Select>
              <Select.Option value="张三">张三</Select.Option>
              <Select.Option value="李四">李四</Select.Option>
              <Select.Option value="王五">王五</Select.Option>
              <Select.Option value="赵六">赵六</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="处理告警" open={handleModal} onOk={submitHandle} onCancel={() => setHandleModal(false)} destroyOnClose>
        <Form form={handleForm} layout="vertical">
          <Form.Item label="处理结果" name="handleResult" rules={[{ required: true, message: '请选择处理结果' }]}>
            <Select>
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="PROCESSING">继续处理</Select.Option>
              <Select.Option value="CLOSED">关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="处理说明" name="handleRemark" rules={[{ required: true, message: '请填写处理说明' }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default DispatchPage;
