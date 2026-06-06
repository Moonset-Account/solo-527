Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post 'auth/login', to: 'auth#login'
      post 'auth/register', to: 'auth#register'
      get 'auth/me', to: 'auth#me'
      put 'auth/profile', to: 'auth#update_profile'

      resources :courses, only: [:index, :show, :create, :update] do
        collection do
          get 'calendar'
        end
      end

      resources :course_categories, only: [:index]

      resources :bookings, only: [:index, :show, :create] do
        member do
          post 'cancel'
          post 'approve'
          post 'reject'
          post 'check_in'
        end
        collection do
          get 'export'
        end
      end

      resources :artworks, only: [:index, :show, :create, :update, :destroy] do
        member do
          post 'approve'
          post 'reject'
          post 'like'
          post 'increment_view'
        end
      end

      resources :material_packages, only: [:index, :show, :create, :update] do
        member do
          post 'stock_in'
          post 'stock_out'
        end
        collection do
          get 'export'
        end
      end

      resources :payments, only: [:index, :create] do
        collection do
          get 'export'
        end
      end

      resources :teacher_settlements, only: [:index, :show] do
        collection do
          post 'generate'
          get 'export'
        end
        member do
          post 'approve'
          post 'reject'
          post 'mark_paid'
          post 'submit'
          post 'pay'
        end
      end

      resources :notifications, only: [:index, :show] do
        collection do
          post 'mark_all_read'
          get 'unread_count'
          get 'export'
        end
        member do
          post 'mark_read'
        end
      end

      resources :audit_logs, only: [:index] do
        collection do
          get 'export'
        end
      end

      resources :teachers, only: [:index, :show]
      resources :students, only: [:index, :show]
    end
  end
end
