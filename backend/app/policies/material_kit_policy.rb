class MaterialKitPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user&.admin?
  end

  def update?
    user&.admin?
  end

  def restock?
    user&.admin?
  end

  def deduct_stock?
    user&.admin?
  end
end
