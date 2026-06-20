import request from '../utils/request'

export const getChangeLogsByLead = (leadId) => {
  return request({
    url: `/change-logs/lead/${leadId}`,
    method: 'get',
  })
}
