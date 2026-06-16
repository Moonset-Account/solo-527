import request from '@/utils/request'

export function getCoursePage(params) {
  return request({
    url: '/course/page',
    method: 'get',
    params
  })
}

export function getCourseById(id) {
  return request({
    url: `/course/${id}`,
    method: 'get'
  })
}

export function addCourse(data) {
  return request({
    url: '/course',
    method: 'post',
    data
  })
}

export function updateCourse(data) {
  return request({
    url: '/course',
    method: 'put',
    data
  })
}

export function deleteCourse(id) {
  return request({
    url: `/course/${id}`,
    method: 'delete'
  })
}

export function getSchedulePage(params) {
  return request({
    url: '/course-schedule/page',
    method: 'get',
    params
  })
}

export function getScheduleById(id) {
  return request({
    url: `/course-schedule/${id}`,
    method: 'get'
  })
}

export function getScheduleByCoach(coachId, params) {
  return request({
    url: `/course-schedule/coach/${coachId}`,
    method: 'get',
    params
  })
}

export function getScheduleByDate(date) {
  return request({
    url: `/course-schedule/date/${date}`,
    method: 'get'
  })
}

export function addSchedule(data) {
  return request({
    url: '/course-schedule',
    method: 'post',
    data
  })
}

export function enrollSchedule(scheduleId) {
  return request({
    url: `/course-schedule/enroll/${scheduleId}`,
    method: 'post'
  })
}

export function cancelEnrollSchedule(scheduleId) {
  return request({
    url: `/course-schedule/cancel/${scheduleId}`,
    method: 'post'
  })
}
