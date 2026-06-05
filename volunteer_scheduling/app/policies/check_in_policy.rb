class CheckInPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.admin? || record.assignment.volunteer_profile.user == user || record.assignment.activity.project_manager == user
  end

  def create?
    user.present?
  end

  def check_out?
    record.assignment.volunteer_profile.user == user || user.admin?
  end

  def review?
    user.admin?
  end

  def approve?
    user.admin?
  end

  def reject?
    user.admin?
  end

  def manual_check_in?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.project_manager?
        scope.joins(assignment: :activity).where(activities: { project_manager_id: user.id })
      else
        scope.joins(assignment: :volunteer_profile).where(volunteer_profiles: { user_id: user.id })
      end
    end
  end
end
