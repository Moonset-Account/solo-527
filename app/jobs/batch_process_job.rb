class BatchProcessJob < ApplicationJob
  queue_as :default

  def perform(batch_operation_id)
    batch_op = BatchOperation.find(batch_operation_id)
    BatchOperationService.new(batch_op.user).process(batch_op)
  end
end
