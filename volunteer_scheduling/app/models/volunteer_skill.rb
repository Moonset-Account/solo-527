class VolunteerSkill < ApplicationRecord
  belongs_to :volunteer_profile
  belongs_to :skill

  validates :skill_id, uniqueness: { scope: :volunteer_profile_id }
  validates :proficiency, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
end
