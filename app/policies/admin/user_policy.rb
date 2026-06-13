module Admin
  class UserPolicy < ApplicationPolicy
    def index?
      user.admin?
    end

    def show?
      index?
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
