import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Empty,
  App as AntdApp,
  Typography,
  List,
  Divider,
  Row,
  Col,
  Form,
  Modal,
  InputNumber,
  DatePicker,
  Statistic,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  ScanOutlined,
  CameraOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
  ShopOutlined,
  UserOutlined,
  CarOutlined,
  FileTextOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  inboundApi,
  productApi,
  supplierApi,
  purchaseApi,
} from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtDate,
  expiryTag,
  stockStatus,
} from '@/utils/format';
import { useAppStore, useCanWrite } from '@/store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function InboundScan() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const canWrite = useCanWrite(user);

  const [scanValue, setScanValue] = useState('');
  const [scanItems, setScanItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [supplierId, setSupplierId] = useState(null);
  const [purchaseOrderId, setPurchaseOrderId] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scanInputRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const fetchSuppliers = async () => {
    try {
      const res = await supplierApi.list({ page: 1, pageSize: 100 });
      setSuppliers(res.data?.list || res.data?.records || []);
    } catch (e) {}
  };

  const fetchPurchaseOrders = async (supplierId) => {
    if (!supplierId) {
      setPurchaseOrders([]);
      return;
    }
    try {
      const res = await purchaseApi.list({
        supplierId,
        status: 'SUPPLIER_CONFIRMED',
        page: 1,
        pageSize: 50,
      });
      setPurchaseOrders(res.data?.list || res.data?.records || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (supplierId) {
      fetchPurchaseOrders(supplierId);
    }
  }, [supplierId]);

  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  const handleScanInput = async (code) => {
    if (!code.trim()) return;
    setScanning(true);
    try {
      const res = await productApi.byBarcode(code.trim());
      const product = res.data;
      if (product) {
        addScanItem(product);
      } else {
        message.warning('未找到该商品');
      }
    } catch (e) {
      message.warning('商品不存在或扫码错误');
    } finally {
      setScanning(false);
      setScanValue('');
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }
    }
  };

  const addScanItem = (product) => {
    const existingIndex = scanItems.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...scanItems];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + 1,
      };
      setScanItems(newItems);
      setSelectedItem(newItems[existingIndex]);
    } else {
      const newItem = {
        id: Date.now() + Math.random(),
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        spec: product.spec,
        quantity: 1,
        unit: product.unit || 'kg',
        batchNo: '',
        produceDate: null,
        expiryDate: null,
        product: product,
      };
      setScanItems([...scanItems, newItem]);
      setSelectedItem(newItem);
      setProductInfo(product);
    }
    message.success(`已添加: ${product.name}`);
  };

  const handleQuantityChange = (id, delta) => {
    const newItems = scanItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(0.01, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setScanItems(newItems);
    if (selectedItem?.id === id) {
      const updated = newItems.find((i) => i.id === id);
      setSelectedItem(updated);
    }
  };

  const handleQuantityInput = (id, value) => {
    const newItems = scanItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: Number(value) || 0 };
      }
      return item;
    });
    setScanItems(newItems);
  };

  const handleDeleteItem = (id) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要移除该商品吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const newItems = scanItems.filter((item) => item.id !== id);
        setScanItems(newItems);
        if (selectedItem?.id === id) {
          setSelectedItem(null);
          setProductInfo(null);
        }
        message.success('已移除');
      },
    });
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setProductInfo(item.product);
  };

  const handleBatchChange = (id, field, value) => {
    const newItems = scanItems.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setScanItems(newItems);
    if (selectedItem?.id === id) {
      const updated = newItems.find((i) => i.id === id);
      setSelectedItem(updated);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleSubmit = async () => {
    if (scanItems.length === 0) {
      message.warning('请先添加商品');
      return;
    }
    if (!supplierId) {
      message.warning('请选择供应商');
      return;
    }

    const items = scanItems.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      spec: item.spec,
      expectedQty: item.quantity,
      actualQty: item.quantity,
      batchNo: item.batchNo,
      produceDate: item.produceDate ? dayjs(item.produceDate).format('YYYY-MM-DD') : null,
      expiryDate: item.expiryDate ? dayjs(item.expiryDate).format('YYYY-MM-DD') : null,
    }));

    setSubmitting(true);
    try {
      const res = await inboundApi.create({
        supplierId,
        purchaseOrderId: purchaseOrderId || null,
        driverName,
        plateNumber,
        remark,
        items,
      });
      message.success('入库单创建成功');
      navigate(`/inbound-orders/${res.data?.id || res.data}`);
    } catch (e) {
      message.error(e?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalItems = scanItems.length;
  const totalQty = scanItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const startCamera = async () => {
    setCameraModalOpen(true);
  };

  const handleCameraScan = (decodedText) => {
    setCameraModalOpen(false);
    handleScanInput(decodedText);
  };

  useEffect(() => {
    if (cameraModalOpen && videoRef.current) {
      const loadScanner = async () => {
        try {
          const { Html5QrcodeScanner } = await import('html5-qrcode');
          scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );
          scannerRef.current.render(
            (decodedText) => {
              handleCameraScan(decodedText);
              if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
              }
            },
            () => {}
          );
        } catch (e) {
          message.error('摄像头启动失败');
        }
      };
      setTimeout(loadScanner, 100);
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [cameraModalOpen]);

  return (
    <div className="app-page" style={{ paddingBottom: 100 }}>
      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            size="large"
            onClick={() => navigate('/inbound-orders')}
          />
          <Title level={3} style={{ margin: 0 }}>
            扫码入库
          </Title>
        </div>
        <Space>
          <Select
            placeholder="关联PO单(可选)"
            allowClear
            style={{ width: 200 }}
            value={purchaseOrderId}
            onChange={setPurchaseOrderId}
            showSearch
            optionFilterProp="children"
          >
            {purchaseOrders.map((po) => (
              <Option key={po.id} value={po.id}>
                {po.orderNo}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={15}>
          <Card className="card-section" style={{ marginBottom: 16 }}>
            <div className="section-title">扫码收货</div>
            <div className="scan-input-wrapper" style={{ marginBottom: 16 }}>
              <Input
                ref={scanInputRef}
                size="large"
                placeholder="扫描条码或输入SKU后回车"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleScanInput(scanValue);
                  }
                }}
                prefix={<ScanOutlined style={{ color: '#1677ff', fontSize: 18 }} />}
                style={{ fontSize: 16, height: 48 }}
                suffix={
                  <Button
                    type="text"
                    icon={<CameraOutlined style={{ fontSize: 18 }} />}
                    onClick={startCamera}
                  />
                }
              />
            </div>

            <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
              {scanItems.length === 0 ? (
                <Empty
                  description={
                    <div>
                      <ScanOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                      <div>扫码或搜索商品开始入库</div>
                    </div>
                  }
                  style={{ padding: '60px 0' }}
                />
              ) : (
                <List
                  dataSource={scanItems}
                  renderItem={(item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px 16px',
                        border: selectedItem?.id === item.id ? '2px solid #1677ff' : '1px solid #f0f0f0',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: selectedItem?.id === item.id ? '#f0f7ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar
                              size={40}
                              style={{ background: '#e6f4ff', color: '#1677ff' }}
                              icon={<ShopOutlined />}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 15,
                                  marginBottom: 2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.productName}
                              </div>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                {item.sku} | {item.spec || '默认规格'}
                                {item.batchNo && <Tag color="blue" style={{ marginLeft: 8 }}>批次: {item.batchNo}</Tag>}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, -0.5);
                            }}
                          />
                          <InputNumber
                            size="small"
                            min={0}
                            step={0.5}
                            value={item.quantity}
                            style={{ width: 80, textAlign: 'center' }}
                            onChange={(v) => {
                              handleQuantityInput(item.id, v);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            size="small"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, 0.5);
                            }}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                          />
                          <Button
                            size="small"
                            type="text"
                            icon={expandedRow === item.id ? <UpOutlined /> : <DownOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(item.id);
                            }}
                          />
                        </div>
                      </div>

                      {expandedRow === item.id && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px dashed #f0f0f0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Row gutter={12}>
                            <Col span={8}>
                              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>批次号</div>
                              <Input
                                size="small"
                                placeholder="输入批次号"
                                value={item.batchNo}
                                onChange={(e) => handleBatchChange(item.id, 'batchNo', e.target.value)}
                              />
                            </Col>
                            <Col span={8}>
                              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>生产日期</div>
                              <DatePicker
                                size="small"
                                style={{ width: '100%' }}
                                value={item.produceDate ? dayjs(item.produceDate) : null}
                                onChange={(date) => handleBatchChange(item.id, 'produceDate', date)}
                              />
                            </Col>
                            <Col span={8}>
                              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>到期日</div>
                              <DatePicker
                                size="small"
                                style={{ width: '100%' }}
                                value={item.expiryDate ? dayjs(item.expiryDate) : null}
                                onChange={(date) => handleBatchChange(item.id, 'expiryDate', date)}
                              />
                            </Col>
                          </Row>
                          {item.expiryDate && (
                            <div style={{ marginTop: 8 }}>
                              <Tag color={expiryTag(item.expiryDate).color}>
                                {expiryTag(item.expiryDate).label}
                              </Tag>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                />
              )}
            </div>
          </Card>
        </Col>

        <Col span={9}>
          <Card className="card-section" style={{ marginBottom: 16 }}>
            <div className="section-title">商品信息</div>
            {productInfo ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Avatar
                    size={56}
                    style={{ background: '#e6f4ff', color: '#1677ff', fontSize: 24 }}
                    icon={<ShopOutlined />}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {productInfo.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#8c8c8c' }}>
                      SKU: {productInfo.sku}
                    </div>
                  </div>
                </div>

                <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                  <div className="info-item">
                    <span className="k">当前库存：</span>
                    <span className="v">
                      {fmtNum(productInfo.stockQty || 0, 2)} {productInfo.unit || 'kg'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="k">库存状态：</span>
                    <span className="v">
                      <Tag color={stockStatus(productInfo.stockQty, productInfo.minStock).color}>
                        {stockStatus(productInfo.stockQty, productInfo.minStock).label}
                      </Tag>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="k">建议库位：</span>
                    <span className="v">{productInfo.suggestedLocation || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="k">供应商：</span>
                    <span className="v">{productInfo.supplierName || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="k">安全库存：</span>
                    <span className="v">
                      {fmtNum(productInfo.minStock || 0, 2)} {productInfo.unit || 'kg'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="k">保质期：</span>
                    <span className="v">{productInfo.shelfLifeDays ? `${productInfo.shelfLifeDays}天` : '-'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <Empty
                description={
                  <div>
                    <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                    <div>扫码或选择商品查看详情</div>
                  </div>
                }
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          padding: '12px 24px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space size={16} wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShopOutlined style={{ color: '#1677ff' }} />
            <Select
              placeholder="选择供应商"
              style={{ width: 180 }}
              value={supplierId}
              onChange={setSupplierId}
              showSearch
              optionFilterProp="children"
            >
              {suppliers.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#8c8c8c' }} />
            <Input
              placeholder="司机姓名"
              style={{ width: 120 }}
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CarOutlined style={{ color: '#8c8c8c' }} />
            <Input
              placeholder="车牌号"
              style={{ width: 120 }}
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#8c8c8c' }} />
            <Input
              placeholder="备注"
              style={{ width: 180 }}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </Space>

        <Space size={16}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              已扫 <span style={{ color: '#1677ff', fontWeight: 600 }}>{totalItems}</span> 种商品
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>
              共 {fmtNum(totalQty, 2)} kg
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={scanItems.length === 0 || !supplierId}
            style={{
              height: 48,
              padding: '0 32px',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            提交入库单
          </Button>
        </Space>
      </div>

      <Modal
        title="摄像头扫码"
        open={cameraModalOpen}
        onCancel={() => {
          setCameraModalOpen(false);
          if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
            scannerRef.current = null;
          }
        }}
        footer={null}
        width={500}
        destroyOnClose
      >
        <div id="qr-reader" style={{ width: '100%' }} />
      </Modal>
    </div>
  );
}
