FactoryBot.define do
  factory :donation do
    donor_name { "MyString" }
    donor_contact { "MyString" }
    amount { "9.99" }
    donation_type { "MyString" }
    material { nil }
    quantity { 1 }
    status { "MyString" }
    remark { "MyText" }
  end
end
