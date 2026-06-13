class ExportPolicy < ApplicationPolicy
  def index?
    user.admin? || user.shop_director?
  end

  def work_orders?
    user.admin? || user.shop_director?
  end

  def quality_inspections?
    work_orders?
  end

  def process_efficiencies?
    work_orders?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
