class EventPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    can_access_admin?
  end

  def update?
    can_access_admin?
  end

  def destroy?
    admin?
  end

  def register?
    member?
  end

  def generate_schedules?
    can_access_admin?
  end

  def export?
    can_access_admin?
  end

  class Scope < Scope
    def resolve
      if can_access_admin?
        scope.all
      else
        scope.where(status: %w[open in_progress completed])
      end
    end
  end
end
