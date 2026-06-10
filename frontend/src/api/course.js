import request from './request'

export const getCourseList = (params) => {
  return request({
    url: '/course/list',
    method: 'get',
    params: {
      pageNum: params.page || 1,
      pageSize: params.size || 10,
      category: params.category,
      keyword: params.keyword,
      status: params.status
    }
  })
}

export const getCourseDetail = (id) => {
  return request({
    url: `/course/${id}`,
    method: 'get'
  })
}

export const getHomeData = () => {
  return request({
    url: '/course/home',
    method: 'get'
  })
}

export const getChapterList = (courseId) => {
  return request({
    url: '/chapter/list',
    method: 'get',
    params: { courseId }
  })
}

export const getChapter = (id) => {
  return request({
    url: `/chapter/${id}`,
    method: 'get'
  })
}

export const getBenefitList = () => {
  return request({
    url: '/benefit/list',
    method: 'get'
  })
}

export const getUserBenefits = () => {
  return request({
    url: '/benefit/user-benefits',
    method: 'get'
  })
}

export const createOrder = (data) => {
  return request({
    url: '/order/create',
    method: 'post',
    data
  })
}

export const adminGetCourseList = (params) => {
  return getCourseList(params)
}

export const adminCreateCourse = (data) => {
  return request({
    url: '/course',
    method: 'post',
    data
  })
}

export const adminUpdateCourse = (id, data) => {
  return request({
    url: `/course/${id}`,
    method: 'put',
    data
  })
}

export const adminUpdateCourseStatus = (id, status) => {
  return request({
    url: `/course/${id}/status`,
    method: 'put',
    params: { status }
  })
}

export const adminGetChapters = (courseId) => {
  return getChapterList(courseId)
}

export const adminCreateChapter = (data) => {
  return request({
    url: '/chapter',
    method: 'post',
    data
  })
}

export const adminUpdateChapter = (id, data) => {
  return request({
    url: `/chapter/${id}`,
    method: 'put',
    data
  })
}

export const adminDeleteChapter = (id) => {
  return request({
    url: `/chapter/${id}`,
    method: 'delete'
  })
}

export const adminSetPreview = (id, isPreview, previewDuration) => {
  return request({
    url: '/chapter/preview',
    method: 'put',
    params: { id, isPreview, previewDuration }
  })
}

export const adminSetTrialChapter = (courseId, chapterId, data) => {
  return adminSetPreview(chapterId, data.isPreview ? 1 : 0, data.previewDuration)
}

export const adminUpdateChapterOrder = (courseId, orderList) => {
  return request({
    url: '/chapter/order',
    method: 'put',
    params: { courseId },
    data: orderList
  })
}

export const adminSortChapters = (courseId, data) => {
  return adminUpdateChapterOrder(courseId, data)
}

export const adminToggleCourseStatus = (id, status) => {
  return adminUpdateCourseStatus(id, status)
}

export const adminDeleteCourse = (id) => {
  return request({
    url: `/course/${id}`,
    method: 'delete'
  })
}

export const adminCreateBenefit = (data) => {
  return request({
    url: '/benefit',
    method: 'post',
    data
  })
}

export const adminUpdateBenefit = (id, data) => {
  return request({
    url: `/benefit/${id}`,
    method: 'put',
    data
  })
}

export const adminDeleteBenefit = (id) => {
  return request({
    url: `/benefit/${id}`,
    method: 'delete'
  })
}
