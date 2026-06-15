'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type {
  DeactivationAlert,
  Instrument,
  UtilizationLog,
  FilterParams,
} from '@/types'

export interface DailyUtilization {
  instrument_id: string
  instrument_name: string
  date: string
  used_hours: number
  disabled_hours: number
  utilization_rate: number
}

export async function resolveDeactivationAlert(
  alertId: string,
  resolvedBy: string
): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { error: 'Supabase 未配置' }
    }

    const { data: alert, error: alertError } = await supabase
      .from('deactivation_alerts')
      .select('id, instrument_id, deactivated_at, resolved')
      .eq('id', alertId)
      .single()

    if (alertError || !alert) {
      return { error: '提醒不存在' }
    }

    if (alert.resolved) {
      return { error: '该提醒已处理' }
    }

    const now = new Date()

    const { error: updateAlertError } = await supabase
      .from('deactivation_alerts')
      .update({
        resolved: true,
        resolved_at: now.toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', alertId)

    if (updateAlertError) {
      return { error: updateAlertError.message }
    }

    const { error: updateInstrumentError } = await supabase
      .from('instruments')
      .update({ status: 'available' })
      .eq('id', alert.instrument_id)

    if (updateInstrumentError) {
      return { error: updateInstrumentError.message }
    }

    const deactivatedAt = new Date(alert.deactivated_at)
    const disabledHours = Math.max(0, (now.getTime() - deactivatedAt.getTime()) / (1000 * 60 * 60))
    const logDate = deactivatedAt.toISOString().slice(0, 10)

    const { data: existingLog } = await supabase
      .from('utilization_logs')
      .select('*')
      .eq('instrument_id', alert.instrument_id)
      .eq('log_date', logDate)
      .maybeSingle()

    if (existingLog) {
      await supabase
        .from('utilization_logs')
        .update({
          disabled_hours: (existingLog.disabled_hours as number) + disabledHours,
        })
        .eq('id', existingLog.id)
    } else {
      await supabase.from('utilization_logs').insert({
        instrument_id: alert.instrument_id,
        log_date: logDate,
        total_hours: 24,
        used_hours: 0,
        disabled_hours: disabledHours,
      })
    }

    await supabase.from('audit_logs').insert({
      user_id: resolvedBy,
      action: 'resolve_deactivation_alert',
      resource_type: 'deactivation_alert',
      resource_id: alertId,
      details: {
        instrument_id: alert.instrument_id,
        disabled_hours: disabledHours,
      },
    })

    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '恢复失败' }
  }
}

export async function createDeactivationAlert(params: {
  instrument_id: string
  reason: string
}): Promise<{
  alert?: DeactivationAlert
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { error: 'Supabase 未配置' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id

    const { data: newAlert, error: insertError } = await supabase
      .from('deactivation_alerts')
      .insert({
        instrument_id: params.instrument_id,
        reason: params.reason,
        resolved: false,
      })
      .select(`
        *,
        instrument:instruments(*)
      `)
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    await supabase
      .from('instruments')
      .update({ status: 'disabled' })
      .eq('id', params.instrument_id)

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'create_deactivation_alert',
      resource_type: 'deactivation_alert',
      resource_id: (newAlert as DeactivationAlert).id,
      details: {
        instrument_id: params.instrument_id,
        reason: params.reason,
      },
    })

    return { alert: newAlert as DeactivationAlert }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '创建停用提醒失败' }
  }
}

export async function listDeactivationAlerts(params?: {
  includeResolved?: boolean
}): Promise<{
  alerts?: DeactivationAlert[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { alerts: [] }
    }

    let query = supabase
      .from('deactivation_alerts')
      .select(`
        *,
        instrument:instruments(*)
      `)

    if (!params?.includeResolved) {
      query = query.eq('resolved', false)
    }

    query = query.order('deactivated_at', { ascending: false })

    const { data: alerts, error } = await query

    if (error) {
      return { alerts: [] }
    }

    return { alerts: (alerts || []) as DeactivationAlert[] }
  } catch {
    return { alerts: [] }
  }
}

export async function listInstruments(
  filters?: FilterParams
): Promise<{
  instruments?: Instrument[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { instruments: [] }
    }

    let query = supabase
      .from('instruments')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.instrument_id) {
      query = query.eq('id', filters.instrument_id)
    }

    const { data: instruments, error } = await query

    if (error) {
      return { instruments: [] }
    }

    return { instruments: (instruments || []) as Instrument[] }
  } catch {
    return { instruments: [] }
  }
}

export async function listUtilizationLogs(
  filters?: {
    date_from?: string
    date_to?: string
    instrument_id?: string
  }
): Promise<{
  logs?: UtilizationLog[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { logs: [] }
    }

    let query = supabase
      .from('utilization_logs')
      .select(`
        *,
        instrument:instruments(*)
      `)
      .order('log_date', { ascending: false })

    if (filters?.date_from) {
      query = query.gte('log_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('log_date', filters.date_to)
    }
    if (filters?.instrument_id) {
      query = query.eq('instrument_id', filters.instrument_id)
    }

    const { data: logs, error } = await query

    if (error) {
      return { logs: [] }
    }

    return { logs: (logs || []) as UtilizationLog[] }
  } catch {
    return { logs: [] }
  }
}

export async function aggregateUtilizationDaily(): Promise<{
  data?: DailyUtilization[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { data: [] }
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateFrom = thirtyDaysAgo.toISOString().slice(0, 10)

    const { data: instruments, error: instError } = await supabase
      .from('instruments')
      .select('id, name')

    if (instError || !instruments) {
      return { data: [] }
    }

    const { data: logs, error: logsError } = await supabase
      .from('utilization_logs')
      .select(`
        *,
        instrument:instruments(name)
      `)
      .gte('log_date', dateFrom)
      .order('log_date', { ascending: true })

    if (logsError) {
      return { data: [] }
    }

    const result: DailyUtilization[] = []
    const instrumentMap = new Map(instruments.map((i) => [i.id, i.name]))

    const dates: string[] = []
    for (let d = new Date(dateFrom); d <= new Date(); d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10))
    }

    for (const inst of instruments) {
      for (const date of dates) {
        const log = (logs || []).find(
          (l) => l.instrument_id === inst.id && (l.log_date as string).slice(0, 10) === date
        )
        const usedHours = log ? Number(log.used_hours) : 0
        const disabledHours = log ? Number(log.disabled_hours) : 0
        const totalHours = 24
        const utilizationRate = totalHours > 0
          ? Math.round((usedHours / (totalHours - disabledHours || totalHours)) * 1000) / 10
          : 0

        result.push({
          instrument_id: inst.id,
          instrument_name: instrumentMap.get(inst.id) || inst.id,
          date,
          used_hours: usedHours,
          disabled_hours: disabledHours,
          utilization_rate: Math.max(0, Math.min(100, utilizationRate)),
        })
      }
    }

    return { data: result }
  } catch {
    return { data: [] }
  }
}
