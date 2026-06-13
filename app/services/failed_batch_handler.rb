class FailedBatchHandler
  def initialize(work_order, process_step = nil)
    @work_order = work_order
    @process_step = process_step
  end

  def record_failure(batch_no, payload, error_message)
    FailedBatch.create!(
      batch_no: batch_no,
      work_order: @work_order,
      process_step: @process_step,
      payload: payload.to_json,
      error_message: error_message,
      status: :pending,
      retry_count: 0
    )
  end

  def retry!(failed_batch, current_user)
    FailedBatch.transaction do
      failed_batch.update!(status: :processing, retry_count: failed_batch.retry_count + 1)
      payload = JSON.parse(failed_batch.payload)
      yield(payload)
      failed_batch.update!(status: :retried)
      AuditLog.create!(
        user: current_user,
        action_type: "失败批次重试",
        entity_type: "FailedBatch",
        entity_id: failed_batch.id,
        details: { retry_count: failed_batch.retry_count }.to_json
      )
    rescue => e
      failed_batch.update!(error_message: "#{failed_batch.error_message}\n第二次失败: #{e.message}")
      raise e
    end
  end

  def resolve!(failed_batch, current_user)
    FailedBatch.transaction do
      failed_batch.update!(
        status: :resolved,
        resolved_at: Time.current,
        resolved_by: current_user
      )
      AuditLog.create!(
        user: current_user,
        action_type: "失败批次标记已解决",
        entity_type: "FailedBatch",
        entity_id: failed_batch.id,
        details: { resolved_at: Time.current }.to_json
      )
    end
  end
end
