class VolunteerProfile < ApplicationRecord
  belongs_to :user

  has_many :volunteer_skills, dependent: :destroy
  has_many :skills, through: :volunteer_skills
  has_many :availabilities, dependent: :destroy
  has_many :emergency_contacts, dependent: :destroy
  has_many :guardians, dependent: :destroy
  has_many :assignments, dependent: :destroy
  has_many :check_ins, through: :assignments
  has_many :service_certificates, dependent: :destroy

  geocoded_by :address
  # after_validation :geocode, if: ->(obj) { obj.address.present? && obj.address_changed? }

  validates :birth_date, presence: true
  validate :validate_guardian_info_if_minor

  before_save :check_if_minor

  def check_if_minor
    if birth_date.present?
      self.is_minor = age < 18
    end
  end

  def age
    return 0 unless birth_date.present?
    now = Time.current.to_date
    age = now.year - birth_date.year
    age -= 1 if now < birth_date + age.years
    age
  end

  def validate_guardian_info_if_minor
    if is_minor? && guardians.empty?
      errors.add(:base, "未成年人必须填写监护人信息")
    end
  end

  def total_service_hours
    check_ins.approved.sum(:service_hours)
  end

  def available_at?(datetime)
    day_of_week = datetime.wday
    time = datetime.strftime("%H:%M:%S")
    availabilities.where(day_of_week: day_of_week).where("start_time <= ? AND end_time >= ?", time, time).exists?
  end

  def has_skill?(skill_id)
    skills.exists?(skill_id)
  end

  def distance_to(location)
    return Float::INFINITY unless latitude && longitude && location.latitude && location.longitude
    Geocoder::Calculations.distance_between([latitude, longitude], [location.latitude, location.longitude])
  end
end
