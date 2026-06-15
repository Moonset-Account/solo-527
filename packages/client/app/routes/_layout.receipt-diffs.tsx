import { useEffect, useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import {
  Card,
  Table,
  Tag,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  Typography,
  message,
  Drawer,
  Descriptions,
  Row,
  Col,
} from "antd";
import { PlusOutlined, SearchOutlined, HistoryOutlined } from "@ant-design/icons";
import type { ReceiptDiff } from "@qinghe/shared";
import { api, type ApiListResponse, type ApiSingleResponse } from "~/lib/api";
import { auditStatusMap, diffTypeMap } from "~/lib/constants";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "签收差异 | 青禾库存追溯台" }];
};

export default function ReceiptDiffsPage() {
  const [data, setData] = useState<ReceiptDiff[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sku, setSku] = useState("");
  const [status, setStatus] = useState<string>();
  const [diffType, setDiffType] = useState<string>();
  const [batchNo, setBatchNo] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentDiff, setCurrentDiff] = useState<ReceiptDiff | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));
      if (sku) params.append("sku", sku);
      if (status) params.append("status", status);
      if (diffType) params.append("diffType", diffType);
      if (batchNo) params.append("batchNo", batchNo);
      const res = await api.get<ApiListResponse<ReceiptDiff>>(
        `/receipt-diffs?${params.toString()}`
      );
      const list = res as ApiListResponse<ReceiptDiff>;
      setData(list.data.data);
      setTotal(list.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleCreate = async (values: any) => {
    try {
      await api.post<ApiSingleResponse<ReceiptDiff>>("/receipt-diffs", values);
      message.success("差异记录创建成功");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const handleChangeStatus = async (values: any) => {
    if (!currentDiff) return;
    try {
      await api.patch<ApiSingleResponse<ReceiptDiff>>(
        `/receipt-diffs/${currentDiff._id}/status`,
        values
      );
      message.success("状态变更成功");
      setStatusModalOpen(false);
      statusForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const handleResolve = async (values: any) => {
    if (!currentDiff) return;
    try {
      await api.patch<ApiSingleResponse<ReceiptDiff>>(
        `/receipt-diffs/${currentDiff._id}/resolve`,
        {
          ...values,
          operator: values.operator || "系统管理员",
        }
      );
      message.success("差异处理完成");
      setResolveModalOpen(false);
      resolveForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const loadHistory = async (d: ReceiptDiff) => {
    try {
      const res = await api.get<ApiSingleResponse<any[]>>(
        `/status-history/RECEIPT_DIFF/${d._id}`
      );
      setHistoryData(res.data || []);
      setHistoryOpen(true);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const columns = [
    {
      title: "差异单号",
      dataIndex: "diffNo",
      render: (v: string, r: ReceiptDiff) => (
        <a onClick={() => { setCurrentDiff(r); setDetailOpen(true); }}>{v}</a>
      ),
    },
    { title: "入库单号", dataIndex: "inboundOrderNo" },
    { title: "批次号", dataIndex: "batchNo" },
    { title: "SKU", dataIndex: "sku" },
    { title: "商品名称", dataIndex: "skuName" },
    {
      title: "差异类型",
      dataIndex: "diffType",
      render: (v: string) => diffTypeMap[v as keyof typeof diffTypeMap],
    },
    {
      title: "差异数量",
      render: (r: ReceiptDiff) => (
        <span style={{ color: r.diffQuantity > 0 ? "red" : "green" }}>
          {r.diffQuantity > 0 ? "短少 " : "盈余 "}
          {Math.abs(r.diffQuantity)} {r.unit}
        </span>
      ),
    },
    { title: "报告人", dataIndex: "reporter" },
    {
      title: "对安全库存影响",
      dataIndex: "impactOnSafetyStock",
      render: (v: boolean) => (v ? <Tag color="red">有影响</Tag> : <Tag color="green">无影响</Tag>),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (v: string) => {
        const info = auditStatusMap[v as keyof typeof auditStatusMap];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: ReceiptDiff) => (
        <Space>
          {record.status === "PENDING" && (
            <Button
              size="small"
              onClick={() => {
                setCurrentDiff(record);
                setStatusModalOpen(true);
              }}
            >
              审批
            </Button>
          )}
          {record.status === "APPROVED" && (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setCurrentDiff(record);
                setResolveModalOpen(true);
              }}
            >
              处理
            </Button>
          )}
          <Button size="small" icon={<HistoryOutlined />} onClick={() => loadHistory(record)}>
            历史
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        签收差异处理
      </Typography.Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索 SKU"
            prefix={<SearchOutlined />}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            style={{ width: 200 }}
          />
          <Input
            placeholder="批次号"
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={Object.entries(auditStatusMap).filter(([k]) => k !== "DELAYED").map(([k, v]) => ({
              label: v.label,
              value: k,
            }))}
          />
          <Select
            placeholder="差异类型"
            allowClear
            style={{ width: 140 }}
            value={diffType}
            onChange={(v) => setDiffType(v)}
            options={Object.entries(diffTypeMap).map(([k, v]) => ({
              label: v,
              value: k,
            }))}
          />
          <Button type="primary" onClick={fetchData}>查询</Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setCreateModalOpen(true)}>
            登记差异
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="登记签收差异"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ reporter: "系统管理员", diffType: "QUANTITY" }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="入库单号" name="inboundOrderNo" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="批次号" name="batchNo" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="商品名称" name="skuName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="差异类型" name="diffType" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(diffTypeMap).map(([k, v]) => ({
                    label: v,
                    value: k,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="应收数量" name="expectedQuantity" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="实收数量" name="actualQuantity" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="差异描述" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="详细描述差异情况" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="根本原因（可选）" name="rootCause">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="关联安全库存ID" name="relatedSafetyStockId">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="报告人" name="reporter" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="备注" name="remark">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审批差异"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleChangeStatus}
          initialValues={{ operator: "系统管理员" }}
        >
          <Form.Item label="审批结果" name="toStatus" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "批准处理", value: "APPROVED" },
                { label: "驳回", value: "REJECTED" },
              ]}
            />
          </Form.Item>
          <Form.Item label="审批意见/原因" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="操作人" name="operator" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setStatusModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理差异 - 根因与纠正措施"
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        footer={null}
      >
        <Form
          form={resolveForm}
          layout="vertical"
          onFinish={handleResolve}
        >
          <Form.Item label="根本原因" name="rootCause" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="差异产生的根本原因分析" />
          </Form.Item>
          <Form.Item label="纠正措施" name="correctiveAction" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="采取的纠正及预防措施" />
          </Form.Item>
          <Form.Item label="处理人" name="handler">
            <Input />
          </Form.Item>
          <Form.Item label="操作人" name="operator" initialValue="系统管理员">
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setResolveModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">完成处理</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`差异详情 - ${currentDiff?.diffNo || ""}`}
        width={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {currentDiff && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="差异单号">{currentDiff.diffNo}</Descriptions.Item>
              <Descriptions.Item label="类型">{diffTypeMap[currentDiff.diffType]}</Descriptions.Item>
              <Descriptions.Item label="入库单号">{currentDiff.inboundOrderNo}</Descriptions.Item>
              <Descriptions.Item label="批次号">{currentDiff.batchNo}</Descriptions.Item>
              <Descriptions.Item label="SKU">{currentDiff.sku}</Descriptions.Item>
              <Descriptions.Item label="商品名称">{currentDiff.skuName}</Descriptions.Item>
              <Descriptions.Item label="应收数量">{currentDiff.expectedQuantity} {currentDiff.unit}</Descriptions.Item>
              <Descriptions.Item label="实收数量">{currentDiff.actualQuantity} {currentDiff.unit}</Descriptions.Item>
              <Descriptions.Item label="差异数量">
                <span style={{ color: currentDiff.diffQuantity > 0 ? "red" : "green" }}>
                  {currentDiff.diffQuantity > 0 ? "-" : "+"}
                  {Math.abs(currentDiff.diffQuantity)} {currentDiff.unit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="对安全库存影响">
                {currentDiff.impactOnSafetyStock ? (
                  <Tag color="red">有影响</Tag>
                ) : (
                  <Tag color="green">无影响</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="报告人">{currentDiff.reporter}</Descriptions.Item>
              <Descriptions.Item label="处理人">{currentDiff.handler || "-"}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={auditStatusMap[currentDiff.status as any]?.color}>
                  {auditStatusMap[currentDiff.status as any]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="差异描述" span={2}>{currentDiff.description}</Descriptions.Item>
              {currentDiff.rootCause && (
                <Descriptions.Item label="根本原因" span={2}>{currentDiff.rootCause}</Descriptions.Item>
              )}
              {currentDiff.correctiveAction && (
                <Descriptions.Item label="纠正措施" span={2}>{currentDiff.correctiveAction}</Descriptions.Item>
              )}
              <Descriptions.Item label="备注" span={2}>{currentDiff.remark || "-"}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={() => loadHistory(currentDiff)}
              >
                查看状态历史
              </Button>
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        title="状态变更历史"
        width={520}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      >
        <Table
          rowKey="_id"
          size="small"
          dataSource={historyData}
          pagination={false}
          columns={[
            { title: "时间", dataIndex: "operationTime", render: (v: Date) => dayjs(v).format("MM-DD HH:mm") },
            { title: "原状态", dataIndex: "fromStatus", render: (v: string) => v || "-" },
            { title: "新状态", dataIndex: "toStatus" },
            { title: "变更原因", dataIndex: "reason" },
            { title: "操作人", dataIndex: "operator" },
          ]}
        />
      </Drawer>
    </div>
  );
}
