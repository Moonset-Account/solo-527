class UserPolicy < ApplicationPolicy
  def index?
    user.admin? || user.captain?
  end

  def show?
    user.admin? || user.captain? || record == user
  end

  def create?
    user.admin?
  end

  def new?
    create?
  end

  def update?
    user.admin? || record == user
  end

  def edit?
    update?
  end

  def destroy?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.captain?
        scope.where(role: :driver)
      else
        scope.where(id: user.id)
      end
    end
  end
end
