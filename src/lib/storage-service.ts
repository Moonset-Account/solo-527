'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notification-service'
import { Database } from '@/types/database'
import type { Contract, Order } from '@/types'

type ContractInsert = Database['public']['Tables']['contracts']['Insert']
type ContractUpdate = Database['public']['Tables']['contracts']['Update']

export async function uploadContract(
  orderId: string,
  file: File,
  uploadedBy: string
): Promise<Contract> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${orderId}/${Date.now()}.${fileExt}`
  const filePath = `contracts/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
    })

  if (uploadError) throw uploadError

  const { data: contractData, error: dbError } = await supabase
    .from('contracts')
    .insert({
      order_id: orderId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      uploaded_by: uploadedBy,
    } as ContractInsert)
    .select()
    .single()

  if (dbError) throw dbError
  const contract = contractData as Contract

  const { data: orderData } = await supabase
    .from('orders')
    .select('customer_id, order_number')
    .eq('id', orderId)
    .single()
  const order = orderData as Order | null

  if (order) {
    await createNotification({
      userId: order.customer_id,
      type: 'order_status',
      title: '合同已上传',
      content: `订单 ${order.order_number} 的合同已上传，请查看。`,
      relatedOrderId: orderId,
    })
  }

  return contract
}

export async function getContractUrl(filePath: string): Promise<string> {
  const supabase = createClient()

  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function signContract(
  contractId: string,
  signedBy: string
): Promise<Contract> {
  const supabase = createClient()

  const { data: contractData, error } = await supabase
    .from('contracts')
    .update({
      signed: true,
      signed_by: signedBy,
      signed_at: new Date().toISOString(),
    } as ContractUpdate)
    .eq('id', contractId)
    .select()
    .single()

  if (error) throw error

  return contractData as Contract
}
