const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getUserInfo = () => {
  const info = localStorage.getItem(USER_INFO_KEY)
  if (info) {
    try {
      return JSON.parse(info)
    } catch (e) {
      return null
    }
  }
  return null
}

export const setUserInfo = (userInfo) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export const removeUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY)
}

export const clearAuth = () => {
  removeToken()
  removeUserInfo()
}
