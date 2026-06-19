class User < ApplicationRecord
  extend Enumerize

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :timeoutable, :trackable

  enumerize :role, in: { admin: 'admin', captain: 'captain', driver: 'driver' }, default: :driver
  enumerize :status, in: { active: 'active', inactive: 'inactive' }, default: :active

  has_many :vehicles, foreign_key: 'current_driver_id'
  has_many :operation_logs
  has_many :claims_as_handler, class_name: 'Claim', foreign_key: 'handler_id'
end
