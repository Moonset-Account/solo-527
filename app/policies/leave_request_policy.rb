class LeaveRequestPolicy < ApplicationPolicy
  def index?
    can_access_admin? || member?
  end

  def show?
    can_access_admin? || record.user == user
  end

  def create?
    member?
  end

  def update?
    can_access_admin?
  end

  def approve?
    can_access_admin?
  end

  def reject?
    can_access_admin?
  end

  class Scope < Scope
    def resolve
      if can_access_admin?
        scope.all
      else
        scope.where(user: user)
      end
    end
  end
end
