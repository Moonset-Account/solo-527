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
  alias_method :edit_skills?, :manage_skills?
  alias_method :update_skills?, :manage_skills?

  def manage_availabilities?
    update?
  end
  alias_method :edit_availabilities?, :manage_availabilities?
  alias_method :update_availabilities?, :manage_availabilities?

  def manage_emergency_contacts?
    update?
  end
  alias_method :edit_emergency_contacts?, :manage_emergency_contacts?
  alias_method :update_emergency_contacts?, :manage_emergency_contacts?

  def manage_guardians?
    update?
  end
  alias_method :edit_guardians?, :manage_guardians?
  alias_method :update_guardians?, :manage_guardians?

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
