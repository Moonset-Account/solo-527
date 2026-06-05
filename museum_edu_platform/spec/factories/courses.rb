FactoryBot.define do
  factory :course do
    title { "MyString" }
    slug { "MyString" }
    description { "MyText" }
    age_min { 1 }
    age_max { 1 }
    duration_minutes { 1 }
    capacity { 1 }
    status { 1 }
    category { "MyString" }
    cover_image { nil }
  end
end
