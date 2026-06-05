class NotificationJob < ApplicationJob
  queue_as :default

  def perform(notifiable, notification_type, actor = nil)
    case notification_type
    when 'pass_created'
      handle_pass_created(notifiable, actor)
    when 'pass_approved'
      handle_pass_approved(notifiable, actor)
    when 'pass_rejected'
      handle_pass_rejected(notifiable, actor)
    when 'pass_expiring'
      handle_pass_expiring(notifiable)
    when 'violation_reported'
      handle_violation_reported(notifiable, actor)
    end
  end

  private

  def handle_pass_created(pass, actor)
    approvers = User.where(role: %w[admin approver safety_officer]).where(active: true)

    approvers.each do |approver|
      Notification.create!(
        recipient: approver,
        title: '新通行证待审批',
        content: "#{actor&.real_name || '系统'} 提交了新的通行证申请，申请人：#{pass.person.name}",
        notification_type: 'approval_required',
        notifiable: pass,
        priority: 'high'
      )
    end
  end

  def handle_pass_approved(pass, actor)
    if pass.creator
      Notification.create!(
        recipient: pass.creator,
        title: '通行证审批通过',
        content: "您申请的通行证 #{pass.pass_number} 已被 #{actor&.real_name || '审批人'} 审批通过",
        notification_type: 'pass_approved',
        notifiable: pass
      )
    end
  end

  def handle_pass_rejected(pass, actor)
    if pass.creator
      Notification.create!(
        recipient: pass.creator,
        title: '通行证被拒绝',
        content: "您申请的通行证 #{pass.pass_number} 被 #{actor&.real_name || '审批人'} 拒绝",
        notification_type: 'pass_rejected',
        notifiable: pass,
        priority: 'high'
      )
    end
  end

  def handle_pass_expiring(pass)
    if pass.creator
      Notification.create!(
        recipient: pass.creator,
        title: '通行证即将过期',
        content: "通行证 #{pass.pass_number} 即将于 #{pass.valid_until.strftime('%Y-%m-%d %H:%M')} 过期，请及时续期",
        notification_type: 'pass_expiring',
        notifiable: pass,
        priority: 'normal'
      )
    end
  end

  def handle_violation_reported(violation, actor)
    safety_officers = User.where(role: %w[admin safety_officer]).where(active: true)

    safety_officers.each do |officer|
      Notification.create!(
        recipient: officer,
        title: '新违规记录上报',
        content: "#{actor&.real_name || '系统'} 上报了新的违规记录：#{violation.violation_type_name}",
        notification_type: 'violation_reported',
        notifiable: violation,
        priority: violation.severity == 'critical' ? 'high' : 'normal'
      )
    end
  end
end
