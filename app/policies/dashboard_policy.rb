class DashboardPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
