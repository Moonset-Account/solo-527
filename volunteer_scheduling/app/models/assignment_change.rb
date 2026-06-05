class AssignmentChange < ApplicationRecord
  belongs_to :assignment
  belongs_to :changed_by, class_name: "User"
  belongs_to :old_volunteer_profile, class_name: "VolunteerProfile", optional: true
  belongs_to :new_volunteer_profile, class_name: "VolunteerProfile", optional: true

  validates :changed_at, presence: true
end
