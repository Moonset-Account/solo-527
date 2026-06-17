import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Select, DatePicker, Tag, Modal, Form, Input, message,
  Row, Col, Alert, Descriptions, Card, Checkbox, Divider, List, Result
} from 'antd';
import {
  CheckOutlined, CloseOutlined, AuditOutlined, InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { lossReports, approvals, stores, lossReasons, users } from '../api/index.js';

const { TextArea } = Input;

function Approvals() {
  const [list, setList] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [storeList, setStoreList] = useState([]);
  const [reasonList, setReasonList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [approvalResult, setApprovalResult] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({});
  const [historyTab, setHistoryTab] = useState('pending');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      lossReports.list(filters),
      approvals.list(),
    ]).then(([data, history]) => {
      setList(data);
      setApprovalHistory(history);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    stores.list().then(setStoreList);
    lossReasons.list().then(setReasonList);
    users.list({ role: 'SUPERVISOR,ADMIN' }).then(setUserList);
  }, [filters]);

  const handleBatchApproval = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一条记录');
      return;
    }
    form.resetFields();
    setModalVisible(true);
  };

  const handleApprovalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = await approvals.create({
        ...values,
        lossReportIds: selectedRowKeys,
      });
      setApprovalResult(result);
      setResultVisible(true);
      setModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      loadData();
    } catch (err) {
      if (err.response?.data?.results) {
        setApprovalResult(err.response.data);
        setResultVisible(true);
        setModalVisible(false);
      } else {
        message.error(err.response?.data?.error || '审批失败');
      }
    }
  };

  const getImpactSummary = () => {
    const storesMap = {};
    selectedRows.forEach((row) => {
      const storeName = row.store?.name || '未知门店';
      if (!storesMap[storeName]) storesMap[storeName] = { count: 0, amount: 0 };
      storesMap[storeName].count++;
      storesMap[storeName].amount += row.lossValue || 0;
    });
    return storesMap;
  };

  const columns = [
    { title: '报损单号', dataIndex: 'reportNo', key: 'reportNo' },
    { title: '门店', dataIndex: ['store', 'name'], key: 'store' },
    {
      title: '报损时间',
      dataIndex: 'reportTime',
      key: 'reportTime',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    { title: '关联批次', dataIndex: ['batch', 'batchNo'], key: 'batch', render: (v) => v || '-' },
    { title: '报损原因', dataIndex: ['lossReason', 'name'], key: 'reason' },
    {
      title: '损耗金额',
      dataIndex: 'lossValue',
      key: 'lossValue',
      render: (v) => `¥${(v || 0).toFixed(2)}`,
    },
    { title: '上报人', dataIndex: 'reporter', key: 'reporter', render: (v) => v || '-' },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (s) => {
        const colors = { PENDING: 'gold', APPROVED: 'green', REJECTED: 'red' };
        const labels = { PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝' };
        return <Tag color={colors[s]}>{labels[s]}</Tag>;
      },
    },
    {
      title: '审批人',
      dataIndex: ['approval', 'approver', 'name'],
      key: 'approver',
      render: (v) => v || '-',
    },
    { title: '跟进动作', dataIndex: 'followUpAction', key: 'followUp', render: (v) => v || '-' },
  ];

  const historyColumns = [
    { title: '审批单号', dataIndex: 'id', key: 'id', render: (v) => `A${v}` },
    { title: '审批人', dataIndex: ['approver', 'name'], key: 'approver' },
    {
      title: '审批结果',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'APPROVED' ? 'green' : 'red'}>
          {s === 'APPROVED' ? '通过' : '拒绝'}
        </Tag>
      ),
    },
    { title: '审批意见', dataIndex: 'comment', key: 'comment', render: (v) => v || '-' },
    { title: '是否批量', dataIndex: 'batchApproval', key: 'batch', render: (v) => v ? '是' : '否' },
    {
      title: '审批时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const impactSummary = getImpactSummary();
  const totalAmount = selectedRows.reduce((sum, r) => sum + (r.lossValue || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><AuditOutlined /> 审批管理</h2>
        <p className="page-desc">批量审批报损单，查看影响对象，失败项保留原状态并提示原因</p>
      </div>

      {historyTab === 'pending' && (
        <>
          <div className="filter-bar">
            <Space wrap>
              <Select
                placeholder="选择门店"
                style={{ width: 180 }}
                allowClear
                onChange={(v) => setFilters({ ...filters, storeId: v })}
                options={storeList.map((s) => ({ label: s.name, value: s.id }))}
              />
              <Select
                placeholder="审批状态"
                style={{ width: 140 }}
                allowClear
                defaultValue="PENDING"
                onChange={(v) => setFilters({ ...filters, approvalStatus: v })}
                options={[
                  { label: '待审批', value: 'PENDING' },
                  { label: '已通过', value: 'APPROVED' },
                  { label: '已拒绝', value: 'REJECTED' },
                ]}
              />
              <Select
                placeholder="报损原因"
                style={{ width: 160 }}
                allowClear
                onChange={(v) => setFilters({ ...filters, lossReasonId: v })}
                options={reasonList.map((r) => ({ label: r.name, value: r.id }))}
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
              <Button type="primary" onClick={loadData}>查询</Button>
            </Space>
          </div>

          {selectedRowKeys.length > 0 && (
            <Alert
              message={
                <Space>
                  <span>已选择 <strong style={{ color: '#1890ff' }}>{selectedRowKeys.length}</strong> 条记录</span>
                  <span>涉及金额 <strong style={{ color: '#cf1322' }}>¥{totalAmount.toFixed(2)}</strong></span>
                  <span>涉及门店 <strong>{Object.keys(impactSummary).length}</strong> 家</span>
                </Space>
              }
              type="info"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button type="primary" onClick={handleBatchApproval} disabled={selectedRowKeys.length === 0}>
                批量审批
              </Button>
              <Button onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>
                清空选择
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={list}
            rowKey="id"
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys, rows) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              },
              getCheckboxProps: (record) => ({
                disabled: record.approvalStatus !== 'PENDING',
              }),
            }}
            pagination={{ pageSize: 15, showSizeChanger: true }}
          />

          <Modal
            title={`批量审批 (${selectedRowKeys.length} 条)`}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            onOk={handleApprovalSubmit}
            width={700}
            okText="确认审批"
          >
            <Divider orientation="left"><InfoCircleOutlined /> 影响对象预览</Divider>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" title="按门店统计">
                  <List
                    size="small"
                    dataSource={Object.entries(impactSummary)}
                    renderItem={([store, data]) => (
                      <List.Item>
                        <span>{store}</span>
                        <span style={{ marginLeft: 'auto' }}>
                          {data.count} 单 / ¥{data.amount.toFixed(2)}
                        </span>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="待审批记录">
                  <List
                    size="small"
                    dataSource={selectedRows}
                    renderItem={(item) => (
                      <List.Item>
                        <span>{item.reportNo}</span>
                        <Tag color="gold" style={{ marginLeft: 8 }}>{item.store?.name}</Tag>
                        <span style={{ marginLeft: 'auto', color: '#cf1322' }}>¥{(item.lossValue || 0).toFixed(2)}</span>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">审批信息</Divider>
            <Form form={form} layout="vertical">
              <Form.Item name="approverId" label="审批人" rules={[{ required: true, message: '请选择审批人' }]}>
                <Select
                  placeholder="请选择审批人"
                  options={userList.map((u) => ({ label: `${u.name} (${u.role})`, value: u.id }))}
                />
              </Form.Item>
              <Form.Item name="status" label="审批结果" rules={[{ required: true, message: '请选择审批结果' }]}>
                <Select
                  options={[
                    { label: '通过', value: 'APPROVED' },
                    { label: '拒绝', value: 'REJECTED' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="comment" label="审批意见/备注">
                <TextArea rows={3} placeholder="请输入审批意见..." />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="审批结果"
            open={resultVisible}
            onCancel={() => setResultVisible(false)}
            footer={[
              <Button key="ok" type="primary" onClick={() => setResultVisible(false)}>
                确定
              </Button>,
            ]}
            width={600}
          >
            {approvalResult && (
              <>
                {approvalResult.results?.failed?.length > 0 ? (
                  <Result
                    status="warning"
                    title="部分审批失败"
                    subTitle={`成功 ${approvalResult.results?.success?.length || 0} 条，失败 ${approvalResult.results?.failed?.length} 条`}
                  />
                ) : (
                  <Result
                    status="success"
                    title="审批完成"
                    subTitle={`共处理 ${approvalResult.results?.success?.length || 0} 条记录`}
                  />
                )}

                {approvalResult.results?.success?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="green" icon={<CheckOutlined />}>
                      成功 {approvalResult.results.success.length} 条
                    </Tag>
                  </div>
                )}

                {approvalResult.results?.failed?.length > 0 && (
                  <div>
                    <Tag color="red" icon={<CloseOutlined />} style={{ marginBottom: 8 }}>
                      失败 {approvalResult.results.failed.length} 条（状态未变更）
                    </Tag>
                    <List
                      size="small"
                      bordered
                      dataSource={approvalResult.results.failed}
                      renderItem={(item) => (
                        <List.Item>
                          <Space>
                            <ExclamationCircleOutlined style={{ color: '#cf1322' }} />
                            <span>记录ID: {item.id}</span>
                            <Tag color="red">失败原因: {item.reason}</Tag>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}

export default Approvals;
