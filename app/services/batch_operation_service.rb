class BatchOperationService
  def initialize(user)
    @user = user
  end

  def execute(operation_type:, target_type:, target_ids:)
    batch_op = BatchOperation.create!(
      user: @user,
      operation_type: operation_type,
      target_type: target_type,
      target_ids: target_ids,
      status: :pending,
      total_count: target_ids.size,
      started_at: Time.current
    )
    BatchProcessJob.perform_later(batch_op.id)
    AuditLogService.new.log(action: "batch_initiated", auditable: batch_op, user: @user)
    batch_op
  end

  def process(batch_op)
    batch_op.update!(status: :processing)
    success = 0
    failure = 0
    target_class = batch_op.target_type.constantize
    batch_op.target_ids.each do |id|
      begin
        record = target_class.find(id)
        case batch_op.operation_type
        when "refund" then process_refund(record)
        when "approve" then process_approve(record)
        else raise "未知操作类型"
        end
        success += 1
      rescue => e
        failure += 1
        Rails.logger.error("BatchOperation #{batch_op.id} failed for #{id}: #{e.message}")
      end
    end
    batch_op.update!(status: :completed, success_count: success, failure_count: failure, completed_at: Time.current)
  end

  private

  def process_refund(order)
    RefundService.new(@user).create_refund(order, reason: "批量退票")
  end

  def process_approve(registration)
    registration.update!(status: :approved, reviewed_at: Time.current)
    AuditLogService.new.log(action: "batch_approved", auditable: registration, user: @user)
  end
end
