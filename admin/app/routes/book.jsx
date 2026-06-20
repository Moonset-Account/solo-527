import { useState, useRef } from 'react';
import { useNavigate } from '@remix-run/react';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    applianceType: '',
    applianceBrand: '',
    applianceModel: '',
    faultDescription: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    appointmentTime: '',
    urgencyLevel: 'normal',
    store: ''
  });
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [error, setError] = useState('');
  
  const applianceTypes = ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他'];
  
  const handlePhotoSelect = (e) => {
    setError('');
    const files = Array.from(e.target.files);
    
    if (selectedPhotos.length + files.length > 5) {
      setError('最多只能上传 5 张照片');
      return;
    }
    
    const newPhotos = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    
    setSelectedPhotos(prev => [...prev, ...newPhotos]);
  };
  
  const removePhoto = (index) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const formDataObj = new FormData();
      
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataObj.append(key, formData[key]);
        }
      });
      
      selectedPhotos.forEach((photo) => {
        formDataObj.append('faultPhotos', photo.file);
      });
      
      const response = await fetch('/api/orders/public', {
        method: 'POST',
        body: formDataObj
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCreatedOrder(result.data);
        setSuccess(true);
      } else {
        setError(result.message || '提交失败，请稍后重试');
      }
    } catch (err) {
      setError('网络错误，请稍后重试：' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.applianceType || !formData.faultDescription) {
        setError('请填写家电类型和故障描述');
        return;
      }
    } else if (step === 2) {
      if (!formData.customerName || !formData.customerPhone || !formData.customerAddress) {
        setError('请填写完整的联系信息');
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(formData.customerPhone)) {
        setError('请输入正确的手机号');
        return;
      }
      if (!formData.appointmentTime) {
        setError('请选择预约时间');
        return;
      }
    }
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setError('');
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
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">订单编号</span>
              <span className="font-medium text-blue-600">{createdOrder?.orderNo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">家电类型</span>
              <span className="font-medium">{formData.applianceType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">预约时间</span>
              <span className="font-medium">{formData.appointmentTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">联系人</span>
              <span className="font-medium">{formData.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">故障照片</span>
              <span className="font-medium">{selectedPhotos.length} 张已上传</span>
            </div>
          </div>
          {createdOrder?.faultPhotos?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2 text-left">已上传的照片：</p>
              <div className="flex flex-wrap gap-2">
                {createdOrder.faultPhotos.map((url, idx) => (
                  <img 
                    key={idx} 
                    src={url} 
                    alt={`故障照片${idx + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => setStep(1)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              继续预约
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              返回首页
            </button>
          </div>
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  故障照片 <span className="text-gray-400 text-xs">（可选，最多5张）</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-3 mb-3">
                  {selectedPhotos.map((photo, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={photo.url} 
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selectedPhotos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      <span className="text-2xl mb-1">+</span>
                      <span className="text-xs">上传照片</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">支持 JPG、PNG、GIF、WebP 格式，每张不超过 10MB</p>
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
                  服务门店 <span className="text-gray-400 text-xs">（可选）</span>
                </label>
                <select
                  value={formData.store}
                  onChange={(e) => setFormData(prev => ({ ...prev, store: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">系统自动分配</option>
                  <option value="朝阳门店">朝阳门店</option>
                  <option value="海淀门店">海淀门店</option>
                  <option value="西城门店">西城门店</option>
                  <option value="东城门店">东城门店</option>
                </select>
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
                  <span className="text-gray-500">故障照片</span>
                  <span className="font-medium">{selectedPhotos.length} 张</span>
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
                  {formData.store && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">服务门店</span>
                      <span className="font-medium">{formData.store}</span>
                    </div>
                  )}
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
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
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
