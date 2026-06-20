const { Order, Satisfaction, Refund, RescheduleRecord, Part, Technician, Service } = require('../models');
const moment = require('moment');

async function getPriceTransparencyReport(req, res) {
  try {
    const { 
      startDate, 
      endDate, 
      store, 
      customerService,
      technicianId,
      applianceType,
      page = 1,
      pageSize = 20
    } = req.query;
    
    const query = {
      status: { $in: ['completed', 'in_progress', 'assigned'] }
    };
    
    if (store) {
      query.store = store;
    }
    
    if (customerService) {
      query.customerService = customerService;
    }
    
    if (technicianId) {
      query.technicianId = technicianId;
    }
    
    if (applianceType && applianceType !== 'all') {
      query.applianceType = applianceType;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('orderNo customerName applianceType appointmentTime status baseAmount serviceFee technicianFee partsAmount totalAmount additionalFees discountAmount pricingBreakdown technicianName store customerService createdAt'),
      Order.countDocuments(query)
    ]);
    
    const summary = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          totalBaseAmount: { $sum: '$baseAmount' },
          totalPartsAmount: { $sum: '$partsAmount' },
          totalServiceFee: { $sum: '$serviceFee' },
          totalTechnicianFee: { $sum: '$technicianFee' },
          totalDiscount: { $sum: '$discountAmount' }
        }
      }
    ]);
    
    const priceComposition = summary[0] ? {
      baseService: summary[0].totalBaseAmount || 0,
      parts: summary[0].totalPartsAmount || 0,
      serviceFee: summary[0].totalServiceFee || 0,
      technicianFee: summary[0].totalTechnicianFee || 0,
      discount: summary[0].totalDiscount || 0,
      total: summary[0].totalRevenue || 0
    } : {
      baseService: 0,
      parts: 0,
      serviceFee: 0,
      technicianFee: 0,
      discount: 0,
      total: 0
    };
    
    res.json({
      success: true,
      data: {
        orders,
        summary: {
          totalOrders: summary[0]?.totalOrders || 0,
          totalRevenue: summary[0]?.totalRevenue || 0,
          avgOrderValue: summary[0]?.avgOrderValue || 0
        },
        priceComposition,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('价格透明报表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取价格透明报表失败',
      error: error.message
    });
  }
}

async function getSatisfactionReport(req, res) {
  try {
    const { 
      startDate, 
      endDate, 
      store, 
      customerService,
      technicianId,
      groupBy = 'overall'
    } = req.query;
    
    const query = {};
    
    if (store) {
      query.store = store;
    }
    
    if (customerService) {
      query.customerService = customerService;
    }
    
    if (technicianId) {
      query.technicianId = technicianId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const [totalSurveys, avgRating, ratingDistribution] = await Promise.all([
      Satisfaction.countDocuments(query),
      Satisfaction.aggregate([
        { $match: query },
        { $group: { _id: null, avgOverall: { $avg: '$overallRating' } } }
      ]),
      Satisfaction.aggregate([
        { $match: query },
        { $group: { _id: '$overallRating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ])
    ]);
    
    let groupData = [];
    
    switch (groupBy) {
      case 'store':
        groupData = await Satisfaction.aggregate([
          { $match: query },
          { 
            $group: { 
              _id: '$store', 
              count: { $sum: 1 },
              avgRating: { $avg: '$overallRating' },
              goodCount: { $sum: { $cond: [{ $gte: ['$overallRating', 4] }, 1, 0] } },
              badCount: { $sum: { $cond: [{ $lte: ['$overallRating', 2] }, 1, 0] } }
            } 
          },
          { $sort: { count: -1 } }
        ]);
        break;
        
      case 'customerService':
        groupData = await Satisfaction.aggregate([
          { $match: query },
          { 
            $group: { 
              _id: '$customerService', 
              count: { $sum: 1 },
              avgRating: { $avg: '$overallRating' },
              goodCount: { $sum: { $cond: [{ $gte: ['$overallRating', 4] }, 1, 0] } },
              badCount: { $sum: { $cond: [{ $lte: ['$overallRating', 2] }, 1, 0] } }
            } 
          },
          { $sort: { count: -1 } }
        ]);
        break;
        
      case 'technician':
        groupData = await Satisfaction.aggregate([
          { $match: query },
          { 
            $group: { 
              _id: '$technicianName', 
              count: { $sum: 1 },
              avgRating: { $avg: '$overallRating' },
              goodCount: { $sum: { $cond: [{ $gte: ['$overallRating', 4] }, 1, 0] } },
              badCount: { $sum: { $cond: [{ $lte: ['$overallRating', 2] }, 1, 0] } }
            } 
          },
          { $sort: { count: -1 } }
        ]);
        break;
        
      case 'date':
        groupData = await Satisfaction.aggregate([
          { $match: query },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              count: { $sum: 1 },
              avgRating: { $avg: '$overallRating' },
              goodCount: { $sum: { $cond: [{ $gte: ['$overallRating', 4] }, 1, 0] } },
              badCount: { $sum: { $cond: [{ $lte: ['$overallRating', 2] }, 1, 0] } }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        groupData = groupData.map(item => ({
          ...item,
          date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
        }));
        break;
        
      case 'badReviewReason':
        groupData = await Satisfaction.aggregate([
          { $match: { ...query, overallRating: { $lte: 2 } } },
          { 
            $group: { 
              _id: '$badReviewReason', 
              count: { $sum: 1 },
              notFollowedCount: { $sum: { $cond: [{ $eq: ['$followUpStatus', 'not_followed'] }, 1, 0] } }
            } 
          },
          { $sort: { count: -1 } }
        ]);
        break;
        
      case 'visitStatus':
        groupData = await Satisfaction.aggregate([
          { $match: query },
          { 
            $group: { 
              _id: '$visitStatus', 
              count: { $sum: 1 }
            } 
          },
          { $sort: { count: -1 } }
        ]);
        break;
        
      case 'followUpStatus':
        groupData = await Satisfaction.aggregate([
          { $match: { ...query, overallRating: { $lte: 2 } } },
          { 
            $group: { 
              _id: '$followUpStatus', 
              count: { $sum: 1 }
            } 
          },
          { $sort: { count: -1 } }
        ]);
        break;
    }
    
    const badReviewStats = {
      total: ratingDistribution.filter(r => r._id <= 2).reduce((sum, r) => sum + r.count, 0),
      byReason: await Satisfaction.aggregate([
        { $match: { ...query, overallRating: { $lte: 2 } } },
        {
          $group: {
            _id: '$badReviewReason',
            count: { $sum: 1 },
            notFollowed: {
              $sum: {
                $cond: [
                  { $in: ['$followUpStatus', ['not_followed', 'pending']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ])
    };
    
    res.json({
      success: true,
      data: {
        summary: {
          totalSurveys,
          avgOverallRating: avgRating[0]?.avgOverall || 0,
          goodRate: totalSurveys > 0 
            ? (ratingDistribution.filter(r => r._id >= 4).reduce((sum, r) => sum + r.count, 0) / totalSurveys * 100).toFixed(1) 
            : 0
        },
        ratingDistribution: ratingDistribution.map(r => ({
          rating: r._id,
          count: r.count,
          percentage: totalSurveys > 0 ? (r.count / totalSurveys * 100).toFixed(1) : 0
        })),
        badReviewStats,
        groupData,
        groupBy
      }
    });
  } catch (error) {
    console.error('满意度报表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取满意度报表失败',
      error: error.message
    });
  }
}

async function getSalesReport(req, res) {
  try {
    const { 
      startDate, 
      endDate, 
      store, 
      customerService,
      groupBy = 'day'
    } = req.query;
    
    const query = {
      status: { $in: ['completed'] }
    };
    
    if (store) {
      query.store = store;
    }
    
    if (customerService) {
      query.customerService = customerService;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    let groupId;
    switch (groupBy) {
      case 'day':
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'store':
        groupId = '$store';
        break;
      case 'customerService':
        groupId = '$customerService';
        break;
      case 'applianceType':
        groupId = '$applianceType';
        break;
      default:
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
    
    const salesData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupId,
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          partsRevenue: { $sum: '$partsAmount' },
          serviceRevenue: { $sum: '$baseAmount' },
          technicianFees: { $sum: '$technicianFee' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const totalStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    const applianceStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$applianceType',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: totalStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        salesData,
        applianceStats,
        groupBy
      }
    });
  } catch (error) {
    console.error('销售报表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取销售报表失败',
      error: error.message
    });
  }
}

async function getRefundRescheduleReport(req, res) {
  try {
    const { startDate, endDate, store, reasonType } = req.query;
    
    const refundQuery = {};
    const rescheduleQuery = {};
    
    if (startDate || endDate) {
      refundQuery.createdAt = {};
      rescheduleQuery.createdAt = {};
      if (startDate) {
        refundQuery.createdAt.$gte = new Date(startDate);
        rescheduleQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        refundQuery.createdAt.$lte = new Date(endDate);
        rescheduleQuery.createdAt.$lte = new Date(endDate);
      }
    }
    
    const [
      totalRefunds,
      refundAmount,
      refundsByReason,
      refundsByStatus,
      totalReschedules,
      reschedulesByReason
    ] = await Promise.all([
      Refund.countDocuments(refundQuery),
      Refund.aggregate([
        { $match: refundQuery },
        { $group: { _id: null, total: { $sum: '$refundAmount' } } }
      ]),
      Refund.aggregate([
        { $match: refundQuery },
        { $group: { _id: '$refundReason', count: { $sum: 1 }, amount: { $sum: '$refundAmount' } } },
        { $sort: { count: -1 } }
      ]),
      Refund.aggregate([
        { $match: refundQuery },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$refundAmount' } } }
      ]),
      RescheduleRecord.countDocuments(rescheduleQuery),
      RescheduleRecord.aggregate([
        { $match: rescheduleQuery },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        refund: {
          totalCount: totalRefunds,
          totalAmount: refundAmount[0]?.total || 0,
          byReason: refundsByReason,
          byStatus: refundsByStatus
        },
        reschedule: {
          totalCount: totalReschedules,
          byReason: reschedulesByReason
        }
      }
    });
  } catch (error) {
    console.error('退款改约报表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取退款改约报表失败',
      error: error.message
    });
  }
}

async function getTechnicianPerformanceReport(req, res) {
  try {
    const { startDate, endDate, store, technicianId } = req.query;
    
    const orderQuery = {
      status: 'completed'
    };
    
    if (store) {
      orderQuery.store = store;
    }
    
    if (technicianId) {
      orderQuery.technicianId = technicianId;
    }
    
    if (startDate || endDate) {
      orderQuery.actualEndTime = {};
      if (startDate) {
        orderQuery.actualEndTime.$gte = new Date(startDate);
      }
      if (endDate) {
        orderQuery.actualEndTime.$lte = new Date(endDate);
      }
    }
    
    const techPerformance = await Order.aggregate([
      { $match: { ...orderQuery, technicianId: { $exists: true } } },
      {
        $group: {
          _id: '$technicianId',
          technicianName: { $first: '$technicianName' },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          totalPartsRevenue: { $sum: '$partsAmount' }
        }
      },
      { $sort: { orderCount: -1 } }
    ]);
    
    const technicians = await Technician.find({}).select('name rating level skillCategories store');
    const techMap = new Map(technicians.map(t => [t._id.toString(), t]));
    
    const satisfactionQuery = {};
    if (startDate || endDate) {
      satisfactionQuery.createdAt = {};
      if (startDate) satisfactionQuery.createdAt.$gte = new Date(startDate);
      if (endDate) satisfactionQuery.createdAt.$lte = new Date(endDate);
    }
    
    const satisfactionByTech = await Satisfaction.aggregate([
      { $match: { ...satisfactionQuery, technicianId: { $exists: true } } },
      {
        $group: {
          _id: '$technicianId',
          avgRating: { $avg: '$overallRating' },
          surveyCount: { $sum: 1 },
          goodCount: { $sum: { $cond: [{ $gte: ['$overallRating', 4] }, 1, 0] } }
        }
      }
    ]);
    const satisfactionMap = new Map(satisfactionByTech.map(s => [s._id.toString(), s]));
    
    const performanceData = techPerformance.map(perf => {
      const techId = perf._id.toString();
      const techInfo = techMap.get(techId);
      const satisfaction = satisfactionMap.get(techId);
      
      return {
        technicianId: perf._id,
        technicianName: perf.technicianName,
        level: techInfo?.level || '',
        rating: techInfo?.rating || 0,
        store: techInfo?.store || '',
        orderCount: perf.orderCount,
        totalRevenue: perf.totalRevenue,
        avgOrderValue: perf.avgOrderValue,
        partsRevenue: perf.totalPartsRevenue,
        satisfactionAvg: satisfaction?.avgRating || 0,
        satisfactionCount: satisfaction?.surveyCount || 0,
        goodRate: satisfaction && satisfaction.surveyCount > 0
          ? ((satisfaction.goodCount / satisfaction.surveyCount) * 100).toFixed(1)
          : 0
      };
    });
    
    res.json({
      success: true,
      data: {
        technicians: performanceData,
        summary: {
          totalTechnicians: performanceData.length,
          totalOrders: performanceData.reduce((sum, t) => sum + t.orderCount, 0),
          totalRevenue: performanceData.reduce((sum, t) => sum + t.totalRevenue, 0)
        }
      }
    });
  } catch (error) {
    console.error('师傅业绩报表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取师傅业绩报表失败',
      error: error.message
    });
  }
}

async function getDashboardStats(req, res) {
  try {
    const { store } = req.query;
    
    const today = moment().startOf('day');
    const weekStart = moment().startOf('week');
    const monthStart = moment().startOf('month');
    
    const baseQuery = {};
    if (store) {
      baseQuery.store = store;
    }
    
    const [
      todayOrders,
      todayRevenue,
      pendingOrders,
      inProgressOrders,
      todayCompleted,
      totalTechnicians,
      lowStockParts,
      monthlyRevenue,
      refundPending
    ] = await Promise.all([
      Order.countDocuments({ ...baseQuery, createdAt: { $gte: today.toDate() } }),
      Order.aggregate([
        { $match: { ...baseQuery, status: 'completed', actualEndTime: { $gte: today.toDate() } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ ...baseQuery, status: 'pending' }),
      Order.countDocuments({ ...baseQuery, status: 'in_progress' }),
      Order.countDocuments({ ...baseQuery, status: 'completed', actualEndTime: { $gte: today.toDate() } }),
      Technician.countDocuments({ status: { $in: ['on_duty', 'busy'] } }),
      Part.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] }, status: 'active' }),
      Order.aggregate([
        { $match: { ...baseQuery, status: 'completed', actualEndTime: { $gte: monthStart.toDate() } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Refund.countDocuments({ status: 'pending' })
    ]);
    
    const recentOrders = await Order.find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNo customerName applianceType status totalAmount appointmentTime technicianName createdAt');
    
    const recentSatisfaction = await Satisfaction.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNo overallRating technicianName customerName createdAt');
    
    res.json({
      success: true,
      data: {
        stats: {
          todayOrders,
          todayRevenue: todayRevenue[0]?.total || 0,
          pendingOrders,
          inProgressOrders,
          todayCompleted,
          totalTechnicians,
          lowStockParts,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          refundPending
        },
        recentOrders,
        recentSatisfaction
      }
    });
  } catch (error) {
    console.error('仪表盘统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取仪表盘统计失败',
      error: error.message
    });
  }
}

module.exports = {
  getPriceTransparencyReport,
  getSatisfactionReport,
  getSalesReport,
  getRefundRescheduleReport,
  getTechnicianPerformanceReport,
  getDashboardStats
};
