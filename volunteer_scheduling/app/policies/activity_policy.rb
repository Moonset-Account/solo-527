class ActivityPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user.project_manager? || user.admin?
  end

  def update?
    user.admin? || record.project_manager == user
  end

  def edit?
    update?
  end

  def destroy?
    user.admin?
  end

  def publish?
    update?
  end

  def manage_locations?
    update?
  end

  def assign_volunteers?
    update?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
