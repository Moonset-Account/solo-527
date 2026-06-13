class QualityInspectionPolicy < ApplicationPolicy
  def new?
    user.admin? || user.shop_director?
  end

  def create?
    new?
  end
end
