class BookingPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user.present?
  end

  def update?
    user&.admin? || user&.education_teacher?
  end

  def confirm?
    update?
  end

  def cancel?
    update? || (record.created_by == user)
  end

  def check_in?
    user&.admin? || user&.education_teacher? || user&.guide?
  end

  class Scope < Scope
    def resolve
      if user&.admin? || user&.education_teacher?
        scope.all
      elsif user&.school_teacher?
        scope.where(school_id: user.school_id)
      elsif user&.guide?
        scope.joins(course_session: :guides).where(guides: { id: user.guide_id })
      else
        scope.none
      end
    end
  end
end
