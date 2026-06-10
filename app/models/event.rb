class Event < ApplicationRecord
  belongs_to :created_by, class_name: "User"
  has_many :ticket_types, dependent: :destroy
  has_many :schedules, dependent: :destroy
  has_many :registrations, dependent: :destroy
  has_many :attendance_alerts, dependent: :destroy
  has_many :revenue_anomalies, dependent: :destroy

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: %w[draft published cancelled completed] }

  enum :status, { draft: "draft", published: "published", cancelled: "cancelled", completed: "completed" }

  scope :by_status, ->(status) { where(status: status) }
  scope :published, -> { where(status: "published") }
  scope :upcoming, -> { where("starts_at > ?", Time.current) }
  scope :recent, -> { order(created_at: :desc) }
end
