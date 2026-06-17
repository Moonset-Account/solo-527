import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Select, DatePicker, Tag, message, Input, Descriptions, Modal, Form, Input as _ } from 'antd';
import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { lossReports, stores, ingredients, lossReasons } from '../api/index.js';

function LossDetails() {
  const [data, setData] = useState([]);
  const [storeList, setStoreList] = useState([]);
  const [ingredientList, setIngredientList] = useState([]);
  const [reasonList, setReasonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [followUpModal, setFollowUpModal] = useState(false);
  const [followUpForm] = Form.useForm();

  useEffect(() => {
    stores.list().then(setStoreList);
    ingredients.list().then(setIngredientList);
    lossReasons.list().then(setReasonList);
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    lossReports.list(filters).then((reports) => {
      const detailList = [];
      reports.forEach((report) => {
        report.ingredients.forEach((ing) => {
          detailList.push({
            key: `${report.id}-${ing.id}`,
            reportId: report.id,
            reportNo: report.reportNo,
            storeName: report.store?.name,
            storeId: report.storeId,
            reportTime: report.reportTime,
            batchNo: report.batch?.batchNo,
            lossReason: report.lossReason?.name,
            ingredientName: ing.ingredient?.name,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            unitPrice: ing.unitPrice,
            totalValue: ing.totalValue,
            approvalStatus: report.approvalStatus,
            reporter: report.reporter,
            description: report.description,
            followUpAction: report.followUpAction,
          });
        });
      });
      setData(detailList);
      setLoading(false);
    });
  };

  const handleSearch = () => {
    loadData();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.storeId) params.append('storeId', filters.storeId);
    if (filters.ingredientId) params.append('ingredientId', filters.ingredientId);
    if (filters.lossReasonId) params.append('lossReasonId', filters.lossReasonId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    window.open(`/api/export/loss-details?${params.toString()}`, '_blank');
    message.success('正在导出，请稍候...');
  };

  const handleViewDetail = async (record) => {
    const detail = await lossReports.get(record.reportId);
    setCurrentDetail(detail);
    setDetailVisible(true);
  };

  const handleFollowUp = (record) => {
    followUpForm.setFieldsValue({ followUpAction: record.followUpAction });
    setCurrentDetail(record);
    setFollowUpModal(true);
  };

  const handleFollowUpSubmit = async () => {
    try {
      const values = await followUpForm.validateFields();
      await lossReports.updateFollowUp(currentDetail.reportId, values);
      message.success('跟进记录已保存');
      setFollowUpModal(false);
      loadData();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const columns = [
    { title: '报损单号', dataIndex: 'reportNo', key: 'reportNo', fixed: 'left', width: 120 },
    { title: '门店', dataIndex: 'storeName', key: 'storeName', width: 100 },
    {
      title: '报损时间',
      dataIndex: 'reportTime',
      key: 'reportTime',
      width: 160,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.reportTime) - new Date(b.reportTime),
    },
    { title: '关联批次', dataIndex: 'batchNo', key: 'batchNo', width: 120 },
    { title: '报损原因', dataIndex: 'lossReason', key: 'lossReason', width: 120 },
    { title: '食材名称', dataIndex: 'ingredientName', key: 'ingredientName', width: 120 },
    { title: '损耗数量', dataIndex: 'quantity', key: 'quantity', width: 100, render: (v, r) => `${v} ${r.unit}` },
    { title: '单价(元)', dataIndex: 'unitPrice', key: 'unitPrice', width: 100, render: (v) => v?.toFixed(2) },
    {
      title: '损耗金额(元)',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 120,
      render: (v) => v?.toFixed(2),
      sorter: (a, b) => (a.totalValue || 0) - (b.totalValue || 0),
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (s) => {
        const colors = { PENDING: 'gold', APPROVED: 'green', REJECTED: 'red' };
        const labels = { PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝' };
        return <Tag color={colors[s]}>{labels[s]}</Tag>;
      },
    },
    {
      title: '上报人', dataIndex: 'reporter', key: 'reporter', width: 100 },
    {
      title: '跟进动作',
      dataIndex: 'followUpAction',
      key: 'followUpAction',
      width: 180,
      render: (v) => v || <Tag color="orange">未跟进</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          <Button size="small" type="primary" onClick={() => handleFollowUp(record)}>跟进</Button>
        </Space>
      ),
    },
  ];

  const totalAmount = data.reduce((sum, r) => sum + (r.totalValue || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">食材损耗明细</h2>
        <p className="page-desc">筛选查看各门店食材损耗明细，支持按条件导出报表</p>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Select
            placeholder="选择门店"
            style={{ width: 160 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, storeId: v })}
            options={storeList.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="食材"
            style={{ width: 160 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, ingredientId: v })}
            options={ingredientList.map((i) => ({ label: i.name, value: i.id }))}
          />
          <Select
            placeholder="报损原因"
            style={{ width: 160 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, lossReasonId: v })}
            options={reasonList.map((r) => ({ label: r.name, value: r.id }))}
          />
          <Select
            placeholder="审批状态"
            style={{ width: 140 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, approvalStatus: v })}
            options={[
              { label: '待审批', value: 'PENDING' },
              { label: '已通过', value: 'APPROVED' },
              { label: '已拒绝', value: 'REJECTED' },
            ]}
          />
          <DatePicker.RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  startDate: dates[0].toISOString(),
                  endDate: dates[1].toISOString(),
                });
              } else {
                  const { startDate, endDate, ...rest } = filters;
                  setFilters(rest);
              }
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出 Excel</Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
        <strong>当前筛选结果：</strong>共 {data.length} 条明细，损耗总金额 <span style={{ color: '#cf1322', fontSize: 18, fontWeight: 'bold' }}>¥{totalAmount.toFixed(2)}</span>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Modal
        title="报损单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentDetail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="报损单号">{currentDetail.reportNo}</Descriptions.Item>
              <Descriptions.Item label="门店">{currentDetail.store?.name}</Descriptions.Item>
              <Descriptions.Item label="报损时间">{dayjs(currentDetail.reportTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="报损原因">{currentDetail.lossReason?.name}</Descriptions.Item>
              <Descriptions.Item label="关联批次">{currentDetail.batch?.batchNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批状态">
                <Tag color={currentDetail.approvalStatus === 'APPROVED' ? 'green' : currentDetail.approvalStatus === 'PENDING' ? 'gold' : 'red'}>
                  {currentDetail.approvalStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="上报人" span={2}>{currentDetail.reporter || '-'}</Descriptions.Item>
              <Descriptions.Item label="损耗说明" span={2}>{currentDetail.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="跟进动作" span={2}>{currentDetail.followUpAction || '-'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <h4>损耗食材明细</h4>
              <Table
                size="small"
                dataSource={currentDetail.ingredients}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '食材', dataIndex: ['ingredient', 'name'], key: 'name' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v, r) => `${v} ${r.unit}` },
                  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => `¥${v?.toFixed(2)}` },
                  { title: '金额', dataIndex: 'totalValue', key: 'totalValue', render: (v) => `¥${v?.toFixed(2)}` },
                ]}
              />
            </div>
          </>
        )}
      </Modal>

      <Modal
        title="跟进动作记录"
        open={followUpModal}
        onOk={handleFollowUpSubmit}
        onCancel={() => setFollowUpModal(false)}
      >
        <Form form={followUpForm} layout="vertical">
          <Form.Item name="followUpAction" label="跟进动作/后续处理" rules={[{ required: true, message: '请输入跟进内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入跟进动作和处理结果..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LossDetails;
