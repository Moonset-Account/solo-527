class PassWorkZone < ApplicationRecord
  belongs_to :pass
  belongs_to :work_zone

  validates :pass_id, uniqueness: { scope: :work_zone_id }
end
