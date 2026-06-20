class AuditLogPolicy < ApplicationPolicy
  def index?
    user.executive_or_admin?
  end

  def show?
    user.executive_or_admin?
  end

  class Scope < Scope
    def resolve
      if user.executive_or_admin?
        scope.all
      else
        scope.none
      end
    end
  end
end
