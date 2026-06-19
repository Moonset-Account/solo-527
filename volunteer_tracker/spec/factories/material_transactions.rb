FactoryBot.define do
  factory :material_transaction do
    material { nil }
    transaction_type { "MyString" }
    quantity { 1 }
    operator { nil }
    recipient { "MyString" }
    remark { "MyText" }
  end
end
