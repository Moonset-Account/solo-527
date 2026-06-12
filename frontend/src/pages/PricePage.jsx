import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, DatePicker, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { referenceApi } from '../api';

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
  const [area, setArea] = useState();
  const [date, setDate] = useState(dayjs());
  const [areas] = useState(['A区', 'B区', 'C区', 'D区']);

  useEffect(() => {
    loadData();
  }, [area, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await referenceApi.getPrices({ area, date: date?.format('YYYY-MM-DD') });
      setData(res.data.data || generateMockData());
    } catch (e) {
      setData(generateMockData());
    }
    setLoading(false);
  };

  const generateMockData = () => {
    const rules = [
      { peakType: 'VALLEY', startTime: '00:00', endTime: '06:00', price: 0.35 },
      { peakType: 'FLAT', startTime: '06:00', endTime: '08:00', price: 0.68 },
      { peakType: 'HIGH', startTime: '08:00', endTime: '11:00', price: 1.05 },
      { peakType: 'PEAK', startTime: '11:00', endTime: '13:00', price: 1.35 },
      { peakType: 'HIGH', startTime: '13:00', endTime: '18:00', price: 1.05 },
      { peakType: 'PEAK', startTime: '18:00', endTime: '21:00', price: 1.35 },
      { peakType: 'FLAT', startTime: '21:00', endTime: '23:00', price: 0.68 },
      { peakType: 'VALLEY', startTime: '23:00', endTime: '24:00', price: 0.35 }
    ];
    return rules.map((r, i) => ({
      id: i + 1,
      ruleName: `${peakTypeMap[r.peakType]?.text}电价规则`,
      periodType: 'DAY',
      peakType: r.peakType,
      startTime: r.startTime,
      endTime: r.endTime,
      price: r.price.toFixed(4),
      effectiveDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      area: area || '全区',
      description: `${peakTypeMap[r.peakType]?.text}时段电价规则`
    }));
  };

  const columns = [
    { title: '规则名称', dataIndex: 'ruleName', width: 160 },
    {
      title: '峰谷类型', dataIndex: 'peakType', width: 100,
      render: v => <Tag color={peakTypeMap[v]?.color}>{peakTypeMap[v]?.text}</Tag>
    },
    { title: '起始时间', dataIndex: 'startTime', width: 100 },
    { title: '结束时间', dataIndex: 'endTime', width: 100 },
    { title: '电价(元/kWh)', dataIndex: 'price', width: 130, render: v => <b style={{ color: '#eb2f96' }}>{v}</b> },
    { title: '适用区域', dataIndex: 'area', width: 100 },
    { title: '生效日期', dataIndex: 'effectiveDate', width: 120 },
    { title: '说明', dataIndex: 'description' }
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
          <Button type="primary" onClick={loadData}>查询</Button>
        </Space>
      </Card>

      <Card className="table-card">
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} />
      </Card>
    </div>
  );
}

export default PricePage;
