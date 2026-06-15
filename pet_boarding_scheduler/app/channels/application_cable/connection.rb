module ApplicationCable
  class Connection < ActionCable::Connection::Base
    def connect
      self.current_user = "admin_user_#{SecureRandom.hex(4)}"
    end
  end
end
