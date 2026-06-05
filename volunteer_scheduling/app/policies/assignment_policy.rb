class AssignmentPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.admin? || record.volunteer_profile.user == user || record.activity.project_manager == user
  end

  def create?
    user.project_manager? || user.admin?
  end

  def update?
    user.admin? || record.activity.project_manager == user
  end

  def accept?
    record.volunteer_profile.user == user
  end

  def decline?
    record.volunteer_profile.user == user
  end

  def swap?
    user.project_manager? || user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin? || user.project_manager?
        scope.all
      else
        scope.where(volunteer_profile: user.volunteer_profile)
      end
    end
  end
end
