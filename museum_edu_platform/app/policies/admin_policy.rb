class AdminPolicy < ApplicationPolicy
  def access?
    user&.admin? || user&.teacher?
  end
end
