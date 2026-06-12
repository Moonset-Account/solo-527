import React, { useState, useEffect } from 'react';
import {
  Card, DatePicker, Select, Table, Tag, Space, Button, Input, Statistic, Row, Col,
  Empty, Alert as AntAlert, message, Modal, Descriptions
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { energyApi } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const anomalyTypeColor = {
  '电压': 'red',
  '电流': 'orange',
  '功率': 'blue',
  '其它': 'default'
};

function detectAnomalyType(remark) {
  if (!remark) return '其它';
  if (remark.includes('电压')) return '电压';
  if (remark.includes('电流') || remark.includes('过载')) return '电流';
  if (remark.includes('功率')) return '功率';
  return '其它';
}

function ValidatePage() {
  const [timeRange, setTimeRange] = useState([dayjs().subtract(24, 'hour'), dayjs()]);
  const [selectedArea, setSelectedArea] = useState();
  const [areas, setAreas] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [totalInvalid, setTotalInvalid] = useState(0);

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  useEffect(() => {
    loadAreas();
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

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await energyApi.validateDetail({
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        area: selectedArea || undefined
      });
      const list = res.data?.data || [];
      const filtered = keyword
        ? list.filter(item =>
            (item.meterName && item.meterName.includes(keyword)) ||
            (item.meterCode && item.meterCode.includes(keyword)) ||
            (item.validateRemark && item.validateRemark.includes(keyword))
          )
        : list;
      setData(filtered);
      setTotalInvalid(filtered.length);
    } catch (e) {
      console.error('加载校验数据失败:', e);
      setErrorMsg(e.response?.data?.message || e.message || '加载校验数据失败');
      setData([]);
      setTotalInvalid(0);
    }
    setLoading(false);
  };

  const showDetail = (record) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const voltageWarning = (v) => {
    if (v == null) return '-';
    const num = Number(v);
    if (num > 280 || num < 160) return <Tag color="red">{num.toFixed(2)}</Tag>;
    return num.toFixed(2);
  };

  const columns = [
    { title: '采集时间', dataIndex: 'readingTime', width: 180, fixed: 'left' },
    { title: '区域', dataIndex: 'area', width: 80 },
    { title: '电表编号', dataIndex: 'meterCode', width: 140 },
    { title: '电表名称', dataIndex: 'meterName', width: 140 },
    {
      title: '电压(V)', dataIndex: 'voltage', width: 100,
      render: voltageWarning
    },
    {
      title: '电流(A)', dataIndex: 'currentValue', width: 100,
      render: v => v == null ? '-' : Number(v).toFixed(2)
    },
    {
      title: '有功功率(kW)', dataIndex: 'activePower', width: 130,
      render: v => v == null ? '-' : Number(v).toFixed(2)
    },
    {
      title: '功率因数', dataIndex: 'powerFactor', width: 100,
      render: v => v == null ? '-' : Number(v).toFixed(4)
    },
    {
      title: '异常类型', width: 100,
      render: (_, r) => {
        const t = detectAnomalyType(r.validateRemark);
        return <Tag color={anomalyTypeColor[t]}>{t}</Tag>;
      }
    },
    { title: '校验说明', dataIndex: 'validateRemark', ellipsis: true },
    {
      title: '操作', width: 100, fixed: 'right',
      render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>详情</Button>
    }
  ];

  return (
    <div>
      <div className="page-title">采集数据校验</div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="异常采集条数"
              value={totalInvalid}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: totalInvalid > 0 ? '#fa8c16' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="覆盖区域"
              value={areas.length}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="统计时段" value={`${timeRange[0].format('MM-DD HH:mm')} ~ ${timeRange[1].format('MM-DD HH:mm')}`} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="筛选区域"
              value={selectedArea || '全部区域'}
              valueStyle={{ color: selectedArea ? '#722ed1' : '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="filter-bar">
        <Space wrap>
          <RangePicker showTime value={timeRange} onChange={setTimeRange} />
          <Select
            placeholder="选择区域"
            style={{ width: 160 }}
            allowClear
            value={selectedArea}
            onChange={setSelectedArea}
            options={areas.map(a => ({ value: a, label: a }))}
          />
          <Input
            placeholder="搜索电表/异常说明"
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>刷新校验</Button>
        </Space>
      </Card>

      {errorMsg && (
        <AntAlert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          message="校验数据加载异常"
          description={errorMsg}
        />
      )}

      <Card className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: errorMsg
              ? <Empty description="暂无数据（接口异常）" />
              : <Empty description={<span><WarningOutlined style={{ marginRight: 4 }} />当前时间段内无校验异常</span>} />
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条异常记录`
          }}
        />
      </Card>

      <Modal
        title="采集数据校验详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={720}
        destroyOnClose
      >
        {currentRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="采集时间" span={2}>{currentRecord.readingTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="区域">{currentRecord.area || '-'}</Descriptions.Item>
            <Descriptions.Item label="电表名称">{currentRecord.meterName || '-'}</Descriptions.Item>
            <Descriptions.Item label="电表编号">{currentRecord.meterCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="数据ID">#{currentRecord.id}</Descriptions.Item>
            <Descriptions.Item label="电压(V)">
              {voltageWarning(currentRecord.voltage)}
            </Descriptions.Item>
            <Descriptions.Item label="电流(A)">
              {currentRecord.currentValue == null ? '-' : Number(currentRecord.currentValue).toFixed(3)}
            </Descriptions.Item>
            <Descriptions.Item label="有功功率(kW)">
              {currentRecord.activePower == null ? '-' : Number(currentRecord.activePower).toFixed(3)}
            </Descriptions.Item>
            <Descriptions.Item label="无功功率(kvar)">
              {currentRecord.reactivePower == null ? '-' : Number(currentRecord.reactivePower).toFixed(3)}
            </Descriptions.Item>
            <Descriptions.Item label="功率因数">
              {currentRecord.powerFactor == null ? '-' : Number(currentRecord.powerFactor).toFixed(4)}
            </Descriptions.Item>
            <Descriptions.Item label="累计电量(kWh)">
              {currentRecord.cumulativeEnergy == null ? '-' : Number(currentRecord.cumulativeEnergy).toFixed(3)}
            </Descriptions.Item>
            <Descriptions.Item label="校验状态" span={2}>
              {currentRecord.isValid
                ? <Tag color="green">有效</Tag>
                : <Tag color="red">异常（无效）</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="校验说明" span={2}>
              <Tag color={anomalyTypeColor[detectAnomalyType(currentRecord.validateRemark)]}>
                {detectAnomalyType(currentRecord.validateRemark)}
              </Tag>
              <span style={{ marginLeft: 8 }}>{currentRecord.validateRemark || '-'}</span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default ValidatePage;
