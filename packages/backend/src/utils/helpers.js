const dayjs = require('dayjs');

const generateNo = (prefix) => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
};

const getDeepDiff = (obj1, obj2, prefix = '') => {
  const diffs = [];
  
  const allKeys = new Set([
    ...Object.keys(obj1 || {}),
    ...Object.keys(obj2 || {})
  ]);
  
  for (const key of allKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];
    
    if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
      diffs.push(...getDeepDiff(val1, val2, fullKey));
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      diffs.push({
        field: fullKey,
        before: val1,
        after: val2
      });
    }
  }
  
  return diffs;
};

const formatFieldName = (field) => {
  const nameMap = {
    name: '姓名',
    petNo: '宠物编号',
    species: '物种',
    breed: '品种',
    gender: '性别',
    birthday: '出生日期',
    weight: '体重',
    color: '毛色',
    chipNo: '芯片号',
    status: '状态',
    healthStatus: '健康状态',
    temperament: '性格特点',
    dietaryNotes: '饮食注意',
    medicalNotes: '医疗记录',
    applicantName: '申请人姓名',
    applicantPhone: '申请人电话',
    applicantAddress: '申请人地址',
    housingType: '住房类型',
    hasPetExperience: '养宠经验',
    adoptionReason: '领养原因',
    trainerId: '训练师',
    reviewerId: '审核人',
    reviewComments: '审核意见',
    rejectionReason: '拒绝原因',
    trainingDate: '训练日期',
    trainingType: '训练类型',
    trainingContent: '训练内容',
    performance: '表现评估',
    visitDate: '回访日期',
    visitType: '回访类型',
    overallStatus: '整体状态',
    petCondition: '宠物状况',
    problems: '存在问题',
    suggestions: '改进建议'
  };
  
  return nameMap[field] || field;
};

module.exports = {
  generateNo,
  getDeepDiff,
  formatFieldName
};
