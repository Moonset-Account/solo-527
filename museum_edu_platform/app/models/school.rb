class School < ApplicationRecord
  has_paper_trail

  enum :status, {
    active: 0,
    inactive: 1
  }, default: 'active'

  has_many :students, dependent: :destroy
  has_many :registrations, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validates :contact_person, presence: true
  validates :phone, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  scope :active_schools, -> { where(status: :active) }
  scope :by_name, ->(name) { where('name LIKE ?', "%#{name}%") if name.present? }

  def student_count
    students.active_students.count
  end
end
