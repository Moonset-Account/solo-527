class ArtworkPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    record.is_public? || user.admin? || (user.present? && record.student.user_id == user.id)
  end

  def create?
    user.student?
  end

  def update?
    user.admin? || (user.student? && record.student.user_id == user.id)
  end

  def destroy?
    user.super_admin? || (user.student? && record.student.user_id == user.id)
  end

  def publish?
    user.admin? || (user.student? && record.student.user_id == user.id)
  end

  def approve?
    user.admin?
  end

  def reject?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.student?
        scope.where('is_public = ? OR student_id = ?', true, user.student.id)
      else
        scope.public_artworks
      end
    end
  end
end
