class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  enum :role, { volunteer: 0, project_manager: 1, admin: 2 }

  has_one :volunteer_profile, dependent: :destroy
  has_many :project_manager_activities, class_name: "Activity", foreign_key: :project_manager_id, dependent: :destroy
  has_many :notifications, foreign_key: :recipient_id, dependent: :destroy
  has_many :admin_confirmations, foreign_key: :admin_id, dependent: :destroy

  after_create :create_volunteer_profile, if: :volunteer?

  validates :name, presence: true
  validates :phone, presence: true, format: { with: /\A1[3-9]\d{9}\z/, message: "格式不正确" }

  def create_volunteer_profile
    VolunteerProfile.create(user: self)
  end
end
