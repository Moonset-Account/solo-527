class User < ApplicationRecord
  has_secure_password

  has_many :events, foreign_key: :created_by_id, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :refunds, dependent: :destroy
  has_many :reviewed_refunds, class_name: "Refund", foreign_key: :reviewed_by_id, dependent: :nullify
  has_many :batch_operations, dependent: :destroy
  has_many :audit_logs, dependent: :destroy
  has_many :saved_filters, dependent: :destroy
  has_many :registrations, dependent: :destroy
  has_many :resolved_revenue_anomalies, class_name: "RevenueAnomaly", foreign_key: :resolved_by_id, dependent: :nullify
  has_many :revenue_anomalies, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :role, presence: true, inclusion: { in: %w[organizer ops admin] }

  enum :role, { organizer: "organizer", ops: "ops", admin: "admin" }

  scope :organizers, -> { where(role: "organizer") }
  scope :ops_staff, -> { where(role: "ops") }
  scope :admins, -> { where(role: "admin") }
  scope :recent, -> { order(created_at: :desc) }
end
