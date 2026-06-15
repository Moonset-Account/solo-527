import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Steps,
  Timeline,
  Collapse,
  message,
  Spin,
} from 'antd';
import { useParams } from 'react-router-dom';
import {
  getContract,
  reviewContract,
  signContract,
  uploadContractAttachment,
  getContractHistory,
  payBill,
} from '../api';

const REVIEW_STATUS_COLOR = {
  DRAFT: 'default',
  PENDING_REVIEW: 'blue',
  REVIEWING: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  ANOMALOUS: 'red',
};

const REVIEW_STATUS_LABEL = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审核',
  REVIEWING: '审核中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  ANOMALOUS: '异常',
};

const SIGN_STATUS_COLOR = {
  PENDING_SIGN: 'default',
  SIGNING: 'blue',
  SIGNED: 'green',
  TERMINATED: 'default',
  ANOMALOUS: 'red',
};

const SIGN_STATUS_LABEL = {
  PENDING_SIGN: '待签署',
  SIGNING: '签署中',
  SIGNED: '已签署',
  TERMINATED: '已终止',
  ANOMALOUS: '异常',
};

const REVIEW_STEPS = ['DRAFT', 'PENDING_REVIEW', 'REVIEWING', 'APPROVED'];

const BILL_STATUS_COLOR = {
  PENDING: 'default',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'default',
};

const BILL_STATUS_LABEL = {
  PENDING: '待支付',
  PAID: '已支付',
  OVERDUE: '已逾期',
  CANCELLED: '已取消',
};

const billColumns = (onPay) => [
  { title: '账单编号', dataIndex: 'billNo', key: 'billNo' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '金额(元)', dataIndex: 'amount', key: 'amount' },
  { title: '到期日', dataIndex: 'dueDate', key: 'dueDate' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={BILL_STATUS_COLOR[status]}>{BILL_STATUS_LABEL[status] || status}</Tag>
    ),
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  {
    title: '操作',
    key: 'actions',
    render: (_, record) =>
      record.status === 'PENDING' ? (
        <Button type="link" size="small" onClick={() => onPay(record)}>
          支付
        </Button>
      ) : null,
  },
];

function JsonDiff({ before, after }) {
  const allKeys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  const diffs = allKeys
    .filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
    .map((key) => ({
      key,
      before: before?.[key] ?? '-',
      after: after?.[key] ?? '-',
    }));

  if (diffs.length === 0) return <span style={{ color: '#999' }}>无变化</span>;

  return (
    <div style={{ fontSize: 12 }}>
      {diffs.map((d) => (
        <div key={d.key} style={{ marginBottom: 4 }}>
          <strong>{d.key}</strong>：{' '}
          <span style={{ color: '#f5222d', textDecoration: 'line-through' }}>
            {JSON.stringify(d.before)}
          </span>{' '}
          →{' '}
          <span style={{ color: '#52c41a' }}>{JSON.stringify(d.after)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ContractDetail() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectForm] = Form.useForm();
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentForm] = Form.useForm();
  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payForm] = Form.useForm();
  const [currentBill, setCurrentBill] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getContract(id), getContractHistory(id)])
      .then(([c, h]) => {
        setContract(c);
        setHistory(h);
      })
      .catch((err) => message.error(err.message || '加载合同详情失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!contract) return null;

  const reviewStepIndex = REVIEW_STEPS.indexOf(contract.reviewStatus);
  const currentReviewStep = reviewStepIndex >= 0 ? reviewStepIndex : REVIEW_STEPS.length - 1;

  const handleReview = (action, data) => {
    reviewContract(id, { action, ...data })
      .then(() => {
        message.success('操作成功');
        fetchData();
      })
      .catch((err) => message.error(err.message || '操作失败'));
  };

  const handleSubmitReview = () => {
    if (!contract.attachmentUrl) {
      message.warning('请先上传附件后再提交审核');
      return;
    }
    handleReview('SUBMIT_REVIEW');
  };

  const handleStartReview = () => handleReview('START_REVIEW');

  const handleApprove = () => handleReview('APPROVE');

  const handleReject = () => {
    rejectForm.validateFields().then((values) => {
      setRejectLoading(true);
      reviewContract(id, { action: 'REJECT', rejectReason: values.rejectReason })
        .then(() => {
          message.success('已驳回');
          setRejectOpen(false);
          rejectForm.resetFields();
          fetchData();
        })
        .catch((err) => message.error(err.message || '操作失败'))
        .finally(() => setRejectLoading(false));
    });
  };

  const handleUploadAttachment = () => {
    attachmentForm.validateFields().then((values) => {
      setAttachmentLoading(true);
      uploadContractAttachment(id, { attachmentUrl: values.attachmentUrl })
        .then(() => {
          message.success('附件上传成功');
          setAttachmentOpen(false);
          attachmentForm.resetFields();
          fetchData();
        })
        .catch((err) => message.error(err.message || '上传失败'))
        .finally(() => setAttachmentLoading(false));
    });
  };

  const handleSign = (action) => {
    signContract(id, { action })
      .then(() => {
        message.success('操作成功');
        fetchData();
      })
      .catch((err) => message.error(err.message || '操作失败'));
  };

  const handleStartSign = () => handleSign('START_SIGN');

  const handleCompleteSign = () => handleSign('COMPLETE_SIGN');

  const handlePayBill = (bill) => {
    setCurrentBill(bill);
    payForm.resetFields();
    setPayOpen(true);
  };

  const handlePaySubmit = () => {
    payForm.validateFields().then((values) => {
      setPayLoading(true);
      payBill(currentBill.id, values)
        .then(() => {
          message.success('支付成功');
          setPayOpen(false);
          payForm.resetFields();
          setCurrentBill(null);
          fetchData();
        })
        .catch((err) => message.error(err.message || '支付失败'))
        .finally(() => setPayLoading(false));
    });
  };

  const timelineItems = history.map((log, index) => ({
    key: log.id || index,
    children: (
      <div>
        <div style={{ marginBottom: 4 }}>
          <Tag color="blue">{log.action}</Tag>
          <span style={{ margin: '0 8px', fontWeight: 500 }}>{log.operatorName || '系统'}</span>
          {log.remark && <span style={{ color: '#666' }}>{log.remark}</span>}
        </div>
        <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>{log.createdAt}</div>
        {(log.beforeSnapshot || log.afterSnapshot) && (
          <Collapse
            size="small"
            items={[
              {
                key: 'diff',
                label: '变更详情',
                children: <JsonDiff before={log.beforeSnapshot} after={log.afterSnapshot} />,
              },
            ]}
          />
        )}
      </div>
    ),
  }));

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title="合同基本信息">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="租客姓名">{contract.tenantName}</Descriptions.Item>
          <Descriptions.Item label="房源标题">{contract.propertyTitle}</Descriptions.Item>
          <Descriptions.Item label="月租金(元)">{contract.monthlyRent}</Descriptions.Item>
          <Descriptions.Item label="押金(元)">{contract.depositAmount}</Descriptions.Item>
          <Descriptions.Item label="开始日期">{contract.startDate}</Descriptions.Item>
          <Descriptions.Item label="结束日期">{contract.endDate}</Descriptions.Item>
          <Descriptions.Item label="审核状态">
            <Tag color={REVIEW_STATUS_COLOR[contract.reviewStatus]}>
              {REVIEW_STATUS_LABEL[contract.reviewStatus] || contract.reviewStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="签署状态">
            <Tag color={SIGN_STATUS_COLOR[contract.signStatus]}>
              {SIGN_STATUS_LABEL[contract.signStatus] || contract.signStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="附件">
            {contract.attachmentUrl ? (
              <a href={contract.attachmentUrl} target="_blank" rel="noreferrer">
                查看附件
              </a>
            ) : (
              <span style={{ color: '#999' }}>未上传</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{contract.createdAt}</Descriptions.Item>
          {contract.rejectReason && (
            <Descriptions.Item label="驳回原因" span={2}>
              <span style={{ color: '#f5222d' }}>{contract.rejectReason}</span>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card
        title="审核流程"
        extra={
          <Space>
            <Button onClick={() => setAttachmentOpen(true)}>上传附件</Button>
            {contract.reviewStatus === 'DRAFT' && (
              <Button type="primary" onClick={handleSubmitReview}>
                提交审核
              </Button>
            )}
            {contract.reviewStatus === 'PENDING_REVIEW' && (
              <Button type="primary" onClick={handleStartReview}>
                开始审核
              </Button>
            )}
            {contract.reviewStatus === 'REVIEWING' && (
              <>
                <Button type="primary" onClick={handleApprove}>
                  审核通过
                </Button>
                <Button danger onClick={() => setRejectOpen(true)}>
                  审核驳回
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Steps
          current={currentReviewStep}
          items={REVIEW_STEPS.map((key) => ({
            title: REVIEW_STATUS_LABEL[key],
          }))}
        />
      </Card>

      <Card
        title="签署流程"
        extra={
          <Space>
            {contract.reviewStatus === 'APPROVED' && contract.signStatus === 'PENDING_SIGN' && (
              <Button type="primary" onClick={handleStartSign}>
                开始签署
              </Button>
            )}
            {contract.signStatus === 'SIGNING' && (
              <Button type="primary" onClick={handleCompleteSign}>
                完成签署
              </Button>
            )}
          </Space>
        }
      >
        <Space size="large">
          <span>
            签署状态：
            <Tag color={SIGN_STATUS_COLOR[contract.signStatus]}>
              {SIGN_STATUS_LABEL[contract.signStatus] || contract.signStatus}
            </Tag>
          </span>
          {contract.signedAt && <span>签署时间：{contract.signedAt}</span>}
        </Space>
      </Card>

      <Card title="关联合同账单">
        <Table
          rowKey="id"
          dataSource={contract.bills || []}
          columns={billColumns(handlePayBill)}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="变更历史">
        {timelineItems.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <span style={{ color: '#999' }}>暂无变更记录</span>
        )}
      </Card>

      <Modal
        title="审核驳回"
        open={rejectOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectOpen(false);
          rejectForm.resetFields();
        }}
        confirmLoading={rejectLoading}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectReason"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传附件"
        open={attachmentOpen}
        onOk={handleUploadAttachment}
        onCancel={() => {
          setAttachmentOpen(false);
          attachmentForm.resetFields();
        }}
        confirmLoading={attachmentLoading}
        destroyOnClose
      >
        <Form form={attachmentForm} layout="vertical">
          <Form.Item
            name="attachmentUrl"
            label="附件URL"
            rules={[{ required: true, message: '请输入附件URL' }]}
          >
            <Input placeholder="请输入附件文件URL" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="支付账单"
        open={payOpen}
        onOk={handlePaySubmit}
        onCancel={() => {
          setPayOpen(false);
          payForm.resetFields();
          setCurrentBill(null);
        }}
        confirmLoading={payLoading}
        destroyOnClose
      >
        <Form form={payForm} layout="vertical">
          <Form.Item
            name="paymentMethod"
            label="支付方式"
            rules={[{ required: true, message: '请输入支付方式' }]}
          >
            <Input placeholder="如：银行转账、线上支付等" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
