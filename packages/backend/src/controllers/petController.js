const Pet = require('../models/Pet');
const { createFlowRecord } = require('../utils/flowRecord');
const { generateNo } = require('../utils/helpers');

const getPets = async (req, res) => {
  try {
    const {
      page = 1, pageSize = 20, keyword, status, species, trainerId, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    const query = {};
    
    if (keyword) {
      query.$text = { $search: keyword };
    }
    if (status) {
      query.status = status;
    }
    if (species) {
      query.species = species;
    }
    if (trainerId) {
      query.trainerId = trainerId;
    }

    const pets = await Pet.find(query)
      .populate('trainerId', 'name role')
      .populate('createdBy', 'name')
      .sort({ [sortBy]: parseInt(sortOrder) })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Pet.countDocuments(query);

    res.json({
      data: pets,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ message: '获取宠物列表失败' });
  }
};

const getPet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('trainerId', 'name role')
      .populate('createdBy', 'name');

    if (!pet) {
      return res.status(404).json({ message: '宠物不存在' });
    }

    res.json({ data: pet });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ message: '获取宠物详情失败' });
  }
};

const createPet = async (req, res) => {
  try {
    const petData = {
      ...req.body,
      petNo: req.body.petNo || generateNo('PET'),
      createdBy: req.user._id,
      updatedBy: req.user._id
    };

    const pet = new Pet(petData);
    await pet.save();

    await createFlowRecord({
      recordType: 'pet_profile',
      relatedId: pet._id,
      relatedNo: pet.petNo,
      action: 'create',
      actionLabel: '创建档案',
      afterData: pet.toObject(),
      description: `创建宠物档案：${pet.name}`,
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.status(201).json({ data: pet });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ message: '创建宠物档案失败' });
  }
};

const updatePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: '宠物不存在' });
    }

    const beforeData = pet.toObject();
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    const statusChanged = beforeData.status !== updatedPet.status;

    await createFlowRecord({
      recordType: 'pet_profile',
      relatedId: pet._id,
      relatedNo: pet.petNo,
      action: statusChanged ? 'status_change' : 'update',
      actionLabel: statusChanged ? '状态变更' : '更新档案',
      beforeData,
      afterData: updatedPet.toObject(),
      description: statusChanged 
        ? `宠物状态从 ${beforeData.status} 变更为 ${updatedPet.status}`
        : `更新宠物档案信息`,
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role
    });

    res.json({ data: updatedPet });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ message: '更新宠物档案失败' });
  }
};

const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: '宠物不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ message: '删除宠物档案失败' });
  }
};

const updatePetStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: '宠物不存在' });
    }

    const beforeData = pet.toObject();
    pet.status = status;
    pet.updatedBy = req.user._id;
    await pet.save();

    await createFlowRecord({
      recordType: 'pet_profile',
      relatedId: pet._id,
      relatedNo: pet.petNo,
      action: 'status_change',
      actionLabel: '状态变更',
      beforeData,
      afterData: pet.toObject(),
      description: `宠物状态从 ${beforeData.status} 变更为 ${status}`,
      operatorId: req.user._id,
      operatorName: req.user.name,
      operatorRole: req.user.role,
      remark
    });

    res.json({ data: pet });
  } catch (error) {
    console.error('Update pet status error:', error);
    res.status(500).json({ message: '更新状态失败' });
  }
};

module.exports = {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  updatePetStatus
};
