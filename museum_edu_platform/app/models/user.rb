class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable, :lockable

  has_paper_trail

  enum :role, {
    admin: 0,
    guide: 1,
    teacher: 2,
    external: 3
  }, default: 'external'

  enum :status, {
    active: 0,
    inactive: 1,
    suspended: 2
  }, default: 'active'

  has_many :session_guides, foreign_key: :user_id
  has_many :guided_sessions, through: :session_guides, source: :session
  has_many :registrations, foreign_key: :user_id
  has_many :feedbacks, foreign_key: :user_id
  has_many :notifications, foreign_key: :user_id
  has_many :check_ins, foreign_key: :checked_in_by_id

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, presence: true

  scope :guides, -> { where(role: :guide) }
  scope :active_guides, -> { guides.where(status: :active) }
  scope :admins, -> { where(role: :admin) }

  def admin?
    role == 'admin'
  end

  def guide?
    role == 'guide'
  end

  def teacher?
    role == 'teacher'
  end

  def external?
    role == 'external'
  end

  def can_manage?
    admin? || teacher?
  end

  def available_for_session?(session_start, session_end, exclude_session_id = nil)
    return false unless guide?

    overlapping = guided_sessions
      .where.not(id: exclude_session_id)
      .where('(start_at, end_at) OVERLAPS (?, ?)', session_start, session_end)
      .where.not(status: :cancelled)
      .exists?

    !overlapping
  end
end
