module Admin
  class FailedBatchPolicy < ApplicationPolicy
    def index?
      user.admin? || user.shop_director?
    end

    def show?
      index?
    end

    def update?
      user.admin? || user.shop_director?
    end

    def retry?
      update?
    end

    def resolve?
      update?
    end

    class Scope < Scope
      def resolve
        scope.all
      end
    end
  end
end
