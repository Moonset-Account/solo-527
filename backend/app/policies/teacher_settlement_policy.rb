class TeacherSettlementPolicy < ApplicationPolicy
  def index?
    user.admin? || user.teacher?
  end

  def show?
    user.admin? || (user.teacher? && record.teacher.user_id == user.id)
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

  def approve?
    user.admin?
  end

  def reject?
    user.admin?
  end

  def mark_paid?
    user.admin?
  end

  def submit?
    user.admin? || (user.teacher? && record.teacher.user_id == user.id)
  end

  def pay?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.where(teacher: user.teacher)
      else
        scope.none
      end
    end
  end
end
