class BatchOperationLog < ApplicationRecord
  has_many :batch_operation_items, dependent: :destroy

  validates :batch_no, presence: true, uniqueness: true
  validates :operation_type, presence: true

  scope :pending, -> { where(status: "pending") }
  scope :processing, -> { where(status: "processing") }
  scope :completed, -> { where(status: "completed") }
  scope :failed, -> { where(status: "failed") }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(operation_type: type) if type.present? }

  before_validation :generate_batch_no, on: :create

  def self.execute(operation_type, records, attributes, operator: nil)
    batch = create!(
      operation_type: operation_type,
      total_count: records.size,
      scope_description: "#{operation_type} - #{records.size} 条记录",
      operator: operator,
      status: "processing",
      started_at: Time.current
    )

    success_count = 0
    failed_count = 0
    all_field_errors = {}

    records.each do |record|
      original_data = record.attributes
      item = batch.batch_operation_items.build(
        record_type: record.class.name,
        record_id: record.id,
        original_data: original_data
      )

      begin
        if record.update(attributes)
          item.success = true
          item.updated_data = record.attributes
          success_count += 1
        else
          item.success = false
          item.field_errors = record.errors.messages
          item.error_message = record.errors.full_messages.join("; ")
          record_id_key = "#{record.class.name}##{record.id}"
          all_field_errors[record_id_key] = record.errors.messages
          failed_count += 1
        end
      rescue => e
        item.success = false
        item.error_message = e.message
        failed_count += 1
      end

      item.save!
    end

    batch.update!(
      success_count: success_count,
      failed_count: failed_count,
      field_errors: all_field_errors,
      status: "completed",
      completed_at: Time.current
    )

    batch
  end

  def preview(records, attributes)
    previews = []
    records.each do |record|
      original = record.dup
      record.assign_attributes(attributes)
      preview = {
        record_type: record.class.name,
        record_id: record.id,
        display_name: record.respond_to?(:name) ? record.name : record.to_s,
        original: original.attributes.slice(*attributes.keys.map(&:to_s)),
        changes: attributes,
        valid: record.valid?,
        errors: record.valid? ? {} : record.errors.messages
      }
      previews << preview
      record.reload
    end
    previews
  end

  private

  def generate_batch_no
    self.batch_no ||= "BATCH#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(3).upcase}"
  end
end
