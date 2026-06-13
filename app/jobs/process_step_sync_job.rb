class ProcessStepSyncJob < ApplicationJob
  queue_as :default

  def perform(work_order_id, process_step_id = nil, payload = {})
    work_order = WorkOrder.find(work_order_id)
    process_step = work_order.process_steps.find(process_step_id) if process_step_id
    sync_to_external_system(work_order, process_step, payload)
  rescue => e
    handler = FailedBatchHandler.new(WorkOrder.find(work_order_id), process_step_id ? ProcessStep.find(process_step_id) : nil)
    handler.record_failure("BATCH-#{Time.current.to_i}", payload, e.message)
    raise e
  end

  private

  def sync_to_external_system(work_order, process_step, payload)
    # 模拟外部接口调用 - 这里会随机失败来演示失败批次记录
    if rand < 0.3
      raise "外部接口连接超时"
    end
    Rails.logger.info "同步成功: #{work_order.order_no}"
  end
end
