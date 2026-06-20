import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

const badReviewReasonLabels = {
  price_issue: '价格问题',
  service_quality: '服务质量',
  technician_attitude: '师傅态度',
  timing_issue: '时效问题',
  communication_issue: '沟通问题',
  other: '其他',
  uncategorized: '未分类'
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

const actionLabels = {
  create: '创建',
  update: '更新',
  delete: '删除',
  assign: '派单',
  status_change: '状态变更',
  reschedule: '改约',
  refund: '退款',
  login: '登录',
  restore: '还原'
};

export default function Satisfaction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
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
    visitStatus: 'all',
    followUpStatus: 'all'
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
        pageSize: 200
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

  const filterData = useMemo(() => {
    let result = data || [];
    
    if (filters.overallRating === 'good') {
      result = result.filter(s => s.overallRating >= 4);
    } else if (filters.overallRating === 'medium') {
      result = result.filter(s => s.overallRating === 3);
    } else if (filters.overallRating === 'bad') {
      result = result.filter(s => s.overallRating <= 2);
    }
    
    if (filters.visitStatus !== 'all') {
      result = result.filter(s => s.visitStatus === filters.visitStatus);
    }
    if (filters.followUpStatus !== 'all') {
      result = result.filter(s => s.followUpStatus === filters.followUpStatus);
    }
    
    return result;
  }, [data, filters]);

  const stats = useMemo(() => {
    const d = filterData;
    const badReviews = d.filter(s => s.overallRating <= 2);
    const goodReviews = d.filter(s => s.overallRating >= 4);
    const avgRating = d.length > 0 
      ? (d.reduce((sum, s) => sum + s.overallRating, 0) / d.length).toFixed(1)
      : 0;
    const goodRate = d.length > 0 
      ? ((goodReviews.length / d.length) * 100).toFixed(1)
      : 0;
    const notFollowedBadReviews = badReviews.filter(s => 
      s.followUpStatus === 'not_followed' || s.followUpStatus === 'pending'
    );
    const notVisitedBadReviews = badReviews.filter(s => 
      s.visitStatus === 'not_visited' || s.visitStatus === 'pending'
    );
    
    return {
      total: d.length,
      avgRating,
      goodRate,
      badCount: badReviews.length,
      goodCount: goodReviews.length,
      notFollowedBadReviews,
      notVisitedBadReviews
    };
  }, [filterData]);

  const storeAnalysis = useMemo(() => {
    const map = new Map();
    filterData.forEach(s => {
      const key = s.store || '未分配门店';
      if (!map.has(key)) {
        map.set(key, { 
          store: key, 
          total: 0, 
          avgRating: 0, 
          totalRating: 0,
          badCount: 0, 
          goodCount: 0, 
          notFollowedBad: 0,
          csMap: new Map()
        });
      }
      const entry = map.get(key);
      entry.total++;
      entry.totalRating += s.overallRating;
      if (s.overallRating <= 2) {
        entry.badCount++;
        if (s.followUpStatus === 'not_followed' || s.followUpStatus === 'pending') {
          entry.notFollowedBad++;
        }
      }
      if (s.overallRating >= 4) entry.goodCount++;
      
      const csName = s.customerService || '未分配客服';
      if (!entry.csMap.has(csName)) {
        entry.csMap.set(csName, {
          cs: csName,
          total: 0,
          totalRating: 0,
          badCount: 0,
          goodCount: 0,
          notFollowedBad: 0
        });
      }
      const csEntry = entry.csMap.get(csName);
      csEntry.total++;
      csEntry.totalRating += s.overallRating;
      if (s.overallRating <= 2) {
        csEntry.badCount++;
        if (s.followUpStatus === 'not_followed' || s.followUpStatus === 'pending') {
          csEntry.notFollowedBad++;
        }
      }
      if (s.overallRating >= 4) csEntry.goodCount++;
    });
    
    const result = [];
    map.forEach((entry, key) => {
      const csList = [];
      entry.csMap.forEach((csEntry) => {
        csList.push({
          ...csEntry,
          avgRating: csEntry.total > 0 ? (csEntry.totalRating / csEntry.total).toFixed(1) : 0,
          goodRate: csEntry.total > 0 ? ((csEntry.goodCount / csEntry.total) * 100).toFixed(1) : 0
        });
      });
      result.push({
        ...entry,
        avgRating: entry.total > 0 ? (entry.totalRating / entry.total).toFixed(1) : 0,
        goodRate: entry.total > 0 ? ((entry.goodCount / entry.total) * 100).toFixed(1) : 0,
        csList: csList.sort((a, b) => b.total - a.total)
      });
    });
    return result.sort((a, b) => b.total - a.total);
  }, [filterData]);

  const dateAnalysis = useMemo(() => {
    const map = new Map();
    filterData.forEach(s => {
      const key = dayjs(s.createdAt).format('YYYY-MM-DD');
      if (!map.has(key)) {
        map.set(key, { 
          date: key, 
          total: 0, 
          totalRating: 0,
          badCount: 0, 
          goodCount: 0, 
          notFollowedBad: 0,
          notVisitedBad: 0,
          hourMap: new Map()
        });
      }
      const entry = map.get(key);
      entry.total++;
      entry.totalRating += s.overallRating;
      if (s.overallRating <= 2) {
        entry.badCount++;
        if (s.followUpStatus === 'not_followed' || s.followUpStatus === 'pending') {
          entry.notFollowedBad++;
        }
        if (s.visitStatus === 'not_visited' || s.visitStatus === 'pending') {
          entry.notVisitedBad++;
        }
      }
      if (s.overallRating >= 4) entry.goodCount++;
      
      const hour = dayjs(s.createdAt).format('HH');
      if (!entry.hourMap.has(hour)) {
        entry.hourMap.set(hour, 0);
      }
      entry.hourMap.set(hour, entry.hourMap.get(hour) + 1);
    });
    
    const result = [];
    map.forEach((entry) => {
      result.push({
        ...entry,
        avgRating: entry.total > 0 ? (entry.totalRating / entry.total).toFixed(1) : 0,
        goodRate: entry.total > 0 ? ((entry.goodCount / entry.total) * 100).toFixed(1) : 0,
        peakHour: entry.hourMap.size > 0 
          ? [...entry.hourMap.entries()].sort((a, b) => b[1] - a[1])[0][0] + ':00'
          : '-'
      });
    });
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [filterData]);

  const badReviewAnalysis = useMemo(() => {
    const badReviews = filterData.filter(s => s.overallRating <= 2);
    const reasonMap = new Map();
    const notVisitedReasonMap = new Map();
    
    badReviews.forEach(s => {
      const reason = s.badReviewReason || 'uncategorized';
      if (!reasonMap.has(reason)) {
        reasonMap.set(reason, { 
          reason, 
          reasonLabel: badReviewReasonLabels[reason] || reason,
          total: 0, 
          notFollowed: 0,
          stores: new Set(),
          css: new Set(),
          technicians: new Set(),
          examples: []
        });
      }
      const entry = reasonMap.get(reason);
      entry.total++;
      if (s.followUpStatus === 'not_followed' || s.followUpStatus === 'pending') {
        entry.notFollowed++;
      }
      if (s.visitStatus === 'not_visited' || s.visitStatus === 'pending') {
        if (!notVisitedReasonMap.has(reason)) {
          notVisitedReasonMap.set(reason, {
            reason,
            reasonLabel: badReviewReasonLabels[reason] || reason,
            count: 0,
            reasonDetail: s.badReviewDetail || ''
          });
        }
        notVisitedReasonMap.get(reason).count++;
      }
      if (s.store) entry.stores.add(s.store);
      if (s.customerService) entry.css.add(s.customerService);
      if (s.technicianName) entry.technicians.add(s.technicianName);
      if (entry.examples.length < 3) {
        entry.examples.push({
          orderNo: s.orderNo,
          customerName: s.customerName,
          comment: s.negativeComments || s.badReviewDetail || '(无具体描述)',
          followUpStatus: s.followUpStatus,
          visitStatus: s.visitStatus
        });
      }
    });
    
    const reasonList = [];
    reasonMap.forEach((entry) => {
      reasonList.push({
        ...entry,
        stores: [...entry.stores],
        css: [...entry.css],
        technicians: [...entry.technicians],
        percentage: badReviews.length > 0 
          ? ((entry.total / badReviews.length) * 100).toFixed(1)
          : 0
      });
    });
    
    const notVisitedList = [];
    notVisitedReasonMap.forEach((entry) => {
      notVisitedList.push(entry);
    });
    
    return {
      totalBadReviews: badReviews.length,
      reasonList: reasonList.sort((a, b) => b.total - a.total),
      notVisitedList: notVisitedList.sort((a, b) => b.count - a.count),
      totalNotVisited: badReviews.filter(s => 
        s.visitStatus === 'not_visited' || s.visitStatus === 'pending'
      ).length,
      totalNotFollowed: badReviews.filter(s => 
        s.followUpStatus === 'not_followed' || s.followUpStatus === 'pending'
      ).length
    };
  }, [filterData]);

  const renderStars = (rating) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <AdminLayout title="售后满意">
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评分筛选</label>
              <select
                value={filters.overallRating}
                onChange={(e) => setFilters(prev => ({ ...prev, overallRating: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                style={{ width: '140px' }}
              >
                <option value="all">全部评分</option>
                <option value="good">好评(4-5星)</option>
                <option value="medium">中评(3星)</option>
                <option value="bad">差评(1-2星)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">回访状态</label>
              <select
                value={filters.visitStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, visitStatus: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                style={{ width: '130px' }}
              >
                <option value="all">全部</option>
                <option value="not_visited">未回访</option>
                <option value="pending">待回访</option>
                <option value="visited">已回访</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">门店</label>
              <input
                type="text"
                placeholder="门店名称"
                value={filters.store}
                onChange={(e) => setFilters(prev => ({ ...prev, store: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                style={{ width: '130px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客服</label>
              <input
                type="text"
                placeholder="客服姓名"
                value={filters.customerService}
                onChange={(e) => setFilters(prev => ({ ...prev, customerService: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                style={{ width: '130px' }}
              />
            </div>
            <button onClick={loadData} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              查询
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="card p-5">
            <p className="text-gray-500 text-xs">评价总数</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-xs">平均评分</p>
            <div className="flex items-center mt-1">
              <span className="text-3xl font-bold text-yellow-500">{stats.avgRating}</span>
              <span className="text-gray-400 text-sm ml-1">/5</span>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-xs">好评率</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.goodRate}%</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-xs">差评数</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.badCount}</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-xs">差评未回访</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.notVisitedBadReviews.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-xs">差评未跟进</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{stats.notFollowedBadReviews.length}</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'list', label: '评价列表' },
            { id: 'store', label: '门店客服拆分', badge: storeAnalysis.length },
            { id: 'date', label: '日期维度拆分', badge: dateAnalysis.length },
            { id: 'reason', label: '差评未回访原因', badge: badReviewAnalysis.totalNotVisited }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {activeTab === 'list' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">评价列表</h3>
              <div className="text-sm text-gray-500">
                差评 <span className="text-red-600 font-medium">{stats.badCount}</span> 条 · 
                未回访 <span className="text-orange-600 font-medium">{stats.notVisitedBadReviews.length}</span> 条
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : filterData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">暂无数据</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filterData.map((item) => (
                  <div key={item._id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => loadDetail(item._id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium text-blue-600">{item.orderNo}</span>
                          {renderStars(item.overallRating)}
                          {item.overallRating <= 2 && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              差评
                            </span>
                          )}
                          {(item.visitStatus === 'not_visited' || item.visitStatus === 'pending') && item.overallRating <= 2 && (
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full animate-pulse">
                              ⚠ 未回访
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                          <span>客户：{item.customerName}</span>
                          <span>师傅：{item.technicianName || '-'}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">客服：{item.customerService || '-'}</span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">门店：{item.store || '-'}</span>
                          <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full block ${
                          item.followUpStatus === 'resolved' ? 'bg-green-100 text-green-700' :
                          item.followUpStatus === 'not_followed' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          跟进：{followUpStatusLabels[item.followUpStatus]}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full block ${
                          item.visitStatus === 'visited' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          回访：{visitStatusLabels[item.visitStatus]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-4">
            {storeAnalysis.length === 0 ? (
              <div className="card p-12 text-center text-gray-500">暂无门店数据</div>
            ) : storeAnalysis.map((store) => (
              <div key={store.store} className="card overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">{store.store}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">共 {store.total} 条评价</p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">平均分：</span>
                        <span className="text-xl font-bold text-yellow-500">{store.avgRating}</span>
                        <span className="text-gray-400">/5</span>
                      </div>
                      <div>
                        <span className="text-gray-500">好评率：</span>
                        <span className="text-xl font-bold text-green-600">{store.goodRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">差评：</span>
                        <span className="text-xl font-bold text-red-600">{store.badCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">差评未跟进：</span>
                        <span className={`text-xl font-bold ${store.notFollowedBad > 0 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
                          {store.notFollowedBad}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {store.csList.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客服姓名</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">评价数</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">平均分</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">好评率</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">好评</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">差评</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">差评未跟进</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {store.csList.map((cs) => (
                          <tr key={cs.cs} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-medium text-gray-800">{cs.cs}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">{cs.total}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-bold ${
                                parseFloat(cs.avgRating) >= 4.5 ? 'text-green-600' :
                                parseFloat(cs.avgRating) >= 3.5 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {cs.avgRating}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 rounded-full" 
                                    style={{ width: `${cs.goodRate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-600">{cs.goodRate}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{cs.goodCount}</td>
                            <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{cs.badCount}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                cs.notFollowedBad > 0 
                                  ? 'bg-red-100 text-red-700 animate-pulse' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {cs.notFollowedBad > 0 ? '⚠ ' : ''}{cs.notFollowedBad}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'date' && (
          <div className="card overflow-hidden">
            {dateAnalysis.length === 0 ? (
              <div className="p-12 text-center text-gray-500">暂无日期数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">评价数</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">平均分</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">好评率</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">好评</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">差评</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">差评未回访</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">差评未跟进</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">高峰时段</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dateAnalysis.map((d) => (
                      <tr key={d.date} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-gray-800">{d.date}</span>
                          <span className="ml-2 text-xs text-gray-400">
                            {dayjs(d.date).format('ddd')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-600">{d.total}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${
                            parseFloat(d.avgRating) >= 4.5 ? 'text-green-600' :
                            parseFloat(d.avgRating) >= 3.5 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {d.avgRating}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full" 
                                style={{ width: `${d.goodRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600 w-12">{d.goodRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{d.goodCount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${d.badCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {d.badCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            d.notVisitedBad > 0 ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {d.notVisitedBad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            d.notFollowedBad > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {d.notFollowedBad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{d.peakHour}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reason' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-5 bg-red-50 border-red-200">
                <p className="text-red-600 text-sm font-medium">差评总数</p>
                <p className="text-3xl font-bold text-red-700 mt-1">{badReviewAnalysis.totalBadReviews}</p>
              </div>
              <div className="card p-5 bg-orange-50 border-orange-200">
                <p className="text-orange-600 text-sm font-medium">差评未回访</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{badReviewAnalysis.totalNotVisited}</p>
              </div>
              <div className="card p-5 bg-pink-50 border-pink-200">
                <p className="text-pink-600 text-sm font-medium">差评未跟进</p>
                <p className="text-3xl font-bold text-pink-700 mt-1">{badReviewAnalysis.totalNotFollowed}</p>
              </div>
              <div className="card p-5 bg-gray-50 border-gray-200">
                <p className="text-gray-600 text-sm font-medium">差评原因分类</p>
                <p className="text-3xl font-bold text-gray-700 mt-1">{badReviewAnalysis.reasonList.length}</p>
              </div>
            </div>

            {badReviewAnalysis.notVisitedList.length > 0 && (
              <div className="card p-5 border-orange-300 bg-orange-50/50">
                <h3 className="font-bold text-orange-800 mb-4 flex items-center">
                  <span className="mr-2">⚠️</span>
                  未回访差评原因分布（需优先处理）
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {badReviewAnalysis.notVisitedList.map((item) => (
                    <div key={item.reason} className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{item.reasonLabel}</span>
                        <span className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full font-bold animate-pulse">
                          {item.count} 单
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all" 
                          style={{ 
                            width: `${badReviewAnalysis.totalNotVisited > 0 
                              ? (item.count / badReviewAnalysis.totalNotVisited) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {badReviewAnalysis.reasonList.length === 0 ? (
                <div className="card p-12 text-center text-gray-500">暂无差评数据</div>
              ) : badReviewAnalysis.reasonList.map((reason) => (
                <div key={reason.reason} className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-gray-800">{reason.reasonLabel}</h4>
                          <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full font-bold">
                            {reason.total} 条 ({reason.percentage}%)
                          </span>
                          {reason.notFollowed > 0 && (
                            <span className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full font-bold animate-pulse">
                              未跟进 {reason.notFollowed} 条
                            </span>
                          )}
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                          <div 
                            className="h-full bg-red-500 rounded-full" 
                            style={{ width: `${reason.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      {reason.stores.length > 0 && (
                        <div>
                          <span className="text-gray-500">涉及门店：</span>
                          {reason.stores.map((s, i) => (
                            <span key={i} className="ml-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {reason.css.length > 0 && (
                        <div>
                          <span className="text-gray-500">对应客服：</span>
                          {reason.css.map((s, i) => (
                            <span key={i} className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {reason.technicians.length > 0 && (
                        <div>
                          <span className="text-gray-500">对应师傅：</span>
                          {reason.technicians.map((s, i) => (
                            <span key={i} className="ml-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {reason.examples.length > 0 && (
                    <div className="p-5 bg-gray-50">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">典型案例：</h5>
                      <div className="space-y-2">
                        {reason.examples.map((ex, i) => (
                          <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-blue-600 text-sm">{ex.orderNo}</span>
                                <span className="text-xs text-gray-500">{ex.customerName}</span>
                              </div>
                              <p className="text-sm text-gray-600">{ex.comment}</p>
                            </div>
                            <div className="ml-4 space-y-1 flex-shrink-0">
                              <span className={`px-2 py-0.5 text-xs rounded-full block text-center ${
                                ex.followUpStatus === 'resolved' ? 'bg-green-100 text-green-700' :
                                ex.followUpStatus === 'not_followed' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {followUpStatusLabels[ex.followUpStatus]}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full block text-center ${
                                ex.visitStatus === 'visited' ? 'bg-green-100 text-green-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {visitStatusLabels[ex.visitStatus]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">满意度详情 - {selectedItem.orderNo}</h3>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="text-center pb-4 border-b border-gray-200">
                <div className="text-4xl mb-2">{renderStars(selectedItem.overallRating)}</div>
                <p className="text-2xl font-bold text-gray-800">{selectedItem.overallRating} 分</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">服务质量</p>
                  <p className="text-lg font-medium">{selectedItem.serviceQuality} 分</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">师傅态度</p>
                  <p className="text-lg font-medium">{selectedItem.technicianAttitude} 分</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">价格满意度</p>
                  <p className="text-lg font-medium">{selectedItem.priceSatisfaction} 分</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">响应速度</p>
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
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">师傅：</span><span className="text-gray-800">{selectedItem.technicianName || '-'}</span></div>
                <div><span className="text-gray-500">客服：</span><span className="text-gray-800">{selectedItem.customerService || '-'}</span></div>
                <div><span className="text-gray-500">门店：</span><span className="text-gray-800">{selectedItem.store || '-'}</span></div>
                <div><span className="text-gray-500">客户：</span><span className="text-gray-800">{selectedItem.customerName || '-'}</span></div>
              </div>
              
              {selectedItem.overallRating <= 2 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-3">差评原因分析</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-600 w-20 flex-shrink-0">原因分类：</span>
                      <span className="font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded">
                        {selectedItem.badReviewReason ? badReviewReasonLabels[selectedItem.badReviewReason] : '未分类'}
                      </span>
                    </div>
                    {selectedItem.badReviewDetail && (
                      <div className="flex">
                        <span className="text-gray-600 w-20 flex-shrink-0">详细说明：</span>
                        <span>{selectedItem.badReviewDetail}</span>
                      </div>
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  跟进处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showFollowUpModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">跟进处理</h3>
              <button onClick={() => setShowFollowUpModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            
            <form onSubmit={handleFollowUp} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跟进状态</label>
                <select
                  value={followUpForm.followUpStatus}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, followUpStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">差评原因分类</label>
                    <select
                      value={followUpForm.badReviewReason}
                      onChange={(e) => setFollowUpForm(prev => ({ ...prev, badReviewReason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    >
                      <option value="">请选择</option>
                      {Object.entries(badReviewReasonLabels).filter(([k]) => k !== 'uncategorized').map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">差评详情</label>
                    <textarea
                      value={followUpForm.badReviewDetail}
                      onChange={(e) => setFollowUpForm(prev => ({ ...prev, badReviewDetail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      rows="2"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跟进备注</label>
                <textarea
                  value={followUpForm.followUpRemark}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, followUpRemark: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  rows="3"
                  placeholder="请输入跟进内容"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  确认提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
