class MaterialPackagePolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user.admin?
  end

  def update?
    user.admin?
  end

  def destroy?
    user.super_admin?
  end

  def stock_in?
    user.admin?
  end

  def stock_out?
    user.admin?
  end
end
