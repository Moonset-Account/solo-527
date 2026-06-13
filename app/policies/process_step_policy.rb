class ProcessStepPolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    user.admin? || user.shop_director?
  end

  def start?
    update?
  end

  def pause?
    update?
  end

  def resume?
    update?
  end

  def complete?
    update?
  end

  def continue_processing?
    update?
  end
end
