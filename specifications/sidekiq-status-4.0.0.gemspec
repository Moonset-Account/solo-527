# -*- encoding: utf-8 -*-
# stub: sidekiq-status 4.0.0 ruby lib

Gem::Specification.new do |s|
  s.name = "sidekiq-status".freeze
  s.version = "4.0.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Evgeniy Tsvigun".freeze, "Kenaniah Cerny".freeze]
  s.date = "1980-01-02"
  s.email = ["utgarda@gmail.com".freeze, "kenaniah@gmail.com".freeze]
  s.homepage = "https://github.com/kenaniah/sidekiq-status".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 3.2".freeze)
  s.rubygems_version = "3.4.19".freeze
  s.summary = "An extension to the sidekiq message processing to track your jobs".freeze

  s.installed_by_version = "3.4.19" if s.respond_to? :installed_by_version

  s.specification_version = 4

  s.add_runtime_dependency(%q<sidekiq>.freeze, [">= 7", "< 9"])
  s.add_runtime_dependency(%q<chronic_duration>.freeze, [">= 0"])
  s.add_runtime_dependency(%q<logger>.freeze, [">= 0"])
  s.add_runtime_dependency(%q<base64>.freeze, [">= 0"])
  s.add_development_dependency(%q<appraisal>.freeze, [">= 0"])
  s.add_development_dependency(%q<colorize>.freeze, [">= 0"])
  s.add_development_dependency(%q<irb>.freeze, [">= 0"])
  s.add_development_dependency(%q<rack-test>.freeze, [">= 0"])
  s.add_development_dependency(%q<rake>.freeze, [">= 0"])
  s.add_development_dependency(%q<rspec>.freeze, [">= 0"])
  s.add_development_dependency(%q<sinatra>.freeze, [">= 0"])
  s.add_development_dependency(%q<webrick>.freeze, [">= 0"])
  s.add_development_dependency(%q<rack-session>.freeze, [">= 0"])
end
