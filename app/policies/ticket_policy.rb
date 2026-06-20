class TicketPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    true
  end

  def new?
    create?
  end

  def update?
    return true if user.executive_or_admin?
    record.submitter == user || record.assignee == user
  end

  def edit?
    update?
  end

  def destroy?
    user.executive?
  end

  def update_status?
    return true if user.executive_or_admin?
    record.assignee == user
  end

  def update_assignee?
    user.executive_or_admin?
  end

  def audit?
    user.executive_or_admin?
  end

  class Scope < Scope
    def resolve
      if user.executive_or_admin?
        scope.all
      else
        scope.where(submitter: user).or(scope.where(assignee: user)).or(scope.where(department: user.department))
      end
    end
  end
end
