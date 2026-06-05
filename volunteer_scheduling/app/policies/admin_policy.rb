class AdminPolicy
  attr_reader :user, :admin

  def initialize(user, admin)
    @user = user
    @admin = admin
  end

  def access?
    user.admin?
  end
end
