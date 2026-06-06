class DashboardPolicy < ApplicationPolicy
  def overview?
    user.present?
  end

  def guide_utilization?
    user.present?
  end

  def session_occupancy?
    user.present?
  end

  def bottlenecks?
    user.can_manage?
  end

  def export?
    user.present?
  end
end
