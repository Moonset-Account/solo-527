class DashboardController < ApplicationController
  def stats
    today = Date.current

    stats = {
      people: {
        total: Person.count,
        active: Person.active.count,
        blacklisted: Person.blacklisted.count,
        new_today: Person.where('DATE(created_at) = ?', today).count
      },
      passes: {
        total: Pass.count,
        active: Pass.active.count,
        pending: Pass.pending.count,
        expired: Pass.expired.count,
        frozen: Pass.frozen_scope.count,
        new_today: Pass.where('DATE(created_at) = ?', today).count
      },
      violations: {
        total: Violation.count,
        this_month: Violation.where('violated_at >= ?', today.beginning_of_month).count,
        pending: Violation.by_status('reported').count
      },
      gate_logs: GateLog.today_stats,
      approvals: {
        pending: Approval.pending.count
      }
    }

    render json: stats
  end

  def recent_activities
    activities = []

    Pass.recent.limit(10).each do |p|
      activities << { type: 'pass', title: "通行证申请: #{p.person.name}", time: p.created_at, data: p }
    end

    Violation.recent.limit(10).each do |v|
      activities << { type: 'violation', title: "违规记录: #{v.violation_type_name}", time: v.violated_at, data: v }
    end

    GateLog.recent.limit(10).each do |g|
      activities << { type: 'gate', title: "门岗记录: #{g.gate_name} #{g.action_name}", time: g.logged_at, data: g }
    end

    activities.sort_by! { |a| a[:time] }.reverse!
    render json: activities.first(20)
  end
end
