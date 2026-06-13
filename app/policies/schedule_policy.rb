class SchedulePolicy < ApplicationPolicy
  def index?
    user.admin? || user.shop_director?
  end

  def show?
    index?
  end

  def by_team?
    index?
  end

  def by_equipment?
    index?
  end

  def gantt?
    index?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
