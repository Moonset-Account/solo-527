"""initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=200), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('role', sa.Enum('ADMIN', 'COACH', 'RUNNER', name='userrole'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    op.create_table(
        'runner_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('height', sa.Float(), nullable=True),
        sa.Column('weekly_mileage', sa.Float(), nullable=True),
        sa.Column('target_race', sa.String(length=100), nullable=True),
        sa.Column('target_date', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_runner_profiles_id'), 'runner_profiles', ['id'], unique=False)

    op.create_table(
        'training_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('plan_date', sa.DateTime(), nullable=False),
        sa.Column('distance_km', sa.Float(), nullable=True),
        sa.Column('target_pace', sa.String(length=20), nullable=True),
        sa.Column('warm_up', sa.String(length=200), nullable=True),
        sa.Column('main_set', sa.Text(), nullable=True),
        sa.Column('cool_down', sa.String(length=200), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_training_plans_id'), 'training_plans', ['id'], unique=False)

    op.create_table(
        'activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('activity_date', sa.DateTime(), nullable=False),
        sa.Column('meeting_point', sa.String(length=200), nullable=True),
        sa.Column('max_participants', sa.Integer(), nullable=True),
        sa.Column('registration_deadline', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activities_id'), 'activities', ['id'], unique=False)

    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('notification_type', sa.String(length=50), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('max_retries', sa.Integer(), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_retry_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)

    op.create_table(
        'pace_zones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('runner_profile_id', sa.Integer(), nullable=True),
        sa.Column('zone_name', sa.String(length=50), nullable=False),
        sa.Column('min_pace', sa.String(length=10), nullable=False),
        sa.Column('max_pace', sa.String(length=10), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(['runner_profile_id'], ['runner_profiles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pace_zones_id'), 'pace_zones', ['id'], unique=False)

    op.create_table(
        'checkins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('runner_id', sa.Integer(), nullable=True),
        sa.Column('training_plan_id', sa.Integer(), nullable=True),
        sa.Column('checkin_date', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('distance_km', sa.Float(), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('avg_pace', sa.String(length=20), nullable=True),
        sa.Column('avg_heart_rate', sa.Integer(), nullable=True),
        sa.Column('perceived_effort', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('track_points', sa.JSON(), nullable=True),
        sa.Column('location_alias', sa.String(length=100), nullable=True),
        sa.Column('status', sa.Enum('NEW', 'PENDING_CONFIRM', 'IN_PROGRESS', 'EXCEPTION_REVIEW', 'ARCHIVED', name='taskstatus'), nullable=True),
        sa.Column('pace_analysis', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['runner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['training_plan_id'], ['training_plans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_checkins_id'), 'checkins', ['id'], unique=False)

    op.create_table(
        'activity_signups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.Integer(), nullable=True),
        sa.Column('runner_id', sa.Integer(), nullable=True),
        sa.Column('signed_up_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('status', sa.Enum('NEW', 'PENDING_CONFIRM', 'IN_PROGRESS', 'EXCEPTION_REVIEW', 'ARCHIVED', name='taskstatus'), nullable=True),
        sa.Column('emergency_contact', sa.String(length=100), nullable=True),
        sa.Column('emergency_phone', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ),
        sa.ForeignKeyConstraint(['runner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_signups_id'), 'activity_signups', ['id'], unique=False)

    op.create_table(
        'injury_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('runner_id', sa.Integer(), nullable=True),
        sa.Column('reported_by', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('body_part', sa.String(length=50), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('rest_days', sa.Integer(), nullable=True),
        sa.Column('reported_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['reported_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['runner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_injury_notes_id'), 'injury_notes', ['id'], unique=False)

    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('task_type', sa.Enum('TRAINING_PLAN', 'CHECKIN', 'ACTIVITY_SIGNUP', 'PACE_FEEDBACK', 'INJURY_REPORT', name='tasktype'), nullable=False),
        sa.Column('status', sa.Enum('NEW', 'PENDING_CONFIRM', 'IN_PROGRESS', 'EXCEPTION_REVIEW', 'ARCHIVED', name='taskstatus'), nullable=True),
        sa.Column('assigned_user_id', sa.Integer(), nullable=True),
        sa.Column('related_id', sa.Integer(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')
    op.drop_index(op.f('ix_injury_notes_id'), table_name='injury_notes')
    op.drop_table('injury_notes')
    op.drop_index(op.f('ix_activity_signups_id'), table_name='activity_signups')
    op.drop_table('activity_signups')
    op.drop_index(op.f('ix_checkins_id'), table_name='checkins')
    op.drop_table('checkins')
    op.drop_index(op.f('ix_pace_zones_id'), table_name='pace_zones')
    op.drop_table('pace_zones')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
    op.drop_index(op.f('ix_activities_id'), table_name='activities')
    op.drop_table('activities')
    op.drop_index(op.f('ix_training_plans_id'), table_name='training_plans')
    op.drop_table('training_plans')
    op.drop_index(op.f('ix_runner_profiles_id'), table_name='runner_profiles')
    op.drop_table('runner_profiles')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
