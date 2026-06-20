class CourseEnrollmentPolicy < ApplicationPolicy
  def index?
    can_access_admin? || member?
  end

  def show?
    can_access_admin? || record.user == user
  end

  def create?
    member?
  end

  def update?
    can_access_admin?
  end

  def destroy?
    admin?
  end

  def cancel?
    can_access_admin? || record.user == user
  end

  def export?
    can_access_admin?
  end

  class Scope < Scope
    def resolve
      if can_access_admin?
        scope.all
      else
        scope.where(user: user)
      end
    end
  end
end
