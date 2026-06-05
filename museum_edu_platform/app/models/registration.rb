class Registration < ApplicationRecord
  has_paper_trail

  enum :registration_type, {
    school_group: 0,
    individual: 1
  }, default: 'school_group'

  enum :status, {
    pending: 0,
    approved: 1,
    rejected: 2,
    cancelled: 3,
    completed: 4
  }, default: 'pending'

  belongs_to :session
  belongs_to :user, optional: true
  belongs_to :school, optional: true

  has_many :registration_students, dependent: :destroy
  has_many :students, through: :registration_students
  has_many :check_ins, dependent: :destroy
  has_many :feedbacks, dependent: :destroy

  validates :session, presence: true
  validates :student_count, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :contact_name, presence: true
  validates :contact_phone, presence: true
  validates :contact_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validate :session_has_capacity, on: :create
  validate :school_present_for_group

  before_create :generate_qr_token
  before_save :sync_students_count

  scope :pending_approval, -> { where(status: :pending).order(created_at: :desc) }
  scope :by_session, ->(session_id) { where(session_id: session_id) if session_id.present? }
  scope :by_school, ->(school_id) { where(school_id: school_id) if school_id.present? }
  scope :upcoming, -> { joins(:session).where('sessions.start_at > ?', Time.current).order('sessions.start_at ASC') }

  def approve!(approver = nil)
    return false unless pending?
    return false unless session.available_spots >= student_count

    transaction do
      update!(status: :approved, approved_at: Time.current)
      update_session_registered_count
      send_notification(:approved)
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  def reject!(reason, rejector = nil)
    return false unless pending?

    transaction do
      update!(status: :rejected, rejected_at: Time.current, rejection_reason: reason)
      send_notification(:rejected)
    end
    true
  end

  def cancel!
    return false unless approved? || pending?

    transaction do
      update!(status: :cancelled)
      update_session_registered_count
    end
    true
  end

  def add_student(student)
    return false if students.include?(student)

    registration_students.create(student: student, status: :registered)
  end

  def remove_student(student)
    registration_students.where(student: student).destroy_all
  end

  def checked_in_students_count
    check_ins.confirmed.distinct.count(:student_id)
  end

  def all_checked_in?
    checked_in_students_count >= student_count
  end

  private

  def session_has_capacity
    return if session.blank?
    return if session.available_spots >= student_count

    errors.add(:student_count, "超过场次剩余名额（剩余 #{session.available_spots} 个）")
  end

  def school_present_for_group
    if school_group? && school.blank?
      errors.add(:school, '团体报名必须选择学校')
    end
  end

  def generate_qr_token
    self.qr_token = SecureRandom.urlsafe_base64(16)
  end

  def sync_students_count
    if registration_students.any? && student_count != registration_students.count
      self.student_count = registration_students.count
    end
  end

  def update_session_registered_count
    session.update!(
      registered_count: session.registrations.approved.sum(:student_count)
    )
  end

  def send_notification(type)
    Notification.create(
      user: user,
      title: notification_title(type),
      content: notification_content(type),
      notification_type: "registration_#{type}",
      related_object: self
    )
  end

  def notification_title(type)
    case type
    when :approved then '报名已通过'
    when :rejected then '报名未通过'
    else '报名状态更新'
    end
  end

  def notification_content(type)
    case type
    when :approved
      "您的#{session.course.title}课程报名已通过，请准时参加。"
    when :rejected
      "您的#{session.course.title}课程报名未通过，原因：#{rejection_reason}"
    else
      "您的报名状态有更新。"
    end
  end
end
