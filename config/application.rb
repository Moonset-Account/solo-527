require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module Work0019
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks])
    config.time_zone = "Beijing"
    config.active_job.queue_adapter = :sidekiq
    config.i18n.default_locale = :zh
  end
end
