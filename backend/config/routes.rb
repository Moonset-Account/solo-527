Rails.application.routes.draw do
  mount_devise_token_auth_for 'User', at: 'api/v1/auth'

  namespace :api do
    namespace :v1 do
      resources :courses, only: [:index, :show, :create, :update, :destroy] do
        resources :schedules, only: [:index], module: :courses
      end

      resources :enrollments, only: [:index, :show, :create] do
        collection do
          get :my
        end
        member do
          put :pay
          put :cancel
          put :request_refund
          put :approve_refund
          put :reject_refund
          put :complete
        end
      end

      resources :works, only: [:index, :show, :create, :update] do
        collection do
          get :my
        end
        member do
          put :authorize_public
          put :approve
          put :reject
        end
      end

      resources :materials, only: [:index, :show, :create, :update] do
        member do
          put :restock
          put :deduct_stock
        end
      end

      resources :teachers, only: [:index, :show, :create, :update]
      resources :students, only: [:index, :show]

      namespace :dashboard do
        get :overview
        get :enrollment_trends
        get :resource_utilization
        get :status_stats
      end

      resources :audit_logs, only: [:index]
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
