class VolunteerProfilePolicy < ApplicationPolicy
  def show?
    user.admin? || record.user == user || user.project_manager?
  end

  def update?
    user.admin? || record.user == user
  end

  def edit?
    update?
  end

  def manage_skills?
    update?
  end

  def manage_availabilities?
    update?
  end

  def manage_emergency_contacts?
    update?
  end

  def manage_guardians?
    update?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.project_manager?
        scope.all
      else
        scope.where(user: user)
      end
    end
  end
end
