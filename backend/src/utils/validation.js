function validatePhone(phone) {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
}

function validateIdCard(idCard) {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!reg.test(idCard)) {
    return false;
  }
  if (idCard.length === 18) {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i];
    }
    const checkCode = checkCodes[sum % 11];
    if (idCard[17].toUpperCase() !== checkCode) {
      return false;
    }
  }
  return true;
}

function validateEmail(email) {
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return reg.test(email);
}

function validateUsername(username) {
  const reg = /^[a-zA-Z0-9_]{3,20}$/;
  return reg.test(username);
}

function validatePassword(password) {
  return password && password.length >= 6 && password.length <= 20;
}

function validateRequired(value, fieldName = '该字段') {
  if (value === undefined || value === null || value === '') {
    return `${fieldName}不能为空`;
  }
  return null;
}

function validatePositiveNumber(value, fieldName = '该字段') {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return `${fieldName}必须为非负数`;
  }
  return null;
}

module.exports = {
  validatePhone,
  validateIdCard,
  validateEmail,
  validateUsername,
  validatePassword,
  validateRequired,
  validatePositiveNumber,
};
