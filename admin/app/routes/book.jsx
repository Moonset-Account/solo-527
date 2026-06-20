import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import api from '~/utils/api';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    applianceType: '',
    applianceBrand: '',
    applianceModel: '',
    faultDescription: '',
    faultPhotos: [],
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    appointmentTime: '',
    urgencyLevel: 'normal'
  });
  
  const applianceTypes = ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他'];
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await api.post('/orders', formData);
      if (result.success) {
        setSuccess(true);
      }
    } catch (error) {
      alert('提交失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const nextStep = () => {
    if (step === 1) {
      if (!formData.applianceType || !formData.faultDescription) {
        alert('请填写家电类型和故障描述');
        return;
      }
    } else if (step === 2) {
      if (!formData.customerName || !formData.customerPhone || !formData.customerAddress) {
        alert('请填写完整的联系信息');
        return;
      }
      if (!formData.appointmentTime) {
        alert('请选择预约时间');
        return;
      }
    }
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">预约成功！</h2>
          <p className="text-gray-500 mb-6">我们的客服会尽快与您联系确认订单</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">家电类型</span>
              <span className="font-medium">{formData.applianceType}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">预约时间</span>
              <span className="font-medium">{formData.appointmentTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">联系人</span>
              <span className="font-medium">{formData.customerName}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">家电维修预约</h1>
          <p className="text-gray-500">专业师傅上门服务，价格透明</p>
        </div>
        
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${
                  step > s ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">故障信息</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  家电类型 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {applianceTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, applianceType: type }))}
                      className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                        formData.applianceType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
                  <input
                    type="text"
                    value={formData.applianceBrand}
                    onChange={(e) => setFormData(prev => ({ ...prev, applianceBrand: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="如：格力、美的"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
                  <input
                    type="text"
                    value={formData.applianceModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, applianceModel: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="如：KFR-35GW"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  故障描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.faultDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, faultDescription: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows="4"
                  placeholder="请详细描述故障情况，如：不制冷、有异响、漏水等"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  故障照片（可选）
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-400">点击上传故障照片</p>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，最多 5 张</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">紧急程度</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: 'normal' }))}
                    className={`flex-1 py-2 text-sm rounded-lg border ${
                      formData.urgencyLevel === 'normal'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    普通预约
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: 'urgent' }))}
                    className={`flex-1 py-2 text-sm rounded-lg border ${
                      formData.urgencyLevel === 'urgent'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    加急服务
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: 'emergency' }))}
                    className={`flex-1 py-2 text-sm rounded-lg border ${
                      formData.urgencyLevel === 'emergency'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    紧急上门
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">联系信息</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    您的姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    手机号码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  详细地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请输入详细地址，如：XX小区XX号楼XX单元XX室"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预约时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">价格说明</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 上门检测费 50 元，检测后不修不收</li>
                  <li>• 维修费用根据实际故障情况确定</li>
                  <li>• 配件费用按实际使用收取</li>
                  <li>• 维修完成后提供 90 天质保</li>
                </ul>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">确认预约</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">家电类型</span>
                  <span className="font-medium">{formData.applianceType}</span>
                </div>
                {formData.applianceBrand && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">品牌型号</span>
                    <span className="font-medium">{formData.applianceBrand} {formData.applianceModel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">故障描述</span>
                  <span className="font-medium text-right max-w-xs">{formData.faultDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">紧急程度</span>
                  <span className={`font-medium ${
                    formData.urgencyLevel === 'normal' ? 'text-gray-600' :
                    formData.urgencyLevel === 'urgent' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {formData.urgencyLevel === 'normal' ? '普通' :
                     formData.urgencyLevel === 'urgent' ? '加急' : '紧急'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">联系人</span>
                    <span className="font-medium">{formData.customerName}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">联系电话</span>
                    <span className="font-medium">{formData.customerPhone}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">预约地址</span>
                    <span className="font-medium text-right max-w-xs">{formData.customerAddress}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">预约时间</span>
                    <span className="font-medium">{formData.appointmentTime}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>温馨提示：</strong>提交后客服将在 30 分钟内与您联系确认订单详情。
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '提交中...' : '确认提交'}
              </button>
            )}
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>服务热线：400-123-4567</p>
          <p className="mt-1">工作时间：8:00 - 22:00</p>
        </div>
      </div>
    </div>
  );
}
