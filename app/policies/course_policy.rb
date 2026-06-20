class CoursePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    can_access_admin?
  end

  def update?
    can_access_admin?
  end

  def destroy?
    admin?
  end

  def enroll?
    member?
  end

  def export?
    can_access_admin?
  end

  class Scope < Scope
    def resolve
      if can_access_admin?
        scope.all
      else
        scope.active
      end
    end
  end
end
