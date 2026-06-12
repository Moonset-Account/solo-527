import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, DatePicker, Select, Button, Table, Modal, Form, Input,
  Tag, Space, Statistic, message
} from 'antd';
import { Line } from '@ant-design/charts';
import { ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { alertApi, energyApi } from '../api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

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
      setAreas(res.data.data || []);
    } catch (e) {
      setAreas(['A区', 'B区', 'C区', 'D区']);
    }
  };

  const loadStats = async () => {
    try {
      const res = await alertApi.getStats();
      setAlertStats(res.data.data || {});
    } catch (e) {
      setAlertStats({ pending: 12, assigned: 8, processing: 5, resolved: 45, total: 70 });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const curveRes = await energyApi.getCurve({
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        area: selectedArea,
        granularity: 'hour'
      });
      setChartData(curveRes.data.data?.map(d => ({
        time: dayjs(d.time).format('MM-DD HH:mm'),
        value: Number(d.value) || 0
      })) || generateMockCurveData());

      const abnormalRes = await alertApi.getAbnormal({
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        status,
        assignee
      });
      setAbnormalData(abnormalRes.data.data || generateMockAbnormalData());
    } catch (e) {
      setChartData(generateMockCurveData());
      setAbnormalData(generateMockAbnormalData());
    }
    setLoading(false);
  };

  const generateMockCurveData = () => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        time: dayjs().subtract(23 - i, 'hour').format('MM-DD HH:mm'),
        value: Math.round(500 + Math.random() * 800)
      });
    }
    return data;
  };

  const generateMockAbnormalData = () => {
    const types = ['OVER_VOLTAGE', 'OVER_CURRENT', 'POWER_ABNORMAL', 'COMMUNICATION_FAIL'];
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const statuses = ['PENDING', 'ASSIGNED', 'PROCESSING', 'RESOLVED'];
    const names = ['张三', '李四', '王五', '赵六'];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      alertNo: `ALT${10000 + i}`,
      alertType: types[i % 4],
      alertLevel: levels[i % 4],
      status: statuses[i % 4],
      alertContent: `电表异常告警-${i + 1}`,
      meterName: `电表-${String.fromCharCode(65 + i)}${100 + i}`,
      area: `${String.fromCharCode(65 + (i % 4))}区`,
      assignee: names[i % 4],
      alertTime: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      triggerValue: (200 + Math.random() * 100).toFixed(2)
    }));
  };

  const handleExport = async () => {
    try {
      message.loading({ content: '正在导出...', key: 'export', duration: 0 });
      const res = await energyApi.exportPeaks({
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        area: selectedArea
      });
      const disposition = res.headers['content-disposition'];
      let fileName = 'peak_export.csv';
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
      message.success({ content: '导出成功', key: 'export' });
    } catch (e) {
      console.error('导出失败:', e);
      message.error({ content: '导出失败，请稍后重试', key: 'export' });
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
    } catch (e) {
      message.error('分派失败');
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
    } catch (e) {
      message.error('处理失败');
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
      render: v => <Tag color={alertLevelMap[v]?.color}>{alertLevelMap[v]?.text}</Tag>
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => <Tag color={alertStatusMap[v]?.color}>{alertStatusMap[v]?.text}</Tag>
    },
    { title: '责任人', dataIndex: 'assignee', width: 100 },
    { title: '告警时间', dataIndex: 'alertTime', width: 170 },
    {
      title: '操作', width: 180,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleAssign(r)} disabled={r.status === 'RESOLVED'}>分派</Button>
          <Button type="link" size="small" onClick={() => handleProcess(r)} disabled={r.status === 'RESOLVED'}>处理</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-title">调度台</div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card className="stat-card"><div className="stat-value">{alertStats.pending || 0}</div><div className="stat-label">待处理告警</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#1677ff' }}>{alertStats.assigned || 0}</div><div className="stat-label">已分派</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#fa8c16' }}>{alertStats.processing || 0}</div><div className="stat-label">处理中</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#52c41a' }}>{alertStats.resolved || 0}</div><div className="stat-label">已解决</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#722ed1' }}>{alertStats.total || 0}</div><div className="stat-label">告警总数</div></Card></Col>
        <Col span={4}><Card className="stat-card"><div className="stat-value" style={{ color: '#eb2f96' }}>{areas.length}</div><div className="stat-label">覆盖区域</div></Card></Col>
      </Row>

      <Card className="filter-bar">
        <Space wrap>
          <RangePicker showTime value={timeRange} onChange={setTimeRange} />
          <Select placeholder="告警状态" style={{ width: 140 }} allowClear value={status} onChange={setStatus}>
            <Option value="PENDING">待处理</Option>
            <Option value="ASSIGNED">已分派</Option>
            <Option value="PROCESSING">处理中</Option>
            <Option value="RESOLVED">已解决</Option>
          </Select>
          <Select placeholder="责任人" style={{ width: 140 }} allowClear value={assignee} onChange={setAssignee}>
            <Option value="张三">张三</Option>
            <Option value="李四">李四</Option>
            <Option value="王五">王五</Option>
            <Option value="赵六">赵六</Option>
          </Select>
          <Select placeholder="区域" style={{ width: 140 }} allowClear value={selectedArea} onChange={setSelectedArea}>
            {areas.map(a => <Option key={a} value={a}>{a}</Option>)}
          </Select>
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>查询</Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出峰值</Button>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card className="chart-card" title="能耗曲线">
            <Line {...chartConfig} height={320} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card className="table-card" title="异常表计 / 告警列表">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={abnormalData}
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal title="分派告警" open={assignModal} onOk={submitAssign} onCancel={() => setAssignModal(false)}>
        <Form form={assignForm} layout="vertical">
          <Form.Item label="责任人" name="assignee" rules={[{ required: true, message: '请选择责任人' }]}>
            <Select>
              <Option value="张三">张三</Option>
              <Option value="李四">李四</Option>
              <Option value="王五">王五</Option>
              <Option value="赵六">赵六</Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="处理告警" open={handleModal} onOk={submitHandle} onCancel={() => setHandleModal(false)}>
        <Form form={handleForm} layout="vertical">
          <Form.Item label="处理结果" name="handleResult" rules={[{ required: true, message: '请选择处理结果' }]}>
            <Select>
              <Option value="RESOLVED">已解决</Option>
              <Option value="PROCESSING">继续处理</Option>
              <Option value="CLOSED">关闭</Option>
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
