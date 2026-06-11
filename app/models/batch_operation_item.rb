class BatchOperationItem < ApplicationRecord
  belongs_to :batch_operation_log

  validates :batch_operation_log_id, presence: true
  validates :record_type, presence: true
  validates :record_id, presence: true

  scope :successful, -> { where(success: true) }
  scope :failed, -> { where(success: false) }
  scope :for_record, ->(type, id) { where(record_type: type, record_id: id) }

  def record
    record_type.constantize.find_by(id: record_id)
  rescue
    nil
  end
end
