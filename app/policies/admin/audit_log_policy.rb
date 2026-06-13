module Admin
  class AuditLogPolicy < ApplicationPolicy
    def index?
      user.admin? || user.shop_director?
    end

    class Scope < Scope
      def resolve
        scope.all
      end
    end
  end
end
