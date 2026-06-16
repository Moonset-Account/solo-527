import request from '@/utils/request'

export function getWaitlistBySchedule(scheduleId) {
  return request({
    url: `/waitlist/schedule/${scheduleId}`,
    method: 'get'
  })
}

export function addToWaitlist(scheduleId) {
  return request({
    url: `/waitlist/schedule/${scheduleId}`,
    method: 'post'
  })
}

export function removeFromWaitlist(scheduleId) {
  return request({
    url: `/waitlist/schedule/${scheduleId}`,
    method: 'delete'
  })
}
