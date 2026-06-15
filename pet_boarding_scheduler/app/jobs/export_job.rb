class ExportJob
  include Sidekiq::Job

  def perform(type, params)
    case type
    when "boarding"
      export_boarding(params)
    when "training"
      export_training(params)
    when "health"
      export_health(params)
    end
  end

  private

  def export_boarding(params)
    start_date = params["start_date"]&.to_date || 30.days.ago.to_date
    end_date = params["end_date"]&.to_date || Date.today

    records = BoardingReservation.where("check_in_at >= ? AND check_in_at <= ?", start_date, end_date)
                                 .includes(:pet, :caretaker, :kennel)
                                 .order(check_in_at: :desc)

    file_path = Rails.root.join("tmp", "exports", "boarding_#{Time.current.to_i}.csv")
    FileUtils.mkdir_p(File.dirname(file_path))

    CSV.open(file_path, "w") do |csv|
      csv << ["入住时间", "离店时间", "宠物名称", "宠物种类", "主理人", "笼位", "状态", "总价", "备注"]
      records.each do |r|
        csv << [
          r.check_in_at.strftime("%Y-%m-%d %H:%M"),
          r.check_out_at&.strftime("%Y-%m-%d %H:%M"),
          r.pet_name,
          r.pet&.species,
          r.caretaker_name,
          r.kennel_name,
          r.status,
          r.total_price,
          r.notes
        ]
      end
    end

    Notification.create!(
      title: "寄养记录导出完成",
      content: "共导出 #{records.count} 条记录。<a href=\"/admin/exports/download/#{File.basename(file_path)}\" class=\"underline font-bold text-indigo-600\">点击下载</a>".html_safe,
      notification_type: "system"
    )
  end

  def export_training(params)
    start_date = params["start_date"]&.to_date || 30.days.ago.to_date
    end_date = params["end_date"]&.to_date || Date.today

    records = TrainingRecord.where("training_date >= ? AND training_date <= ?", start_date, end_date)
                            .includes(:pet, :caretaker, :service)
                            .order(training_date: :desc)

    file_path = Rails.root.join("tmp", "exports", "training_#{Time.current.to_i}.csv")
    FileUtils.mkdir_p(File.dirname(file_path))

    CSV.open(file_path, "w") do |csv|
      csv << ["训练日期", "宠物名称", "主理人", "服务项目", "时长", "状态", "延期原因", "训练内容", "进度", "备注"]
      records.each do |r|
        csv << [
          r.training_date,
          r.pet_name,
          r.caretaker_name,
          r.service_name,
          r.duration_minutes,
          r.status,
          r.delay_reason,
          r.content,
          r.progress,
          r.notes
        ]
      end
    end

    Notification.create!(
      title: "训练记录导出完成",
      content: "共导出 #{records.count} 条记录。<a href=\"/admin/exports/download/#{File.basename(file_path)}\" class=\"underline font-bold text-indigo-600\">点击下载</a>".html_safe,
      notification_type: "system"
    )
  end

  def export_health(params)
    start_date = params["start_date"]&.to_date || 30.days.ago.to_date
    end_date = params["end_date"]&.to_date || Date.today

    records = HealthRecord.where("recorded_at >= ? AND recorded_at <= ?", start_date, end_date)
                          .includes(:pet, :caretaker)
                          .order(recorded_at: :desc)

    file_path = Rails.root.join("tmp", "exports", "health_#{Time.current.to_i}.csv")
    FileUtils.mkdir_p(File.dirname(file_path))

    CSV.open(file_path, "w") do |csv|
      csv << ["记录时间", "宠物名称", "主理人", "体温", "体重", "食欲", "活动量", "症状", "备注"]
      records.each do |r|
        csv << [
          r.recorded_at.strftime("%Y-%m-%d %H:%M"),
          r.pet_name,
          r.caretaker&.name,
          r.temperature,
          r.weight,
          r.appetite_level,
          r.activity_level,
          r.symptoms,
          r.notes
        ]
      end
    end

    Notification.create!(
      title: "健康记录导出完成",
      content: "共导出 #{records.count} 条记录。<a href=\"/admin/exports/download/#{File.basename(file_path)}\" class=\"underline font-bold text-indigo-600\">点击下载</a>".html_safe,
      notification_type: "system"
    )
  end
end
