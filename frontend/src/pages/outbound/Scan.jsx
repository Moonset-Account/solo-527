import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card, Row, Col, Input, Select, Button, Space, List, Tag, Avatar,
  App, Empty, Form, Modal, Progress, notification,
} from 'antd';
import {
  ScanOutlined, MinusOutlined, PlusOutlined, DeleteOutlined,
  ArrowLeftOutlined, CameraOutlined, SendOutlined,
  InboxOutlined, BarcodeOutlined, CheckCircleFilled, SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import StatusTag from '../../components/StatusTag.jsx';
import {
  productApi, outboundApi, batchApi,
} from '../../api/index.js';
import { OUTBOUND_TYPES } from '../../utils/constants.js';
import { fmtMoney, fmtNum, expiryTag } from '../../utils/format.js';

const { TextArea } = Input;

const OutboundScan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message, modal } = App.useApp();
  const [api, contextHolder] = notification.useNotification();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanItems, setScanItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [outboundType, setOutboundType] = useState('SALE');
  const [destination, setDestination] = useState('');
  const [remark, setRemark] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [orderInfo, setOrderInfo] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const barcodeInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (orderId) {
      (async () => {
        try {
          const res = await outboundApi.detail(orderId);
          const data = res?.data || res;
          setOrderInfo(data);
          setOrderItems(data?.items || []);
          setOutboundType(data?.outboundType || 'SALE');
          setDestination(data?.destination || '');
        } catch (_) {}
      })();
    }
  }, [orderId]);

  const getFIFOBatch = (productId, batches) => {
    const productBatches = batches.filter(b => b.productId === productId);
    productBatches.sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return dayjs(a.expiryDate).valueOf() - dayjs(b.expiryDate).valueOf();
    });
    return productBatches[0] || null;
  };

  const showScanSuccess = (productName) => {
    api.success({
      message: '扫码成功',
      description: (
        <div>
          <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
          <span style={{ marginLeft: 8, fontWeight: 600 }}>{productName}</span>
          <span style={{ marginLeft: 8, color: '#52c41a' }}>已加入拣货清单</span>
        </div>
      ),
      duration: 1.5,
      placement: 'topRight',
    });
  };

  const addScanItem = async (product, qty = 1) => {
    let batchInfo = null;
    try {
      const bRes = await batchApi.list({ productId: product.id, status: 'NORMAL', pageSize: 100 });
      const batches = bRes?.data || [];
      batchInfo = getFIFOBatch(product.id, batches);
    } catch (_) {}

    setScanItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, {
        scanId: Date.now() + Math.random(),
        productId: product.id,
        product: product,
        sku: product.sku,
        productName: product.name,
        spec: product.spec,
        unitPrice: product.defaultPrice || 0,
        qty,
        batchNo: batchInfo?.batchNo || '',
        expiryDate: batchInfo?.expiryDate || null,
        location: batchInfo?.location || product.defaultLocation || '',
        fifoUsed: !!batchInfo,
      }];
    });
    showScanSuccess(product.name || product.sku);
  };

  const handleScanByCode = async (code) => {
    if (!code?.trim()) return;
    try {
      const res = await productApi.byBarcode(code.trim());
      const product = res?.data || res;
      if (product) {
        if (orderId && orderItems.length > 0) {
          const matchItem = orderItems.find(i => i.productId === product.id || i.sku === product.sku);
          if (!matchItem) {
            modal.confirm({
              title: '商品不在出库单内',
              content: `确认要拣货 ${product.name || product.sku}？此商品不在当前出库单明细中。`,
              okText: '继续添加',
              cancelText: '取消',
              onOk: async () => { await addScanItem(product, 1); },
            });
            return;
          }
        }
        await addScanItem(product, 1);
      } else {
        message.error('未找到商品');
      }
    } catch (e) {
      message.error('识别失败，请检查条码');
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = barcodeInput.trim();
      if (v) {
        handleScanByCode(v);
        setBarcodeInput('');
      }
    }
  };

  const handleQtyChange = (scanId, delta) => {
    setScanItems(prev => prev.map(i => {
      if (i.scanId === scanId) {
        const nq = Math.max(1, i.qty + delta);
        return { ...i, qty: nq };
      }
      return i;
    }));
    if (selectedItem?.scanId === scanId) {
      setSelectedItem(s => s ? { ...s, qty: Math.max(1, s.qty + delta) } : s);
    }
  };

  const handleRemove = (scanId) => {
    modal.confirm({
      title: '确认移除？', okText: '移除', okType: 'danger',
      onOk: () => {
        setScanItems(prev => prev.filter(i => i.scanId !== scanId));
        if (selectedItem?.scanId === scanId) setSelectedItem(null);
      },
    });
  };

  const startCamera = async () => {
    setCameraOpen(true);
    try {
      const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode;
      const html5QrCode = new Html5Qrcode('qr-reader-ob');
      html5QrCodeRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanByCode(decodedText);
          html5QrCode.clear();
          setCameraOpen(false);
        },
        () => {},
      );
    } catch (e) {
      message.error('摄像头启动失败');
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.clear().catch(() => {});
    }
    setCameraOpen(false);
  };

  const totalQty = scanItems.reduce((a, b) => a + Number(b.qty || 0), 0);
  const totalAmount = scanItems.reduce((a, b) => a + Number(b.qty || 0) * Number(b.unitPrice || 0), 0);

  const progressData = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return null;
    const totalRequired = orderItems.reduce((a, b) => a + Number(b.plannedQty || 0), 0);
    const scannedMap = {};
    scanItems.forEach(i => { scannedMap[i.productId] = (scannedMap[i.productId] || 0) + i.qty; });
    let pickedQty = 0;
    orderItems.forEach(i => { pickedQty += Math.min(Number(i.plannedQty || 0), scannedMap[i.productId] || 0); });
    return {
      required: totalRequired,
      picked: pickedQty,
      percent: totalRequired > 0 ? Math.min(100, Math.round((pickedQty / totalRequired) * 100)) : 0,
    };
  }, [scanItems, orderItems]);

  const handleSubmit = async () => {
    if (scanItems.length === 0) {
      message.warning('请先扫描商品');
      return;
    }
    modal.confirm({
      title: '确认提交出库？',
      content: (
        <div>
          <div>商品种类：<b>{scanItems.length}</b></div>
          <div>商品总数：<b>{fmtNum(totalQty)}</b></div>
          <div>预计总额：<b style={{ color: '#1677ff' }}>{fmtMoney(totalAmount)}</b></div>
          {progressData && (
            <div style={{ marginTop: 8 }}>
              拣货进度：<b>{fmtNum(progressData.picked)} / {fmtNum(progressData.required)}</b>
            </div>
          )}
        </div>
      ),
      okText: '提交出库',
      onOk: async () => {
        setSubmitLoading(true);
        try {
          let obId = orderId;
          if (obId) {
            await outboundApi.update(obId, {
              items: scanItems.map(i => ({
                productId: i.productId,
                plannedQty: i.qty,
                pickedQty: i.qty,
                shippedQty: i.qty,
                unitPrice: i.unitPrice,
                batchNo: i.batchNo || undefined,
                expiryDate: i.expiryDate || undefined,
                location: i.location || undefined,
              })),
            });
            try {
              await outboundApi.setStatus(obId, { status: 'SHIPPED' });
            } catch (_) {}
          } else {
            const res = await outboundApi.create({
              outboundType,
              destination: destination || undefined,
              remark: remark || undefined,
              items: scanItems.map(i => ({
                productId: i.productId,
                plannedQty: i.qty,
                pickedQty: i.qty,
                shippedQty: i.qty,
                unitPrice: i.unitPrice,
                batchNo: i.batchNo || undefined,
                expiryDate: i.expiryDate || undefined,
                location: i.location || undefined,
              })),
            });
            const data = res?.data || res;
            obId = data?.id;
          }
          message.success('出库单已提交');
          if (obId) {
            navigate(`/outbound/${obId}`);
          } else {
            navigate('/outbound');
          }
        } catch (e) {
        } finally {
          setSubmitLoading(false);
        }
      },
    });
  };

  const orderInfoLabel = orderInfo ? (
    <Space size="large" wrap>
      <Tag color="geekblue" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
        {orderInfo.orderNo}
      </Tag>
      <StatusTag type="outbound" status={orderInfo.status} />
      <Tag color="blue" style={{ margin: 0 }}>{OUTBOUND_TYPES[orderInfo.outboundType] || orderInfo.outboundType}</Tag>
      {progressData && (
        <span style={{ minWidth: 200 }}>
          <Progress
            percent={progressData.percent}
            size="small"
            status={progressData.percent >= 100 ? 'success' : 'active'}
            format={(p) => `${p}% (${fmtNum(progressData.picked)}/${fmtNum(progressData.required)})`}
          />
        </span>
      )}
    </Space>
  ) : null;

  return (
    <div className="page-container" style={{ paddingBottom: 100, background: '#fff7e6' }}>
      {contextHolder}

      <Card size="small" style={{ marginBottom: 12, border: orderInfo ? '2px solid #fa8c16' : undefined }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/outbound')}>
              返回出库单列表
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Space size="large" wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              {orderInfoLabel || (
                <>
                  <span>
                    商品种类：<b style={{ color: '#1677ff', fontSize: 16 }}>{scanItems.length}</b>
                  </span>
                  <span>
                    总数：<b style={{ color: '#52c41a', fontSize: 16 }}>{fmtNum(totalQty)}</b>
                  </span>
                  <span>
                    总额：<b style={{ color: '#fa8c16', fontSize: 16 }}>{fmtMoney(totalAmount)}</b>
                  </span>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        style={{ marginBottom: 12, border: '2px solid #fa8c16' }}
        title={<span><BarcodeOutlined style={{ color: '#fa8c16' }} /> 扫码出库 (FIFO 优先最早到期批次)</span>}
      >
        <Row gutter={[16, 12]}>
          {!orderId && (
            <>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: 8, fontWeight: 600, color: '#555' }}>出库类型</div>
                <Select
                  style={{ width: '100%', height: 48 }}
                  size="large"
                  value={outboundType}
                  onChange={setOutboundType}
                  options={Object.entries(OUTBOUND_TYPES).map(([k, v]) => ({ value: k, label: v }))}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: 8, fontWeight: 600, color: '#555' }}>目的地</div>
                <Input
                  size="large"
                  style={{ height: 48 }}
                  placeholder="目的地/客户/仓库"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: 8, fontWeight: 600, color: '#555' }}>条码/SKU 扫描</div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    ref={barcodeInputRef}
                    size="large"
                    style={{ height: 48, fontSize: 18 }}
                    prefix={<ScanOutlined style={{ color: '#fa8c16' }} />}
                    placeholder="扫码枪扫描或输入条码后回车..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    autoComplete="off"
                  />
                  <Button
                    size="large"
                    type="primary"
                    style={{ height: 48, padding: '0 20px', background: '#fa8c16', borderColor: '#fa8c16' }}
                    icon={<CameraOutlined />}
                    onClick={startCamera}
                  >
                    摄像头扫码
                  </Button>
                  <Button
                    size="large"
                    style={{ height: 48, padding: '0 20px' }}
                    onClick={() => { handleBarcodeKeyDown({ key: 'Enter', preventDefault: () => {} }); }}
                  >
                    确定
                  </Button>
                </Space.Compact>
              </Col>
            </>
          )}
          {orderId && (
            <Col xs={24} md={24}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#555' }}>条码/SKU 扫描</div>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  ref={barcodeInputRef}
                  size="large"
                  style={{ height: 48, fontSize: 18 }}
                  prefix={<ScanOutlined style={{ color: '#fa8c16' }} />}
                  placeholder="扫码枪扫描或输入条码后回车..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  autoComplete="off"
                />
                <Button
                  size="large"
                  type="primary"
                  style={{ height: 48, padding: '0 20px', background: '#fa8c16', borderColor: '#fa8c16' }}
                  icon={<CameraOutlined />}
                  onClick={startCamera}
                >
                  摄像头扫码
                </Button>
                <Button
                  size="large"
                  style={{ height: 48, padding: '0 20px' }}
                  onClick={() => { handleBarcodeKeyDown({ key: 'Enter', preventDefault: () => {} }); }}
                >
                  确定
                </Button>
              </Space.Compact>
            </Col>
          )}
        </Row>
      </Card>

      <Row gutter={12}>
        <Col xs={24} lg={14}>
          <Card
            size="small"
            title={<span><InboxOutlined /> 已拣商品 ({scanItems.length})</span>}
            style={{ height: 'calc(100vh - 430px)', overflow: 'hidden' }}
            bodyStyle={{ height: 'calc(100% - 44px)', overflowY: 'auto' }}
          >
            {scanItems.length === 0 ? (
              <Empty description="暂无拣货商品，开始扫码吧" style={{ marginTop: 60 }} />
            ) : (
              <List
                size="small"
                dataSource={scanItems}
                renderItem={(item) => {
                  const t = expiryTag(item.expiryDate);
                  const active = selectedItem?.scanId === item.scanId;
                  return (
                    <List.Item
                      key={item.scanId}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        cursor: 'pointer',
                        background: active ? '#fff7e6' : 'transparent',
                        border: active ? '1px solid #fa8c16' : '1px solid transparent',
                        borderRadius: 8,
                        marginBottom: 8,
                        padding: '12px 14px',
                      }}
                    >
                      <Row style={{ width: '100%' }} align="middle" gutter={[8, 8]}>
                        <Col flex="44px">
                          <Avatar size={40} style={{ backgroundColor: '#fa8c16' }}>
                            {(item.productName || item.sku || '?')[0]}
                          </Avatar>
                        </Col>
                        <Col flex="auto">
                          <div style={{ fontWeight: 600 }}>
                            {item.productName || item.sku}
                            {item.fifoUsed && (
                              <SafetyCertificateOutlined style={{ color: '#52c41a', marginLeft: 6 }} title="FIFO批次" />
                            )}
                          </div>
                          <Space size={8} wrap style={{ marginTop: 4 }}>
                            <Tag style={{ margin: 0 }}>{item.sku}</Tag>
                            {item.spec && <Tag color="default">{item.spec}</Tag>}
                            {item.batchNo && <Tag color="blue">批次: {item.batchNo}</Tag>}
                            {item.expiryDate && <Tag color={t.color}>{t.label}</Tag>}
                            {item.location && <Tag color="purple">库位: {item.location}</Tag>}
                          </Space>
                        </Col>
                        <Col>
                          <Space direction="vertical" align="end" size={4}>
                            <div style={{ color: '#fa8c16', fontWeight: 600 }}>{fmtMoney(item.qty * item.unitPrice)}</div>
                            <Space>
                              <Button
                                type="dashed"
                                size="small"
                                icon={<MinusOutlined />}
                                onClick={(e) => { e.stopPropagation(); handleQtyChange(item.scanId, -1); }}
                              />
                              <b style={{ minWidth: 36, textAlign: 'center', fontSize: 16 }}>{item.qty}</b>
                              <Button
                                type="dashed"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={(e) => { e.stopPropagation(); handleQtyChange(item.scanId, 1); }}
                              />
                            </Space>
                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => { e.stopPropagation(); handleRemove(item.scanId); }}
                            >
                              移除
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            size="small"
            title={selectedItem ? <span>商品信息详情</span> : <span>商品信息 / FIFO 批次</span>}
            style={{ height: 'calc(100vh - 430px)', overflow: 'hidden' }}
            bodyStyle={{ height: 'calc(100% - 44px)', overflowY: 'auto' }}
          >
            {selectedItem ? (
              <div>
                <div style={{ textAlign: 'center', padding: '16px 0', background: '#fff7e6', borderRadius: 8 }}>
                  <Avatar size={72} style={{ backgroundColor: '#fa8c16', fontSize: 28 }}>
                    {(selectedItem.productName || selectedItem.sku || '?')[0]}
                  </Avatar>
                  <div style={{ fontWeight: 700, fontSize: 18, marginTop: 10 }}>
                    {selectedItem.productName}
                    {selectedItem.fifoUsed && (
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        <SafetyCertificateOutlined /> FIFO
                      </Tag>
                    )}
                  </div>
                  <Tag color="orange" style={{ marginTop: 6 }}>{selectedItem.sku}</Tag>
                  {selectedItem.spec && <Tag color="default" style={{ marginTop: 6 }}>{selectedItem.spec}</Tag>}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>批次号</div>
                      <div style={{ fontWeight: 600 }}>{selectedItem.batchNo || '-'}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>有效期</div>
                      <div>
                        {selectedItem.expiryDate ? (
                          <Tag color={expiryTag(selectedItem.expiryDate).color}>
                            {selectedItem.expiryDate} ({expiryTag(selectedItem.expiryDate).label})
                          </Tag>
                        ) : '-'}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>单价</div>
                      <div style={{ fontWeight: 600, color: '#fa8c16' }}>{fmtMoney(selectedItem.unitPrice)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>小计</div>
                      <div style={{ fontWeight: 700, color: '#1677ff', fontSize: 18 }}>
                        {fmtMoney(selectedItem.qty * selectedItem.unitPrice)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>数量</div>
                      <div style={{ fontWeight: 600, fontSize: 18 }}>{fmtNum(selectedItem.qty)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>建议库位</div>
                      <div style={{ fontWeight: 600 }}>{selectedItem.location || selectedItem.product?.defaultLocation || '-'}</div>
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 60, textAlign: 'center' }}>
                <Empty description="选择左侧商品查看详情" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', borderRadius: 8, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: '#52c41a', marginBottom: 8 }}>
                    <SafetyCertificateOutlined /> FIFO 先进先出规则
                  </div>
                  <ul style={{ color: '#666', margin: 0, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 4 }}>扫描条码自动匹配最早到期批次</li>
                    <li style={{ marginBottom: 4 }}>优先从近效期批次中拣货</li>
                    <li style={{ marginBottom: 4 }}>已过期批次自动排除</li>
                    <li>批次信息可在商品详情中查看</li>
                  </ul>
                </div>
              </div>
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
          borderTop: '2px solid #fa8c16',
          padding: '12px 24px',
          zIndex: 100,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          <Col xs={24} md={12}>
            {!orderId && (
              <TextArea
                rows={2}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注信息（可选）"
                style={{ resize: 'none' }}
              />
            )}
            {orderId && orderInfo && (
              <div>
                <div style={{ color: '#888', fontSize: 12 }}>目的地</div>
                <div style={{ fontWeight: 600 }}>{orderInfo.destination || orderInfo.customerName || orderInfo.warehouseTo || '-'}</div>
              </div>
            )}
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ justifyContent: 'flex-end', width: '100%' }} wrap>
              <Space size="middle">
                {progressData ? (
                  <div style={{ minWidth: 220 }}>
                    <Progress
                      percent={progressData.percent}
                      status={progressData.percent >= 100 ? 'success' : 'active'}
                      format={(p) => `拣货进度 ${p}%`}
                    />
                  </div>
                ) : null}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#888', fontSize: 12 }}>商品种类</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#1677ff' }}>{scanItems.length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#888', fontSize: 12 }}>总数量</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#52c41a' }}>{fmtNum(totalQty)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#888', fontSize: 12 }}>总金额</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#fa8c16' }}>{fmtMoney(totalAmount)}</div>
                </div>
              </Space>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                loading={submitLoading}
                onClick={handleSubmit}
                style={{ height: 56, padding: '0 40px', fontSize: 16, fontWeight: 600, background: '#fa8c16', borderColor: '#fa8c16' }}
              >
                提交出库单
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Modal
        title="摄像头扫码"
        open={cameraOpen}
        onCancel={stopCamera}
        footer={null}
        width={480}
        destroyOnClose
      >
        <div id="qr-reader-ob" style={{ width: '100%' }}></div>
      </Modal>
    </div>
  );
};

export default OutboundScan;
