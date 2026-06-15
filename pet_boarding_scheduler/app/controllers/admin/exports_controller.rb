module Admin
  class ExportsController < ApplicationController
    EXPORT_TYPES = %w[boarding training health].freeze

    def boarding
      handle_export("boarding")
    end

    def training
      handle_export("training")
    end

    def health
      handle_export("health")
    end

    def download
      filename = params[:filename]
      filepath = Rails.root.join("tmp", "exports", filename)

      if File.exist?(filepath) && filename.match?(/\A[a-z]+_\d+\.csv\z/)
        send_file filepath, type: "text/csv", disposition: "attachment"
      else
        redirect_to admin_root_path, alert: "文件不存在或已过期。"
      end
    end

    private

    def handle_export(type)
      @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
      @end_date = params[:end_date]&.to_date || Date.today
      export_params = { "start_date" => @start_date.to_s, "end_date" => @end_date.to_s }

      if params[:async] == "true"
        ExportJob.perform_async(type, export_params)
        redirect_back fallback_location: admin_root_path, notice: "异步导出任务已提交，完成后将通过通知提醒您。"
        return
      end

      scope = case type
              when "boarding"
                BoardingReservation.where("check_in_at >= ? AND check_in_at <= ?", @start_date, @end_date)
                                   .includes(:pet, :caretaker, :kennel)
                                   .order(check_in_at: :desc)
              when "training"
                TrainingRecord.where("training_date >= ? AND training_date <= ?", @start_date, @end_date)
                              .includes(:pet, :caretaker, :service)
                              .order(training_date: :desc)
              when "health"
                HealthRecord.where("recorded_at >= ? AND recorded_at <= ?", @start_date, @end_date)
                            .includes(:pet, :caretaker)
                            .order(recorded_at: :desc)
              end

      respond_to do |format|
        format.csv do
          csv_data = generate_csv(type, scope)
          send_data csv_data, filename: "#{type}_records_#{Date.today}.csv", type: "text/csv"
        end
        format.html do
          render_export_form(type)
        end
      end
    end

    def generate_csv(type, scope)
      CSV.generate(headers: true) do |csv|
        case type
        when "boarding"
          csv << ["入住时间", "离店时间", "宠物名称", "宠物种类", "主理人", "笼位", "状态", "总价", "备注"]
          scope.each do |r|
            csv << [
              r.check_in_at.strftime("%Y-%m-%d %H:%M"),
              r.check_out_at&.strftime("%Y-%m-%d %H:%M"),
              r.pet_name,
              r.pet&.species,
              r.caretaker_name,
              r.kennel_name,
              status_label("boarding", r.status),
              r.total_price,
              r.notes
            ]
          end
        when "training"
          csv << ["训练日期", "宠物名称", "主理人", "服务项目", "时长(分钟)", "状态", "延期原因", "训练内容", "进度", "备注"]
          scope.each do |r|
            csv << [
              r.training_date,
              r.pet_name,
              r.caretaker_name,
              r.service_name,
              r.duration_minutes,
              status_label("training", r.status),
              r.delay_reason,
              r.content,
              r.progress,
              r.notes
            ]
          end
        when "health"
          csv << ["记录时间", "宠物名称", "主理人", "体温", "体重", "食欲", "活动量", "症状", "备注"]
          scope.each do |r|
            csv << [
              r.recorded_at.strftime("%Y-%m-%d %H:%M"),
              r.pet_name,
              r.caretaker&.name,
              r.temperature,
              r.weight,
              r.appetite_display,
              r.activity_display,
              r.symptoms,
              r.notes
            ]
          end
        end
      end
    end

    def status_label(type, status)
      labels = {
        boarding: { "scheduled" => "已预约", "checked_in" => "入住中", "completed" => "已完成", "cancelled" => "已取消" },
        training: { "scheduled" => "已安排", "completed" => "已完成", "delayed" => "延期", "cancelled" => "已取消" }
      }
      labels.dig(type.to_sym, status) || status
    end

    def render_export_form(type)
      @type = type
      @type_name = { "boarding" => "寄养记录", "training" => "训练记录", "health" => "健康记录" }[type]
      render :form
    end
  end
end
