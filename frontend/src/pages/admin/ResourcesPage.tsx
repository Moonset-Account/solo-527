import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Space, Progress, Modal,
  App as AntdApp, Input, Select, Tooltip, Avatar, Empty, Alert,
} from 'antd';
import {
  ReloadOutlined, LockOutlined, UnlockOutlined, DatabaseOutlined,
  HddOutlined, FileOutlined, ExclamationCircleOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { contractApi, fileApi } from '../../api';
import { useAppStore, formatDate, formatSize } from '../../store';
import { FileResource, ContractAttachment } from '../../types';
const { Option } = Select;

export default function ResourcesPage() {
  const { message } = AntdApp.useApp();
  const { user, checkPermission } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const [attachments, setAttachments] = useState<ContractAttachment[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [fileStats, setFileStats] = useState<any>({});

  const fetchResourceUsage = async () => {
    setLoading(true);
    try {
      const res = await contractApi.getResourcesUsage();
      setData(res);
    } finally { setLoading(false); }
  };

  const fetchAttachments = async () => {
    try {
      const params: any = { page, pageSize };
      if (typeFilter) params.attachmentType = typeFilter;
      const res = await fileApi.queryAttachments(params) as any;
      let list = res.list || [];
      if (keyword) {
        list = list.filter((a: ContractAttachment) => a.originalName.includes(keyword));
      }
      setAttachments(list);
      setTotal(res.total || 0);
    } catch {}
  };

  const fetchFileStats = async () => {
    try {
      const res = await fileApi.getAttachmentStats();
      setFileStats(res);
    } catch {}
  };

  useEffect(() => {
    fetchResourceUsage();
    fetchFileStats();
    fetchAttachments();
  }, [page, pageSize, typeFilter]);

  useEffect(() => { fetchAttachments(); }, [typeFilter]);

  const handleLock = async (r: FileResource) => {
    try {
      Modal.confirm({
        title: `锁定资源？`,
        content: (
          <div>
            <p>资源：<b>{r.resourceName}</b></p>
            <p>锁定后其他用户将无法修改，默认为2小时。</p>
          </div>
        ),
        onOk: async () => {
          await contractApi.lockResource(r.id);
          message.success('已锁定');
          fetchResourceUsage();
        },
      });
    } catch (e: any) { message.error(e.message); }
  };

  const handleUnlock = async (r: FileResource) => {
    try {
      await contractApi.unlockResource(r.id);
      message.success('已解锁');
      fetchResourceUsage();
    } catch (e: any) { message.error(e.message); }
  };

  const totalGB = (data.totalSize || 0) / 1024 / 1024 / 1024;
  const pctUsed = Math.min(100, Math.round(totalGB / 500 * 100));

  const typeLabels: Record<string, string> = {
    contract_main: '合同主件', appendix: '附件', proof: '证明', id_card: '身份证',
    business_license: '营业执照', tax_certificate: '税务证明', other: '其他',
  };
  const statusMap: Record<string, any> = {
    uploaded: { label: '待审核', color: 'orange' },
    verified: { label: '已验证', color: 'green' },
    rejected: { label: '已拒绝', color: 'red' },
    expired: { label: '已过期', color: 'default' },
  };

  const resColumns = [
    {
      title: '资源', width: 260,
      render: (_, r: FileResource) => (
        <Space>
          <FileOutlined />
          <div>
            <div style={{ fontWeight: 500 }}>{r.resourceName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.resourceType}</div>
          </div>
        </Space>
      ),
    },
    { title: '资源键', dataIndex: 'resourceKey', ellipsis: true, render: (v) => <code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{v.substring(0, 32)}</code> },
    {
      title: '占用大小', dataIndex: 'size', width: 130, align: 'right' as any,
      sorter: (a: any, b: any) => a.size - b.size,
      render: (v) => <b>{formatSize(v)}</b>,
    },
    { title: '关联合同', dataIndex: 'contractId', width: 160, render: (v) => v ? <Tag color="blue">已关联</Tag> : '-' },
    {
      title: '锁定状态', width: 260,
      render: (_, r: FileResource) => r.isLocked ? (
        <div>
          <Space>
            <Tag color="red" icon={<LockOutlined />}>被锁定</Tag>
            {r.lockerName && <Avatar size={20} style={{ background: '#ff4d4f' }}>{r.lockerName[0]}</Avatar>}
            <span>{r.lockerName}</span>
          </Space>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
            到期：{formatDate(r.lockExpireAt, 'MM-DD HH:mm')}
            {r.lockExpireAt && new Date(r.lockExpireAt).getTime() < Date.now() && (
              <Tag color="warning" style={{ marginLeft: 8 }}>已过期</Tag>
            )}
          </div>
        </div>
      ) : <Tag color="green" icon={<UnlockOutlined />}>可用</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => formatDate(v) },
    {
      title: '操作', width: 120, fixed: 'right' as any,
      render: (_, r: FileResource) => (
        <Space>
          {r.isLocked ? (
            (r.lockerId === user?.id || checkPermission('file:permission:manage')) && (
              <Button size="small" type="link" icon={<UnlockOutlined />} onClick={() => handleUnlock(r)}>解锁</Button>
            )
          ) : (
            <Button size="small" type="link" icon={<LockOutlined />} onClick={() => handleLock(r)}>锁定</Button>
          )}
        </Space>
      ),
    },
  ];

  const attColumns = [
    {
      title: '文件名', width: 240, ellipsis: true, dataIndex: 'originalName',
      render: (v, r: any) => <a href={`/api/files/attachments/${r.id}/download`}>{v}</a>,
    },
    { title: '类型', dataIndex: 'attachmentType', width: 110, render: (v) => <Tag>{typeLabels[v] || v}</Tag> },
    { title: '大小', dataIndex: 'fileSize', width: 110, render: (v) => formatSize(v) },
    { title: '上传者', dataIndex: ['uploader', 'realName'], width: 110 },
    {
      title: '审核状态', dataIndex: 'status', width: 100,
      render: (v) => <Tag color={statusMap[v].color}>{statusMap[v].label}</Tag>,
    },
    {
      title: '使用统计', width: 160,
      render: (_: any, r: ContractAttachment) => (
        <div style={{ fontSize: 12 }}>
          <span style={{ color: '#1677ff' }}>👁 {r.viewCount}次</span>
          <span style={{ marginLeft: 12, color: '#52c41a' }}>⬇ {r.downloadCount}次</span>
        </div>
      ),
    },
    {
      title: '权限配置', width: 120,
      render: (_, r: ContractAttachment) => r.permissionConfig?.public
        ? <Tag color="green">公开</Tag>
        : <Tag color="orange">受限访问</Tag>,
    },
    { title: '上传时间', dataIndex: 'uploadedAt', width: 160, render: (v) => formatDate(v) },
    {
      title: '操作', width: 140, fixed: 'right' as any,
      render: (_, r: ContractAttachment) => (
        <Space>
          <Button size="small" type="link">预览</Button>
          <Button size="small" type="link">下载</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">
        <Space><DatabaseOutlined style={{ fontSize: 20, color: '#13c2c2' }} /><span>资源占用与文件管理</span></Space>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchResourceUsage(); fetchAttachments(); fetchFileStats(); }}>刷新</Button>
      </div>

      <Row gutter={[16, 16]} className="stats-grid">
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title={<><HddOutlined /> 文件总数</>} value={data.totalCount || 0} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title={<><DatabaseOutlined /> 占用空间</>}
              value={totalGB >= 1 ? totalGB.toFixed(2) : ((data.totalSize || 0) / 1024 / 1024).toFixed(1)}
              suffix={totalGB >= 1 ? 'GB' : 'MB'} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title={<><LockOutlined /> 锁定资源</>} value={data.lockedCount || 0} valueStyle={{ color: data.lockedCount > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title={<><SafetyOutlined /> 附件数</>} value={fileStats.total || 0} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <Statistic title="附件总大小"
              value={(fileStats.totalSize || 0) >= 1024 * 1024 ? ((fileStats.totalSize || 0) / 1024 / 1024).toFixed(1) : ((fileStats.totalSize || 0) / 1024).toFixed(0)}
              suffix={(fileStats.totalSize || 0) >= 1024 * 1024 ? 'MB' : 'KB'} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bordered={false} size="small" style={{ borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 6 }}>存储使用率 (限额500GB)</div>
            <Progress percent={pctUsed} status={pctUsed > 80 ? 'exception' : pctUsed > 60 ? 'normal' : 'success'} />
          </Card>
        </Col>
      </Row>

      {data.lockedCount > 0 && (
        <Alert
          message={`当前有 ${data.lockedCount} 个资源被锁定，可能造成资源冲突`}
          type="warning" showIcon style={{ marginBottom: 16, borderRadius: 8 }}
          action={<Button size="small" type="link">查看</Button>}
        />
      )}

      <div className="page-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
            资源占用明细（Top50）
          </div>
          <Space>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>按类型分布：</span>
            {Object.entries(data.byType || {}).map(([k, v]) => (
              <Tag key={k} color="blue">{k}: {formatSize(v as number)}</Tag>
            ))}
          </Space>
        </div>
        <Table
          rowKey="id" loading={loading} columns={resColumns} dataSource={data.resources || []}
          scroll={{ x: 1300 }} pagination={false}
          locale={{ emptyText: <Empty description="暂无资源数据" /> }}
        />
      </div>

      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            <FileOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            附件列表查询
          </div>
          <Space>
            <Input allowClear placeholder="搜索文件名" style={{ width: 200 }} value={keyword}
              onChange={(e) => setKeyword(e.target.value)} onPressEnter={fetchAttachments} />
            <Select allowClear placeholder="附件类型" style={{ width: 160 }} value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1); }}>
              {Object.entries(typeLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
            </Select>
          </Space>
        </div>
        <Table
          rowKey="id" columns={attColumns} dataSource={attachments} scroll={{ x: 1300 }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{ emptyText: <Empty description="暂无附件" /> }}
        />
      </div>
    </div>
  );
}
