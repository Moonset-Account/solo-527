module Admin
  class MoldPolicy < ApplicationPolicy
    def index?
      user.admin? || user.shop_director?
    end

    def show?
      index?
    end

    def create?
      user.admin?
    end

    def new?
      create?
    end

    def update?
      user.admin?
    end

    def edit?
      update?
    end

    def destroy?
      user.admin?
    end

    class Scope < Scope
      def resolve
        scope.all
      end
    end
  end
end
