require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 8.0

    config.api_only = true

    config.time_zone = "Beijing"
    config.active_record.default_timezone = :local

    config.i18n.default_locale = :'zh-CN'

    config.generators do |g|
      g.test_framework :rspec
      g.fixture_replacement :factory_bot, dir: 'spec/factories'
    end

    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore, key: '_backend_session'

    config.active_record.async_query_executor = :global_thread_pool
  end
end
