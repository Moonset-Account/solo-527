class RegistrationStudent < ApplicationRecord
  has_paper_trail

  enum :status, {
    registered: 0,
    cancelled: 1,
    attended: 2,
    no_show: 3
  }, default: 'registered'

  belongs_to :registration
  belongs_to :student

  validates :registration, presence: true
  validates :student, presence: true
  validates :student_id, uniqueness: { scope: :registration_id }

  scope :by_registration, ->(registration_id) { where(registration_id: registration_id) if registration_id.present? }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :registered, -> { where(status: :registered) }
  scope :attended, -> { where(status: :attended) }
end
