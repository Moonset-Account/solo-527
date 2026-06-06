Ransack.configure do |config|
  config.sanitize_custom_scope_booleans = true
end

module Ransackable
  extend ActiveSupport::Concern

  included do
    def self.ransackable_attributes(auth_object = nil)
      column_names + _ransackers.keys
    end

    def self.ransackable_associations(auth_object = nil)
      reflect_on_all_associations.map { |a| a.name.to_s }
    end

    def self.ransackable_scopes(auth_object = nil)
      []
    end
  end
end
