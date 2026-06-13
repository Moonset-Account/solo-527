import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, DatePicker, Button, Space, Empty, Alert as AntAlert } from 'antd';
import dayjs from 'dayjs';
import { referenceApi, energyApi } from '../api';

const { Option } = Select;

const peakTypeMap = {
  PEAK: { color: 'red', text: '尖峰' },
  HIGH: { color: 'orange', text: '高峰' },
  FLAT: { color: 'blue', text: '平段' },
  VALLEY: { color: 'green', text: '低谷' }
};

function PricePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [area, setArea] = useState();
  const [date, setDate] = useState(dayjs());
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    loadAreas();
    loadData();
  }, [area, date]);

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
      const res = await referenceApi.getPrices({
        area: area || undefined,
        date: date?.format('YYYY-MM-DD')
      });
      const list = res.data?.data;
      setData(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('加载电价规则失败:', e);
      setErrorMsg(e.response?.data?.message || e.message || '加载电价规则失败');
      setData([]);
    }
    setLoading(false);
  };

  const columns = [
    { title: '规则名称', dataIndex: 'ruleName', width: 160, render: v => v || '-' },
    {
      title: '峰谷类型', dataIndex: 'peakType', width: 100,
      render: v => peakTypeMap[v] ? <Tag color={peakTypeMap[v].color}>{peakTypeMap[v].text}</Tag> : (v || '-')
    },
    { title: '起始时间', dataIndex: 'startTime', width: 100, render: v => v || '-' },
    { title: '结束时间', dataIndex: 'endTime', width: 100, render: v => v || '-' },
    {
      title: '电价(元/kWh)', dataIndex: 'price', width: 130,
      render: v => v != null ? <b style={{ color: '#eb2f96' }}>{v}</b> : '-'
    },
    { title: '适用区域', dataIndex: 'area', width: 100, render: v => v || '-' },
    { title: '生效日期', dataIndex: 'effectiveDate', width: 120, render: v => v || '-' },
    { title: '说明', dataIndex: 'description', render: v => v || '-' }
  ];

  return (
    <div>
      <div className="page-title">电价规则</div>

      <Card className="filter-bar">
        <Space wrap>
          <Select placeholder="选择区域" style={{ width: 160 }} allowClear value={area} onChange={setArea}>
            {areas.map(a => <Option key={a} value={a}>{a}</Option>)}
          </Select>
          <DatePicker value={date} onChange={setDate} style={{ width: 160 }} />
          <Button type="primary" onClick={loadData} loading={loading}>查询</Button>
        </Space>
      </Card>

      {errorMsg && (
        <AntAlert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          message="电价规则加载异常"
          description={errorMsg}
        />
      )}

      <Card className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          locale={{
            emptyText: errorMsg
              ? <Empty description="暂无数据（接口异常）" />
              : <Empty description="当前条件下无电价规则" />
          }}
        />
      </Card>
    </div>
  );
}

export default PricePage;
