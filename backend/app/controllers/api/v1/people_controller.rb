module Api
  module V1
    class PeopleController < ApplicationController
      def index
        scope = Person.all
        scope = scope.by_type(params[:person_type]) if params[:person_type].present?
        scope = scope.where(blacklisted: params[:blacklisted]) if params[:blacklisted].present?
        scope = scope.ransack(params[:q]).result if params[:q].present?
        scope = scope.order(created_at: :desc)
        render_paginated(scope)
      end

      def show
        person = Person.find(params[:id])
        render json: person.as_json(
          include: {
            credentials: {},
            passes: { include: :work_zones },
            violations: { limit: 10, order: 'violated_at DESC' }
          }
        )
      end

      def create
        authorize_manage!
        person = Person.new(person_params)
        if person.save
          render json: person, status: :created
        else
          render json: { error: person.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def update
        authorize_manage!
        person = Person.find(params[:id])
        if person.update(person_params)
          render json: person
        else
          render json: { error: person.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def blacklist
        authorize_manage!
        person = Person.find(params[:id])
        person.add_to_blacklist!(params[:reason])
        render json: { message: '已加入黑名单', person: person }
      end

      def remove_blacklist
        authorize_manage!
        person = Person.find(params[:id])
        person.remove_from_blacklist!
        render json: { message: '已移出黑名单', person: person }
      end

      private

      def person_params
        params.permit(:name, :id_card, :gender, :birth_date, :phone, :address, :company, :person_type, :photo_url, :remark)
      end
    end
  end
end
