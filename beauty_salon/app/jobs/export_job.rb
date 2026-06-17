require "csv"

class ExportJob < ApplicationJob
  queue_as :exports

  def perform(model_name, filters)
    records = build_scope(model_name, filters)
    csv_data = generate_csv(records)

    filename = "#{model_name.underscore}_#{Time.current.strftime("%Y%m%d_%H%M%S")}.csv"
    tempfile = Tempfile.new(["export_#{model_name.underscore}", ".csv"])
    tempfile.write(csv_data)
    tempfile.rewind

    notification = Notification.create!(
      recipient: AdminUser.default,
      title: "导出完成",
      body: "#{model_name} 数据已导出完成，共 #{records.count} 条记录",
      category: "export"
    )

    notification.export_file.attach(
      io: tempfile,
      filename: filename,
      content_type: "text/csv"
    )
  ensure
    tempfile&.close&.unlink
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
    CSV.generate(headers: true) do |csv|
      csv << records.first.class.column_names
      records.each do |record|
        csv << record.attributes.values
      end
    end
  end
end
