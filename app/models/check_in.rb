class CheckIn < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :checkinable, polymorphic: true
  belongs_to :operator, class_name: "User", optional: true

  scope :by_status, ->(status) { where(status: status) }
  scope :checked_in, -> { where(status: "checked_in") }
  scope :today, -> { where("DATE(created_at) = ?", Date.today) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_checkinable, ->(type, id) { where(checkinable_type: type, checkinable_id: id) }

  validates :status, inclusion: { in: %w[pending checked_in no_show cancelled] }
  validates :check_in_method, inclusion: { in: %w[manual qr_code staff auto], allow_nil: true }

  def check_in!(method = "manual", operator = nil)
    update!(
      status: "checked_in",
      checked_in_at: Time.current,
      check_in_method: method,
      operator: operator
    )
  end

  def mark_no_show!(operator = nil)
    update!(status: "no_show", operator: operator)
  end

  def checked_in?
    status == "checked_in"
  end

  def source_description
    case checkinable_type
    when "CourseEnrollment"
      "课程: #{checkinable.course.name}"
    when "EventRegistration"
      "赛事: #{checkinable.event.name}"
    else
      checkinable_type
    end
  end
end
