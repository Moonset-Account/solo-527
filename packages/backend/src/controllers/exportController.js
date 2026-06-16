const ExcelJS = require('exceljs');
const AdoptionApplication = require('../models/AdoptionApplication');
const Pet = require('../models/Pet');
const TrainingRecord = require('../models/TrainingRecord');
const VisitRecord = require('../models/VisitRecord');
const dayjs = require('dayjs');

const exportApplications = async (req, res) => {
  try {
    const { status, trainerId, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (trainerId) query.trainerId = trainerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const applications = await AdoptionApplication.find(query)
      .populate('petId', 'name species breed')
      .populate('trainerId', 'name')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('领养申请');

    worksheet.columns = [
      { header: '申请编号', key: 'applicationNo', width: 20 },
      { header: '宠物名称', key: 'petName', width: 12 },
      { header: '宠物品种', key: 'petBreed', width: 15 },
      { header: '申请人', key: 'applicantName', width: 12 },
      { header: '联系电话', key: 'applicantPhone', width: 15 },
      { header: '居住地址', key: 'applicantAddress', width: 30 },
      { header: '住房类型', key: 'housingType', width: 12 },
      { header: '训练师', key: 'trainerName', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '缺失资料数', key: 'missingCount', width: 10 },
      { header: '申请时间', key: 'createdAt', width: 20 }
    ];

    const statusLabels = {
      draft: '草稿',
      submitted: '已提交',
      under_review: '审核中',
      approved: '已通过',
      rejected: '已拒绝',
      completed: '已完成',
      cancelled: '已取消'
    };

    const housingLabels = {
      apartment: '公寓',
      house: '独栋',
      villa: '别墅',
      other: '其他'
    };

    for (const app of applications) {
      worksheet.addRow({
        applicationNo: app.applicationNo,
        petName: app.petName,
        petBreed: app.petId?.breed || '-',
        applicantName: app.applicantName,
        applicantPhone: app.applicantPhone,
        applicantAddress: app.applicantAddress || '-',
        housingType: housingLabels[app.housingType] || '-',
        trainerName: app.trainerName || '未分配',
        status: statusLabels[app.status] || app.status,
        missingCount: (app.missingFields || []).length,
        createdAt: dayjs(app.createdAt).format('YYYY-MM-DD HH:mm')
      });
    }

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="领养申请_${dayjs().format('YYYYMMDD')}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export applications error:', error);
    res.status(500).json({ message: '导出失败' });
  }
};

const exportPets = async (req, res) => {
  try {
    const { status, species, trainerId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (species) query.species = species;
    if (trainerId) query.trainerId = trainerId;

    const pets = await Pet.find(query)
      .populate('trainerId', 'name')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('宠物档案');

    worksheet.columns = [
      { header: '宠物编号', key: 'petNo', width: 18 },
      { header: '宠物名称', key: 'name', width: 12 },
      { header: '物种', key: 'species', width: 10 },
      { header: '品种', key: 'breed', width: 15 },
      { header: '性别', key: 'gender', width: 8 },
      { header: '年龄', key: 'age', width: 10 },
      { header: '体重(kg)', key: 'weight', width: 10 },
      { header: '毛色', key: 'color', width: 10 },
      { header: '芯片号', key: 'chipNo', width: 18 },
      { header: '健康状态', key: 'healthStatus', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '训练师', key: 'trainerName', width: 12 },
      { header: '创建时间', key: 'createdAt', width: 20 }
    ];

    const speciesLabels = { dog: '狗', cat: '猫', other: '其他' };
    const genderLabels = { male: '公', female: '母', unknown: '未知' };
    const statusLabels = {
      pending: '待寄养',
      fostering: '寄养中',
      adopted: '已领养',
      returned: '已退回',
      deceased: '已故'
    };
    const healthLabels = { healthy: '健康', sick: '生病', recovering: '康复中' };

    for (const pet of pets) {
      const age = pet.birthday 
        ? `${Math.floor((Date.now() - new Date(pet.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}岁`
        : '-';

      worksheet.addRow({
        petNo: pet.petNo,
        name: pet.name,
        species: speciesLabels[pet.species] || pet.species,
        breed: pet.breed || '-',
        gender: genderLabels[pet.gender] || '-',
        age,
        weight: pet.weight || '-',
        color: pet.color || '-',
        chipNo: pet.chipNo || '-',
        healthStatus: healthLabels[pet.healthStatus] || pet.healthStatus,
        status: statusLabels[pet.status] || pet.status,
        trainerName: pet.trainerId?.name || '未分配',
        createdAt: dayjs(pet.createdAt).format('YYYY-MM-DD HH:mm')
      });
    }

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="宠物档案_${dayjs().format('YYYYMMDD')}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export pets error:', error);
    res.status(500).json({ message: '导出失败' });
  }
};

module.exports = {
  exportApplications,
  exportPets
};
