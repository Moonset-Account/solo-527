Rails.application.routes.draw do
  devise_for :users

  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  resource :volunteer_profile, only: [:show, :edit, :update] do
    resources :skills, only: [:index, :create, :destroy], controller: "volunteer_skills"
    resources :availabilities, only: [:index, :create, :destroy]
    resources :emergency_contacts, only: [:index, :create, :destroy]
    resources :guardians, only: [:index, :create, :destroy]
  end

  resources :activities do
    resources :locations, except: [:index]
    resources :assignments, only: [:index, :new, :create] do
      collection do
        get :recommendations
      end
    end
    member do
      post :publish
    end
  end

  resources :assignments, only: [:show, :update, :destroy] do
    member do
      post :accept
      post :decline
      post :swap
    end
    resources :check_ins, only: [:new, :create]
  end

  resources :check_ins, only: [:index, :show] do
    member do
      post :check_out
      post :approve
      post :reject
    end
  end

  resources :service_certificates, only: [:index, :show, :new, :create] do
    member do
      get :download
      post :issue
      post :revoke
    end
  end

  resources :notifications, only: [:index, :show] do
    member do
      post :mark_as_read
    end
    collection do
      post :mark_all_as_read
    end
  end

  namespace :admin do
    resources :users, only: [:index, :show, :edit, :update, :destroy]
    resources :skills, except: [:show]
    get "check_ins/review", to: "check_ins#review"
  end

  namespace :api do
    namespace :v1 do
      post "check_ins/scan", to: "check_ins#scan"
    end
  end
end
