import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDate = (date) => {
  return formatDateTime(date, 'YYYY-MM-DD');
};

export const getStatusBadge = (status) => {
  const statusMap = {
    draft: { text: '草稿', class: 'status-draft' },
    pending: { text: '待审核', class: 'status-pending' },
    approved: { text: '已通过', class: 'status-approved' },
    voting: { text: '投票中', class: 'status-voting' },
    completed: { text: '已完成', class: 'status-completed' },
    rejected: { text: '已拒绝', class: 'status-rejected' },
    todo: { text: '待处理', class: 'status-todo' },
    in_progress: { text: '进行中', class: 'status-in_progress' },
    done: { text: '已完成', class: 'status-done' },
    open: { text: '进行中', class: 'status-in_progress' },
    closed: { text: '已关闭', class: 'status-done' },
  };
  return statusMap[status] || { text: status, class: 'status-draft' };
};

export const getPriorityBadge = (priority) => {
  const priorityMap = {
    high: { text: '高', class: 'priority-high' },
    medium: { text: '中', class: 'priority-medium' },
    low: { text: '低', class: 'priority-low' },
  };
  return priorityMap[priority] || { text: priority, class: 'priority-medium' };
};

export const getRoleText = (role) => {
  const roleMap = {
    admin: '管理员',
    representative: '居民代表',
    volunteer: '志愿者',
    resident: '居民',
  };
  return roleMap[role] || role;
};

export const getTaskTypeText = (type) => {
  const typeMap = {
    patrol: '巡逻任务',
    assistance: '帮扶任务',
    voting: '投票任务',
    meeting: '会议任务',
    inspection: '检查任务',
    maintenance: '维修任务',
    complaint: '投诉处理',
    suggestion: '建议处理',
    qualification_exception: '资格异常处理',
  };
  return typeMap[type] || type;
};

export const getAssistanceTypeText = (type) => {
  const typeMap = {
    elderly_care: '老人照料',
    child_care: '儿童看护',
    disability_support: '残疾人帮扶',
    medical_assistance: '医疗协助',
    living_support: '生活照料',
    psychological_support: '心理疏导',
    legal_aid: '法律援助',
    education_support: '教育帮扶',
    employment_support: '就业帮扶',
    emergency_rescue: '紧急救助',
    environmental_maintenance: '环境维护',
    community_service: '社区服务',
  };
  return typeMap[type] || type;
};

export const getHouseholdTypeText = (type) => {
  const typeMap = {
    ordinary: '普通家庭',
    low_income: '低收入家庭',
    elderly_only: '空巢老人',
    disabled: '残疾人家庭',
    single_parent: '单亲家庭',
    needy: '特困家庭',
    martyrs: '烈属家庭',
  };
  return typeMap[type] || type;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const handleApiError = (error, message = '操作失败') => {
  console.error('API Error:', error);
  let errorMessage = message;
  if (error.response?.data) {
    if (typeof error.response.data === 'string') {
      errorMessage = error.response.data;
    } else if (error.response.data.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (Array.isArray(error.response.data)) {
      errorMessage = error.response.data.join(', ');
    }
  }
  return errorMessage;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};
