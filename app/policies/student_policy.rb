class StudentPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user&.admin? || user&.education_teacher? || user&.school_teacher?
  end

  def update?
    create?
  end

  def destroy?
    user&.admin?
  end

  class Scope < Scope
    def resolve
      if user&.admin? || user&.education_teacher?
        scope.all
      elsif user&.school_teacher?
        scope.where(school_id: user.school_id)
      else
        scope.none
      end
    end
  end
end
