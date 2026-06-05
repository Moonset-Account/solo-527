Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations',
    passwords: 'users/passwords'
  }

  root 'home#index'

  get 'up' => 'rails/health#show', as: :rails_health_check

  get 'manifest' => 'rails/pwa#manifest', as: :pwa_manifest
  get 'service-worker' => 'rails/pwa#service_worker', as: :pwa_service_worker

  resources :courses, only: [:index, :show] do
    resources :sessions, only: [:index, :show], controller: 'course_sessions'
  end

  resources :registrations, only: [:index, :show, :new, :create] do
    member do
      post :cancel
    end
    collection do
      get :my_registrations
    end
  end

  namespace :mobile do
    get 'check_in/:qr_token' => 'check_ins#new', as: :check_in
    post 'check_in/:qr_token' => 'check_ins#create'
    post 'check_ins/sync' => 'check_ins#sync'
    resources :check_ins, only: [:index, :show]
  end

  namespace :admin do
    get 'dashboard' => 'dashboard#index', as: :dashboard

    resources :courses do
      resources :sessions, controller: 'course_sessions' do
        member do
          post :assign_guide
          post :remove_guide
          get :qr_code
        end
        resources :registrations, only: [:index, :show, :new, :create], controller: 'session_registrations'
      end
    end

    resources :sessions, only: [:index, :show] do
      member do
        get :check_in_list
        get :attendance_report
      end
    end

    resources :registrations do
      member do
        post :approve
        post :reject
        post :cancel
      end
    end

    resources :schools do
      resources :students, controller: 'school_students'
    end

    resources :students, only: [:index, :show, :edit, :update, :destroy]

    resources :users do
      member do
        post :activate
        post :suspend
      end
    end

    resources :guides, only: [:index, :show] do
      member do
        get :schedule
      end
    end

    resources :equipment

    resources :audits, only: [:index]

    resources :reports, only: [:index] do
      collection do
        get :attendance
        get :feedback
        get :registration
      end
    end
  end

  namespace :guide do
    get 'dashboard' => 'dashboard#index', as: :dashboard
    get 'schedule' => 'sessions#index'
    resources :sessions, only: [:index, :show] do
      member do
        get :check_in_list
        post :mark_attendance
      end
    end
    resources :feedbacks, only: [:index, :show]
  end

  resources :feedbacks, only: [:new, :create, :index, :show]

  resources :notifications, only: [:index, :show] do
    member do
      post :mark_as_read
    end
    collection do
      post :mark_all_as_read
    end
  end

  namespace :api do
    namespace :v1 do
      resources :sessions, only: [:show] do
        member do
          get :check_in_status
        end
      end
      resources :check_ins, only: [:create, :index]
    end
  end
end
