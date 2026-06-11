import { get, post, put, del, patch } from '@/utils/request'

export interface AddressItem {
  _id: string
  userId: string
  contactName: string
  phone: string
  province: string
  city: string
  district: string
  community: string
  detail: string
  lng?: number
  lat?: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressListResult {
  data: AddressItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateAddressParams {
  userId: string
  contactName: string
  phone: string
  province: string
  city: string
  district: string
  community?: string
  detail: string
  lng?: number
  lat?: number
  isDefault?: boolean
}

export function createAddress(params: CreateAddressParams) {
  return post<AddressItem>('/addresses', params)
}
export function getAddressList(params: { userId: string; isDefault?: boolean }) {
  return get<AddressListResult>('/addresses', params)
}
export function getAddressById(id: string) {
  return get<AddressItem>(`/addresses/${id}`)
}
export function updateAddress(id: string, params: any) {
  return put<AddressItem>(`/addresses/${id}`, params)
}
export function deleteAddress(id: string) {
  return del<void>(`/addresses/${id}`)
}
export function setAddressDefault(id: string) {
  return patch<AddressItem>(`/addresses/${id}/default`)
}
