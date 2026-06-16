const TrainingRecord = require('../models/TrainingRecord');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { createFlowRecord } = require('../utils/flowRecord');
const { generateNo } = require('../utils/helpers');

const getTrainingRecords = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      petId,
      trainerId,
      trainingType,
      startDate,
      endDate,
      sortBy = 'trainingDate',
      sortOrder = -1
    } = req.query;

    const query = {};
    
    if (petId) query.petId = petId;
    if (trainerId) query.trainerId = trainerId;
    if (trainingType) query.trainingType = trainingType;
    if (startDate || endDate) {
      query.trainingDate = {};
      if (startDate) query.trainingDate.$gte = new Date(startDate);
      if (endDate) query.trainingDate.$lte = new Date(endDate);
    }

    const records = await TrainingRecord.find(query)
      .populate('petId', 'name species breed')
      .populate('trainerId', 'name role')
      .sort({ [sortBy]: parseInt(sortOrder) })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await TrainingRecord.countDocuments(query);

    res.json({
      data: records,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Get training records error:', error);
    res.status(500).json({ message: '获取训练记录失败' });
  }
};

const getTrainingRecord = async (req, res) => {
  try {
    const record = await TrainingRecord.findById(req.params.id)
      .populate('petId', 'name species breed status')
      .populate('trainerId', 'name role');

    if (!record) {
      return res.status(404).json({ message: '训练记录不存在' });
    }

    res.json({ data: record });
  } catch (error) {
    console.error('Get training record error:', error);
    res.status(500).json({ message: '获取训练记录详情失败' });
  }
};

const createTrainingRecord = async (req, res) => {
  try {
    const pet = await Pet.findById(req.body.petId);
    if (!pet) {
      return res.status(404).json({ message: '宠物不存在' });
    }

    const trainer = await User.findById(req.body.trainerId);
    if (!trainer) {
      return res.status(404).json({ message: '训练师不存在' });
    }

    const recordData = {
      ...req.body,
      recordNo: generateNo('TRN'),
      petNo: pet.petNo,
      petName: pet.name,
      trainerName: trainer.name,
      createdBy: req.user._id,
      updatedBy: req.user._id
    };

    const record = new TrainingRecord(recordData);
    await record.save();

    await createFlowRecord({
      recordType: 'training_record',
      relatedId: record._id,
      relatedNo: record.recordNo,
      action: 'create',
      actionLabel: '创建记录',
      afterData: record.toObject(),
      description: `创建训练记录：${pet.name} - ${req.body.trainingType}`,
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.status(201).json({ data: record });
  } catch (error) {
    console.error('Create training record error:', error);
    res.status(500).json({ message: '创建训练记录失败' });
  }
};

const updateTrainingRecord = async (req, res) => {
  try {
    const record = await TrainingRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: '训练记录不存在' });
    }

    const beforeData = record.toObject();
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    if (req.body.trainerId && req.body.trainerId !== record.trainerId?.toString()) {
      const trainer = await User.findById(req.body.trainerId);
      if (trainer) {
        updateData.trainerName = trainer.name;
      }
    }

    const updatedRecord = await TrainingRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    await createFlowRecord({
      recordType: 'training_record',
      relatedId: record._id,
      relatedNo: record.recordNo,
      action: 'update',
      actionLabel: '更新记录',
      beforeData,
      afterData: updatedRecord.toObject(),
      description: '更新训练记录',
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.json({ data: updatedRecord });
  } catch (error) {
    console.error('Update training record error:', error);
    res.status(500).json({ message: '更新训练记录失败' });
  }
};

const deleteTrainingRecord = async (req, res) => {
  try {
    const record = await TrainingRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ message: '训练记录不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete training record error:', error);
    res.status(500).json({ message: '删除训练记录失败' });
  }
};

module.exports = {
  getTrainingRecords,
  getTrainingRecord,
  createTrainingRecord,
  updateTrainingRecord,
  deleteTrainingRecord
};
