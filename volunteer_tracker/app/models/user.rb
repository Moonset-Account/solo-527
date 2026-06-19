class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  enum :role, { admin: "admin", volunteer: "volunteer" }

  has_many :shift_enrollments, dependent: :destroy
  has_many :shifts, through: :shift_enrollments
  has_many :visit_records, foreign_key: :volunteer_id, dependent: :destroy
  has_many :volunteer_service_assignments, dependent: :destroy
  has_many :volunteer_services, through: :volunteer_service_assignments
  has_many :material_transactions, foreign_key: :operator_id, dependent: :nullify
  has_many :overdue_reviews, foreign_key: :reviewer_id, dependent: :nullify

  validates :name, presence: true

  def admin?
    role == 'admin'
  end
end
