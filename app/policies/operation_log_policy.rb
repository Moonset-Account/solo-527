class OperationLogPolicy < ApplicationPolicy
  def index?
    user.admin? || user.captain? || user.driver?
  end

  def show?
    user.admin? || user.captain? || record.user_id == user.id
  end

  def create?
    user.admin?
  end

  def new?
    create?
  end

  def update?
    user.admin?
  end

  def edit?
    update?
  end

  def destroy?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin? || user.captain?
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end
  end
end
