export const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone)
}

export const validateEmail = (email) => {
  return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email)
}

export const validateIdCard = (idCard) => {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)
}

export const validateUrl = (url) => {
  return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(url)
}

export const validatePassword = (password) => {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/.test(password)
}

export const validateChinese = (str) => {
  return /^[\u4e00-\u9fa5]+$/.test(str)
}

export const validateNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

export const validateInteger = (value) => {
  return /^-?\d+$/.test(value)
}

export const validatePositiveInteger = (value) => {
  return /^[1-9]\d*$/.test(value)
}
