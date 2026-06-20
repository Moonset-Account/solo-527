source "https://rubygems.org"

gem "rails", "~> 8.1.3"
gem "propshaft"
gem "pg", "~> 1.1"
gem "puma", ">= 5.0"
gem "jsbundling-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "cssbundling-rails"
gem "bcrypt", "~> 3.1.7"
gem "tzinfo-data", platforms: %i[ windows jruby ]
gem "bootsnap", require: false
gem "image_processing", "~> 1.2"

gem "sidekiq"
gem "devise"
gem "pundit"
gem "paper_trail"
gem "aasm"
gem "kaminari"
gem "ransack"

group :development, :test do
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"
  gem "bundler-audit", require: false
  gem "brakeman", require: false
  gem "rubocop-rails-omakase", require: false
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "web-console"
  gem "letter_opener"
end
