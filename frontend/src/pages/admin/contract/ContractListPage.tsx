import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Tag, Button, Space, Input, Select, DatePicker, Row, Col, Card,
  Statistic, Modal, Form, Drawer, Divider, Upload, message, Progress, Popconfirm, Badge, Tooltip,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, FilterOutlined,
  FileTextOutlined, DownloadOutlined, EyeOutlined, EditOutlined,
  CheckCircleOutlined, CloseCircleOutlined, UploadOutlined, ExportOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import { contractApi, fileApi, approvalApi } from '../../../api';
import {
  contractStatusMap, contractTypeMap, urgencyMap, formatDate, formatSize,
  approvalStatusMap, useAppStore,
} from '../../../store';
import { Contract, ContractStatus, ContractType, UrgencyLevel, PageResult } from '../../../types';
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

export default function ContractListPage() {
  const navigate = useNavigate();
  const { checkPermission } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [submitVisible, setSubmitVisible] = useState(false);
  const [submitForm] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined as ContractStatus | undefined,
    contractType: undefined as ContractType | undefined,
    urgency: undefined as UrgencyLevel | undefined,
    materialsComplete: undefined as boolean | undefined,
    hasRejectionReason: undefined as boolean | undefined,
    hasAttachments: undefined as boolean | undefined,
    dateRange: [] as any[],
    amountMin: undefined as number | undefined,
    amountMax: undefined as number | undefined,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page, pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status,
        contractType: filters.contractType,
        urgency: filters.urgency,
        materialsComplete: filters.materialsComplete,
        hasRejectionReason: filters.hasRejectionReason,
        hasAttachments: filters.hasAttachments,
        amountMin: filters.amountMin,
        amountMax: filters.amountMax,
      };
      if (filters.dateRange?.length === 2) {
        params.dateRangeStart = filters.dateRange[0].format('YYYY-MM-DD');
        params.dateRangeEnd = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await contractApi.query(params) as unknown as PageResult<Contract>;
      setData(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const res = await contractApi.stats();
    setStats(res);
  };

  useEffect(() => {
    fetchData();
    fetchStats();
    (async () => {
      try {
        const res = await fetch('/api/auth/users').then(r => r.json());
        setUsers(res?.data?.list || []);
      } catch { setUsers([]); }
    })();
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [filters.status, filters.contractType, filters.urgency, filters.materialsComplete, filters.hasRejectionReason, filters.hasAttachments]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setFilters({
      keyword: '', status: undefined, contractType: undefined, urgency: undefined,
      materialsComplete: undefined, hasRejectionReason: undefined, hasAttachments: undefined,
      dateRange: [], amountMin: undefined, amountMax: undefined,
    });
    setPage(1);
    setTimeout(fetchData, 50);
  };

  const handleViewDetails = async (c: Contract) => {
    try {
      const detail = await contractApi.getById(c.id) as unknown as Contract;
      setCurrentContract(detail);
      setDetailVisible(true);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleSubmitApproval = async (c: Contract) => {
    setCurrentContract(c);
    submitForm.resetFields();
    submitForm.setFieldsValue({
      steps: [{ nodeName: '法务审核', approverId: '' }],
    });
    setSubmitVisible(true);
  };

  const doSubmitApproval = async () => {
    try {
      const values = await submitForm.validateFields();
      await approvalApi.submit({ contractId: currentContract!.id, steps: values.steps });
      message.success('已提交审批');
      setSubmitVisible(false);
      fetchData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await contractApi.archive(id);
      message.success('已归档');
      fetchData();
    } catch (e: any) { message.error(e.message); }
  };

  const handleVerifyMaterials = async (c: Contract, verified: boolean) => {
    Modal.confirm({
      title: verified ? '确认材料完整' : '确认材料不完整',
      content: (
        <Form>
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} placeholder="请输入备注说明（必填当选择不完整时）" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const remark = '';
        await contractApi.verifyMaterials(c.id, verified, remark);
        message.success('已更新材料状态');
        fetchData();
      },
    });
  };

  const columns: TableProps<Contract>['columns'] = [
    {
      title: '合同编号', dataIndex: 'contractNo', width: 150, fixed: 'left',
      sorter: true,
      render: (v, r) => <a onClick={() => handleViewDetails(r)} style={{ color: '#1677ff', fontWeight: 500 }}>{v}</a>,
    },
    {
      title: '合同标题', dataIndex: 'title', width: 240, ellipsis: true,
      render: (v, r) => (
        <Tooltip title={v} placement="topLeft">
          <div>{v}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
            {(contractTypeMap as any)[r.contractType] || r.contractType}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '金额', dataIndex: 'amount', width: 130, align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (v) => <span style={{ fontWeight: 600, color: v > 100000 ? '#ff4d4f' : '#1f1f1f' }}>¥{v?.toLocaleString() || 0}</span>,
    },
    { title: '甲方', dataIndex: 'partyA', width: 140, ellipsis: true },
    { title: '乙方', dataIndex: 'partyB', width: 140, ellipsis: true },
    {
      title: '紧急度', dataIndex: 'urgency', width: 90,
      render: (v) => {
        const info = (urgencyMap as any)[v];
        return <Tag color={info.color} icon={v === 'very_urgent' ? '🔥' : v === 'urgent' ? '⚡' : null}>{info.label}</Tag>;
      },
    },
    {
      title: '材料', dataIndex: 'materialsComplete', width: 100,
      render: (v, r) => v
        ? <Tag color="success" icon={<CheckCircleOutlined />}>完整</Tag>
        : <Badge status="warning" text={<span style={{ color: '#fa8c16' }}>不完整</span>} />,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      filters: Object.entries(contractStatusMap).map(([k, v]) => ({ text: (v as any).label, value: k })),
      onFilter: (value, record) => record.status === value,
      render: (v) => {
        const info = (contractStatusMap as any)[v];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '申请人', dataIndex: ['applicant', 'realName'], width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v) => formatDate(v),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作', width: 240, fixed: 'right' as const,
      render: (_: any, r) => (
        <Space size={4}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails(r)}>详情</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => navigate(`/contracts/${r.id}`)}>编辑</Button>
          {r.status === 'draft' || r.status === 'rejected' ? (
            r.materialsComplete ? (
              <Button size="small" type="primary" ghost icon={<FileTextOutlined />} onClick={() => handleSubmitApproval(r)}>提交审批</Button>
            ) : (
              <Tooltip title="请先补全材料">
                <Button size="small" disabled icon={<FileTextOutlined />}>提交审批</Button>
              </Tooltip>
            )
          ) : null}
          {(r.status === 'approved' || r.status === 'signed') && checkPermission('contract:archive') && (
            <Popconfirm title="确认归档该合同？" onConfirm={() => handleArchive(r.id)}>
              <Button size="small" type="link">归档</Button>
            </Popconfirm>
          )}
          {checkPermission('material:verify') && (
            <Dropdown trigger={['click']} menu={{
              items: [
                { key: 'complete', label: '✓ 标记完整', onClick: () => handleVerifyMaterials(r, true) },
                { key: 'incomplete', label: '✗ 标记不完整', onClick: () => handleVerifyMaterials(r, false) },
              ],
            }}>
              <Button size="small" type="link">核对</Button>
            </Dropdown>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">
        <span>合同列表</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          {checkPermission('contract:create') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/contracts/create')}>新建合同</Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} className="stats-grid">
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="总数" value={stats.total || 0} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="审批中" value={stats.byStatus?.approving || 0} valueStyle={{ fontSize: 22, color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="已退回" value={stats.byStatus?.rejected || 0} valueStyle={{ fontSize: 22, color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="已批准" value={stats.byStatus?.approved || 0} valueStyle={{ fontSize: 22, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="已归档" value={stats.byStatus?.archived || 0} valueStyle={{ fontSize: 22, color: '#8c8c8c' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="待我审批" value={stats.pendingApproval || 0} valueStyle={{ fontSize: 22, color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <div className="page-container" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16, fontSize: 14, color: '#595959', fontWeight: 500 }}>
          <FilterOutlined style={{ marginRight: 8 }} />高级筛选：支持申请附件、退回原因、资源占用等多维度查询
        </div>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索编号/标题/甲乙方"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="合同状态"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
            >
              {Object.entries(contractStatusMap).map(([k, v]) => (
                <Option key={k} value={k}>{(v as any).label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="合同类型"
              style={{ width: '100%' }}
              value={filters.contractType}
              onChange={(v) => setFilters({ ...filters, contractType: v })}
            >
              {Object.entries(contractTypeMap).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="紧急程度"
              style={{ width: '100%' }}
              value={filters.urgency}
              onChange={(v) => setFilters({ ...filters, urgency: v })}
            >
              {Object.entries(urgencyMap).map(([k, v]) => (
                <Option key={k} value={k}>{(v as any).label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="材料完整性"
              style={{ width: '100%' }}
              value={filters.materialsComplete === undefined ? undefined : String(filters.materialsComplete)}
              onChange={(v) => setFilters({ ...filters, materialsComplete: v === undefined ? undefined : v === 'true' })}
            >
              <Option value="true">材料完整</Option>
              <Option value="false">材料不完整</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="退回原因"
              style={{ width: '100%' }}
              value={filters.hasRejectionReason === undefined ? undefined : String(filters.hasRejectionReason)}
              onChange={(v) => setFilters({ ...filters, hasRejectionReason: v === undefined ? undefined : v === 'true' })}
            >
              <Option value="true">含退回原因</Option>
              <Option value="false">无退回原因</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="申请附件"
              style={{ width: '100%' }}
              value={filters.hasAttachments === undefined ? undefined : String(filters.hasAttachments)}
              onChange={(v) => setFilters({ ...filters, hasAttachments: v === undefined ? undefined : v === 'true' })}
            >
              <Option value="true">有附件</Option>
              <Option value="false">无附件</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker style={{ width: '100%' }} value={filters.dateRange as any} onChange={(v) => setFilters({ ...filters, dateRange: v as any })} />
          </Col>
          <Col xs={24} sm={24} md={24}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="page-container">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1400 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条，共 ${t} 条`,
          }}
        />
      </div>

      <Drawer
        title={`合同详情：${currentContract?.contractNo || ''}`}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={800}
        extra={
          <Space>
            <Button onClick={() => navigate(`/contracts/${currentContract?.id}`)}>编辑</Button>
            <Button type="primary" onClick={() => setDetailVisible(false)}>关闭</Button>
          </Space>
        }
      >
        {currentContract && (
          <div>
            <Descriptions title="基本信息" bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="合同编号">{currentContract.contractNo}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{currentContract.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{(contractTypeMap as any)[currentContract.contractType]}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={(contractStatusMap as any)[currentContract.status].color}>
                  {(contractStatusMap as any)[currentContract.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="甲方">{currentContract.partyA}</Descriptions.Item>
              <Descriptions.Item label="乙方">{currentContract.partyB}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{currentContract.amount?.toLocaleString() || 0} {currentContract.currency}</Descriptions.Item>
              <Descriptions.Item label="紧急度">
                <Tag color={(urgencyMap as any)[currentContract.urgency].color}>
                  {(urgencyMap as any)[currentContract.urgency].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {formatDate(currentContract.effectiveDate, 'YYYY-MM-DD')} ~ {formatDate(currentContract.expiryDate, 'YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="材料完整性">
                {currentContract.materialsComplete ? <Tag color="success">完整</Tag> : <Tag color="warning">不完整</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{currentContract.applicant?.realName}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentContract.owner?.realName || '-'}</Descriptions.Item>
              {currentContract.rejectionReason && (
                <Descriptions.Item label="退回原因" span={2}>
                  <div style={{ color: '#ff4d4f', background: '#fff1f0', padding: 8, borderRadius: 6 }}>
                    {currentContract.rejectionReason}
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="摘要" span={2}>{currentContract.summary || '-'}</Descriptions.Item>
            </Descriptions>

            {currentContract.materialChecklist?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Divider orientation="left" orientationMargin={0}>材料清单</Divider>
                <Progress
                  percent={Math.round(
                    (currentContract.materialChecklist.filter((m: any) => !m.required || m.uploaded).length /
                      Math.max(1, currentContract.materialChecklist.filter((m: any) => m.required).length)) * 100,
                  )}
                  status={currentContract.materialsComplete ? 'success' : 'active'}
                  style={{ marginBottom: 12 }}
                />
                <Table
                  rowKey="name"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '材料名称', dataIndex: 'name' },
                    {
                      title: '是否必需', dataIndex: 'required', width: 100,
                      render: (v) => v ? <Tag color="red">必需</Tag> : <Tag>可选</Tag>,
                    },
                    {
                      title: '是否上传', dataIndex: 'uploaded', width: 100,
                      render: (v) => v ? <Tag color="success">已上传</Tag> : <Tag color="default">未上传</Tag>,
                    },
                    { title: '备注', dataIndex: 'remark' },
                  ]}
                  dataSource={currentContract.materialChecklist as any}
                />
              </div>
            )}

            <Divider orientation="left" orientationMargin={0}>附件列表</Divider>
            <AttachmentList contractId={currentContract.id} onUploaded={handleViewDetails.bind(null, currentContract)} />
          </div>
        )}
      </Drawer>

      <Modal
        title={`提交审批 - ${currentContract?.contractNo || ''}`}
        open={submitVisible}
        onOk={doSubmitApproval}
        onCancel={() => setSubmitVisible(false)}
        okText="提交"
        width={700}
        destroyOnClose
      >
        <Form form={submitForm} layout="vertical">
          <Form.List name="steps">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, idx) => (
                  <Card size="small" key={field.key} style={{ marginBottom: 12 }}
                    title={`审批节点 ${idx + 1}`}
                    extra={fields.length > 1 ? <Button danger size="small" onClick={() => remove(field.name)}>删除</Button> : null}
                  >
                    <Row gutter={12}>
                      <Col xs={24} md={12}>
                        <Form.Item {...field} name={[field.name, 'nodeName']} label="节点名称"
                          rules={[{ required: true, message: '请输入节点名称' }]}
                          initialValue={`第${idx + 1}级审批`}>
                          <Input placeholder="如：法务审核" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item {...field} name={[field.name, 'approverId']} label="审批人"
                          rules={[{ required: true, message: '请选择审批人' }]}>
                          <Select placeholder="选择审批人" showSearch optionFilterProp="children">
                            {users.map((u) => (
                              <Option key={u.id} value={u.id}>{u.realName} - {u.department}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button block type="dashed" onClick={() => add()} style={{ marginBottom: 12 }}>
                  <PlusOutlined /> 添加审批节点
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}

import { Descriptions, Dropdown } from 'antd';

function AttachmentList({ contractId, onUploaded }: { contractId: string; onUploaded: () => void }) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const res = await fileApi.queryAttachments({ contractId, page: 1, pageSize: 100 }) as any;
      setAttachments(res.list || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (contractId) loadAttachments();
  }, [contractId]);

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      await fileApi.upload(file, contractId, 'other', (p) => setUploadProgress(p));
      message.success('上传成功');
      loadAttachments();
      onUploaded();
      onSuccess?.(null, file);
    } catch (e: any) {
      message.error(e.message);
      onError?.(e);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const attTypeMap: Record<string, string> = {
    contract_main: '合同主件', appendix: '附件', proof: '证明材料',
    id_card: '身份证', business_license: '营业执照', tax_certificate: '税务证明', other: '其他',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Tag color="blue">共 {attachments.length} 个，总 {formatSize(attachments.reduce((s, a) => s + a.fileSize, 0))}</Tag>
        <Upload
          customRequest={customRequest}
          showUploadList={false}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          multiple
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {uploading ? `上传中 ${uploadProgress}%` : '上传附件'}
          </Button>
        </Upload>
      </div>
      {uploading && <Progress percent={uploadProgress} status="active" style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        pagination={false}
        columns={[
          { title: '文件名', dataIndex: 'originalName', ellipsis: true,
            render: (v, r: any) => <a onClick={() => window.open(`/uploads/${r.filePath.replace(/^uploads\//, '')}`)}>{v}</a>,
          },
          { title: '类型', dataIndex: 'attachmentType', width: 100, render: (v) => attTypeMap[v] || v },
          { title: '大小', dataIndex: 'fileSize', width: 100, render: (v) => formatSize(v) },
          { title: '上传者', dataIndex: ['uploader', 'realName'], width: 100 },
          { title: '状态', dataIndex: 'status', width: 100, render: (v) => {
            const map: Record<string, any> = { uploaded: <Tag>待审核</Tag>, verified: <Tag color="success">已验证</Tag>, rejected: <Tag color="error">已拒绝</Tag> };
            return map[v] || v;
          }},
          { title: '权限', width: 160,
            render: (_, r: any) => r.permissionConfig?.public ? <Tag color="green">公开</Tag> : <Tag color="orange">受限</Tag>,
          },
          { title: '操作', width: 140,
            render: (_, r: any) => (
              <Space>
                <Button size="small" type="link" icon={<EyeOutlined />}
                  onClick={() => window.open(`/api/files/attachments/${r.id}`, '_blank')}>预览</Button>
                <Button size="small" type="link" icon={<DownloadOutlined />}
                  onClick={() => window.open(`/api/files/attachments/${r.id}/download`)}>下载</Button>
              </Space>
            ),
          },
        ]}
        dataSource={attachments}
      />
    </div>
  );
}
