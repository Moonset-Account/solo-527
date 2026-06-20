class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_paper_trail

  has_many :course_enrollments, dependent: :destroy
  has_many :courses, through: :course_enrollments
  has_many :leave_requests, dependent: :destroy
  has_many :event_registrations, dependent: :destroy
  has_many :events, through: :event_registrations
  has_many :venue_bookings, dependent: :destroy
  has_many :check_ins, dependent: :destroy
  has_many :payments, dependent: :destroy
  has_many :batch_jobs, dependent: :destroy

  scope :active, -> { where(active: true) }
  scope :by_role, ->(role) { where(role: role) }

  ROLES = %w[member admin supervisor].freeze

  validates :name, presence: true
  validates :role, inclusion: { in: ROLES }

  def admin?
    role == "admin"
  end

  def supervisor?
    role == "supervisor"
  end

  def member?
    role == "member"
  end

  def can_access_admin?
    admin? || supervisor?
  end
end
