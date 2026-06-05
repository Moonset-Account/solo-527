class Guardian < ApplicationRecord
  belongs_to :volunteer_profile

  validates :name, presence: true
  validates :relationship, presence: true
  validates :phone, presence: true, format: { with: /\A1[3-9]\d{9}\z/, message: "格式不正确" }
  validates :consent_given, inclusion: { in: [true, false], message: "必须给予同意" }
end
