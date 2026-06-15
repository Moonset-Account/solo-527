class User < ApplicationRecord
  has_secure_password

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true

  scope :active, -> { where(active: true) }

  ROLES = %w[admin staff manager].freeze

  def admin?
    role == "admin"
  end

  def manager?
    role == "manager" || admin?
  end

  def role_display
    {
      admin: "管理员",
      manager: "经理",
      staff: "员工"
    }.fetch(role.to_sym, role.humanize)
  end
end
