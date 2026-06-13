# -*- encoding: utf-8 -*-
# stub: caxlsx_rails 0.7.1 ruby lib

Gem::Specification.new do |s|
  s.name = "caxlsx_rails".freeze
  s.version = "0.7.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "changelog_uri" => "https://github.com/caxlsx/caxlsx_rails/blob/master/CHANGELOG.md" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Noel Peden".freeze]
  s.date = "1980-01-02"
  s.description = "Caxlsx_Rails provides an Caxlsx renderer so you can move all your spreadsheet code from your controller into view files. Partials are supported so you can organize any code into reusable chunks (e.g. cover sheets, common styling, etc.) You can use it with acts_as_caxlsx, placing the to_xlsx call in a view and adding ':package => xlsx_package' to the parameter list. Now you can keep your controllers thin!".freeze
  s.email = ["noel@peden.biz".freeze]
  s.homepage = "https://github.com/caxlsx/caxlsx_rails".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.6".freeze)
  s.rubygems_version = "3.4.19".freeze
  s.summary = "A simple rails plugin to provide an xlsx renderer using the caxlsx gem.".freeze

  s.installed_by_version = "3.4.19" if s.respond_to? :installed_by_version

  s.specification_version = 4

  s.add_runtime_dependency(%q<actionpack>.freeze, [">= 6.1"])
  s.add_runtime_dependency(%q<caxlsx>.freeze, [">= 4.0"])
  s.add_development_dependency(%q<bundler>.freeze, [">= 0"])
  s.add_development_dependency(%q<rake>.freeze, [">= 0"])
  s.add_development_dependency(%q<rspec-rails>.freeze, [">= 0"])
  s.add_development_dependency(%q<capybara>.freeze, [">= 0"])
  s.add_development_dependency(%q<roo>.freeze, [">= 0"])
  s.add_development_dependency(%q<rubyzip>.freeze, [">= 0"])
end
