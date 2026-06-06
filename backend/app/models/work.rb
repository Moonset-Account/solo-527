class Work < ApplicationRecord
  include Audited

  belongs_to :student, class_name: 'User', foreign_key: 'student_id'
  belongs_to :course, optional: true
  belongs_to :enrollment, optional: true
  belongs_to :authorized_by, class_name: 'User', optional: true
  belongs_to :approved_by, class_name: 'User', optional: true
  belongs_to :rejected_by, class_name: 'User', optional: true

  validates :title, presence: true
  validates :review_status, presence: true, inclusion: { in: %w[pending approved rejected] }

  scope :public_approved, -> { where(is_public: true, review_status: 'approved') }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :by_course, ->(course_id) { where(course_id: course_id) if course_id.present? }
  scope :by_review_status, ->(status) { where(review_status: status) if status.present? }
  scope :by_is_public, ->(is_public) { where(is_public: is_public) unless is_public.nil? }

  def public?
    is_public
  end

  def pending?
    review_status == 'pending'
  end

  def approved?
    review_status == 'approved'
  end

  def rejected?
    review_status == 'rejected'
  end

  def authorize_public!(user)
    return false unless student_id == user.id

    update!(
      is_public: true,
      authorized_by_student: true,
      authorized_at: Time.current,
      authorized_by: user,
      review_status: 'pending'
    )
    true
  end

  def approve!(user)
    return false unless review_status == 'pending'

    update!(
      review_status: 'approved',
      approved_at: Time.current,
      approved_by: user
    )
    true
  end

  def reject!(user, reason = nil)
    return false unless review_status == 'pending'

    update!(
      review_status: 'rejected',
      reject_reason: reason,
      rejected_at: Time.current,
      rejected_by: user
    )
    true
  end

  def make_private!
    update!(
      is_public: false,
      authorized_by_student: false,
      authorized_at: nil,
      authorized_by: nil,
      review_status: 'pending'
    )
  end
end
