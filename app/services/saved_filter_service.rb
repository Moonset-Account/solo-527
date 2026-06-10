class SavedFilterService
  def initialize(user)
    @user = user
  end

  def save(filterable_type:, name:, conditions:)
    @user.saved_filters.create!(
      filterable_type: filterable_type,
      name: name,
      conditions: conditions
    )
  end

  def list(filterable_type:)
    @user.saved_filters.where(filterable_type: filterable_type).order(created_at: :desc)
  end

  def apply(filter)
    filterable_type = filter.filterable_type
    conditions = filter.conditions
    case filterable_type
    when "Registration"
      filter_registrations(conditions)
    when "Schedule"
      filter_schedules(conditions)
    when "Inventory"
      filter_inventories(conditions)
    else
      raise "不支持的筛选类型"
    end
  end

  private

  def filter_registrations(conditions)
    scope = Registration.all
    scope = scope.where(status: conditions["status"]) if conditions["status"].present?
    scope = scope.where(event_id: conditions["event_id"]) if conditions["event_id"].present?
    scope = scope.where(schedule_id: conditions["schedule_id"]) if conditions["schedule_id"].present?
    scope
  end

  def filter_schedules(conditions)
    scope = Schedule.all
    scope = scope.where(event_id: conditions["event_id"]) if conditions["event_id"].present?
    scope = scope.where(venue: conditions["venue"]) if conditions["venue"].present?
    scope
  end

  def filter_inventories(conditions)
    scope = Inventory.joins(:ticket_type)
    scope = scope.where(ticket_types: { event_id: conditions["event_id"] }) if conditions["event_id"].present?
    scope = scope.where(ticket_types: { status: conditions["status"] }) if conditions["status"].present?
    scope
  end
end
