class ReviewConclusionPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.executive_or_admin?
  end

  def new?
    create?
  end

  def update?
    user.executive_or_admin?
  end

  def edit?
    update?
  end

  def destroy?
    user.executive?
  end
end
