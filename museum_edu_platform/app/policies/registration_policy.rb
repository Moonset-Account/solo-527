class RegistrationPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user&.admin? || user&.teacher? || record.user == user
  end

  def create?
    user.present?
  end

  def new?
    create?
  end

  def update?
    user&.admin? || user&.teacher?
  end

  def approve?
    user&.admin? || user&.teacher?
  end

  def reject?
    user&.admin? || user&.teacher?
  end

  def cancel?
    user&.admin? || user&.teacher? || record.user == user
  end

  def my_registrations?
    user.present?
  end

  class Scope < Scope
    def resolve
      if user.admin? || user.teacher?
        scope.all
      else
        scope.where(user: user)
      end
    end
  end
end
