class PaymentPolicy < ApplicationPolicy
  def index?
    user.admin? || user.teacher? || record.student.user_id == user.id
  end

  def show?
    user.admin? || record.student.user_id == user.id
  end

  def create?
    user.student?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.joins(booking: { course_session: :teacher })
          .where(teachers: { user_id: user.id })
      else
        scope.where(student: user.student)
      end
    end
  end
end
