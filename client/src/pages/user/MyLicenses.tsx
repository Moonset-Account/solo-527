import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Select, Space, Button, Modal, Descriptions, Badge, Spin } from 'antd';
import { KeyOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import type { License } from '@/types';
import { getLicenseList, getLicenseDetail } from '@/api/license';
import { licenseStatusMap, licenseTypeMap, formatDate, formatMoney, billingCycleMap } from '@/utils';

const { Option } = Select;

const MyLicensesPage: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLicense, setCurrentLicense] = useState<License | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const result = await getLicenseList({ page, pageSize, status, type });
      setLicenses(result.list);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [page, status, type]);

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await getLicenseDetail(id);
      setCurrentLicense(detail);
      setDetailVisible(true);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getDaysLeftColor = (daysLeft?: number) => {
    if (!daysLeft || daysLeft <= 0) return 'red';
    if (daysLeft <= 7) return 'orange';
    return 'green';
  };

  const getDaysLeftText = (license: License) => {
    const endDate = new Date(license.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return '已过期';
    return `${daysLeft} 天后到期`;
  };

  const columns = [
    {
      title: '插件名称',
      dataIndex: ['plugin', 'name'],
      key: 'pluginName',
      render: (text: string, record: License) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm">
            <KeyOutlined />
          </div>
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '套餐',
      dataIndex: ['plan', 'name'],
      key: 'planName',
      render: (text: string, record: License) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-400">
            {record.plan ? formatMoney(Number(record.plan.price)) : '--'}/{record.plan ? billingCycleMap[record.plan.billingCycle] : ''}
          </div>
        </div>
      ),
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: License) => {
        const info = licenseStatusMap[status as keyof typeof licenseStatusMap];
        const endDate = new Date(record.endDate);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (status === 'ACTIVE' && daysLeft <= 7) {
          return <Badge status="warning" text="即将到期" />;
        }
        return <Tag color={info?.color}>{info?.text}</Tag>;
      },
    },
    {
      title: '席位使用',
      dataIndex: '',
      key: 'seats',
      width: 120,
      render: (_: any, record: License) => (
        <div>
          <div className="text-sm">
            <span className="font-medium text-blue-600">{record.usedSeats}</span>
            <span className="text-gray-400"> / {record.seatCount}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (record.usedSeats / record.seatCount) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: '有效期',
      key: 'validity',
      width: 160,
      render: (_: any, record: License) => (
        <div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <CalendarOutlined className="text-gray-400" />
            {formatDate(record.startDate)} ~ {formatDate(record.endDate)}
          </div>
          <div className="text-xs mt-1">
            {record.status === 'ACTIVE' ? (
              <span style={{ color: getDaysLeftColor(
                Math.ceil((new Date(record.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              ) }}>
                {getDaysLeftText(record)}
              </span>
            ) : (
              <span className="text-gray-400">已结束</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: License) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    { label: '全部授权', value: total, color: 'text-gray-800' },
    { label: '生效中', value: licenses.filter(l => l.status === 'ACTIVE').length, color: 'text-green-600' },
    { label: '试用授权', value: licenses.filter(l => l.type === 'TRIAL').length, color: 'text-orange-600' },
    { label: '即将到期', value: licenses.filter(l => {
      const days = Math.ceil((new Date(l.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return l.status === 'ACTIVE' && days <= 7;
    }).length, color: 'text-red-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">我的授权</h2>
        <p className="text-gray-500 text-sm">查看您拥有的所有插件授权及使用情况</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx} variant="borderless" size="small" className="text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card variant="borderless">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-600 text-sm">筛选：</span>
          <Select
            placeholder="授权状态"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={(val) => { setStatus(val); setPage(1); }}
          >
            <Option value="ACTIVE">生效中</Option>
            <Option value="EXPIRED">已过期</Option>
            <Option value="CANCELLED">已取消</Option>
          </Select>
          <Select
            placeholder="授权类型"
            allowClear
            style={{ width: 140 }}
            value={type}
            onChange={(val) => { setType(val); setPage(1); }}
          >
            <Option value="TRIAL">试用</Option>
            <Option value="PAID">付费</Option>
          </Select>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={licenses}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              showSizeChanger: false,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="授权详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        <Spin spinning={detailLoading}>
          {currentLicense && (
            <>
              <div className="flex items-center gap-4 pb-4 mb-4 border-b">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl">
                  <KeyOutlined />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{currentLicense.plugin?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag color={licenseTypeMap[currentLicense.type]?.color}>
                      {licenseTypeMap[currentLicense.type]?.text}
                    </Tag>
                    <Tag color={licenseStatusMap[currentLicense.status]?.color}>
                      {licenseStatusMap[currentLicense.status]?.text}
                    </Tag>
                  </div>
                </div>
              </div>

              <Descriptions column={2} size="small">
                <Descriptions.Item label="套餐">{currentLicense.plan?.name}</Descriptions.Item>
                <Descriptions.Item label="价格">
                  {currentLicense.plan ? formatMoney(Number(currentLicense.plan.price)) : '--'}
                  /{currentLicense.plan ? billingCycleMap[currentLicense.plan.billingCycle] : ''}
                </Descriptions.Item>
                <Descriptions.Item label="总席位">{currentLicense.seatCount}</Descriptions.Item>
                <Descriptions.Item label="已用席位">{currentLicense.usedSeats}</Descriptions.Item>
                <Descriptions.Item label="开始时间">{formatDate(currentLicense.startDate)}</Descriptions.Item>
                <Descriptions.Item label="到期时间">{formatDate(currentLicense.endDate)}</Descriptions.Item>
                <Descriptions.Item label="申请人" span={2}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    {currentLicense.user?.name}（{currentLicense.user?.department}）
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {currentLicense.remarks || '无'}
                </Descriptions.Item>
              </Descriptions>

              {currentLicense.trialHandles && currentLicense.trialHandles.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-3">处理记录</h4>
                  <div className="space-y-3">
                    {currentLicense.trialHandles.map(record => (
                      <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {record.result === 'CONVERT' ? '转正' : record.result === 'CLOSE' ? '关闭' : '延期'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(record.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          处理人：{record.handler?.name}
                          {record.extendDays > 0 && ` · 延期 ${record.extendDays} 天`}
                        </div>
                        {record.remark && (
                          <div className="text-sm text-gray-600 mt-2">备注：{record.remark}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default MyLicensesPage;
