const VisitRecord = require('../models/VisitRecord');
const AdoptionApplication = require('../models/AdoptionApplication');
const { createFlowRecord } = require('../utils/flowRecord');
const { generateNo } = require('../utils/helpers');

const getVisitRecords = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      applicationId,
      petId,
      visitorId,
      visitType,
      overallStatus,
      startDate,
      endDate,
      sortBy = 'visitDate',
      sortOrder = -1
    } = req.query;

    const query = {};
    
    if (applicationId) query.applicationId = applicationId;
    if (petId) query.petId = petId;
    if (visitorId) query.visitorId = visitorId;
    if (visitType) query.visitType = visitType;
    if (overallStatus) query.overallStatus = overallStatus;
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }

    const records = await VisitRecord.find(query)
      .populate('applicationId', 'applicationNo status')
      .populate('visitorId', 'name role')
      .sort({ [sortBy]: parseInt(sortOrder) })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await VisitRecord.countDocuments(query);

    res.json({
      data: records,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Get visit records error:', error);
    res.status(500).json({ message: '获取回访记录失败' });
  }
};

const getVisitRecord = async (req, res) => {
  try {
    const record = await VisitRecord.findById(req.params.id)
      .populate('applicationId', 'applicationNo applicantName applicantPhone')
      .populate('visitorId', 'name role phone');

    if (!record) {
      return res.status(404).json({ message: '回访记录不存在' });
    }

    res.json({ data: record });
  } catch (error) {
    console.error('Get visit record error:', error);
    res.status(500).json({ message: '获取回访记录详情失败' });
  }
};

const createVisitRecord = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.body.applicationId);
    if (!application) {
      return res.status(404).json({ message: '领养申请不存在' });
    }

    const recordData = {
      ...req.body,
      recordNo: generateNo('VST'),
      applicationNo: application.applicationNo,
      petId: application.petId,
      petName: application.petName,
      applicantName: application.applicantName,
      createdBy: req.user._id
    };

    if (req.body.visitorId) {
      const { default: User } = await import('../models/User.js');
      const visitor = await User.findById(req.body.visitorId);
      if (visitor) {
        recordData.visitorName = visitor.name;
      }
    }

    const record = new VisitRecord(recordData);
    await record.save();

    await createFlowRecord({
      recordType: 'visit_record',
      relatedId: record._id,
      relatedNo: record.recordNo,
      action: 'create',
      actionLabel: '创建回访',
      afterData: record.toObject(),
      description: `创建回访记录：${application.applicantName} - ${req.body.visitType}`,
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.status(201).json({ data: record });
  } catch (error) {
    console.error('Create visit record error:', error);
    res.status(500).json({ message: '创建回访记录失败' });
  }
};

const updateVisitRecord = async (req, res) => {
  try {
    const record = await VisitRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: '回访记录不存在' });
    }

    const beforeData = record.toObject();
    const updateData = req.body;

    if (req.body.visitorId && req.body.visitorId !== record.visitorId?.toString()) {
      const { default: User } = await import('../models/User.js');
      const visitor = await User.findById(req.body.visitorId);
      if (visitor) {
        updateData.visitorName = visitor.name;
      }
    }

    const updatedRecord = await VisitRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    await createFlowRecord({
      recordType: 'visit_record',
      relatedId: record._id,
      relatedNo: record.recordNo,
      action: 'update',
      actionLabel: '更新回访',
      beforeData,
      afterData: updatedRecord.toObject(),
      description: '更新回访记录',
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.json({ data: updatedRecord });
  } catch (error) {
    console.error('Update visit record error:', error);
    res.status(500).json({ message: '更新回访记录失败' });
  }
};

const deleteVisitRecord = async (req, res) => {
  try {
    const record = await VisitRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ message: '回访记录不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete visit record error:', error);
    res.status(500).json({ message: '删除回访记录失败' });
  }
};

module.exports = {
  getVisitRecords,
  getVisitRecord,
  createVisitRecord,
  updateVisitRecord,
  deleteVisitRecord
};
