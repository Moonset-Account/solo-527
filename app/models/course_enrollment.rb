class CourseEnrollment < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :course
  has_many :leave_requests, dependent: :destroy
  has_many :check_ins, as: :checkinable, dependent: :destroy
  has_many :payments, as: :payable, dependent: :destroy

  scope :by_status, ->(status) { where(status: status) }
  scope :by_payment_status, ->(status) { where(payment_status: status) }
  scope :recent, -> { order(created_at: :desc) }

  validates :user_id, uniqueness: { scope: :course_id, message: "已经报名了该课程" }
  validates :status, inclusion: { in: %w[pending confirmed cancelled completed] }
  validates :payment_status, inclusion: { in: %w[unpaid paid failed refunded] }

  def confirm!
    update!(status: "confirmed", enrolled_at: Time.current)
  end

  def cancel!
    transaction do
      update!(status: "cancelled")
      course.decrement!(:enrolled_count) if course.enrolled_count > 0
    end
  end

  def mark_paid!(payment = nil)
    update!(payment_status: "paid")
    confirm! if pending?
  end

  def mark_payment_failed!(reason = nil)
    update!(payment_status: "failed")
  end

  def source_description
    "课程报名: #{course.name} (#{status_text})"
  end

  def status_text
    case status
    when "pending" then "待确认"
    when "confirmed" then "已确认"
    when "cancelled" then "已取消"
    when "completed" then "已完成"
    else status
    end
  end

  def pending?
    status == "pending"
  end

  def confirmed?
    status == "confirmed"
  end

  def paid?
    payment_status == "paid"
  end
end
