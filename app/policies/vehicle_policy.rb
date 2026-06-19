class VehiclePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.admin? || user.captain?
  end

  def new?
    create?
  end

  def update?
    user.admin? || user.captain?
  end

  def edit?
    update?
  end

  def destroy?
    user.admin? || user.captain?
  end

  class Scope < Scope
    def resolve
      if user.admin? || user.captain?
        scope.all
      elsif user.driver?
        scope.where(current_driver_id: user.id)
      else
        scope.all
      end
    end
  end
end
