class Student < ApplicationRecord
  include Ransackable
  MIN_AGE = 3
  MAX_AGE = 18
  ALLOWED_FIELDS = %w[name age grade school_id id_card_last_four emergency_contact_name emergency_contact_phone health_notes].freeze

  belongs_to :school, optional: true
  has_many :booking_students, dependent: :destroy
  has_many :bookings, through: :booking_students

  validates :name, presence: true, length: { maximum: 50 }
  validates :age, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: MIN_AGE, less_than_or_equal_to: MAX_AGE }
  validates :id_card_last_four, format: { with: /\A\d{4}\z/, message: 'must be 4 digits' }, allow_blank: true
  validates :emergency_contact_phone, format: { with: /\A1[3-9]\d{9}\z/, message: 'must be a valid phone number' }, allow_blank: true
  validate :minimal_data_collection

  scope :by_school, ->(school_id) { where(school_id: school_id) }
  scope :by_age_range, ->(min_age, max_age) { where(age: min_age..max_age) }

  def attended_sessions
    course_sessions.joins(:booking_students).where(booking_students: { attended: true })
  end

  private

  def minimal_data_collection
    if id_card_last_four.present? && id_card_last_four.length != 4
      errors.add(:id_card_last_four, 'only last 4 digits allowed for privacy')
    end
  end
end
