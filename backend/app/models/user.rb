class User < ApplicationRecord
  has_secure_password

  enum role: { student: 0, teacher: 1, admin: 2, super_admin: 3 }

  has_one :teacher, dependent: :destroy
  has_one :student, dependent: :destroy
  has_many :audit_logs, dependent: :nullify
  has_many :notifications, dependent: :destroy
  has_many :approved_bookings, class_name: 'Booking', foreign_key: 'approved_by'
  has_many :approved_settlements, class_name: 'TeacherSettlement', foreign_key: 'approved_by'

  validates :phone, presence: true, uniqueness: true, format: { with: /\A1[3-9]\d{9}\z/ }
  validates :name, presence: true, length: { maximum: 50 }
  validates :email, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }

  scope :active, -> { where(is_active: true) }
  scope :by_role, ->(role) { where(role: role) }

  def active?
    is_active
  end

  def admin?
    admin? || super_admin?
  end
end
