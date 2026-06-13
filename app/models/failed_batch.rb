class FailedBatch < ApplicationRecord
  enum :status, { pending: 0, processing: 1, retried: 2, resolved: 3 }

  belongs_to :work_order
  belongs_to :process_step, optional: true
  belongs_to :resolved_by, class_name: 'User', optional: true

  validates :batch_no, presence: true
  validates :payload, presence: true
  validates :error_message, presence: true
  validates :retry_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  audited

  scope :by_status, ->(status) { where(status: status) }
  scope :pending_or_processing, -> { where(status: [:pending, :processing]) }
  scope :by_work_order, ->(work_order_id) { where(work_order_id: work_order_id) }
  scope :by_process_step, ->(process_step_id) { where(process_step_id: process_step_id) }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :latest_first, -> { order(created_at: :desc) }
  scope :needs_attention, -> { pending.where("created_at < ?", 1.hour.ago) }

  def parsed_payload
    return {} unless payload.present?
    JSON.parse(payload) rescue {}
  end

  def status_name
    I18n.t("enums.failed_batch.status.#{status}", default: status.humanize)
  end

  def status_color
    case status
    when 'pending' then 'bg-red-100 text-red-800'
    when 'processing' then 'bg-yellow-100 text-yellow-800'
    when 'retried' then 'bg-blue-100 text-blue-800'
    when 'resolved' then 'bg-green-100 text-green-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def can_retry?
    pending? && retry_count < 3
  end

  def can_resolve?
    pending? || processing? || retried?
  end

  def age_in_hours
    ((Time.current - created_at) / 1.hour).round(2)
  end
end
