class TrainingRecord < ApplicationRecord
  belongs_to :pet
  belongs_to :caretaker
  belongs_to :service, optional: true

  validates :training_date, :pet_id, :caretaker_id, presence: true

  enum :status, { scheduled: 0, completed: 1, delayed: 2, cancelled: 3 }

  scope :today, -> { where(training_date: Date.today) }
  scope :this_week, -> { where(training_date: 1.week.ago..Date.today) }
  scope :this_month, -> { where(training_date: 1.month.ago..Date.today) }
  scope :delayed, -> { where(status: :delayed) }
  scope :by_caretaker, ->(caretaker_id) { where(caretaker_id:) }
  scope :by_delay_reason, ->(reason) { where(delay_reason: reason) }

  def self.ransackable_attributes(auth_object = nil)
    super + %w[id pet_id caretaker_id service_id training_date status delay_reason duration_minutes content progress notes created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[pet caretaker service]
  end

  DELAY_REASONS = [
    "宠物状态不佳",
    "天气原因",
    "主理人临时安排",
    "宠物不配合",
    "设备故障",
    "其他"
  ].freeze

  def pet_name
    pet&.name
  end

  def caretaker_name
    caretaker&.name
  end

  def service_name
    service&.name
  end

  def delayed?
    status == "delayed"
  end
end
