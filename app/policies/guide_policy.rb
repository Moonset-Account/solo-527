class GuidePolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user&.admin? || user&.education_teacher?
  end

  def update?
    create?
  end

  def destroy?
    user&.admin?
  end
end
