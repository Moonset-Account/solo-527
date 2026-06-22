import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Select, Modal, Descriptions, message, Spin, Timeline } from 'antd';
import { FileSearchOutlined, BellOutlined, DownloadOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import type { License, DepartmentSummaryData } from '@/types';
import { getRenewalList, getDepartmentSummary } from '@/api/settlement';
import { getApplicationDetail } from '@/api/application';
import { formatDate, formatMoney, licenseTypeMap, licenseStatusMap, billingCycleMap } from '@/utils';

const { TabPane } = Tabs;
const { Option } = Select;

const SettlementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('renewal');
  const [renewalList, setRenewalList] = useState<License[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [daysLeft, setDaysLeft] = useState(30);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLicense, setCurrentLicense] = useState<License | null>(null);
  const [applicationDetail, setApplicationDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRenewalList = async () => {
    setLoading(true);
    try {
      const result = await getRenewalList({ page, pageSize, daysLeft });
      setRenewalList(result.list);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentSummary = async () => {
    setLoading(true);
    try {
      const result = await getDepartmentSummary();
      setDepartmentData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'renewal') {
      fetchRenewalList();
    } else {
      fetchDepartmentSummary();
    }
  }, [activeTab, page, daysLeft]);

  const handleViewDetail = async (license: License) => {
    setDetailLoading(true);
    try {
      setCurrentLicense(license);
      if (license.applicationId) {
        const appDetail = await getApplicationDetail(license.applicationId);
        setApplicationDetail(appDetail);
      }
      setDetailVisible(true);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNotify = (license: License) => {
    message.success(`已向 ${license.user?.name} 发送续费提醒通知`);
  };

  const handleExport = () => {
    message.success('正在生成对账明细文件...');
  };

  const renewalColumns = [
    {
      title: '插件名称',
      dataIndex: ['plugin', 'name'],
      key: 'plugin',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '用户/部门',
      key: 'user',
      render: (_: any, record: License) => (
        <div>
          <div>{record.user?.name}</div>
          <div className="text-xs text-gray-400">{record.user?.department}</div>
        </div>
      ),
    },
    {
      title: '套餐',
      dataIndex: ['plan', 'name'],
      key: 'plan',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const info = licenseTypeMap[type as keyof typeof licenseTypeMap];
        return <Tag color={info?.color}>{info?.text}</Tag>;
      },
    },
    {
      title: '到期时间',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '剩余天数',
      key: 'daysLeft',
      width: 100,
      render: (_: any, record: License) => {
        const days = record.daysLeft || 0;
        let color = 'green';
        let text = `${days} 天`;
        if (days <= 0) { color = 'red'; text = '已过期'; }
        else if (days <= 7) { color = 'orange'; }
        return <span style={{ color }} className="font-medium">{text}</span>;
      },
    },
    {
      title: '状态',
      key: 'renewalStatus',
      width: 100,
      render: (_: any, record: License) => {
        const status = record.renewalStatus;
        if (status === 'EXPIRED') return <Tag color="red">已过期</Tag>;
        if (status === 'URGENT') return <Tag color="orange">即将到期</Tag>;
        return <Tag color="blue">待续费</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: License) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<BellOutlined />} onClick={() => handleNotify(record)}>
            提醒
          </Button>
        </Space>
      ),
    },
  ];

  const departmentColumns = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '授权数量',
      dataIndex: 'licenseCount',
      key: 'licenseCount',
      width: 100,
    },
    {
      title: '总席位',
      dataIndex: 'totalSeats',
      key: 'totalSeats',
      width: 100,
    },
    {
      title: '席位利用率',
      dataIndex: 'seatUtilization',
      key: 'seatUtilization',
      width: 120,
      render: (val: number) => <span>{val}%</span>,
    },
    {
      title: '月费用（预估）',
      dataIndex: 'monthlyCost',
      key: 'monthlyCost',
      width: 140,
      render: (val: number) => (
        <span className="text-blue-600 font-bold">{formatMoney(val)}</span>
      ),
    },
  ];

  const tabItems = [
    { key: 'renewal', label: <span><HistoryOutlined /> 续费名单</span> },
    { key: 'department', label: <span><FileSearchOutlined /> 部门对账</span> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">对账中心</h2>
        <p className="text-gray-500 text-sm">管理续费名单、跨部门对账及原始材料追溯</p>
      </div>

      <Card variant="borderless">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab === 'renewal' && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-gray-600 text-sm">到期范围：</span>
              <Select
                value={daysLeft}
                style={{ width: 140 }}
                onChange={(val) => { setDaysLeft(val); setPage(1); }}
              >
                <Option value={7}>7天内</Option>
                <Option value={15}>15天内</Option>
                <Option value={30}>30天内</Option>
                <Option value={60}>60天内</Option>
              </Select>
              <div className="ml-auto">
                <Button icon={<DownloadOutlined />} onClick={handleExport}>
                  导出名单
                </Button>
              </div>
            </div>

            <Spin spinning={loading}>
              <Table
                columns={renewalColumns}
                dataSource={renewalList}
                rowKey="id"
                scroll={{ x: 900 }}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  onChange: setPage,
                  showSizeChanger: false,
                }}
              />
            </Spin>
          </>
        )}

        {activeTab === 'department' && (
          <Spin spinning={loading}>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card size="small">
                <div className="text-gray-500 text-sm">部门数</div>
                <div className="text-2xl font-bold text-gray-800 mt-1">
                  {departmentData?.summary.totalDepartments || 0}
                </div>
              </Card>
              <Card size="small">
                <div className="text-gray-500 text-sm">授权总数</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {departmentData?.summary.totalLicenses || 0}
                </div>
              </Card>
              <Card size="small">
                <div className="text-gray-500 text-sm">月度总费用（预估）</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {formatMoney(departmentData?.summary.totalMonthlyCost || 0)}
                </div>
              </Card>
            </div>

            <Table
              columns={departmentColumns}
              dataSource={departmentData?.departmentData || []}
              rowKey="department"
              expandable={{
                expandedRowRender: (record) => (
                  <div className="pl-8">
                    <div className="text-gray-500 text-sm mb-2">插件费用明细：</div>
                    <Table
                      size="small"
                      columns={[
                        { title: '插件名称', dataIndex: 'pluginName', key: 'pluginName' },
                        { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
                        { title: '授权数', dataIndex: 'licenseCount', key: 'licenseCount', width: 80 },
                        { title: '总席位', dataIndex: 'totalSeats', key: 'totalSeats', width: 80 },
                        { title: '月费用', dataIndex: 'monthlyCost', key: 'monthlyCost', width: 120,
                          render: (val: number) => <span className="text-blue-600">{formatMoney(val)}</span>
                        },
                      ]}
                      dataSource={record.plugins}
                      rowKey="pluginId"
                      pagination={false}
                    />
                  </div>
                ),
              }}
              pagination={false}
            />
          </Spin>
        )}
      </Card>

      <Modal
        title="授权明细 - 原始材料追溯"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="export" type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出材料
          </Button>,
        ]}
        width={700}
      >
        <Spin spinning={detailLoading}>
          {currentLicense && (
            <>
              <div className="flex items-center gap-4 pb-4 mb-4 border-b">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
                  {currentLicense.plugin?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{currentLicense.plugin?.name}</h3>
                  <div className="flex items-center gap-2">
                    <Tag color={licenseTypeMap[currentLicense.type]?.color}>
                      {licenseTypeMap[currentLicense.type]?.text}
                    </Tag>
                    <Tag color={licenseStatusMap[currentLicense.status]?.color}>
                      {licenseStatusMap[currentLicense.status]?.text}
                    </Tag>
                  </div>
                </div>
              </div>

              <Descriptions column={2} size="small" className="mb-4">
                <Descriptions.Item label="套餐">{currentLicense.plan?.name}</Descriptions.Item>
                <Descriptions.Item label="账期">
                  {currentLicense.plan ? billingCycleMap[currentLicense.plan.billingCycle] : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="单价">
                  {currentLicense.plan ? formatMoney(Number(currentLicense.plan.price)) : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="席位">{currentLicense.seatCount} 个</Descriptions.Item>
                <Descriptions.Item label="开始时间">{formatDate(currentLicense.startDate)}</Descriptions.Item>
                <Descriptions.Item label="到期时间">{formatDate(currentLicense.endDate)}</Descriptions.Item>
              </Descriptions>

              {applicationDetail && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileSearchOutlined className="text-blue-500" />
                    原始申请材料
                  </h4>
                  <div className="p-3 bg-gray-50 rounded-lg mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">申请单 #{applicationDetail.id}</span>
                      <Tag>{applicationDetail.status === 'COMPLETED' ? '已审批' : applicationDetail.status}</Tag>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      申请人：{applicationDetail.applicantName}（{applicationDetail.department}）
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      申请时间：{formatDate(applicationDetail.createdAt)}
                    </div>
                    <div className="text-sm text-gray-700 p-2 bg-white rounded border">
                      <span className="text-gray-500">申请理由：</span>
                      {applicationDetail.reason}
                    </div>
                  </div>

                  <Timeline
                    items={[
                      {
                        color: 'blue',
                        children: (
                          <div>
                            <div className="font-medium">提交申请</div>
                            <div className="text-xs text-gray-400">{formatDate(applicationDetail.createdAt)}</div>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <div>
                            <div className="font-medium">审批通过</div>
                            <div className="text-xs text-gray-400">
                              审批人：{applicationDetail.approver?.name}
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default SettlementPage;
