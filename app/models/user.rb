class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  enum :role, { admin: 0, shop_director: 1 }

  has_many :quality_inspections, foreign_key: :inspector_id
  has_many :audit_logs, foreign_key: :user_id
  has_many :resolved_failed_batches, foreign_key: :resolved_by_id, class_name: 'FailedBatch'

  validates :name, presence: true
  validates :role, presence: true
  validates :phone, presence: true, allow_nil: true

  audited

  scope :admins, -> { where(role: :admin) }
  scope :shop_directors, -> { where(role: :shop_director) }
  scope :active, -> { where(encrypted_password) }

  def display_name
    name || email
  end

  def role_name
    I18n.t("enums.user.role.#{role}", default: role.humanize)
  end
end
