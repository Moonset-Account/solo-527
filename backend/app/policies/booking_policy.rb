class BookingPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.admin? || user.teacher? || record.student.user_id == user.id
  end

  def create?
    user.student?
  end

  def update?
    user.admin?
  end

  def destroy?
    user.super_admin?
  end

  def cancel?
    user.admin? || record.student.user_id == user.id
  end

  def approve?
    user.admin?
  end

  def reject?
    user.admin?
  end

  def check_in?
    user.admin? || user.teacher?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.joins(course_session: :teacher).where(teachers: { user_id: user.id })
      else
        scope.where(student: user.student)
      end
    end
  end
end
