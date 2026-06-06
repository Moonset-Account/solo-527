import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Studio = Database['public']['Tables']['studios']['Row']
export type Equipment = Database['public']['Tables']['equipment']['Row']
export type EquipmentForCustomer = Omit<Equipment, 'purchase_price'>
export type Package = Database['public']['Tables']['packages']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderEquipment = Database['public']['Tables']['order_equipment']['Row']
export type DepositTransaction = Database['public']['Tables']['deposit_transactions']['Row']
export type DamageRecord = Database['public']['Tables']['damage_records']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationQueue = Database['public']['Tables']['notification_queue']['Row']

export type OrderWithDetails = Order & {
  studio: Studio | null
  customer: Profile | null
  package: Package | null
  order_equipment: (OrderEquipment & {
    equipment: Equipment | null
  })[]
  deposit_transactions: DepositTransaction[]
  damage_records: (DamageRecord & {
    equipment: { name: string } | null
    responsible_party: { full_name: string | null } | null
  })[]
  contracts: Contract[]
}

export type OrderWithStudioCustomer = Order & {
  studio: { name: string } | null
  customer: { full_name: string | null; email: string } | null
}

export type AvailabilityCheckResult = {
  available: boolean
  conflicts?: {
    type: 'studio' | 'equipment'
    id: string
    name?: string
    conflictingOrderId?: string | null
  }[]
}

export type CreateOrderRequest = {
  customerId: string
  studioId: string
  packageId?: string
  startTime: string
  endTime: string
  equipmentIds?: string[]
  notes?: string
}

export type CreateDamageRecordRequest = {
  orderId: string
  equipmentId: string
  description: string
  severity: DamageRecord['severity']
  repairCost?: number
  responsiblePartyId: string
  reportedBy: string
  photos?: string[]
}
