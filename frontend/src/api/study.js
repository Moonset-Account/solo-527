import request from './request'

export const getContinueLearning = () => {
  return request({
    url: '/study/continue',
    method: 'get'
  })
}

export const getStudyProgress = (courseId) => {
  return request({
    url: `/study/course/${courseId}/progress`,
    method: 'get'
  })
}

export const getChapterProgress = (chapterId) => {
  return request({
    url: `/study/chapter/${chapterId}/progress`,
    method: 'get'
  })
}

export const updateChapterProgress = (chapterId, data) => {
  return request({
    url: `/study/chapter/${chapterId}/progress`,
    method: 'put',
    data
  })
}

export const markChapterComplete = (chapterId) => {
  return request({
    url: `/study/chapter/${chapterId}/complete`,
    method: 'post'
  })
}

export const getCheckinCalendar = (courseId, params) => {
  return request({
    url: `/study/course/${courseId}/checkin-calendar`,
    method: 'get',
    params
  })
}

export const getCheckinList = (courseId, params) => {
  return request({
    url: `/study/course/${courseId}/checkin-list`,
    method: 'get',
    params
  })
}

export const checkin = (courseId, data) => {
  return request({
    url: `/study/course/${courseId}/checkin`,
    method: 'post',
    data
  })
}

export const getMyCourses = () => {
  return request({
    url: '/study/my-courses',
    method: 'get'
  })
}

export const getLastStudyChapter = (courseId) => {
  return request({
    url: `/study/course/${courseId}/last-chapter`,
    method: 'get'
  })
}
