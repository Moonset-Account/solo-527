class SessionGuide < ApplicationRecord
  has_paper_trail

  enum :status, {
    pending: 0,
    confirmed: 1,
    cancelled: 2
  }, default: 'pending'

  belongs_to :session
  belongs_to :user

  validates :session, presence: true
  validates :user, presence: true
  validates :role, presence: true
  validate :guide_availability, on: :create

  scope :by_session, ->(session_id) { where(session_id: session_id) if session_id.present? }
  scope :by_guide, ->(user_id) { where(user_id: user_id) if user_id.present? }
  scope :confirmed, -> { where(status: :confirmed) }

  private

  def guide_availability
    return if user.blank? || session.blank?

    unless user.available_for_session?(session.start_at, session.end_at, session.id)
      errors.add(:user, '该讲解员在此时段已有安排')
    end
  end
end
