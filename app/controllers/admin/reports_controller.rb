module Admin
  class ReportsController < ApplicationController
    def daily_load
      @start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
      @end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
      @doctors = Doctor.active

      @load_data = @doctors.map do |doctor|
        {
          doctor: doctor,
          daily_stats: (@start_date..@end_date).map do |date|
            {
              date: date,
              appointment_count: doctor.daily_appointments_count(date),
              load_ratio: doctor.daily_load_ratio(date),
              waiting_count: doctor.waiting_lists.where(created_at: date.all_day).count
            }
          end
        }
      end

      respond_to do |format|
        format.html
        format.csv do
          send_data generate_load_csv,
                    filename: "daily_load_#{@start_date}_#{@end_date}.csv",
                    type: "text/csv; charset=utf-8"
        end
      end
    end

    def no_shows
      @start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
      @end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today

      @no_show_appointments = Appointment.no_show
                                         .includes(:customer, :doctor, :time_slot, :waiting_list)
                                         .where(appointment_date: @start_date..@end_date)
                                         .order(appointment_date: :desc)
                                         .page(params[:page]).per(50)

      @no_show_stats = {
        total: @no_show_appointments.total_count,
        total_customers: @no_show_appointments.pluck(:customer_id).uniq.count,
        repeat_offenders: Customer.where("no_show_count > 1").count
      }

      respond_to do |format|
        format.html
        format.csv do
          send_data generate_no_show_csv,
                    filename: "no_shows_#{@start_date}_#{@end_date}.csv",
                    type: "text/csv; charset=utf-8"
        end
      end
    end

    def export_details
      @start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
      @end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today

      @appointments = Appointment.includes(
        :customer, :doctor, :time_slot, :waiting_list,
        appointment_service_items: [:service_item],
        refund_records: []
      ).where(appointment_date: @start_date..@end_date).order(appointment_date: :desc)

      @reconciliation_data = @appointments.map(&:reconciliation_data)

      respond_to do |format|
        format.html do
          @summary_stats = calculate_summary
        end
        format.csv do
          send_data generate_details_csv,
                    filename: "details_export_#{@start_date}_#{@end_date}.csv",
                    type: "text/csv; charset=utf-8"
        end
      end
    end

    private

    def calculate_summary
      total = @appointments.count
      completed = @appointments.completed.count
      cancelled = @appointments.cancelled.count
      no_shows = @appointments.no_show.count
      total_revenue = @appointments.sum(:paid_amount)
      total_refund = @appointments.sum(:refunded_amount)

      {
        total_count: total,
        completed_count: completed,
        cancelled_count: cancelled,
        no_show_count: no_shows,
        conversion_rate: @appointments.from_waiting_list.count > 0 ? (@appointments.from_waiting_list.count.to_f / total * 100).round(1) : 0,
        total_revenue: total_revenue,
        total_refund: total_refund,
        net_revenue: total_revenue - total_refund
      }
    end

    def generate_load_csv
      CSV.generate(headers: true) do |csv|
        csv << ["日期", "医生", "科室", "预约数", "最大接待量", "负荷率(%)", "候补入队数"]

        @doctors.each do |doctor|
          (@start_date..@end_date).each do |date|
            csv << [
              date.to_s,
              doctor.name,
              doctor.department,
              doctor.daily_appointments_count(date),
              doctor.daily_max_patients,
              doctor.daily_load_ratio(date),
              doctor.waiting_lists.where(created_at: date.all_day).count
            ]
          end
        end
      end
    end

    def generate_no_show_csv
      CSV.generate(headers: true) do |csv|
        csv << ["预约单号", "预约日期", "客户姓名", "手机号", "医生",
                "时段", "候补来源", "历史爽约次数", "最后处理时间", "备注"]

        @no_show_appointments.each do |apt|
          csv << [
            apt.appointment_no,
            apt.appointment_date&.strftime("%Y-%m-%d %H:%M"),
            apt.customer&.name,
            apt.customer&.phone,
            apt.doctor&.name,
            apt.time_slot&.start_time&.strftime("%Y-%m-%d %H:%M"),
            apt.from_waiting_list ? "是" : "否",
            apt.customer&.no_show_count,
            apt.updated_at&.strftime("%Y-%m-%d %H:%M:%S"),
            apt.notes
          ]
        end
      end
    end

    def generate_details_csv
      CSV.generate(headers: true) do |csv|
        csv << [
          "预约单号", "日期", "客户姓名", "手机号", "医生",
          "时段", "状态", "候补来源", "服务项目", "服务数量",
          "总金额", "已付金额", "退款金额", "净收入",
          "退款次数", "候补追踪码", "创建时间", "操作员", "备注"
        ]

        @appointments.each do |apt|
          apt.appointment_service_items.each do |item|
            csv << [
              apt.appointment_no,
              apt.appointment_date&.strftime("%Y-%m-%d"),
              apt.customer&.name,
              apt.customer&.phone,
              apt.doctor&.name,
              apt.time_slot&.start_time&.strftime("%Y-%m-%d %H:%M"),
              status_text(apt.status),
              apt.from_waiting_list ? "是" : "否",
              item.service_item&.name,
              item.quantity,
              apt.total_amount,
              apt.paid_amount,
              apt.refunded_amount,
              apt.paid_amount - apt.refunded_amount,
              apt.refund_records.count,
              apt.waiting_list&.tracking_code,
              apt.created_at&.strftime("%Y-%m-%d %H:%M:%S"),
              apt.operator,
              apt.notes
            ]
          end

          if apt.appointment_service_items.empty?
            csv << [
              apt.appointment_no,
              apt.appointment_date&.strftime("%Y-%m-%d"),
              apt.customer&.name,
              apt.customer&.phone,
              apt.doctor&.name,
              apt.time_slot&.start_time&.strftime("%Y-%m-%d %H:%M"),
              status_text(apt.status),
              apt.from_waiting_list ? "是" : "否",
              "", "",
              apt.total_amount,
              apt.paid_amount,
              apt.refunded_amount,
              apt.paid_amount - apt.refunded_amount,
              apt.refund_records.count,
              apt.waiting_list&.tracking_code,
              apt.created_at&.strftime("%Y-%m-%d %H:%M:%S"),
              apt.operator,
              apt.notes
            ]
          end
        end
      end
    end

    def status_text(status)
      {
        "pending" => "待确认",
        "confirmed" => "已确认",
        "completed" => "已完成",
        "cancelled" => "已取消",
        "no_show" => "爽约",
        "refunded" => "已退款"
      }[status] || status
    end
  end
end
