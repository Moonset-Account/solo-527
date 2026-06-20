import request from '../utils/request'

export const getQuotationsByLead = (leadId) => {
  return request({
    url: `/quotations/lead/${leadId}`,
    method: 'get',
  })
}

export const getQuotationDetail = (id) => {
  return request({
    url: `/quotations/${id}`,
    method: 'get',
  })
}

export const createQuotation = (data) => {
  return request({
    url: '/quotations',
    method: 'post',
    data,
  })
}

export const updateQuotation = (id, data) => {
  return request({
    url: `/quotations/${id}`,
    method: 'put',
    data,
  })
}

export const deleteQuotation = (id) => {
  return request({
    url: `/quotations/${id}`,
    method: 'delete',
  })
}

export const setCurrentQuotation = (id) => {
  return request({
    url: `/quotations/${id}/current`,
    method: 'put',
  })
}
