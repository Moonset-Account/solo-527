PaperTrail.config.enabled = true
PaperTrail.config.has_paper_trail_defaults = {
  on: [:create, :update, :destroy]
}
PaperTrail.config.object_changes_adapter = PaperTrail::Serializers::YAML
PaperTrail.config.version_limit = nil

Rails.application.config.after_initialize do
  yaml_permitted = [
    Date, Time, DateTime, BigDecimal, Symbol,
    ActiveSupport::TimeWithZone, ActiveSupport::TimeZone,
    ActiveSupport::Duration, ActiveSupport::HashWithIndifferentAccess
  ]
  if ActiveRecord.respond_to?(:yaml_column_permitted_classes=)
    ActiveRecord.yaml_column_permitted_classes |= yaml_permitted
  end
  if ActiveRecord::Base.respond_to?(:yaml_column_permitted_classes=)
    ActiveRecord::Base.yaml_column_permitted_classes |= yaml_permitted
  end
end
