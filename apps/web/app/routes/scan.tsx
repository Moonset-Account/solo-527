import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { api } from '~/lib/api';
import Layout from '~/components/Layout';
import { Html5Qrcode } from 'html5-qrcode';

type ScanMode = 'borrow' | 'return';

interface Material {
  id: string;
  name: string;
  qr_code: string;
  category_name?: string;
  status: string;
  condition?: string;
}

export default function Scan() {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>('borrow');
  const [applicationId, setApplicationId] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [scannedMaterial, setScannedMaterial] = useState<Material | null>(null);
  const [manualQrCode, setManualQrCode] = useState('');
  const [condition, setCondition] = useState('good');
  const [damageDescription, setDamageDescription] = useState('');
  const [missingParts, setMissingParts] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadApplications();
  }, [token, isAuthenticated, navigate, mode]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const loadApplications = async () => {
    if (!token) return;
    try {
      const status = 'approved';
      const data: any = await api.borrows.list(token, { status });
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载申请列表失败:', error);
    }
  };

  const startScanner = useCallback(async () => {
    if (!applicationId) {
      setMessage({ type: 'error', text: '请先选择借用申请' });
      return;
    }

    if (!token) {
      setMessage({ type: 'error', text: '请先登录' });
      return;
    }

    setMessage({ type: '', text: '' });
    setScannedMaterial(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        async (decodedText: string) => {
          if (isScanningRef.current) {
            return;
          }
          isScanningRef.current = true;
          
          const qrCode = decodedText.trim();
          if (qrCode) {
            await handleQrCodeDetected(qrCode);
          }
        },
        (errorMessage: string) => {
        }
      );

      setScanning(true);
      setMessage({ type: 'success', text: '摄像头已打开，请将二维码对准扫描框' });
    } catch (error: any) {
      console.error('启动摄像头失败:', error);
      let errorMsg = '无法访问摄像头，请检查权限设置';
      if (error.name === 'NotAllowedError') {
        errorMsg = '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未找到摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMsg = '摄像头被其他应用占用';
      }
      setMessage({ type: 'error', text: errorMsg + '，或使用手动输入方式' });
      setScanning(false);
      html5QrCodeRef.current = null;
    }
  }, [applicationId, token]);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    isScanningRef.current = false;
    setScanning(false);
  }, []);

  const handleQrCodeDetected = async (qrCode: string) => {
    if (!token || !applicationId) {
      setMessage({ type: 'error', text: '请先选择借用申请' });
      isScanningRef.current = false;
      return;
    }

    try {
      const material = await api.materials.getByQr(token, qrCode) as Material;
      setScannedMaterial(material);
      setManualQrCode(qrCode);
      setMessage({ type: 'success', text: `识别成功：${material.name}` });
      await stopScanner();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '未找到该物资' });
    } finally {
      isScanningRef.current = false;
    }
  };

  const handleScanQr = async () => {
    if (!manualQrCode || !applicationId || !token) {
      setMessage({ type: 'error', text: '请填写完整信息' });
      return;
    }

    try {
      const material = await api.materials.getByQr(token, manualQrCode) as Material;
      setScannedMaterial(material);
      setMessage({ type: 'success', text: `识别成功：${material.name}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '未找到该物资' });
    }
  };

  const handleSubmit = async () => {
    if (!scannedMaterial || !applicationId || !token || submitting) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      if (mode === 'borrow') {
        await api.borrows.borrow(token, {
          applicationId,
          materialId: scannedMaterial.id,
          qrCode: scannedMaterial.qr_code,
          borrowCondition: condition,
        });
        setMessage({ type: 'success', text: '借出登记成功！' });
      } else {
        await api.borrows.return(token, {
          applicationId,
          materialId: scannedMaterial.id,
          qrCode: scannedMaterial.qr_code,
          returnCondition: condition,
          damageDescription: damageDescription || undefined,
          missingParts: missingParts || undefined,
        });
        setMessage({ type: 'success', text: '归还登记成功！' });
      }
      
      setScannedMaterial(null);
      setManualQrCode('');
      setCondition('good');
      setDamageDescription('');
      setMissingParts('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleScanning = async () => {
    if (scanning) {
      await stopScanner();
      setMessage({ type: '', text: '' });
    } else {
      await startScanner();
    }
  };

  if (!isAuthenticated || (user?.role !== 'warehouse_manager' && user?.role !== 'admin')) {
    return null;
  }

  const statusText: Record<string, string> = {
    available: '可借用',
    reserved: '已预留',
    borrowed: '已借出',
    damaged: '已损坏',
    repairing: '维修中',
    scrapped: '已报废',
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">扫码借还</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setMode('borrow');
                setScannedMaterial(null);
                stopScanner();
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                mode === 'borrow'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              借出登记
            </button>
            <button
              onClick={() => {
                setMode('return');
                setScannedMaterial(null);
                stopScanner();
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                mode === 'return'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              归还登记
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择借用申请</label>
            <select
              value={applicationId}
              onChange={(e) => {
                setApplicationId(e.target.value);
                setScannedMaterial(null);
                stopScanner();
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">请选择申请</option>
              {applications.map((app: any) => (
                <option key={app.id} value={app.id}>
                  {app.activity_title} - {app.applicant_name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              必须先选择借用申请才能扫码
            </p>
          </div>

          {message.text && (
            <div className={`mb-6 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">扫码识别</p>
                
                <div className="mb-4">
                  {!scanning ? (
                    <button
                      onClick={toggleScanning}
                      disabled={!applicationId}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      打开摄像头扫码
                    </button>
                  ) : (
                    <div className="relative">
                      <div 
                        id={scannerContainerId} 
                        className="w-full rounded-lg overflow-hidden bg-black"
                        style={{ minHeight: '250px' }}
                      />
                      <button
                        onClick={toggleScanning}
                        className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-sm rounded z-10 hover:bg-red-600"
                      >
                        关闭摄像头
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="relative flex items-center gap-2 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 px-2">或</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">手动输入二维码编号</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="例如：TABLE-001"
                      value={manualQrCode}
                      onChange={(e) => setManualQrCode(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    />
                    <button
                      onClick={handleScanQr}
                      disabled={!applicationId || !manualQrCode}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      查询
                    </button>
                  </div>
                </div>
              </div>

              {scannedMaterial && (
                <div className="mt-4 p-4 border-2 rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-500">✓</span>
                    <p className="font-semibold text-green-800">{scannedMaterial.name}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-600">
                      <span className="text-gray-500">二维码：</span>
                      {scannedMaterial.qr_code}
                    </p>
                    <p className="text-green-600">
                      <span className="text-gray-500">分类：</span>
                      {scannedMaterial.category_name || '-'}
                    </p>
                    <p className="text-green-600">
                      <span className="text-gray-500">状态：</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800`}>
                        {statusText[scannedMaterial.status] || scannedMaterial.status}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-4">
                  {mode === 'borrow' ? '借出信息' : '归还信息'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {mode === 'borrow' ? '借出时成色' : '归还时成色'}
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    >
                      <option value="excellent">优秀 - 全新</option>
                      <option value="good">良好 - 轻微使用痕迹</option>
                      <option value="fair">一般 - 明显使用痕迹</option>
                      <option value="poor">较差 - 有损坏但可用</option>
                    </select>
                  </div>

                  {mode === 'return' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">损坏描述（如有）</label>
                        <textarea
                          value={damageDescription}
                          onChange={(e) => setDamageDescription(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          rows={2}
                          placeholder="描述物资损坏情况..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">缺件说明（如有）</label>
                        <textarea
                          value={missingParts}
                          onChange={(e) => setMissingParts(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          rows={2}
                          placeholder="说明缺少的配件..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!scannedMaterial || !applicationId || submitting}
                className="w-full py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting 
                  ? '处理中...' 
                  : mode === 'borrow' ? '确认借出' : '确认归还'}
              </button>

              <div className="text-xs text-gray-400 space-y-1">
                <p>提示：</p>
                <ul className="list-disc list-inside">
                  <li>先选择借用申请，再扫码或手动查询物资</li>
                  <li>归还时如有损坏或缺件请详细填写</li>
                  <li>提交后系统自动记录操作日志</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
