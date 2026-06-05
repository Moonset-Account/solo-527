require 'jwt'

class JsonWebToken
  SECRET_KEY = Rails.application.credentials.secret_key_base || 'development_secret_key'
  ALGORITHM = 'HS256'
  EXPIRATION_TIME = 7.days

  def self.encode(payload, exp = EXPIRATION_TIME.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY, true, algorithm: ALGORITHM).first
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError => e
    raise e
  end
end
