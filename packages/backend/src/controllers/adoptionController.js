const AdoptionApplication = require('../models/AdoptionApplication');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { createFlowRecord } = require('../utils/flowRecord');
const { generateNo } = require('../utils/helpers');

const REQUIRED_FIELDS = [
  'applicantName',
  'applicantPhone',
  'applicantAddress',
  'housingType',
  'adoptionReason',
  'emergencyContact.name',
  'emergencyContact.phone'
];

const checkMissingFields = (data) => {
  const missing = [];
  
  const checkField = (fieldPath) => {
    const parts = fieldPath.split('.');
    let value = data;
    for (const part of parts) {
      value = value?.[part];
    }
    return value === undefined || value === null || value === '';
  };

  for (const field of REQUIRED_FIELDS) {
    if (checkField(field)) {
      missing.push(field);
    }
  }
  
  return missing;
};

const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      status,
      trainerId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query;

    const query = {};
    
    if (keyword) {
      query.$text = { $search: keyword };
    }
    if (status) {
      query.status = status;
    }
    if (trainerId) {
      query.trainerId = trainerId;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const applications = await AdoptionApplication.find(query)
      .populate('petId', 'name species breed status')
      .populate('trainerId', 'name role')
      .populate('reviewerId', 'name role')
      .sort({ [sortBy]: parseInt(sortOrder) })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await AdoptionApplication.countDocuments(query);

    res.json({
      data: applications,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: '获取领养申请列表失败' });
  }
};

const getApplication = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.params.id)
      .populate('petId', 'name species breed status photo')
      .populate('trainerId', 'name role phone')
      .populate('reviewerId', 'name role');

    if (!application) {
      return res.status(404).json({ message: '领养申请不存在' });
    }

    res.json({ data: application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: '获取领养申请详情失败' });
  }
};

const createApplication = async (req, res) => {
  try {
    const pet = await Pet.findById(req.body.petId);
    if (!pet) {
      return res.status(404).json({ message: '宠物不存在' });
    }

    const applicationData = {
      ...req.body,
      applicationNo: generateNo('ADP'),
      petNo: pet.petNo,
      petName: pet.name,
      status: 'draft',
      createdBy: req.user._id,
      updatedBy: req.user._id
    };

    if (req.body.trainerId) {
      const trainer = await User.findById(req.body.trainerId);
      if (trainer) {
        applicationData.trainerName = trainer.name;
      }
    }

    applicationData.missingFields = checkMissingFields(applicationData);

    const application = new AdoptionApplication(applicationData);
    await application.save();

    await createFlowRecord({
      recordType: 'adoption_application',
      relatedId: application._id,
      relatedNo: application.applicationNo,
      action: 'create',
      actionLabel: '创建申请',
      afterData: application.toObject(),
      description: `创建领养申请：${application.applicantName} - ${pet.name}`,
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.status(201).json({ data: application });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ message: '创建领养申请失败' });
  }
};

const updateApplication = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: '领养申请不存在' });
    }

    const beforeData = application.toObject();
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    if (req.body.trainerId && req.body.trainerId !== application.trainerId?.toString()) {
      const trainer = await User.findById(req.body.trainerId);
      if (trainer) {
        updateData.trainerName = trainer.name;
      }
    }

    if (application.status === 'draft' || application.status === 'submitted') {
      const combined = { ...application.toObject(), ...updateData };
      updateData.missingFields = checkMissingFields(combined);
    }

    const updatedApplication = await AdoptionApplication.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    await createFlowRecord({
      recordType: 'adoption_application',
      relatedId: application._id,
      relatedNo: application.applicationNo,
      action: 'update',
      actionLabel: '更新申请',
      beforeData,
      afterData: updatedApplication.toObject(),
      description: '更新领养申请资料',
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.json({ data: updatedApplication });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: '更新领养申请失败' });
  }
};

const submitApplication = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: '领养申请不存在' });
    }

    if (application.status !== 'draft') {
      return res.status(400).json({ message: '只有草稿状态的申请可以提交' });
    }

    const missingFields = checkMissingFields(application.toObject());
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: '申请资料不完整，请补充后再提交',
        missingFields 
      });
    }

    const beforeData = application.toObject();
    application.status = 'submitted';
    application.submittedAt = new Date();
    application.updatedBy = req.user._id;
    await application.save();

    await createFlowRecord({
      recordType: 'adoption_application',
      relatedId: application._id,
      relatedNo: application.applicationNo,
      action: 'submit',
      actionLabel: '提交审核',
      beforeData,
      afterData: application.toObject(),
      description: '提交领养申请，等待审核',
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.json({ data: application });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ message: '提交申请失败' });
  }
};

const reviewApplication = async (req, res) => {
  try {
    const { status, reviewComments, rejectionReason } = req.body;
    const application = await AdoptionApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: '领养申请不存在' });
    }

    if (application.status !== 'submitted' && application.status !== 'under_review') {
      return res.status(400).json({ message: '当前状态不允许审核' });
    }

    if (!['under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '无效的审核状态' });
    }

    const beforeData = application.toObject();
    application.status = status;
    application.reviewComments = reviewComments;
    application.rejectionReason = rejectionReason;
    application.reviewerId = req.user._id;
    application.reviewerName = req.user.name;
    application.reviewedAt = new Date();
    application.updatedBy = req.user._id;

    if (status === 'approved') {
      const pet = await Pet.findById(application.petId);
      if (pet) {
        pet.status = 'adopted';
        await pet.save();
      }
    }

    await application.save();

    const statusLabels = {
      under_review: '审核中',
      approved: '审核通过',
      rejected: '审核拒绝'
    };

    await createFlowRecord({
      recordType: 'adoption_application',
      relatedId: application._id,
      relatedNo: application.applicationNo,
      action: 'review',
      actionLabel: '审核',
      beforeData,
      afterData: application.toObject(),
      description: `审核结果：${statusLabels[status]}${rejectionReason ? `，拒绝原因：${rejectionReason}` : ''}`,
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.json({ data: application });
  } catch (error) {
    console.error('Review application error:', error);
    res.status(500).json({ message: '审核失败' });
  }
};

const completeApplication = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: '领养申请不存在' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ message: '只有审核通过的申请可以完成' });
    }

    const beforeData = application.toObject();
    application.status = 'completed';
    application.completedAt = new Date();
    application.updatedBy = req.user._id;
    await application.save();

    await createFlowRecord({
      recordType: 'adoption_application',
      relatedId: application._id,
      relatedNo: application.applicationNo,
      action: 'complete',
      actionLabel: '完成领养',
      beforeData,
      afterData: application.toObject(),
      description: '领养流程完成',
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.json({ data: application });
  } catch (error) {
    console.error('Complete application error:', error);
    res.status(500).json({ message: '完成领养失败' });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  submitApplication,
  reviewApplication,
  completeApplication
};
