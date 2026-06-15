'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ArchiveRecord, FilterParams, ProcessingStatus } from '@/types'

export async function uploadAndCreateArchive(formData: FormData): Promise<{
  archive?: ArchiveRecord
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

    const file = formData.get('file') as File | null
    const projectId = formData.get('project_id') as string | null
    const sampleId = formData.get('sample_id') as string | null
    const processingStatus = (formData.get('processing_status') as ProcessingStatus) || 'pending'
    const responsiblePerson = formData.get('responsible_person') as string | null
    const metadataStr = formData.get('metadata') as string | null
    const fileName = formData.get('file_name') as string | null

    if (!file && !fileName) {
      return { error: '请上传文件' }
    }

    let fileUrl = ''
    const finalFileName = fileName || file?.name || 'unknown'

    if (file) {
      try {
        const storagePath = `${userId}/${Date.now()}_${finalFileName}`
        const fileBuffer = await file.arrayBuffer()

        const { error: uploadError } = await supabase.storage
          .from('archives')
          .upload(storagePath, Buffer.from(fileBuffer), {
            contentType: file.type || 'application/octet-stream',
          })

        if (uploadError) {
          if (uploadError.message.includes('bucket') || uploadError.message.includes('does not exist')) {
            fileUrl = `/mock-archives/${finalFileName}`
          } else {
            throw uploadError
          }
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('archives')
            .getPublicUrl(storagePath)
          fileUrl = publicUrlData.publicUrl
        }
      } catch {
        fileUrl = `/mock-archives/${finalFileName}`
      }
    } else {
      fileUrl = `/mock-archives/${finalFileName}`
    }

    let metadata: Record<string, string> = {}
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr)
      } catch {
      }
    }

    const { data: newArchive, error: insertError } = await supabase
      .from('archive_records')
      .insert({
        user_id: userId,
        project_id: projectId || null,
        sample_id: sampleId || null,
        file_url: fileUrl,
        file_name: finalFileName,
        processing_status: processingStatus,
        responsible_person: responsiblePerson || null,
        metadata: metadata,
      })
      .select(`
        *,
        project:projects(*),
        sample:samples(*)
      `)
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'create_archive',
      resource_type: 'archive',
      resource_id: (newArchive as ArchiveRecord).id,
      details: {
        file_name: finalFileName,
        processing_status: processingStatus,
      },
    })

    return { archive: newArchive as ArchiveRecord }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '上传归档失败' }
  }
}

export async function updateArchiveStatus(
  id: string,
  status: ProcessingStatus
): Promise<{
  success?: boolean
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
      .select('id, role')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id

    const { error: updateError } = await supabase
      .from('archive_records')
      .update({ processing_status: status })
      .eq('id', id)

    if (updateError) {
      return { error: updateError.message }
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'update_archive_status',
      resource_type: 'archive',
      resource_id: id,
      details: { new_status: status },
    })

    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '更新状态失败' }
  }
}

export async function listArchives(filters?: FilterParams): Promise<{
  archives?: ArchiveRecord[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { archives: [] }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { archives: [] }
    }

    let query = supabase
      .from('archive_records')
      .select(`
        *,
        project:projects(*),
        sample:samples(*)
      `)
      .order('archived_at', { ascending: false })

    if (filters?.date_from) {
      query = query.gte('archived_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('archived_at', filters.date_to + 'T23:59:59Z')
    }
    if (filters?.processing_status) {
      query = query.eq('processing_status', filters.processing_status)
    }
    if (filters?.responsible_person) {
      query = query.ilike('responsible_person', `%${filters.responsible_person}%`)
    }

    const { data: archives, error } = await query

    if (error) {
      return { archives: [] }
    }

    return { archives: (archives || []) as ArchiveRecord[] }
  } catch {
    return { archives: [] }
  }
}
