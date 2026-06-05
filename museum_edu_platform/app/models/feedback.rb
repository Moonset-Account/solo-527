class Feedback < ApplicationRecord
  has_paper_trail

  enum :status, {
    draft: 0,
    submitted: 1,
    reviewed: 2
  }, default: 'draft'

  belongs_to :session
  belongs_to :registration, optional: true
  belongs_to :user, optional: true

  has_many_attached :photos

  validates :rating, presence: true, numericality: { only_integer: true, in: 1..5 }
  validates :content, length: { maximum: 2000 }

  validates :photos, content_type: ['image/png', 'image/jpeg'],
                     size: { less_than: 10.megabytes },
                     limit: { max: 5 }

  scope :by_session, ->(session_id) { where(session_id: session_id) if session_id.present? }
  scope :by_rating, ->(rating) { where(rating: rating) if rating.present? }
  scope :recent, -> { order(submitted_at: :desc) }

  def submit!
    return false unless draft?

    update(status: :submitted, submitted_at: Time.current)
  end
end
