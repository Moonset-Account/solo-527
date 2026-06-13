class WorkOrder < ApplicationRecord
  include AASM
  include CableReady::Broadcaster

  enum :status, { pending: 0, in_progress: 1, completed: 2, on_hold: 3 }
  enum :priority, { low: 0, medium: 1, high: 2, urgent: 3 }

  has_many :process_steps, dependent: :destroy
  has_many :failed_batches, dependent: :destroy
  has_many :quality_inspections, through: :process_steps

  after_update_commit :broadcast_update
  after_create_commit :broadcast_create

  validates :order_no, presence: true, uniqueness: true
  validates :product_name, presence: true
  validates :quantity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :planned_start_date, presence: true
  validates :planned_end_date, presence: true
  validate :planned_end_date_after_start_date

  audited
  has_associated_audits

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :in_progress
    state :completed
    state :on_hold

    event :start do
      transitions from: :pending, to: :in_progress
    end

    event :hold do
      transitions from: [:pending, :in_progress], to: :on_hold
    end

    event :resume do
      transitions from: :on_hold, to: :in_progress
    end

    event :complete do
      transitions from: :in_progress, to: :completed
    end
  end

  scope :today_scheduled, -> { where("planned_start_date = ? OR planned_end_date = ?", Date.today, Date.today) }
  scope :this_week, -> { where(planned_start_date: Date.today.beginning_of_week..Date.today.end_of_week) }
  scope :overdue, -> { where("planned_end_date < ? AND status != ?", Date.today, statuses[:completed]) }
  scope :by_priority, -> { order(priority: :desc, created_at: :desc) }
  scope :search_by_order_no, ->(query) { where("order_no ILIKE ?", "%#{query}%") }
  scope :search_by_product, ->(query) { where("product_name ILIKE ?", "%#{query}%") }

  accepts_nested_attributes_for :process_steps, allow_destroy: true, reject_if: :all_blank

  def current_process_step
    process_steps.order(sequence: :asc).find_by(status: [:in_progress, :paused, :quality_check]) ||
      process_steps.order(sequence: :asc).find_by(status: :not_started)
  end

  def completed_steps_count
    process_steps.completed.count
  end

  def total_steps_count
    process_steps.count
  end

  def progress_percentage
    return 0 if total_steps_count.zero?
    ((completed_steps_count.to_f / total_steps_count) * 100).round(1)
  end

  def total_actual_quantity
    process_steps.sum(:actual_quantity)
  end

  def total_defect_quantity
    process_steps.sum(:defect_quantity)
  end

  def defect_rate
    return 0 if total_actual_quantity.zero?
    ((total_defect_quantity.to_f / total_actual_quantity) * 100).round(2)
  end

  def priority_name
    I18n.t("enums.work_order.priority.#{priority}", default: priority.humanize)
  end

  def status_name
    I18n.t("enums.work_order.status.#{status}", default: status.humanize)
  end

  private

  def planned_end_date_after_start_date
    return if planned_end_date.blank? || planned_start_date.blank?
    errors.add(:planned_end_date, "必须晚于计划开始日期") if planned_end_date < planned_start_date
  end

  def broadcast_update
    broadcast_replace_later_to "work_orders", target: dom_id(self), partial: "work_orders/work_order_card", locals: { work_order: self }
    broadcast_replace_later_to "dashboard", target: "work_order_#{id}_status", partial: "work_orders/status_badge", locals: { work_order: self }
  end

  def broadcast_create
    broadcast_prepend_later_to "work_orders", target: "work_orders_list", partial: "work_orders/work_order_card", locals: { work_order: self }
  end
end
