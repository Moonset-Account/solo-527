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

  class Scope < Scope
    def resolve
      if user.executive_or_admin?
        scope.all
      else
        scope.joins(:ticket).where(tickets: { submitter_id: user.id }).or(
          scope.joins(:ticket).where(tickets: { assignee_id: user.id })
        ).or(
          scope.joins(:ticket).where(tickets: { department_id: user.department_id })
        )
      end
    end
  end
end
