module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request!, only: [:login]

      def login
        user = User.find_by(username: params[:username])

        if user&.authenticate(params[:password])
          if user.active?
            token = JwtService.encode(user_id: user.id)
            render json: {
              token: token,
              user: {
                id: user.id,
                username: user.username,
                real_name: user.real_name,
                role: user.role,
                role_name: user.role_name,
                department: user.department
              }
            }
          else
            render json: { error: '账户已被禁用' }, status: :unauthorized
          end
        else
          render json: { error: '用户名或密码错误' }, status: :unauthorized
        end
      end

      def me
        render json: {
          id: current_user.id,
          username: current_user.username,
          real_name: current_user.real_name,
          role: current_user.role,
          role_name: current_user.role_name,
          department: current_user.department,
          phone: current_user.phone,
          email: current_user.email
        }
      end

      def logout
        render json: { message: '登出成功' }
      end
    end
  end
end
