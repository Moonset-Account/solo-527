class ExportJob < ApplicationJob
  queue_as :exports

  def perform(model_name, filters, recipient_type, recipient_id)
    records = build_scope(model_name, filters)
    csv_data = generate_csv(records)

    tmpfile = Tempfile.new(["export_#{model_name}", ".csv"])
    tmpfile.write(csv_data)
    tmpfile.rewind

    Notification.create!(
      recipient_type: recipient_type,
      recipient_id: recipient_id,
      title: "导出完成",
      body: "#{model_name} 数据已导出完成，共 #{records.count} 条记录",
      category: "export"
    )
  ensure
    tmpfile&.close&.unlink
  end

  private

  def build_scope(model_name, filters)
    klass = model_name.constantize
    scope = klass.all
    filters.each do |key, value|
      next if value.blank?
      if klass.respond_to?("by_#{key}")
        scope = scope.public_send("by_#{key}", value)
      elsif klass.column_names.include?(key.to_s)
        scope = scope.where(key => value)
      end
    end
    scope
  end

  def generate_csv(records)
    return "" if records.empty?
    CSV.generate do |csv|
      csv << records.first.class.column_names
      records.each do |record|
        csv << record.attributes.values
      end
    end
  end
end
