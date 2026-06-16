import dayjs from 'dayjs';

export const formatDate = (date: string | Date | undefined, format: string = 'YYYY-MM-DD') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date | undefined) => {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
};

export const formatRelativeTime = (date: string | Date | undefined) => {
  if (!date) return '-';
  const diff = dayjs().diff(dayjs(date), 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff}天前`;
  if (diff < 30) return `${Math.floor(diff / 7)}周前`;
  if (diff < 365) return `${Math.floor(diff / 30)}个月前`;
  return `${Math.floor(diff / 365)}年前`;
};

export const petStatusLabels: Record<string, string> = {
  pending: '待寄养',
  fostering: '寄养中',
  adopted: '已领养',
  returned: '已退回',
  deceased: '已故',
};

export const petStatusColors: Record<string, string> = {
  pending: 'warning',
  fostering: 'info',
  adopted: 'success',
  returned: 'danger',
  deceased: '',
};

export const adoptionStatusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  under_review: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
  completed: '已完成',
  cancelled: '已取消',
};

export const adoptionStatusColors: Record<string, string> = {
  draft: '',
  submitted: 'warning',
  under_review: 'primary',
  approved: 'success',
  rejected: 'danger',
  completed: 'success',
  cancelled: '',
};

export const speciesLabels: Record<string, string> = {
  dog: '狗',
  cat: '猫',
  other: '其他',
};

export const genderLabels: Record<string, string> = {
  male: '公',
  female: '母',
  unknown: '未知',
};

export const healthStatusLabels: Record<string, string> = {
  healthy: '健康',
  sick: '生病',
  recovering: '康复中',
};

export const trainingTypeLabels: Record<string, string> = {
  obedience: '服从训练',
  socialization: '社会化',
  behavior_correction: '行为纠正',
  agility: '敏捷训练',
  basic_commands: '基础指令',
  other: '其他',
};

export const performanceLabels: Record<string, string> = {
  excellent: '优秀',
  good: '良好',
  average: '一般',
  poor: '较差',
};

export const visitTypeLabels: Record<string, string> = {
  first_week: '首周回访',
  first_month: '首月回访',
  quarterly: '季度回访',
  random: '随机回访',
  complaint: '投诉回访',
};

export const visitMethodLabels: Record<string, string> = {
  home_visit: '上门家访',
  video_call: '视频通话',
  phone_call: '电话回访',
  on_site: '现场查看',
};

export const housingTypeLabels: Record<string, string> = {
  apartment: '公寓',
  house: '独栋',
  villa: '别墅',
  other: '其他',
};

export const reminderCategoryLabels: Record<string, string> = {
  health: '健康',
  safety: '安全',
  feeding: '喂养',
  behavior: '行为',
  legal: '法规',
  other: '其他',
};

export const reminderLevelLabels: Record<string, string> = {
  info: '提示',
  warning: '警告',
  danger: '危险',
};

export const recordTypeLabels: Record<string, string> = {
  pet_profile: '宠物档案',
  adoption_application: '领养申请',
  training_record: '训练记录',
  adoption_review: '领养审核',
  visit_record: '回访记录',
};

export const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  status_change: '状态变更',
  submit: '提交',
  review: '审核',
  complete: '完成',
  cancel: '取消',
};

export const fieldLabels: Record<string, string> = {
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
  trainerId: '训练师',
  applicantName: '申请人姓名',
  applicantPhone: '申请人电话',
  applicantAddress: '申请人地址',
  housingType: '住房类型',
  hasPetExperience: '养宠经验',
  adoptionReason: '领养原因',
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
  problems: '存在问题',
  suggestions: '改进建议',
};

export const formatFieldLabel = (field: string) => {
  return fieldLabels[field] || field;
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
