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
  Row,
  Col,
  Tag,
} from "antd";
import {
  ExportOutlined,
  QrcodeOutlined,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import { api, type ApiSingleResponse } from "~/lib/api";
import type { Inventory, InventoryTransaction } from "@qinghe/shared";

export const meta: MetaFunction = () => {
  return [{ title: "扫码出库 | 青禾库存追溯台" }];
};

export default function ScanOutboundPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    inventory: Inventory | null;
    transaction: InventoryTransaction;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: {
    batchNo: string;
    sku: string;
    locationCode: string;
    quantity: number;
    operator: string;
    outboundOrderNo?: string;
    remark?: string;
  }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<
        ApiSingleResponse<{ inventory: Inventory | null; transaction: InventoryTransaction }>
      >("/inventory/outbound", values);
      const data = (
        res as ApiSingleResponse<{
          inventory: Inventory | null;
          transaction: InventoryTransaction;
        }>
      ).data;
      setResult(data);
      form.resetFields(["quantity", "outboundOrderNo", "remark"]);
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
          扫码出库
        </Space>
      </Typography.Title>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="出库操作">
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
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="SKU"
                    name="sku"
                    rules={[{ required: true, message: "请输入 SKU" }]}
                  >
                    <Input placeholder="请输入商品 SKU" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="来源库位"
                    name="locationCode"
                    rules={[{ required: true, message: "请输入库位编码" }]}
                  >
                    <Input placeholder="例如：A-01-01-01" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="出库数量"
                    name="quantity"
                    rules={[{ required: true, message: "请输入数量" }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: "100%" }}
                      placeholder="出库数量"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="关联出库单号" name="outboundOrderNo">
                <Input placeholder="选填，关联订单号" />
              </Form.Item>

              <Form.Item
                label="操作人"
                name="operator"
                rules={[{ required: true, message: "请输入操作人" }]}
              >
                <Input placeholder="操作人姓名" />
              </Form.Item>

              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={2} placeholder="选填" />
              </Form.Item>

              {error && (
                <Alert
                  type="error"
                  message="出库失败"
                  description={error}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item>
                <Button
                  type="primary"
                  danger
                  htmlType="submit"
                  size="large"
                  icon={<ExportOutlined />}
                  loading={loading}
                  block
                >
                  确认出库
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="操作说明">
            <Space direction="vertical">
              <Tag color="blue">FIFO：严格按照先进先出原则</Tag>
              <Tag color="orange">FEFO：生鲜按近效期先出</Tag>
              <Typography.Paragraph>
                出库前请确认：
                <ul>
                  <li>批次号与库位信息匹配</li>
                  <li>商品在效期内，无变质情况</li>
                  <li>温区要求符合运输条件</li>
                  <li>出库数量不超过可用库存</li>
                </ul>
              </Typography.Paragraph>
            </Space>
          </Card>

          {result && (
            <>
              <div style={{ height: 24 }} />
              <Result
                icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                status="success"
                title="出库成功"
                subTitle={`流水号：${result.transaction.transactionNo}，剩余库存：${
                  result.inventory?.availableQuantity ?? 0
                }`}
              />
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
