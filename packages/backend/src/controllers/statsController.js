const AdoptionApplication = require('../models/AdoptionApplication');
const Pet = require('../models/Pet');
const TrainingRecord = require('../models/TrainingRecord');
const VisitRecord = require('../models/VisitRecord');
const dayjs = require('dayjs');

const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

const getOverviewStats = async (req, res) => {
  try {
    const [totalPets, fosteringPets, adoptedPets, totalApplications, pendingApplications, approvedApplications] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: 'fostering' }),
      Pet.countDocuments({ status: 'adopted' }),
      AdoptionApplication.countDocuments(),
      AdoptionApplication.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      AdoptionApplication.countDocuments({ status: { $in: ['approved', 'completed'] } })
    ]);

    res.json({
      data: {
        totalPets,
        fosteringPets,
        adoptedPets,
        totalApplications,
        pendingApplications,
        approvedApplications
      }
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ message: '获取统计数据失败' });
  }
};

const getAdoptionStatsByTrainer = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (USE_MEMORY_DB) {
      const allApps = await AdoptionApplication.find({});
      let filteredApps = allApps;
      
      if (startDate || endDate) {
        filteredApps = allApps.filter(app => {
          const appDate = new Date(app.createdAt);
          if (startDate && appDate < new Date(startDate)) return false;
          if (endDate && appDate > new Date(endDate)) return false;
          return true;
        });
      }

      const groups = {};
      for (const app of filteredApps) {
        const trainerId = app.trainerId || 'none';
        const trainerName = app.trainerName || '未分配';
        const key = `${trainerId}_${trainerName}`;
        
        if (!groups[key]) {
          groups[key] = {
            trainerId,
            trainerName,
            total: 0,
            submitted: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            missingFieldCount: 0
          };
        }
        
        groups[key].total++;
        if (app.status === 'submitted') groups[key].submitted++;
        if (app.status === 'under_review') groups[key].under_review++;
        if (app.status === 'approved' || app.status === 'completed') groups[key].approved++;
        if (app.status === 'rejected') groups[key].rejected++;
        groups[key].missingFieldCount += (app.missingFields || []).length;
      }

      const stats = Object.values(groups).map(g => ({
        ...g,
        approvalRate: g.total > 0 ? Math.round((g.approved / g.total) * 100 * 100) / 100 : 0
      })).sort((a, b) => b.total - a.total);

      return res.json({ data: stats });
    }

    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const stats = await AdoptionApplication.aggregate([
      { $match: match },
      {
        $group: {
          _id: { trainerId: '$trainerId', trainerName: '$trainerName' },
          total: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
          },
          under_review: {
            $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $in: ['$status', ['approved', 'completed']] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          missingFieldCount: {
            $sum: { $size: { $ifNull: ['$missingFields', []] } }
          }
        }
      },
      {
        $project: {
          _id: 0,
          trainerId: '$_id.trainerId',
          trainerName: { $ifNull: ['$_id.trainerName', '未分配'] },
          total: 1,
          submitted: 1,
          under_review: 1,
          approved: 1,
          rejected: 1,
          missingFieldCount: 1,
          approvalRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$approved', '$total'] }, 100] }, 2] }
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({ data: stats });
  } catch (error) {
    console.error('Get adoption stats by trainer error:', error);
    res.status(500).json({ message: '获取训练师统计失败' });
  }
};

const getAdoptionStatsByDate = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'day' } = req.query;

    if (USE_MEMORY_DB) {
      const allApps = await AdoptionApplication.find({});
      let filteredApps = allApps;
      
      if (startDate || endDate) {
        filteredApps = allApps.filter(app => {
          const appDate = new Date(app.createdAt);
          if (startDate && appDate < new Date(startDate)) return false;
          if (endDate && appDate > new Date(endDate)) return false;
          return true;
        });
      } else {
        const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
        filteredApps = allApps.filter(app => new Date(app.createdAt) >= thirtyDaysAgo);
      }

      const groups = {};
      for (const app of filteredApps) {
        const date = new Date(app.createdAt);
        let dateKey;
        
        switch (granularity) {
          case 'month':
            dateKey = dayjs(date).format('YYYY-MM');
            break;
          case 'week':
            dateKey = dayjs(date).format('YYYY-wo');
            break;
          case 'day':
          default:
            dateKey = dayjs(date).format('YYYY-MM-DD');
        }
        
        if (!groups[dateKey]) {
          groups[dateKey] = {
            date: dateKey,
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0
          };
        }
        
        groups[dateKey].total++;
        if (app.status === 'approved' || app.status === 'completed') groups[dateKey].approved++;
        if (app.status === 'rejected') groups[dateKey].rejected++;
        if (app.status === 'submitted' || app.status === 'under_review') groups[dateKey].pending++;
      }

      const stats = Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
      return res.json({ data: stats });
    }

    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    } else {
      const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
      match.createdAt = { $gte: thirtyDaysAgo };
    }

    let dateFormat;
    let groupId;

    switch (granularity) {
      case 'month':
        dateFormat = '%Y-%m';
        groupId = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'week':
        dateFormat = '%Y-%U';
        groupId = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
        groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const stats = await AdoptionApplication.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $in: ['$status', ['approved', 'completed']] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_review']] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedStats = stats.map(item => ({
      date: item._id,
      total: item.total,
      approved: item.approved,
      rejected: item.rejected,
      pending: item.pending
    }));

    res.json({ data: formattedStats });
  } catch (error) {
    console.error('Get adoption stats by date error:', error);
    res.status(500).json({ message: '获取日期统计失败' });
  }
};

const getMissingFieldStats = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    if (status) {
      match.status = status;
    }

    const applications = await AdoptionApplication.find(match).select('missingFields applicationNo status');
    
    const fieldCountMap = {};
    let totalWithMissing = 0;

    for (const app of applications) {
      const missingFields = app.missingFields || [];
      if (missingFields.length > 0) {
        totalWithMissing++;
        for (const field of missingFields) {
          if (!fieldCountMap[field]) {
            fieldCountMap[field] = 0;
          }
          fieldCountMap[field]++;
        }
      }
    }

    const fieldLabels = {
      'applicantName': '申请人姓名',
      'applicantPhone': '申请人电话',
      'applicantIdCard': '身份证号',
      'applicantEmail': '电子邮箱',
      'applicantAddress': '居住地址',
      'housingType': '住房类型',
      'hasPetExperience': '养宠经验',
      'currentPets': '现有宠物',
      'familyMembers': '家庭成员',
      'hasChildren': '是否有孩子',
      'workSchedule': '工作时间',
      'monthlyBudget': '月度预算',
      'adoptionReason': '领养原因',
      'emergencyContact.name': '紧急联系人姓名',
      'emergencyContact.phone': '紧急联系人电话',
      'emergencyContact.relationship': '紧急联系人关系',
      'veterinaryInfo': '兽医信息'
    };

    const stats = Object.entries(fieldCountMap)
      .map(([field, count]) => ({
        field,
        label: fieldLabels[field] || field,
        count,
        percentage: applications.length > 0 
          ? Math.round((count / applications.length) * 100 * 100) / 100
          : 0
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      data: {
        totalApplications: applications.length,
        totalWithMissing,
        missingRate: applications.length > 0 
          ? Math.round((totalWithMissing / applications.length) * 100 * 100) / 100
          : 0,
        fields: stats
      }
    });
  } catch (error) {
    console.error('Get missing field stats error:', error);
    res.status(500).json({ message: '获取缺失字段统计失败' });
  }
};

const getTrainingStats = async (req, res) => {
  try {
    const { startDate, endDate, trainerId } = req.query;

    const match = {};
    if (startDate || endDate) {
      match.trainingDate = {};
      if (startDate) match.trainingDate.$gte = new Date(startDate);
      if (endDate) match.trainingDate.$lte = new Date(endDate);
    }
    if (trainerId) {
      match.trainerId = trainerId;
    }

    const stats = await TrainingRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$trainingType',
          count: { $sum: 1 },
          totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
          excellentCount: {
            $sum: { $cond: [{ $eq: ['$performance', 'excellent'] }, 1, 0] }
          },
          goodCount: {
            $sum: { $cond: [{ $eq: ['$performance', 'good'] }, 1, 0] }
          },
          averageCount: {
            $sum: { $cond: [{ $eq: ['$performance', 'average'] }, 1, 0] }
          },
          poorCount: {
            $sum: { $cond: [{ $eq: ['$performance', 'poor'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ data: stats });
  } catch (error) {
    console.error('Get training stats error:', error);
    res.status(500).json({ message: '获取训练统计失败' });
  }
};

const getVisitStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate || endDate) {
      match.visitDate = {};
      if (startDate) match.visitDate.$gte = new Date(startDate);
      if (endDate) match.visitDate.$lte = new Date(endDate);
    }

    const stats = await VisitRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$visitType',
          count: { $sum: 1 },
          excellentCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'excellent'] }, 1, 0] }
          },
          goodCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'good'] }, 1, 0] }
          },
          averageCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'average'] }, 1, 0] }
          },
          poorCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'poor'] }, 1, 0] }
          },
          needsAttentionCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'needs_attention'] }, 1, 0] }
          },
          followUpCount: {
            $sum: { $cond: [{ $eq: ['$followUpRequired', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ data: stats });
  } catch (error) {
    console.error('Get visit stats error:', error);
    res.status(500).json({ message: '获取回访统计失败' });
  }
};

module.exports = {
  getOverviewStats,
  getAdoptionStatsByTrainer,
  getAdoptionStatsByDate,
  getMissingFieldStats,
  getTrainingStats,
  getVisitStats
};
