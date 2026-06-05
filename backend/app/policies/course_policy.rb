class CoursePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.admin?
  end

  def update?
    user.admin?
  end

  def destroy?
    user.super_admin?
  end

  def publish?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      else
        scope.published
      end
    end
  end
end
