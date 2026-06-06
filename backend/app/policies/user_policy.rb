class UserPolicy < ApplicationPolicy
  def index?
    user.admin? || user.super_admin?
  end

  def show?
    user.admin? || user.super_admin? || user == record
  end

  def create?
    user.super_admin?
  end

  def update?
    user.super_admin? || user == record
  end

  class Scope < Scope
    def resolve
      if user.admin? || user.super_admin?
        scope.all
      else
        scope.where(id: user.id)
      end
    end
  end
end
