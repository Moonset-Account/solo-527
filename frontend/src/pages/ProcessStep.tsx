import { useState, useEffect } from 'react';
import { processStepApi } from '../services/processStepApi';
import { equipmentApi } from '../services/equipmentApi';
import { useAuthStore } from '../stores/authStore';
import type { ProcessStepInstance, Equipment } from '../types';

const ProcessStep = () => {
  const [qrCode, setQrCode] = useState('');
  const [currentStep, setCurrentStep] = useState<ProcessStepInstance | null>(null);
  const [outputQuantity, setOutputQuantity] = useState(0);
  const [defectiveQuantity, setDefectiveQuantity] = useState(0);
  const [remark, setRemark] = useState('');
  const [abnormalReason, setAbnormalReason] = useState('');
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        setLoadingEquipments(true);
        const list = await equipmentApi.getAll();
        setEquipmentList(list);
      } catch (err) {
        console.error('Failed to load equipments:', err);
      } finally {
        setLoadingEquipments(false);
      }
    };
    fetchEquipments();
  }, []);

  useEffect(() => {
    if (currentStep && currentStep.status === 1) {
      if (currentStep.equipmentId) {
        setSelectedEquipmentId(currentStep.equipmentId);
      } else if (equipmentList.length > 0) {
        const runningEquip = equipmentList.find((e) => e.status === 1 || e.status === 2);
        if (runningEquip) {
          setSelectedEquipmentId(runningEquip.id);
        } else if (equipmentList.length > 0) {
          setSelectedEquipmentId(equipmentList[0].id);
        }
      }
    }
  }, [currentStep, equipmentList]);

  const handleQuery = async () => {
    if (!qrCode.trim()) return;
    try {
      const step = await processStepApi.getByQrCode(qrCode);
      setCurrentStep(step);
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: '未找到该二维码对应的工序' });
      setCurrentStep(null);
    }
  };

  const handleStart = async () => {
    if (!currentStep || !user) return;
    if (!selectedEquipmentId) {
      setMessage({ type: 'error', text: '请选择加工设备' });
      return;
    }
    try {
      const result = await processStepApi.scanStart({
        qrCode,
        operatorId: user.id,
        equipmentId: selectedEquipmentId,
      });
      setCurrentStep(result);
      setMessage({ type: 'success', text: '工序已开始' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '操作失败' });
    }
  };

  const handleComplete = async () => {
    if (!currentStep) return;
    try {
      const result = await processStepApi.scanComplete({
        qrCode,
        outputQuantity,
        defectiveQuantity,
        remark,
      });
      setCurrentStep(result);
      setMessage({ type: 'success', text: '工序已完成' });
      setOutputQuantity(0);
      setDefectiveQuantity(0);
      setRemark('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '操作失败' });
    }
  };

  const handleReportAbnormal = async () => {
    if (!currentStep || !abnormalReason.trim()) return;
    try {
      const result = await processStepApi.reportAbnormal({ qrCode, reason: abnormalReason });
      setCurrentStep(result);
      setShowAbnormalModal(false);
      setAbnormalReason('');
      setMessage({ type: 'success', text: '异常已上报' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '操作失败' });
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'text-gray-600 bg-gray-100';
      case 2: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-green-600 bg-green-100';
      case 4: return 'text-red-600 bg-red-100';
      case 5: return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEquipmentStatusText = (status: number) => {
    switch (status) {
      case 1: return '运行中';
      case 2: return '加工中';
      case 3: return '异常';
      case 4: return '停机';
      case 5: return '维护中';
      default: return '未知';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">扫码流转</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="扫描或输入二维码"
            className="flex-1 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary text-lg"
          />
          <button
            onClick={handleQuery}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
          >
            查询
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {currentStep && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{currentStep.stepName}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStep.status)}`}>
                {currentStep.statusText}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">工单号：</span>
                <span className="font-medium">{currentStep.workOrderCode}</span>
              </div>
              <div>
                <span className="text-gray-500">工序编号：</span>
                <span>{currentStep.stepCode}</span>
              </div>
              <div>
                <span className="text-gray-500">设备：</span>
                <span>{currentStep.equipmentName || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">操作人：</span>
                <span>{currentStep.operatorName || '-'}</span>
              </div>
              {currentStep.startedAt && (
                <div>
                  <span className="text-gray-500">开始时间：</span>
                  <span>{new Date(currentStep.startedAt).toLocaleString()}</span>
                </div>
              )}
              {currentStep.completedAt && (
                <div>
                  <span className="text-gray-500">完成时间：</span>
                  <span>{new Date(currentStep.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {currentStep.status === 1 && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">选择加工设备</label>
                {loadingEquipments ? (
                  <div className="text-gray-400 text-sm">加载设备列表中...</div>
                ) : (
                  <select
                    value={selectedEquipmentId}
                    onChange={(e) => setSelectedEquipmentId(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="">请选择设备</option>
                    {equipmentList.map((equip) => (
                      <option key={equip.id} value={equip.id}>
                        {equip.code} - {equip.name} ({getEquipmentStatusText(equip.status)})
                      </option>
                    ))}
                  </select>
                )}
                {currentStep.equipmentId && (
                  <p className="mt-1 text-xs text-gray-500">
                    提示：工单默认绑定设备：{currentStep.equipmentName || '无'}
                  </p>
                )}
              </div>
              <button
                onClick={handleStart}
                disabled={!selectedEquipmentId || loadingEquipments}
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                开始加工
              </button>
            </div>
          )}

          {currentStep.status === 2 && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">合格数量</label>
                  <input
                    type="number"
                    value={outputQuantity}
                    onChange={(e) => setOutputQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">不良数量</label>
                  <input
                    type="number"
                    value={defectiveQuantity}
                    onChange={(e) => setDefectiveQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">备注</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  完成报工
                </button>
                <button
                  onClick={() => setShowAbnormalModal(true)}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                >
                  异常上报
                </button>
              </div>
            </div>
          )}

          {currentStep.status === 3 && (
            <div className="p-6">
              <div className="text-center text-gray-500">
                <p className="mb-2">该工序已完成</p>
                <p className="text-sm">合格: {currentStep.outputQuantity} | 不良: {currentStep.defectiveQuantity}</p>
              </div>
            </div>
          )}

          {currentStep.status === 4 && (
            <div className="p-6 bg-red-50">
              <p className="text-red-700 mb-2">异常状态</p>
              <p className="text-sm text-red-600">原因：{currentStep.abnormalReason}</p>
            </div>
          )}
        </div>
      )}

      {showAbnormalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">异常上报</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">异常原因</label>
              <textarea
                value={abnormalReason}
                onChange={(e) => setAbnormalReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="请描述异常情况"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbnormalModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleReportAbnormal}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                确认上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessStep;
