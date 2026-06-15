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
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import type { Transfer } from "@qinghe/shared";
import { api, type ApiListResponse, type ApiSingleResponse } from "~/lib/api";
import {
  auditStatusMap,
  transferTypeMap,
  delayReasonCategoryMap,
} from "~/lib/constants";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "调拨申请 | 青禾库存追溯台" }];
};

export default function TransfersPage() {
  const [data, setData] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sku, setSku] = useState("");
  const [status, setStatus] = useState<string>();
  const [type, setType] = useState<string>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [delayForm] = Form.useForm();
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
      if (type) params.append("type", type);
      const res = await api.get<ApiListResponse<Transfer>>(
        `/transfers?${params.toString()}`
      );
      const list = res as ApiListResponse<Transfer>;
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
      await api.post<ApiSingleResponse<Transfer>>("/transfers", {
        ...values,
        plannedDate: values.plannedDate.format("YYYY-MM-DD"),
        expectedDate: values.expectedDate.format("YYYY-MM-DD"),
      });
      message.success("调拨申请创建成功");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const handleChangeStatus = async (values: any) => {
    if (!currentTransfer) return;
    try {
      await api.patch<ApiSingleResponse<Transfer>>(
        `/transfers/${currentTransfer._id}/status`,
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

  const handleDelay = async (values: any) => {
    if (!currentTransfer) return;
    try {
      await api.patch<ApiSingleResponse<Transfer>>(
        `/transfers/${currentTransfer._id}/delay`,
        {
          ...values,
          operator: values.handler || "系统管理员",
        }
      );
      message.success("延误登记成功");
      setDelayModalOpen(false);
      delayForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const loadHistory = async (t: Transfer) => {
    try {
      const res = await api.get<ApiSingleResponse<any[]>>(
        `/status-history/TRANSFER/${t._id}`
      );
      setHistoryData(res.data || []);
      setHistoryOpen(true);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const statusOptionsForChange = (current: string) => {
    const all = {
      PENDING: [{ label: "已批准", value: "APPROVED" },
      APPROVED: [
        { label: "已完成", value: "COMPLETED" },
        { label: "已驳回", value: "REJECTED" },
      ],
      DELAYED: [{ label: "已完成", value: "COMPLETED" }],
    };
    return all[current as keyof typeof all] || [];
  };

  const columns = [
    {
      title: "调拨单号",
      dataIndex: "transferNo",
      render: (v: string, r: Transfer) => (
        <a onClick={() => { setCurrentTransfer(r); setDetailOpen(true); }}>{v}</a>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      render: (v: string) => transferTypeMap[v as keyof typeof transferTypeMap],
    },
    { title: "SKU", dataIndex: "sku" },
    { title: "商品名称", dataIndex: "skuName" },
    { title: "数量", render: (r: Transfer) => `${r.quantity} ${r.unit}` },
    { title: "来源 → 目标", render: (r: Transfer) => `${r.fromLocation} → ${r.toLocation}` },
    { title: "预计到货", dataIndex: "expectedDate", render: (v: Date) => {
      const days = dayjs(v).diff(dayjs(), "day");
      const delayed = days < 0;
      return (
        <Tag color={delayed ? "red" : "blue"}>
          {dayjs(v).format("YYYY-MM-DD")} {delayed ? `(延误${-days}天` : ""}
        </Tag>
      );
    }},
    {
      title: "申请人", dataIndex: "applicant" },
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
      render: (_: any, record: Transfer) => (
        <Space>
          {statusOptionsForChange(record.status).length > 0 && (
            <Button
              size="small"
              onClick={() => {
                setCurrentTransfer(record);
                setStatusModalOpen(true);
              }}
            >
              变更状态
            </Button>
          )}
          {(record.status === "PENDING" || record.status === "APPROVED") &&
            dayjs(record.expectedDate).isBefore(dayjs()) && (
              <Button
                size="small"
                danger
                onClick={() => {
                  setCurrentTransfer(record);
                  setDelayModalOpen(true);
                }}
              >
                登记延误
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
        调拨申请
      </Typography.Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索 SKU"
            prefix={<SearchOutlined />}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            style={{ width: 220 }}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={Object.entries(auditStatusMap).map(([k, v]) => ({
              label: v.label,
              value: k,
            }))}
          />
          <Select
            placeholder="类型"
            allowClear
            style={{ width: 140 }}
            value={type}
            onChange={(v) => setType(v)}
            options={Object.entries(transferTypeMap).map(([k, v]) => ({
              label: v,
              value: k,
            }))}
          />
          <Button type="primary" onClick={fetchData}>查询</Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setCreateModalOpen(true)}>
            新建调拨
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
        title="新建调拨申请"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={760}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ applicant: "系统管理员", type: "ALLOCATION" }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="调拨类型" name="type" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(transferTypeMap).map(([k, v]) => ({
                    label: v,
                    value: k,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="供应商" name="supplier">
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
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="数量" name="quantity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="单位" name="unit" rules={[{ required: true }]} initialValue="件">
              <Input />
            </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="批次号" name="batchNo">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="来源库位" name="fromLocation" rules={[{ required: true }]}>
                <Input placeholder="如：A-01-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="目标库位" name="toLocation" rules={[{ required: true }]}>
                <Input placeholder="如：B-02-01" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="计划日期" name="plannedDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="预计到货日期" name="expectedDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="申请人" name="applicant" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="关联安全库存" name="relatedSafetyStockId">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交申请</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更调拨状态"
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
          <Form.Item label="目标状态" name="toStatus" rules={[{ required: true }]}>
            <Select options={currentTransfer ? statusOptionsForChange(currentTransfer.status) : []} />
          </Form.Item>
          <Form.Item label="变更原因" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请详细说明状态变更原因" />
          </Form.Item>
          <Form.Item label="操作人" name="operator" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setStatusModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认变更</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="登记调拨延误"
        open={delayModalOpen}
        onCancel={() => setDelayModalOpen(false)}
        footer={null}
      >
        <Form
          form={delayForm}
          layout="vertical"
          onFinish={handleDelay}
        >
          <Form.Item label="延误原因" name="delayReason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请详细说明延误原因" />
          </Form.Item>
          <Form.Item label="原因分类" name="delayReasonCategory" rules={[{ required: true }]}>
            <Select
              options={Object.entries(delayReasonCategoryMap).map(([k, v]) => ({
                label: v,
                value: k,
              }))}
            />
          </Form.Item>
          <Form.Item label="处理人" name="handler">
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setDelayModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`调拨详情 - {currentTransfer?.transferNo || ""}
        width={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {currentTransfer && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="调拨单号">{currentTransfer.transferNo}</Descriptions.Item>
              <Descriptions.Item label="类型">{transferTypeMap[currentTransfer.type]}</Descriptions.Item>
              <Descriptions.Item label="SKU">{currentTransfer.sku}</Descriptions.Item>
              <Descriptions.Item label="商品名称">{currentTransfer.skuName}</Descriptions.Item>
              <Descriptions.Item label="数量">{currentTransfer.quantity} {currentTransfer.unit}</Descriptions.Item>
              <Descriptions.Item label="批次号">{currentTransfer.batchNo || "-"}</Descriptions.Item>
              <Descriptions.Item label="来源库位">{currentTransfer.fromLocation}</Descriptions.Item>
              <Descriptions.Item label="目标库位">{currentTransfer.toLocation}</Descriptions.Item>
              <Descriptions.Item label="供应商">{currentTransfer.supplier || "-"}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{dayjs(currentTransfer.plannedDate).format("YYYY-MM-DD")}</Descriptions.Item>
              <Descriptions.Item label="预计到货">{dayjs(currentTransfer.expectedDate).format("YYYY-MM-DD")}</Descriptions.Item>
              <Descriptions.Item label="实际到货">
                {currentTransfer.actualDate ? dayjs(currentTransfer.actualDate).format("YYYY-MM-DD") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{currentTransfer.applicant}</Descriptions.Item>
              <Descriptions.Item label="审批人">{currentTransfer.approver || "-"}</Descriptions.Item>
              <Descriptions.Item label="处理人">{currentTransfer.handler || "-"}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={auditStatusMap[currentTransfer.status as any]?.color}>
                  {auditStatusMap[currentTransfer.status as any]?.label}
                </Tag>
              </Descriptions.Item>
              {currentTransfer.delayReason && (
                <Descriptions.Item label="延误原因" span={2}>
                  {currentTransfer.delayReason}
                  {currentTransfer.delayReasonCategory && (
                    <Tag style={{ marginLeft: 8 }}>
                      {delayReasonCategoryMap[currentTransfer.delayReasonCategory]}
                    </Tag>
                  )}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="备注" span={2}>
                {currentTransfer.remark || "-"}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={() => loadHistory(currentTransfer)}
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
