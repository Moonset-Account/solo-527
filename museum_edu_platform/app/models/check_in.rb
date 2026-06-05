class CheckIn < ApplicationRecord
  has_paper_trail

  enum :status, {
    pending: 0,
    confirmed: 1,
    cancelled: 2
  }, default: 'pending'

  belongs_to :registration
  belongs_to :student
  belongs_to :session
  belongs_to :checked_in_by, class_name: 'User', optional: true

  has_one_attached :photo

  validates :checked_in_at, presence: true
  validates :check_in_method, presence: true
  validates :offline_uuid, uniqueness: true, allow_nil: true

  validates :photo, content_type: ['image/png', 'image/jpeg'],
                    size: { less_than: 10.megabytes }

  scope :by_session, ->(session_id) { where(session_id: session_id) if session_id.present? }
  scope :by_registration, ->(registration_id) { where(registration_id: registration_id) if registration_id.present? }
  scope :today, -> { where(checked_in_at: Date.current.all_day) }
  scope :offline_pending, -> { where('offline_uuid IS NOT NULL AND synced_at IS NULL') }
  scope :confirmed, -> { where(status: :confirmed) }

  def self.sync_offline_records
    offline_pending.find_each do |check_in|
      check_in.update(synced_at: Time.current) if check_in.valid?
    end
  end

  def offline?
    offline_uuid.present? && synced_at.nil?
  end

  def synced?
    synced_at.present?
  end
end
