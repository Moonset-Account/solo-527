import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

const badReviewReasonLabels = {
  price_issue: '价格问题',
  service_quality: '服务质量',
  technician_attitude: '师傅态度',
  timing_issue: '时效问题',
  communication_issue: '沟通问题',
  other: '其他'
};

const visitStatusLabels = {
  not_visited: '未回访',
  pending: '待回访',
  visited: '已回访',
  no_answer: '无人接听',
  customer_busy: '客户忙'
};

const followUpStatusLabels = {
  not_followed: '未跟进',
  followed: '已跟进',
  resolved: '已解决',
  unresolved: '未解决',
  escalated: '已升级'
};

export default function Satisfaction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    followUpStatus: 'followed',
    followUpRemark: '',
    badReviewReason: '',
    badReviewDetail: ''
  });
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    overallRating: 'all',
    store: '',
    customerService: '',
    groupBy: 'overall'
  });
  
  useEffect(() => {
    loadData();
  }, [filters]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/satisfaction', {
        ...filters,
        page: 1,
        pageSize: 50
      });
      if (result.success) {
        setData(result.data || []);
      }
    } catch (error) {
      console.error('加载满意度数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadDetail = async (id) => {
    try {
      const result = await api.get(`/satisfaction/${id}`);
      if (result.success) {
        setSelectedItem(result.data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('加载详情失败:', error);
    }
  };
  
  const handleFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/satisfaction/${selectedItem._id}/followup`, followUpForm);
      setShowFollowUpModal(false);
      loadData();
      loadDetail(selectedItem._id);
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };
  
  const updateVisitStatus = async (status) => {
    try {
      await api.put(`/satisfaction/${selectedItem._id}/visit`, {
        visitStatus: status
      });
      loadData();
      loadDetail(selectedItem._id);
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };
  
  const badReviews = data?.filter?.(s => s.overallRating <= 2) || [];
  const goodReviews = data?.filter?.(s => s.overallRating >= 4) || [];
  const avgRating = data?.length > 0 
    ? (data.reduce((sum, s) => sum + s.overallRating, 0) / data.length).toFixed(1)
    : 0;
  const goodRate = data?.length > 0 
    ? ((goodReviews.length / data.length) * 100).toFixed(1)
    : 0;
  
  const notFollowedBadReviews = badReviews.filter(s => 
    s.followUpStatus === 'not_followed' || s.followUpStatus === 'pending'
  );
  
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <AdminLayout title="售后满意">
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="label">评分筛选</label>
              <select
                value={filters.overallRating}
                onChange={(e) => setFilters(prev => ({ ...prev, overallRating: e.target.value }))}
                className="select"
                style={{ width: '140px' }}
              >
                <option value="all">全部评分</option>
                <option value="good">好评(4-5星)</option>
                <option value="medium">中评(3星)</option>
                <option value="bad">差评(1-2星)</option>
              </select>
            </div>
            <div>
              <label className="label">门店</label>
              <input
                type="text"
                placeholder="门店名称"
                value={filters.store}
                onChange={(e) => setFilters(prev => ({ ...prev, store: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="label">客服</label>
              <input
                type="text"
                placeholder="客服姓名"
                value={filters.customerService}
                onChange={(e) => setFilters(prev => ({ ...prev, customerService: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            <button onClick={loadData} className="btn btn-primary">
              查询
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-gray-500 text-sm">评价总数</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{data?.length || 0}</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-sm">平均评分</p>
            <div className="flex items-center mt-2">
              <span className="text-3xl font-bold text-yellow-500">{avgRating}</span>
              <span className="text-gray-400 text-lg ml-1">/5</span>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-sm">好评率</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{goodRate}%</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-sm">差评未跟进</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{notFollowedBadReviews.length}</p>
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">评价列表</h3>
            <div className="text-sm text-gray-500">
              差评 <span className="text-red-600 font-medium">{badReviews.length}</span> 条 · 
              未跟进 <span className="text-orange-600 font-medium">{notFollowedBadReviews.length}</span> 条
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : data?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无数据</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data?.map?.((item) => (
                <div key={item._id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => loadDetail(item._id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-blue-600">{item.orderNo}</span>
                        {renderStars(item.overallRating)}
                        {item.overallRating <= 2 && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                            差评
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>客户：{item.customerName}</span>
                        <span>师傅：{item.technicianName || '-'}</span>
                        <span>客服：{item.customerService || '-'}</span>
                        <span>门店：{item.store || '-'}</span>
                        <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      {(item.positiveComments || item.negativeComments) && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-1">
                          {item.positiveComments || item.negativeComments}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.followUpStatus === 'resolved' ? 'bg-green-100 text-green-700' :
                        item.followUpStatus === 'not_followed' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {followUpStatusLabels[item.followUpStatus]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">满意度详情 - {selectedItem.orderNo}</h3>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="text-center pb-4 border-b border-gray-200">
                <div className="text-4xl mb-2">
                  {renderStars(selectedItem.overallRating)}
                </div>
                <p className="text-2xl font-bold text-gray-800">{selectedItem.overallRating} 分</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">服务质量</p>
                  <p className="text-lg font-medium">{selectedItem.serviceQuality} 分</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">师傅态度</p>
                  <p className="text-lg font-medium">{selectedItem.technicianAttitude} 分</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">价格满意度</p>
                  <p className="text-lg font-medium">{selectedItem.priceSatisfaction} 分</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">响应速度</p>
                  <p className="text-lg font-medium">{selectedItem.responseSpeed} 分</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedItem.positiveComments && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">好评内容</p>
                    <p className="text-gray-600 bg-green-50 p-3 rounded-lg">{selectedItem.positiveComments}</p>
                  </div>
                )}
                {selectedItem.negativeComments && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">差评内容</p>
                    <p className="text-gray-600 bg-red-50 p-3 rounded-lg">{selectedItem.negativeComments}</p>
                  </div>
                )}
                {selectedItem.suggestions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">客户建议</p>
                    <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">{selectedItem.suggestions}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">师傅：</span>
                  <span className="text-gray-800">{selectedItem.technicianName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">客服：</span>
                  <span className="text-gray-800">{selectedItem.customerService || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">门店：</span>
                  <span className="text-gray-800">{selectedItem.store || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">评价来源：</span>
                  <span className="text-gray-800">{selectedItem.surveySource || '-'}</span>
                </div>
              </div>
              
              {selectedItem.overallRating <= 2 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">差评原因分析</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">原因分类：</span>
                      <span className="font-medium">
                        {selectedItem.badReviewReason ? badReviewReasonLabels[selectedItem.badReviewReason] : '未分类'}
                      </span>
                    </p>
                    {selectedItem.badReviewDetail && (
                      <p>
                        <span className="text-gray-600">详细说明：</span>
                        {selectedItem.badReviewDetail}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">回访状态：</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedItem.visitStatus === 'visited' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {visitStatusLabels[selectedItem.visitStatus]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">跟进状态：</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedItem.followUpStatus === 'resolved' ? 'bg-green-100 text-green-700' :
                    selectedItem.followUpStatus === 'not_followed' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {followUpStatusLabels[selectedItem.followUpStatus]}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {selectedItem.visitStatus !== 'visited' && (
                  <button 
                    onClick={() => updateVisitStatus('visited')} 
                    className="btn btn-success"
                  >
                    标记已回访
                  </button>
                )}
                <button 
                  onClick={() => {
                    setFollowUpForm({
                      followUpStatus: selectedItem.followUpStatus,
                      followUpRemark: selectedItem.followUpRemark || '',
                      badReviewReason: selectedItem.badReviewReason || '',
                      badReviewDetail: selectedItem.badReviewDetail || ''
                    });
                    setShowFollowUpModal(true);
                  }} 
                  className="btn btn-primary"
                >
                  跟进处理
                </button>
              </div>
              
              {selectedItem.followUpRemark && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">跟进记录</p>
                  <p className="text-sm text-gray-600">{selectedItem.followUpRemark}</p>
                  {selectedItem.followUpBy && (
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedItem.followUpBy} · {dayjs(selectedItem.followUpTime).format('YYYY-MM-DD HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showFollowUpModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">跟进处理</h3>
            </div>
            
            <form onSubmit={handleFollowUp} className="p-5 space-y-4">
              <div>
                <label className="label">跟进状态</label>
                <select
                  value={followUpForm.followUpStatus}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, followUpStatus: e.target.value }))}
                  className="select"
                >
                  <option value="not_followed">未跟进</option>
                  <option value="followed">已跟进</option>
                  <option value="resolved">已解决</option>
                  <option value="unresolved">未解决</option>
                  <option value="escalated">已升级</option>
                </select>
              </div>
              
              {selectedItem.overallRating <= 2 && (
                <>
                  <div>
                    <label className="label">差评原因分类</label>
                    <select
                      value={followUpForm.badReviewReason}
                      onChange={(e) => setFollowUpForm(prev => ({ ...prev, badReviewReason: e.target.value }))}
                      className="select"
                    >
                      <option value="">请选择</option>
                      {Object.entries(badReviewReasonLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">差评详情</label>
                    <textarea
                      value={followUpForm.badReviewDetail}
                      onChange={(e) => setFollowUpForm(prev => ({ ...prev, badReviewDetail: e.target.value }))}
                      className="input"
                      rows="2"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="label">跟进备注</label>
                <textarea
                  value={followUpForm.followUpRemark}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, followUpRemark: e.target.value }))}
                  className="input"
                  rows="3"
                  placeholder="请输入跟进情况"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowFollowUpModal(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
