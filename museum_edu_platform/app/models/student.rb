class Student < ApplicationRecord
  has_paper_trail

  enum :gender, {
    male: 0,
    female: 1,
    other: 2
  }, default: 'male'

  enum :age_group, {
    preschool: 0,
    primary_1_2: 1,
    primary_3_4: 2,
    primary_5_6: 3,
    junior_high: 4,
    senior_high: 5
  }, default: 'primary_1_2'

  enum :status, {
    active: 0,
    inactive: 1
  }, default: 'active'

  belongs_to :school
  has_many :registration_students, dependent: :destroy
  has_many :registrations, through: :registration_students
  has_many :check_ins, dependent: :destroy

  validates :name, presence: true, length: { maximum: 50 }
  validates :gender, presence: true
  validates :age_group, presence: true

  scope :by_school, ->(school_id) { where(school_id: school_id) if school_id.present? }
  scope :by_age_group, ->(age_group) { where(age_group: age_group) if age_group.present? }
  scope :active_students, -> { where(status: :active) }

  def age_group_label
    I18n.t("activerecord.attributes.student.age_groups.#{age_group}", default: age_group.humanize)
  end

  def gender_label
    I18n.t("activerecord.attributes.student.genders.#{gender}", default: gender.humanize)
  end
end
