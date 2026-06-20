class LeaveRequest < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :course_enrollment
  belongs_to :approved_by, class_name: "User", optional: true

  scope :by_status, ->(status) { where(status: status) }
  scope :pending, -> { where(status: "pending") }
  scope :approved, -> { where(status: "approved") }
  scope :rejected, -> { where(status: "rejected") }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_date, ->(date) { where(leave_date: date) }

  validates :leave_date, presence: true
  validates :status, inclusion: { in: %w[pending approved rejected cancelled] }

  def approve!(approver)
    update!(status: "approved", approved_by: approver, approved_at: Time.current)
  end

  def reject!(approver, note = nil)
    update!(status: "rejected", approved_by: approver, approve_note: note)
  end

  def pending?
    status == "pending"
  end

  def approved?
    status == "approved"
  end
end
