class VolunteerServiceAssignment < ApplicationRecord
  belongs_to :volunteer_service
  belongs_to :user

  validates :volunteer_service_id, uniqueness: { scope: :user_id }
end
