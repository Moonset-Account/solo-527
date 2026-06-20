class CheckInPolicy < ApplicationPolicy
  def index?
    can_access_admin? || member?
  end

  def show?
    can_access_admin? || record.user == user
  end

  def create?
    can_access_admin?
  end

  def update?
    can_access_admin?
  end

  def check_in?
    can_access_admin?
  end

  def bulk_check_in?
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
