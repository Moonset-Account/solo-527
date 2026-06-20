class BatchJobPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    record.user_id == user.id || can_access_admin?
  end

  class Scope < Scope
    def resolve
      if can_access_admin?
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end
  end
end
