import React, { useState, useEffect } from 'react';
import { Row, Col, Statistic, Card, Select, DatePicker } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import { dashboard, stores } from '../api/index.js';

const { RangePicker } = DatePicker;

function Dashboard() {
  const [summary, setSummary] = useState({});
  const [storeId, setStoreId] = useState();
  const [storeList, setStoreList] = useState([]);

  useEffect(() => {
    stores.list().then(setStoreList);
  }, []);

  useEffect(() => {
    dashboard.summary({ storeId }).then(setSummary);
  }, [storeId]);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><DashboardOutlined /> 数据概览</h2>
        <p className="page-desc">实时掌握门店运营与库存损耗情况</p>
      </div>

      <div className="filter-bar">
        <Select
          placeholder="选择门店"
          style={{ width: 200, marginRight: 16 }}
          allowClear
          onChange={setStoreId}
          options={storeList.map((s) => ({ label: s.name, value: s.id }))}
        />
        <RangePicker />
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic title="门店总数" value={summary.totalStores || 0} suffix="家" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic title="烘焙批次" value={summary.totalBatches || 0} suffix="个" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic title="待审批报损" value={summary.pendingApprovals || 0} suffix="单" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic title="低库存预警" value={summary.lowStockCount || 0} suffix="项" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="快速入口">
            <p>• 烘焙批次登记：记录每日烘焙生产批次和用料</p>
            <p>• 报损单管理：登记产品损耗及原因</p>
            <p>• 食材损耗明细：筛选和导出损耗数据</p>
            <p>• 督导追踪：现金流水、排班、巡店</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="今日任务">
            <p>• 审核待审批报损单（{summary.pendingApprovals || 0}）</p>
            <p>• 检查低库存食材（{summary.lowStockCount || 0}）</p>
            <p>• 查看排班冲突</p>
            <p>• 跟进巡店待办</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
