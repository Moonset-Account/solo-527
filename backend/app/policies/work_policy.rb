class WorkPolicy < ApplicationPolicy
  def index?
    true
  end

  def my?
    user&.student?
  end

  def show?
    record.public? || user&.admin? || record.student_id == user&.id
  end

  def create?
    user&.student?
  end

  def update?
    user&.admin? || record.student_id == user&.id
  end

  def authorize_public?
    user&.student? && record.student_id == user&.id
  end

  def approve?
    user&.admin?
  end

  def reject?
    user&.admin?
  end
end
