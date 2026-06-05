Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'
      get 'auth/me', to: 'auth#me'

      get 'dashboard/stats', to: 'dashboard#stats'
      get 'dashboard/recent_activities', to: 'dashboard#recent_activities'

      resources :people do
        post 'blacklist', on: :member
        post 'remove_blacklist', on: :member
      end

      resources :credentials do
        post 'verify', on: :member
      end

      resources :vehicles do
        post 'blacklist', on: :member
      end

      resources :work_zones

      resources :passes do
        post 'freeze', on: :member
        post 'unfreeze', on: :member
        collection do
          post 'validate_pass_number'
        end
      end

      resources :approvals do
        post 'approve', on: :member
        post 'reject', on: :member
        collection do
          get 'pending_for_me'
        end
      end

      resources :violations do
        collection do
          get 'monthly_stats'
        end
      end

      resources :gate_logs do
        collection do
          post 'verify_and_log'
          get 'today_stats'
        end
      end

      resources :notifications do
        post 'mark_as_read', on: :member
        collection do
          get 'unread_count'
          post 'mark_all_as_read'
        end
      end

      resources :import_export_jobs, only: [:index, :show] do
        collection do
          post 'create_export'
          post 'create_import'
        end
        member do
          get 'download'
        end
      end
    end
  end
end
