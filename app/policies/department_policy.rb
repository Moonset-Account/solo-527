class DepartmentPolicy < ApplicationPolicy
  def index?
    user.executive_or_admin?
  end

  def show?
    user.executive_or_admin?
  end

  def create?
    user.executive?
  end

  def new?
    create?
  end

  def update?
    user.executive?
  end

  def edit?
    update?
  end

  def destroy?
    user.executive?
  end
end
