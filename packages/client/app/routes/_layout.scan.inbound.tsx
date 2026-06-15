import { useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Alert,
  Result,
  Typography,
  Divider,
  Tag,
  Row,
  Col,
} from "antd";
import {
  InboxOutlined,
  QrcodeOutlined,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import { api, type ApiSingleResponse } from "../lib/api";
import type { Batch, Inventory, InventoryTransaction } from "@qinghe/shared";

export const meta: MetaFunction = () => {
  return [{ title: "扫码入库 | 青禾库存追溯台" }];
};

export default function ScanInboundPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    inventory: Inventory;
    transaction: InventoryTransaction;
    batch?: Batch;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchInfo, setBatchInfo] = useState<Batch | null>(null);

  const fetchBatchInfo = async (batchNo: string, sku: string) => {
    if (!batchNo || !sku) return;
    try {
      const res = await api.get<ApiSingleResponse<Batch>>(
        `/batches/${batchNo}`
      );
      const data = (res as ApiSingleResponse<Batch>).data;
      if (data && data.sku === sku) {
        setBatchInfo(data);
      } else {
        setBatchInfo(null);
      }
    } catch {
      setBatchInfo(null);
    }
  };

  const handleSubmit = async (values: {
    batchNo: string;
    sku: string;
    locationCode: string;
    quantity: number;
    operator: string;
    remark?: string;
  }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<
        ApiSingleResponse<{
          inventory: Inventory;
          transaction: InventoryTransaction;
        }>
      >("/inventory/inbound", values);
      const data = (
        res as ApiSingleResponse<{
          inventory: Inventory;
          transaction: InventoryTransaction;
        }>
      ).data;
      setResult({ ...data, batch: batchInfo || undefined });
      form.resetFields(["quantity", "remark", "inboundOrderNo", "reason"]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        <Space>
          <QrcodeOutlined />
          扫码入库
        </Space>
      </Typography.Title>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="入库操作">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ operator: "系统管理员" }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="批次号"
                    name="batchNo"
                    rules={[{ required: true, message: "请输入或扫描批次号" }]}
                  >
                    <Input
                      placeholder="请扫描或输入批次号"
                      size="large"
                      autoFocus
                      onChange={(e) => {
                        fetchBatchInfo(e.target.value, form.getFieldValue("sku"));
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="SKU"
                    name="sku"
                    rules={[{ required: true, message: "请输入 SKU" }]}
                  >
                    <Input
                      placeholder="请输入商品 SKU"
                      onChange={(e) => {
                        fetchBatchInfo(form.getFieldValue("batchNo"), e.target.value);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="目标库位"
                    name="locationCode"
                    rules={[{ required: true, message: "请输入库位编码" }]}
                  >
                    <Input placeholder="例如：A-01-01-01" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="入库数量"
                    name="quantity"
                    rules={[{ required: true, message: "请输入数量" }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: "100%" }}
                      placeholder="入库数量"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="操作人"
                name="operator"
                rules={[{ required: true, message: "请输入操作人" }]}
              >
                <Input placeholder="操作人姓名" />
              </Form.Item>

              <Form.Item
                label="入库原因（必填，用于状态追溯）"
                name="reason"
                rules={[{ required: true, message: "请填写入库原因" }]}
              >
                <Select
                  placeholder="请选择入库原因"
                  allowClear
                  options={[
                    { label: "采购入库", value: "采购入库" },
                    { label: "调拨入库", value: "调拨入库" },
                    { label: "退货入库", value: "退货入库" },
                    { label: "盘盈入库", value: "盘盈入库" },
                    { label: "生产入库", value: "生产入库" },
                    { label: "其他入库", value: "其他入库" },
                  ]}
                />
              </Form.Item>

              <Form.Item label="关联入库单号" name="inboundOrderNo">
                <Input placeholder="选填" />
              </Form.Item>

              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={2} placeholder="选填" />
              </Form.Item>

              {error && (
                <Alert
                  type="error"
                  message="入库失败"
                  description={error}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<InboxOutlined />}
                  loading={loading}
                  block
                >
                  确认入库
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="批次信息">
            {batchInfo ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Typography.Text type="secondary">批次号：</Typography.Text>
                  <Typography.Text strong>{batchInfo.batchNo}</Typography.Text>
                </div>
                <div>
                  <Typography.Text type="secondary">商品：</Typography.Text>
                  <Typography.Text>
                    {batchInfo.sku} - {batchInfo.skuName}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Text type="secondary">供应商：</Typography.Text>
                  <Typography.Text>{batchInfo.supplier}</Typography.Text>
                </div>
                <div>
                  <Typography.Text type="secondary">生产日期：</Typography.Text>
                  <Typography.Text>
                    {new Date(batchInfo.productionDate).toLocaleDateString("zh-CN")}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Text type="secondary">有效期至：</Typography.Text>
                  <Tag color="red">
                    {new Date(batchInfo.expiryDate).toLocaleDateString("zh-CN")}
                  </Tag>
                </div>
                <div>
                  <Typography.Text type="secondary">应收数量：</Typography.Text>
                  <Typography.Text>
                    {batchInfo.quantity} {batchInfo.unit}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Text type="secondary">已收数量：</Typography.Text>
                  <Typography.Text strong>
                    {batchInfo.receivedQuantity} {batchInfo.unit}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Text type="secondary">状态：</Typography.Text>
                  <Tag>{batchInfo.status}</Tag>
                </div>
              </Space>
            ) : (
              <Typography.Text type="secondary">
                输入批次号和 SKU 后自动加载批次信息
              </Typography.Text>
            )}
          </Card>

          {result && (
            <>
              <Divider />
              <Result
                icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                status="success"
                title="入库成功"
                subTitle={`流水号：${result.transaction.transactionNo}`}
              />
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
