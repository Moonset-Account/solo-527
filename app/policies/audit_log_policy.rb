class AuditLogPolicy < ApplicationPolicy
  def index?
    user.executive_or_admin?
  end

  def show?
    user.executive_or_admin?
  end
end
