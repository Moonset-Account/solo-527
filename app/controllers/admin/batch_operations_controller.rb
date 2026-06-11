module Admin
  class BatchOperationsController < ApplicationController
    def index
      @batch_logs = BatchOperationLog.includes(:batch_operation_items).recent.page(params[:page]).per(20)
    end

    def new
      @record_types = %w[Appointment WaitingList Doctor TimeSlot Customer ServiceItem]
      @selected_ids = params[:ids]
      @record_type = params[:record_type] || "Appointment"
      @sample_record = safe_constantize(@record_type)&.first
    end

    def preview
      record_type = params[:record_type]
      ids = params[:ids]&.split(",") || []
      attributes = sanitize_attributes(params[:attributes], params[:update_fields])

      if attributes.empty?
        redirect_to new_admin_batch_operation_path(record_type: record_type, ids: params[:ids]),
                    alert: "请至少勾选并填写一个要更新的字段" and return
      end

      model_class = safe_constantize(record_type)
      unless model_class
        redirect_to new_admin_batch_operation_path, alert: "无效的记录类型" and return
      end

      records = model_class.where(id: ids)
      if records.empty?
        redirect_to new_admin_batch_operation_path, alert: "未找到匹配的记录" and return
      end

      @preview_data = BatchOperationLog.new.preview(records, attributes)
      @scope_summary = {
        record_type: record_type,
        total_count: records.count,
        attributes: attributes,
        ids: ids,
        update_fields: params[:update_fields] || {}
      }
    end

    def execute
      record_type = params[:record_type]
      ids = params[:ids]&.split(",") || []
      attributes = sanitize_attributes(params[:attributes], params[:update_fields])

      if attributes.empty?
        redirect_to admin_batch_operations_path, alert: "没有要更新的字段" and return
      end

      model_class = safe_constantize(record_type)
      unless model_class
        redirect_to admin_batch_operations_path, alert: "无效的记录类型" and return
      end

      records = model_class.where(id: ids)
      if records.empty?
        redirect_to admin_batch_operations_path, alert: "未找到匹配的记录" and return
      end

      batch_log = BatchOperationLog.execute(
        "bulk_update_#{record_type.underscore}",
        records,
        attributes,
        operator: current_operator
      )

      redirect_to admin_batch_operation_path(batch_log),
                  notice: "批量处理完成：成功 #{batch_log.success_count} 条，失败 #{batch_log.failed_count} 条"
    end

    def show
      @batch_log = BatchOperationLog.includes(:batch_operation_items).find(params[:id])
      @failed_items = @batch_log.batch_operation_items.failed
      @successful_items = @batch_log.batch_operation_items.successful
    end

    private

    def safe_constantize(name)
      %w[Appointment WaitingList Doctor TimeSlot Customer ServiceItem].include?(name) ? name.constantize : nil
    end

    def sanitize_attributes(raw_attrs, update_fields = nil)
      return {} unless raw_attrs.is_a?(Hash)
      attrs = raw_attrs.to_unsafe_h.select { |_, v| v.present? }
      if update_fields.is_a?(Hash)
        allowed_keys = update_fields.keys.map(&:to_s)
        attrs = attrs.select { |k, _| allowed_keys.include?(k.to_s) }
      end
      attrs
    end
  end
end
