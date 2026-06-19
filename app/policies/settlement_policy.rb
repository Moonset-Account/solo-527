class SettlementPolicy < ApplicationPolicy
  def index?
    user.admin? || user.captain? || user.driver?
  end

  def show?
    user.admin? || user.captain? || record.driver_id == user.id
  end

  def create?
    user.admin? || user.captain?
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

  def generate?
    user.admin? || user.captain?
  end

  def approve?
    user.admin?
  end

  def pay?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin? || user.captain?
        scope.all
      else
        scope.where(driver_id: user.id)
      end
    end
  end
end
