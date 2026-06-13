class ProcessStep < ApplicationRecord
  include AASM
  include CableReady::Broadcaster

  enum :status, { not_started: 0, in_progress: 1, paused: 2, completed: 3, quality_check: 4 }

  belongs_to :work_order
  belongs_to :assigned_team, class_name: 'Team', optional: true
  belongs_to :assigned_equipment, class_name: 'Equipment', optional: true
  belongs_to :mold, optional: true

  has_many :quality_inspections, dependent: :destroy
  has_many :process_efficiencies, dependent: :destroy
  has_many :failed_batches, dependent: :destroy

  after_update_commit :broadcast_update

  validates :name, presence: true
  validates :sequence, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :actual_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :defect_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

  audited associated_with: :work_order
  has_associated_audits

  aasm column: :status, enum: true do
    state :not_started, initial: true
    state :in_progress
    state :paused
    state :quality_check
    state :completed

    event :start do
      transitions from: :not_started, to: :in_progress
    end

    event :pause do
      transitions from: :in_progress, to: :paused
    end

    event :resume do
      transitions from: :paused, to: :in_progress
    end

    event :complete do
      transitions from: :in_progress, to: :quality_check
    end

    event :pass_quality do
      transitions from: :quality_check, to: :completed
    end

    event :continue_processing do
      transitions from: [:quality_check, :paused], to: :in_progress
    end
  end

  scope :by_work_order, ->(work_order_id) { where(work_order_id: work_order_id) }
  scope :by_sequence, -> { order(sequence: :asc) }
  scope :in_progress_or_paused, -> { where(status: [:in_progress, :paused]) }
  scope :today_active, -> { where("DATE(started_at) = ? OR DATE(completed_at) = ?", Date.today, Date.today) }
  scope :by_team, ->(team_id) { where(assigned_team_id: team_id) }
  scope :by_equipment, ->(equipment_id) { where(assigned_equipment_id: equipment_id) }

  def can_start?
    not_started? && previous_step_completed?
  end

  def previous_step_completed?
    previous_step.nil? || previous_step.completed?
  end

  def previous_step
    work_order.process_steps.where("sequence < ?", sequence).order(sequence: :desc).first
  end

  def next_step
    work_order.process_steps.where("sequence > ?", sequence).order(sequence: :asc).first
  end

  def latest_quality_inspection
    quality_inspections.order(inspection_time: :desc).first
  end

  def passed_quality?
    quality_inspections.where(result: :pass).exists?
  end

  def has_failed_quality?
    quality_inspections.where(result: [:fail, :rework]).exists?
  end

  def duration_hours
    return 0 unless started_at
    end_time = completed_at || Time.current
    ((end_time - started_at) / 1.hour).round(2)
  end

  def working_duration_hours
    total = duration_hours
    paused_time = 0
    total
  end

  def pass_rate
    return 0 if actual_quantity.to_i.zero?
    (((actual_quantity - defect_quantity).to_f / actual_quantity) * 100).round(2)
  end

  def latest_efficiency
    process_efficiencies.order(created_at: :desc).first
  end

  def status_name
    I18n.t("enums.process_step.status.#{status}", default: status.humanize)
  end

  def status_color
    case status
    when 'not_started' then 'bg-gray-100 text-gray-800'
    when 'in_progress' then 'bg-blue-100 text-blue-800'
    when 'paused' then 'bg-yellow-100 text-yellow-800'
    when 'quality_check' then 'bg-purple-100 text-purple-800'
    when 'completed' then 'bg-green-100 text-green-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  private

  def broadcast_update
    broadcast_replace_later_to "work_order_#{work_order_id}", target: dom_id(self), partial: "work_orders/process_step_card", locals: { step: self, work_order: work_order }
    broadcast_replace_later_to "work_orders", target: dom_id(work_order), partial: "work_orders/work_order_card", locals: { work_order: work_order }
  end
end
