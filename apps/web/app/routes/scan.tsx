import { useEffect, useState, useRef } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { api } from '~/lib/api';
import Layout from '~/components/Layout';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadApplications();
  }, [token, isAuthenticated, navigate, mode]);

  const loadApplications = async () => {
    if (!token) return;
    try {
      const status = mode === 'borrow' ? 'approved' : 'approved';
      const data: any = await api.borrows.list(token, { status });
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载申请列表失败:', error);
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
    if (!scannedMaterial || !applicationId || !token) return;

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
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '无法访问摄像头，请手动输入二维码' });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setScanning(false);
    }
  };

  if (!isAuthenticated || (user?.role !== 'warehouse_manager' && user?.role !== 'admin')) {
    return null;
  }

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">扫码借还</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('borrow')}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                mode === 'borrow'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              借出登记
            </button>
            <button
              onClick={() => setMode('return')}
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
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">请选择申请</option>
              {applications.map((app: any) => (
                <option key={app.id} value={app.id}>
                  {app.activity_title} - {app.applicant_name}
                </option>
              ))}
            </select>
          </div>

          {message.text && (
            <div className={`mb-6 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">扫码识别（或手动输入）</p>
                <div className="mb-4">
                  {!scanning ? (
                    <button
                      onClick={startCamera}
                      className="w-full py-2 border rounded-lg hover:bg-gray-100 text-sm"
                    >
                      📷 打开摄像头扫码
                    </button>
                  ) : (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                      />
                      <button
                        onClick={stopCamera}
                        className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-sm rounded"
                      >
                        关闭
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入物资二维码编号"
                    value={manualQrCode}
                    onChange={(e) => setManualQrCode(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                  <button
                    onClick={handleScanQr}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    查询
                  </button>
                </div>
              </div>

              {scannedMaterial && (
                <div className="mt-4 p-4 border rounded-lg bg-green-50 border-green-200">
                  <p className="font-medium text-green-800">{scannedMaterial.name}</p>
                  <p className="text-sm text-green-600">二维码：{scannedMaterial.qr_code}</p>
                  <p className="text-sm text-green-600">分类：{scannedMaterial.category_name}</p>
                  <p className="text-sm text-green-600">状态：{scannedMaterial.status}</p>
                </div>
              )}
            </div>

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
                  <option value="excellent">优秀</option>
                  <option value="good">良好</option>
                  <option value="fair">一般</option>
                  <option value="poor">较差</option>
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

              <button
                onClick={handleSubmit}
                disabled={!scannedMaterial || !applicationId}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认{mode === 'borrow' ? '借出' : '归还'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
