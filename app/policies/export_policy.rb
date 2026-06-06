class ExportPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user == record.user || user.can_manage?
  end

  def create?
    user.present?
  end

  def download?
    user == record.user || user.can_manage?
  end

  class Scope < Scope
    def resolve
      if user.can_manage?
        scope.all
      else
        scope.where(user: user)
      end
    end
  end
end
