import request from './request'

export const getCourseList = (params) => {
  return request({
    url: '/courses',
    method: 'get',
    params
  })
}

export const getCourseDetail = (id) => {
  return request({
    url: `/courses/${id}`,
    method: 'get'
  })
}

export const getCourseChapters = (courseId) => {
  return request({
    url: `/courses/${courseId}/chapters`,
    method: 'get'
  })
}

export const getTrialChapters = (courseId) => {
  return request({
    url: `/courses/${courseId}/trial-chapters`,
    method: 'get'
  })
}

export const getMemberBenefits = (courseId) => {
  return request({
    url: `/courses/${courseId}/member-benefits`,
    method: 'get'
  })
}

export const purchaseCourse = (courseId, data) => {
  return request({
    url: `/courses/${courseId}/purchase`,
    method: 'post',
    data
  })
}

export const adminGetCourseList = (params) => {
  return request({
    url: '/admin/courses',
    method: 'get',
    params
  })
}

export const adminCreateCourse = (data) => {
  return request({
    url: '/admin/courses',
    method: 'post',
    data
  })
}

export const adminUpdateCourse = (id, data) => {
  return request({
    url: `/admin/courses/${id}`,
    method: 'put',
    data
  })
}

export const adminDeleteCourse = (id) => {
  return request({
    url: `/admin/courses/${id}`,
    method: 'delete'
  })
}

export const adminToggleCourseStatus = (id, status) => {
  return request({
    url: `/admin/courses/${id}/status`,
    method: 'put',
    data: { status }
  })
}

export const adminGetChapters = (courseId) => {
  return request({
    url: `/admin/courses/${courseId}/chapters`,
    method: 'get'
  })
}

export const adminCreateChapter = (courseId, data) => {
  return request({
    url: `/admin/courses/${courseId}/chapters`,
    method: 'post',
    data
  })
}

export const adminUpdateChapter = (courseId, chapterId, data) => {
  return request({
    url: `/admin/courses/${courseId}/chapters/${chapterId}`,
    method: 'put',
    data
  })
}

export const adminDeleteChapter = (courseId, chapterId) => {
  return request({
    url: `/admin/courses/${courseId}/chapters/${chapterId}`,
    method: 'delete'
  })
}

export const adminSortChapters = (courseId, data) => {
  return request({
    url: `/admin/courses/${courseId}/chapters/sort`,
    method: 'put',
    data
  })
}

export const adminSetTrialChapter = (courseId, chapterId, data) => {
  return request({
    url: `/admin/courses/${courseId}/chapters/${chapterId}/trial`,
    method: 'put',
    data
  })
}
