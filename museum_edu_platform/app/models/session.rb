class Session < ApplicationRecord
  has_paper_trail

  enum :status, {
    scheduled: 0,
    open: 1,
    closed: 2,
    in_progress: 3,
    completed: 4,
    cancelled: 5
  }, default: 'scheduled'

  belongs_to :course
  has_many :session_guides, dependent: :destroy
  has_many :guides, through: :session_guides, source: :user
  has_many :registrations, dependent: :destroy
  has_many :check_ins, dependent: :destroy
  has_many :session_equipments, dependent: :destroy
  has_many :equipments, through: :session_equipments
  has_many :feedbacks, dependent: :destroy

  validates :start_at, presence: true
  validates :end_at, presence: true
  validates :location, presence: true
  validates :capacity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validate :end_time_after_start_time

  before_create :generate_qr_code_token
  before_save :set_default_registered_count

  scope :upcoming, -> { where('start_at > ?', Time.current).where.not(status: :cancelled).order(:start_at) }
  scope :today, -> { where(start_at: Date.current.all_day).order(:start_at) }
  scope :this_week, -> { where(start_at: Date.current.beginning_of_week..Date.current.end_of_week).order(:start_at) }
  scope :by_status, ->(status) { where(status: status) if status.present? }

  def available_spots
    capacity - approved_registrations_count
  end

  def approved_registrations_count
    registrations.approved.sum(:student_count)
  end

  def full?
    available_spots <= 0
  end

  def can_register?
    open? && !full? && start_at > 24.hours.from_now
  end

  def available_guides
    User.active_guides.select do |guide|
      guide.available_for_session?(start_at, end_at, id)
    end
  end

  def assign_guide(user, role = 'main')
    return false unless user.guide?
    return false unless user.available_for_session?(start_at, end_at, id)

    session_guides.create(user: user, role: role, status: :confirmed)
  end

  def check_in_student(student, checked_in_by, method = 'qr')
    return false if student_already_checked_in?(student)

    check_ins.create!(
      student: student,
      checked_in_by: checked_in_by,
      checked_in_at: Time.current,
      check_in_method: method,
      status: :confirmed
    )
  end

  def student_already_checked_in?(student)
    check_ins.where(student: student, status: :confirmed).exists?
  end

  def checked_in_count
    check_ins.confirmed.count
  end

  def qr_code_data
    Rails.application.routes.url_helpers.mobile_check_in_url(qr_token: qr_code_token, host: Rails.application.config.action_mailer.default_url_options[:host])
  end

  def qr_code_svg
    qrcode = RQRCode::QRCode.new(qr_code_data)
    qrcode.as_svg(
      offset: 0,
      color: '000',
      shape_rendering: 'crispEdges',
      module_size: 6,
      standalone: true
    )
  end

  private

  def end_time_after_start_time
    return if end_at.blank? || start_at.blank?

    if end_at <= start_at
      errors.add(:end_at, '必须晚于开始时间')
    end
  end

  def generate_qr_code_token
    self.qr_code_token = SecureRandom.urlsafe_base64(16)
  end

  def set_default_registered_count
    self.registered_count ||= 0
  end
end
