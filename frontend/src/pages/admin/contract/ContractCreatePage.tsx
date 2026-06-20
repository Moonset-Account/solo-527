import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Input, Select, DatePicker, InputNumber, Button, Card, Row, Col, message,
  Space, Divider, Steps, Tag, Upload, Progress, Tooltip, Drawer, List, Modal,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, SaveOutlined, SendOutlined, UploadOutlined,
  EyeOutlined, DownloadOutlined, DeleteOutlined, UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { contractApi, approvalApi, fileApi, authApi } from '../../../api';
import { contractTypeMap, urgencyMap, formatDate, formatSize, contractStatusMap, useAppStore } from '../../../store';
import { Contract, ContractType, UrgencyLevel } from '../../../types';
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Props {
  mode?: 'create' | 'edit';
  contractId?: string;
}

export default function ContractCreatePage(props: Props) {
  const { mode = 'create', contractId } = props;
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reservedNo, setReservedNo] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [approveSteps, setApproveSteps] = useState<any[]>([]);
  const [materialChecklist, setMaterialChecklist] = useState<any[]>([
    { name: '合同主件', required: true, uploaded: false, remark: '' },
    { name: '营业执照（甲）', required: true, uploaded: false, remark: '' },
    { name: '营业执照（乙）', required: true, uploaded: false, remark: '' },
    { name: '身份证复印件', required: false, uploaded: false, remark: '' },
    { name: '授权委托书', required: false, uploaded: false, remark: '' },
    { name: '其他证明材料', required: false, uploaded: false, remark: '' },
  ]);

  useEffect(() => {
    (async () => {
      const r = await authApi.listUsers() as any;
      setUsers(r.list || []);
    })();
    (async () => {
      try {
        const res = await contractApi.reserveNumber();
        setReservedNo(res);
      } catch (e) {}
    })();
    if (mode === 'edit' && contractId) {
      loadContract();
    }
    if (mode === 'create') {
      form.setFieldsValue({
        urgency: 'normal',
        currency: 'CNY',
        amount: 0,
      });
    }
  }, [contractId, mode]);

  const loadContract = async () => {
    try {
      const c = await contractApi.getById(contractId!) as unknown as Contract;
      setCurrentContract(c);
      form.setFieldsValue({
        title: c.title,
        summary: c.summary,
        contractType: c.contractType,
        urgency: c.urgency,
        partyA: c.partyA,
        partyB: c.partyB,
        amount: c.amount,
        currency: c.currency,
        dateRange: c.effectiveDate && c.expiryDate ? [dayjs(c.effectiveDate), dayjs(c.expiryDate)] : undefined,
        ownerId: c.ownerId,
        customFields: c.customFields,
      });
      if (c.materialChecklist) setMaterialChecklist(c.materialChecklist);

      const atts = await fileApi.queryAttachments({ contractId: c.id, page: 1, pageSize: 100 }) as any;
      setAttachments(atts.list || []);
    } catch (e: any) { message.error(e.message); }
  };

  const handleSave = async (submitApproval = false) => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        ...values,
        effectiveDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        expiryDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        materialChecklist,
      };
      delete payload.dateRange;

      if (submitApproval) setSubmitting(true);
      else setSaving(true);

      let contract: Contract;
      if (mode === 'edit' && currentContract) {
        contract = await contractApi.update(currentContract.id, payload) as unknown as Contract;
      } else {
        contract = await contractApi.create(payload) as unknown as Contract;
      }

      if (submitApproval && approveSteps.length > 0) {
        await approvalApi.submit({ contractId: contract.id, steps: approveSteps });
        message.success('已保存并提交审批');
      } else {
        message.success(submitApproval ? '请先添加审批节点' : '已保存');
      }

      setTimeout(() => navigate('/contracts'), 500);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  const customUpload = async (options: any) => {
    if (!currentContract && mode === 'create') {
      message.warning('请先保存合同后再上传附件');
      return;
    }
    const cid = currentContract!.id;
    setUploading(true);
    try {
      await fileApi.upload(options.file, cid, 'other', (p) => setUploadProgress(p));
      message.success('上传成功');
      const atts = await fileApi.queryAttachments({ contractId: cid, page: 1, pageSize: 100 }) as any;
      setAttachments(atts.list || []);
      loadContract();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateMaterialItem = (idx: number, field: string, value: any) => {
    const arr = [...materialChecklist];
    arr[idx] = { ...arr[idx], [field]: value };
    setMaterialChecklist(arr);
  };

  const addApproveStep = () => {
    setApproveSteps([...approveSteps, { nodeName: `第${approveSteps.length + 1}级审批`, approverId: '' }]);
  };

  const materialsComplete = materialChecklist.filter((m) => m.required).every((m) => m.uploaded);

  return (
    <div>
      <div className="page-title">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contracts')}>返回列表</Button>
          <span>{mode === 'create' ? '新建合同' : `编辑合同 - ${currentContract?.contractNo || ''}`}</span>
        </Space>
        <Space>
          <Button icon={<SaveOutlined />} onClick={() => handleSave(false)} loading={saving} disabled={submitting}>
            保存草稿
          </Button>
          <Tooltip title={materialsComplete ? '' : '材料不完整，无法提交审批'}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSave(true)}
              loading={submitting}
              disabled={saving || !materialsComplete || approveSteps.length === 0}
            >
              保存并提交审批
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={17}>
          <Card className="page-container" style={{ marginBottom: 16 }}>
            <div className="section-title">基本信息</div>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="合同编号">
                    <Input value={currentContract?.contractNo || reservedNo?.contractNo || '（保存后自动生成）'} readOnly />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="contractType" label="合同类型" rules={[{ required: true }]}>
                    <Select placeholder="请选择">
                      {Object.entries(contractTypeMap).map(([k, v]) => (
                        <Option key={k} value={k}>{v}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="urgency" label="紧急程度">
                    <Select>
                      {Object.entries(urgencyMap).map(([k, v]) => (
                        <Option key={k} value={k}>{(v as any).label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24}>
                  <Form.Item name="title" label="合同标题" rules={[{ required: true, message: '请输入合同标题' }]}>
                    <Input placeholder="请输入合同标题" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="partyA" label="甲方（全称）" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="partyB" label="乙方（全称）" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="amount" label="合同金额">
                    <InputNumber style={{ width: '100%' }} min={0} step={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="currency" label="货币单位">
                    <Select>
                      <Option value="CNY">人民币 CNY</Option>
                      <Option value="USD">美元 USD</Option>
                      <Option value="EUR">欧元 EUR</Option>
                      <Option value="HKD">港币 HKD</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="dateRange" label="合同有效期">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="ownerId" label="负责人">
                    <Select placeholder="默认当前用户" allowClear showSearch optionFilterProp="children">
                      {users.map((u) => (
                        <Option key={u.id} value={u.id}>{u.realName} - {u.department}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="summary" label="合同摘要/备注">
                    <TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card className="page-container" style={{ marginBottom: 16 }}>
            <div className="section-title">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>材料清单核对</span>
                <Tag color={materialsComplete ? 'success' : 'warning'}>
                  {materialsComplete ? '✓ 材料完整' : '⚠ 材料不完整'}
                </Tag>
              </Space>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>材料名称</th>
                    <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0', width: 100 }}>是否必需</th>
                    <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0', width: 100 }}>是否上传</th>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {materialChecklist.map((m, idx) => (
                    <tr key={m.name} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: 12 }}>{m.name}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <Select value={m.required} onChange={(v) => updateMaterialItem(idx, 'required', v)} size="small" style={{ width: 80 }}>
                          <Option value={true}>必需</Option>
                          <Option value={false}>可选</Option>
                        </Select>
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <Select value={m.uploaded} onChange={(v) => updateMaterialItem(idx, 'uploaded', v)} size="small" style={{ width: 80 }}>
                          <Option value={true} style={{ color: '#52c41a' }}>✓ 已上传</Option>
                          <Option value={false} style={{ color: '#ff4d4f' }}>✗ 未上传</Option>
                        </Select>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Input size="small" value={m.remark} onChange={(e) => updateMaterialItem(idx, 'remark', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button size="small" icon={<PlusOutlined />} onClick={() => setMaterialChecklist([...materialChecklist, { name: '新材料', required: false, uploaded: false, remark: '' }])}>
                添加材料项
              </Button>
            </div>
          </Card>

          <Card className="page-container" style={{ marginBottom: 16 }}>
            <div className="section-title">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>审批流程设置（提交时生效）</span>
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addApproveStep}>
                  添加审批节点
                </Button>
              </Space>
            </div>
            {approveSteps.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>
                暂无审批节点，请点击上方按钮添加
              </div>
            ) : (
              <Steps direction="vertical" size="small" current={-1}>
                {approveSteps.map((step, idx) => (
                  <Steps.Step
                    key={idx}
                    status="process"
                    title={
                      <Input
                        size="small"
                        value={step.nodeName}
                        style={{ width: 240, marginRight: 12 }}
                        onChange={(e) => {
                          const arr = [...approveSteps];
                          arr[idx] = { ...step, nodeName: e.target.value };
                          setApproveSteps(arr);
                        }}
                      />
                    }
                    description={
                      <Space>
                        <Select
                          size="small"
                          style={{ width: 200 }}
                          placeholder="选择审批人"
                          value={step.approverId || undefined}
                          onChange={(v) => {
                            const arr = [...approveSteps];
                            arr[idx] = { ...step, approverId: v };
                            setApproveSteps(arr);
                          }}
                          showSearch
                          optionFilterProp="children"
                        >
                          {users.map((u) => (
                            <Option key={u.id} value={u.id}>{u.realName}</Option>
                          ))}
                        </Select>
                        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => setApproveSteps(approveSteps.filter((_, i) => i !== idx))} />
                      </Space>
                    }
                  />
                ))}
              </Steps>
            )}
          </Card>

          <Card className="page-container" style={{ marginBottom: 16 }}>
            <div className="section-title">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>合同附件</span>
                <Upload customRequest={customUpload} showUploadList={false} multiple>
                  <Button icon={<UploadOutlined />} loading={uploading} disabled={!currentContract && mode === 'create'}>
                    {!currentContract && mode === 'create' ? '请先保存合同' : `上传附件 ${uploading ? uploadProgress + '%' : ''}`}
                  </Button>
                </Upload>
              </Space>
            </div>
            {uploading && <Progress percent={uploadProgress} style={{ marginBottom: 16 }} />}
            {attachments.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#8c8c8c' }}>暂无附件</div>
            ) : (
              <List
                dataSource={attachments}
                renderItem={(a: any) => (
                  <List.Item
                    actions={[
                      <Button size="small" type="link" icon={<EyeOutlined />}>预览</Button>,
                      <Button size="small" type="link" icon={<DownloadOutlined />}>下载</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<div style={{ fontSize: 28 }}>📄</div>}
                      title={a.originalName}
                      description={
                        <Space>
                          <Tag>{a.attachmentType}</Tag>
                          <span style={{ color: '#8c8c8c' }}>{formatSize(a.fileSize)}</span>
                          <span style={{ color: '#8c8c8c' }}>{formatDate(a.uploadedAt, 'MM-DD HH:mm')}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <div style={{ position: 'sticky', top: 88 }}>
            <Card className="page-container" style={{ marginBottom: 16 }}>
              <div className="section-title">状态信息</div>
              <List size="small">
                <List.Item>
                  <span style={{ color: '#8c8c8c' }}>当前状态</span>
                  <Tag color={(contractStatusMap as any)[currentContract?.status || 'draft']?.color}>
                    {(contractStatusMap as any)[currentContract?.status || 'draft']?.label || '草稿'}
                  </Tag>
                </List.Item>
                <List.Item>
                  <span style={{ color: '#8c8c8c' }}>申请人</span>
                  <span>{currentContract?.applicant?.realName || user?.realName}</span>
                </List.Item>
                <List.Item>
                  <span style={{ color: '#8c8c8c' }}>创建时间</span>
                  <span>{currentContract?.createdAt ? formatDate(currentContract.createdAt) : '新建'}</span>
                </List.Item>
              </List>
            </Card>

            <Card className="page-container">
              <div className="section-title">操作说明</div>
              <List size="small" style={{ fontSize: 13, lineHeight: 1.8 }}>
                <List.Item>
                  1. 填写所有必填项后可保存为草稿
                </List.Item>
                <List.Item>
                  2. 材料清单中所有<b>必需</b>项均勾选已上传后才能提交审批
                </List.Item>
                <List.Item>
                  3. 至少配置 1 个审批人才能提交审批流程
                </List.Item>
                <List.Item>
                  4. 附件需保存合同后方可上传
                </List.Item>
              </List>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
