class User < ApplicationRecord
  include Ransackable
  include Devise::JWT::RevocationStrategies::JTIMatcher if defined?(Devise::JWT)

  belongs_to :school, optional: true

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable

  enum :role, { admin: 0, education_teacher: 1, guide: 2, school_teacher: 3, guest: 4 }
  enum :status, { active: 0, inactive: 1, suspended: 2 }

  has_many :created_courses, class_name: 'Course', foreign_key: 'created_by_id'
  has_many :created_bookings, class_name: 'Booking', foreign_key: 'created_by_id'
  has_many :cancelled_bookings, class_name: 'Booking', foreign_key: 'cancelled_by_id'
  has_many :checked_in_students, class_name: 'BookingStudent', foreign_key: 'checked_in_by_id'
  has_many :assigned_guides, class_name: 'GuideAssignment', foreign_key: 'assigned_by_id'
  has_many :allocated_aids, class_name: 'TeachingAidAllocation', foreign_key: 'allocated_by_id'
  has_many :authored_feedbacks, class_name: 'Feedback', foreign_key: 'author_id'

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, presence: true
  validates :status, presence: true

  scope :active, -> { where(status: :active) }
  scope :by_role, ->(role) { where(role: role) }

  def can_manage?(resource)
    admin? || education_teacher?
  end

  def can_view_sensitive_data?
    admin? || education_teacher?
  end
end
