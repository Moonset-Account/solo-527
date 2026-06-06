class EnrollmentPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def my?
    user&.student?
  end

  def show?
    user&.admin? || record.student_id == user&.id
  end

  def create?
    user&.student?
  end

  def pay?
    user&.student? && record.student_id == user&.id
  end

  def cancel?
    user&.admin? || (user&.student? && record.student_id == user&.id)
  end

  def request_refund?
    user&.student? && record.student_id == user&.id
  end

  def approve_refund?
    user&.admin?
  end

  def reject_refund?
    user&.admin?
  end

  def complete?
    user&.admin?
  end
end
