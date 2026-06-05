class LocationPolicy < ApplicationPolicy
  def show?
    user.present?
  end

  def new?
    create?
  end

  def create?
    user.project_manager? || user.admin?
  end

  def edit?
    update?
  end

  def update?
    user.admin? || record.activity.project_manager == user
  end

  def destroy?
    user.admin? || record.activity.project_manager == user
  end
end
