class Schedule < ApplicationRecord
  belongs_to :event
  has_many :registrations, dependent: :destroy
  has_many :attendance_alerts, dependent: :destroy

  validates :name, presence: true
  validates :sort_order, numericality: { greater_than_or_equal_to: 0 }

  scope :by_event, ->(event_id) { where(event_id: event_id) }
  scope :ordered, -> { order(sort_order: :asc) }
  scope :upcoming, -> { where("starts_at > ?", Time.current) }
end
